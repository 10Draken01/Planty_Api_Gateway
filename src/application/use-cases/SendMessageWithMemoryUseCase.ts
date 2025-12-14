/**
 * Use Case MEJORADO: Enviar mensaje con MEMORIA HÍBRIDA
 *
 * Integra:
 * - Memoria conversacional (últimos mensajes)
 * - Memoria de usuario (preferencias, plantas, problemas)
 * - Memoria de conocimiento (RAG con ChromaDB)
 * - Cache de embeddings (reduce latencia ~70%)
 */

import { VectorRepository } from '@domain/repositories/VectorRepository';
import { SendMessageDTO, ChatResponseDTO } from '../dtos/ChatDTOs';
import { UsersServiceClient } from '@infrastructure/external/UsersServiceClient';
import { IntentionDetectorService } from '@application/services/IntentionDetectorService';
import { PersonalityService } from '@application/services/PersonalityService';
import { GodStorytellerService } from '@application/services/GodStorytellerService';
import { PlantyPromptBuilder } from '@application/services/PlantyPromptBuilder';
import { IPlantyContextRepository } from '@domain/repositories/PlantyContextRepository';
import { Personality } from '@domain/entities/Personality';
import { PlantyContext } from '@domain/entities/PlantyContext';
import { IntentionType } from '@domain/entities/IntentionType';

export interface IChatService {
  generateResponse(query: string, context: string): Promise<string>;
  setPersonality(personality: Personality): void;
}

export interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
}

export class SendMessageWithMemoryUseCase {
  constructor(
    private vectorRepository: VectorRepository,
    private chatService: IChatService,
    private embeddingService: IEmbeddingService,
    private usersServiceClient: UsersServiceClient,
    private intentionDetector: IntentionDetectorService,
    private personalityService: PersonalityService,
    private plantyContextRepo: IPlantyContextRepository,
    private plantyPromptBuilder: PlantyPromptBuilder,
    private godStorytellerService: GodStorytellerService
  ) {}

  async execute(dto: SendMessageDTO): Promise<ChatResponseDTO> {
    const startTime = Date.now();

    const {
      userId,
      sessionId: providedSessionId,
      message,
      includeContext = true,
      maxContextChunks = 5
    } = dto;

    // Validaciones
    if (!userId || userId.trim().length === 0) {
      throw new Error('userId es requerido');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    console.log(`\n🔹 Nuevo mensaje de usuario: ${userId}`);
    console.log(`📝 Mensaje: "${message.substring(0, 50)}..."`);

    try {
      // ============================================
      // [0] PLANTY SYSTEM: Detectar intenciones y cargar contexto
      // ============================================
      console.log('🌿 Detectando intenciones con Planty System...');
      const detectedIntentions = this.intentionDetector.detect(message);
      console.log(`  ✓ Intenciones detectadas: ${detectedIntentions.map(i => i.type).join(', ') || 'ninguna'}`);

      // Cargar o crear PlantyContext
      let plantyContext = await this.plantyContextRepo.getByUserId(userId);
      const isFirstInteraction = !plantyContext;

      if (!plantyContext) {
        console.log('  🆕 Primera interacción - creando contexto de Planty...');
        plantyContext = PlantyContext.createNew(userId);
      }

      // Obtener personalidad actual
      const currentPersonalityId = plantyContext.currentPersonality;
      let currentPersonality = this.personalityService.getPersonalityById(currentPersonalityId);

      if (!currentPersonality) {
        currentPersonality = Personality.getDefault();
      }

      // Aplicar personalidad al servicio de chat
      this.chatService.setPersonality(currentPersonality);
      console.log(`  ✓ Personalidad activa: ${currentPersonality.config.name}`);

      // ============================================
      // [1] INICIAR O RECUPERAR SESIÓN
      // ============================================
      let sessionId = providedSessionId;

      if (!sessionId) {
        console.log('🆕 Iniciando nueva sesión...');
        sessionId = await this.usersServiceClient.startConversation(userId);
        console.log(`✅ Sesión creada: ${sessionId}`);
      } else {
        console.log(`♻️  Usando sesión existente: ${sessionId}`);
      }

      // ============================================
      // [2] RECUPERAR CONTEXTO DEL USUARIO (NIVEL 2: Memoria de Largo Plazo)
      // ============================================
      console.log('👤 Recuperando contexto del usuario...');
      const userContext = await this.usersServiceClient.getUserContext(userId);

      if (userContext) {
        console.log(`  ✓ Usuario: ${userContext.name}`);
        console.log(`  ✓ Nivel: ${userContext.experienceLevel}`);
        console.log(`  ✓ Plantas activas: ${userContext.activePlants.length}`);
        console.log(`  ✓ Problemas comunes: ${userContext.commonProblems.length}`);
      }

      // ============================================
      // [2.5] PLANTY SYSTEM: Manejar primera interacción y cambios de personalidad
      // ============================================
      let personalityChanged = false;
      let personalityChangeMessage = '';

      // Detectar si el usuario quiere cambiar de personalidad
      const personalityChangeIntention = detectedIntentions.find(
        i => i.type === IntentionType.CHANGE_PERSONALITY
      );

      if (personalityChangeIntention && personalityChangeIntention.extractedData?.personalityRequested) {
        const newPersonality = this.personalityService.getPersonalityByType(
          personalityChangeIntention.extractedData.personalityRequested as any
        );

        if (newPersonality && newPersonality.id !== currentPersonality.id) {
          console.log(`  🔄 Cambiando personalidad: ${currentPersonality.config.name} → ${newPersonality.config.name}`);

          // Generar mensaje de transición
          personalityChangeMessage = this.plantyPromptBuilder.buildPersonalityChangeResponse(
            currentPersonality,
            newPersonality,
            userContext?.name
          );

          // Actualizar contexto y personalidad
          plantyContext = plantyContext.changePersonality(personalityChangeIntention.extractedData.personalityRequested as any);
          currentPersonality = newPersonality;
          this.chatService.setPersonality(currentPersonality);
          personalityChanged = true;
        }
      }

      // Detectar referencias a dioses
      const godReferenceIntentions = detectedIntentions.filter(
        i => i.type === IntentionType.REFERENCE_GOD
      );

      if (godReferenceIntentions.length > 0) {
        console.log(`  ⚡ Referencias a dioses detectadas: ${godReferenceIntentions.length}`);
        godReferenceIntentions.forEach(intention => {
          if (intention.extractedData?.godMentioned) {
            plantyContext = plantyContext!.incrementGodReference(intention.extractedData.godMentioned);
          }
        });
      }

      // ============================================
      // [3] RECUPERAR HISTORIAL CONVERSACIONAL (NIVEL 1: Memoria de Corto Plazo)
      // ============================================
      console.log('💬 Recuperando historial conversacional...');
      const conversationContext = await this.usersServiceClient.getConversationContext(sessionId);

      if (conversationContext && conversationContext.recentMessages.length > 0) {
        console.log(`  ✓ Mensajes previos: ${conversationContext.recentMessages.length}`);
        console.log(`  ✓ Tags: ${conversationContext.tags.join(', ') || 'ninguno'}`);
      } else {
        console.log(`  ℹ️  Primera interacción en esta sesión - sin historial previo`);
      }

      // ============================================
      // [4] CONSTRUIR CONTEXTO RAG (NIVEL 3: Memoria de Conocimiento)
      // ============================================
      let ragContext = '';
      let retrievedChunks: any[] = [];
      let embeddingCached = false;

      if (includeContext) {
        try {
          console.log('🔍 Generando embedding del query...');
          const embedStart = Date.now();

          // El servicio de embeddings tiene cache integrado
          const queryEmbedding = await this.embeddingService.generateEmbedding(message);

          const embedLatency = Date.now() - embedStart;
          embeddingCached = embedLatency < 100; // Si es muy rápido, probablemente vino del cache

          console.log(`  ✓ Embedding generado en ${embedLatency}ms ${embeddingCached ? '(cached)' : ''}`);

          // Buscar chunks similares en ChromaDB
          console.log(`🔎 Buscando top ${maxContextChunks} chunks relevantes...`);
          const searchResults = await this.vectorRepository.searchSimilar(
            queryEmbedding,
            maxContextChunks
          );

          if (searchResults.length > 0) {
            console.log(`  ✓ Encontrados ${searchResults.length} chunks relevantes`);

            // Construir contexto RAG
            ragContext = searchResults
              .map((result, idx) => {
                return `[Fragmento ${idx + 1}]:\n${result.chunk.content}`;
              })
              .join('\n\n');

            retrievedChunks = searchResults.map(r => ({
              chunkId: r.chunk.id,
              documentName: 'documento.pdf', // Mejorar con metadata real
              relevanceScore: r.score
            }));
          } else {
            console.log('  ⚠️  No se encontraron chunks relevantes');
          }
        } catch (error) {
          console.error('❌ Error en búsqueda RAG:', error);
          // Continuar sin contexto RAG si falla
        }
      }

      // ============================================
      // [5] CONSTRUIR CONTEXTO ENRIQUECIDO COMPLETO
      // ============================================
      const enrichedContext = this.buildEnrichedContext({
        ragContext,
        userContext,
        conversationContext,
        message
      });

      console.log('🧠 Contexto enriquecido construido:');
      console.log(`  - RAG: ${ragContext.length > 0 ? '✓' : '✗'}`);
      console.log(`  - Usuario: ${userContext ? '✓' : '✗'}`);
      console.log(`  - Conversación: ${conversationContext ? '✓' : '✗'}`);

      // ============================================
      // [6] GENERAR RESPUESTA CON EL LLM
      // ============================================
      console.log('🤖 Generando respuesta con Ollama...');
      const llmStart = Date.now();

      const response = await this.chatService.generateResponse(message, enrichedContext);

      const llmLatency = Date.now() - llmStart;
      console.log(`  ✓ Respuesta generada en ${llmLatency}ms`);

      // ============================================
      // [7] GUARDAR MENSAJE DEL USUARIO
      // ============================================
      console.log('💾 Guardando mensaje del usuario...');
      await this.usersServiceClient.saveMessage({
        sessionId,
        role: 'user',
        content: message
      });

      // ============================================
      // [8] GUARDAR RESPUESTA DEL ASISTENTE
      // ============================================
      console.log('💾 Guardando respuesta del asistente...');
      await this.usersServiceClient.saveMessage({
        sessionId,
        role: 'assistant',
        content: response,
        metadata: {
          retrievedChunks,
          modelUsed: 'llama3.2',
          latencyMs: llmLatency,
          ragEnabled: includeContext
        }
      });

      // ============================================
      // [9] EXTRAER INFORMACIÓN DEL USUARIO (NER básico)
      // ============================================
      console.log('🔬 Extrayendo información del usuario...');
      await this.usersServiceClient.extractUserInfo(
        userId,
        message,
        'conv_id', // TODO: Obtener ID real de conversación
        'msg_id'   // TODO: Obtener ID real de mensaje
      );

      // ============================================
      // [10] ACTUALIZAR TAGS DE LA CONVERSACIÓN
      // ============================================
      const detectedTags = this.detectTags(message);
      if (detectedTags.length > 0) {
        console.log(`🏷️  Tags detectados: ${detectedTags.join(', ')}`);
        await this.usersServiceClient.updateConversationTags(sessionId, detectedTags);
      }

      // ============================================
      // [11] PLANTY SYSTEM: Guardar contexto actualizado
      // ============================================
      console.log('🌿 Guardando contexto de Planty...');
      plantyContext = plantyContext!.addConversationMemory(message);
      await this.plantyContextRepo.save(plantyContext);
      console.log('  ✓ Contexto de Planty guardado');

      // ============================================
      // [12] CONSTRUIR RESPUESTA
      // ============================================
      const totalLatency = Date.now() - startTime;

      console.log(`✅ Mensaje procesado en ${totalLatency}ms\n`);

      // Si hubo cambio de personalidad, agregar mensaje al inicio de la respuesta
      let finalResponse = response;
      if (personalityChanged && personalityChangeMessage) {
        finalResponse = `${personalityChangeMessage}\n\n${response}`;
      }

      const chatResponse: ChatResponseDTO = {
        sessionId,
        message,
        response: finalResponse,
        sources: retrievedChunks.map(chunk => ({
          content: chunk.chunkId,
          score: chunk.relevanceScore,
          metadata: { documentName: chunk.documentName }
        })),
        userContext: userContext ? {
          name: userContext.name,
          experienceLevel: userContext.experienceLevel,
          activePlants: userContext.activePlants.map(p => p.plantName)
        } : undefined,
        conversationContext: conversationContext ? {
          messageCount: conversationContext.messageCount + 1, // +1 por el nuevo mensaje
          tags: conversationContext.tags
        } : undefined,
        // 🌿 PLANTY SYSTEM: Nuevos campos
        currentPersonality: currentPersonality.config.name,
        availablePersonalities: this.personalityService.getAvailablePersonalities().map(p => p.config.name),
        personalityChanged,
        needsUserProfile: isFirstInteraction && !userContext,
        cached: embeddingCached,
        latencyMs: totalLatency,
        timestamp: new Date()
      };

      return chatResponse;

    } catch (error: any) {
      console.error('❌ Error procesando mensaje:', error.message);
      throw error;
    }
  }

  /**
   * Construir contexto enriquecido para el LLM
   */
  private buildEnrichedContext(params: {
    ragContext: string;
    userContext: any;
    conversationContext: any;
    message: string;
  }): string {
    const { ragContext, userContext, conversationContext, message } = params;

    let context = '';

    // 1. Contexto del usuario
    if (userContext) {
      context += `👤 INFORMACIÓN DEL USUARIO:\n`;
      context += `- Nombre: ${userContext.name}\n`;
      context += `- Nivel de experiencia: ${this.getExperienceLevelText(userContext.experienceLevel)}\n`;

      if (userContext.activePlants.length > 0) {
        context += `- Plantas activas: ${userContext.activePlants.map((p: any) => p.plantName).join(', ')}\n`;
      }

      if (userContext.commonProblems.length > 0) {
        context += `- Problemas frecuentes: ${userContext.commonProblems.map((p: any) => p.problem).join(', ')}\n`;
      }

      if (userContext.recentFacts.length > 0) {
        context += `- Hechos conocidos: ${userContext.recentFacts.join('; ')}\n`;
      }

      context += '\n';
    }

    // 2. Historial conversacional
    if (conversationContext && conversationContext.recentMessages.length > 0) {
      context += `💬 HISTORIAL COMPLETO DE LA CONVERSACIÓN (${conversationContext.recentMessages.length} mensajes):\n`;
      context += `="= ESTOS SON LOS ÚNICOS MENSAJES QUE HAN OCURRIDO - NO HAY MÁS ===\n\n`;

      // Mostrar TODOS los mensajes completos sin truncar
      const lastMessages = conversationContext.recentMessages;
      lastMessages.forEach((msg: any, index: number) => {
        const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
        context += `[${index + 1}] ${role}: ${msg.content}\n\n`;
      });

      context += `=== FIN DEL HISTORIAL COMPLETO - NO INVENTES MÁS MENSAJES ===\n\n`;
    }

    // 3. Contexto RAG (conocimiento sobre plantas)
    if (ragContext && ragContext.length > 0) {
      context += `🌿 LO QUE SÉ SOBRE ESTE TEMA:\n`;
      context += ragContext;
      context += '\n\n';
    }

    // 4. Pregunta actual
    context += `❓ PREGUNTA ACTUAL DEL USUARIO:\n`;
    context += `"${message}"\n\n`;

    // Instrucciones mejoradas para el LLM
    const hasConversationHistory = conversationContext && conversationContext.recentMessages.length > 0;

    if (hasConversationHistory) {
      context += `⚠️ INSTRUCCIONES CRÍTICAS - SIGUE ESTO EXACTAMENTE:

1. SOLO puedes hacer referencia a mensajes que aparecen en el "HISTORIAL COMPLETO" arriba
2. NO inventes conversaciones que no están en el historial
3. NO digas cosas como "hablamos sobre X" si X no aparece textualmente en el historial
4. Si el usuario pregunta algo nuevo que NO está en el historial, responde como si fuera una pregunta nueva
5. NO saludes de nuevo si ya saludaste en mensajes anteriores del historial
6. PROHIBIDO inventar temas o conversaciones - solo usa lo que está explícitamente en el historial
7. Si no estás 100% seguro de que algo se mencionó, NO lo menciones
8. NUNCA menciones "base de datos", "documentos" o "información almacenada"
9. Si sabes algo (de la sección "LO QUE SÉ"), responde como si fuera TU conocimiento propio
10. Si NO sabes algo, simplemente di "No sé eso" o "No tengo información sobre eso"

EJEMPLO DE LO QUE NO DEBES HACER:
❌ "Recuerdo que hablamos sobre pH del suelo" (si no está en el historial)
❌ "Como mencionaste antes sobre tus tomates" (si el usuario solo dijo "tomates" sin contexto)
❌ "¡Hola! Me alegra verte de nuevo" (si ya saludaste en el historial)
❌ "Según la base de datos..." o "En los documentos..."
❌ "No encuentro eso en mi base de datos"

EJEMPLO DE LO QUE SÍ DEBES HACER:
✅ Responder directamente a la pregunta actual
✅ Usar SOLO la información que aparece literalmente en el historial
✅ "Los tomates necesitan..." (como si fuera tu conocimiento)
✅ "No sé eso" o "No tengo información sobre eso" (si no está en "LO QUE SÉ")
✅ Ser conciso y directo sin inventar contexto`;
    } else {
      context += `⚠️ INSTRUCCIONES CRÍTICAS - PRIMERA INTERACCIÓN:

1. Esta es la PRIMERA interacción - NO hay mensajes previos
2. NO saludes diciendo "me alegra verte de nuevo" o similar
3. NO menciones conversaciones anteriores - no existen
4. Responde DIRECTAMENTE a la pregunta sin saludos innecesarios
5. Si el usuario dice "hola", saluda brevemente y pregunta cómo ayudar
6. Si el usuario pregunta algo específico (ej: "tomates"), responde DIRECTAMENTE sin saludar de nuevo
7. NUNCA menciones "base de datos", "documentos" o "información almacenada"
8. Si sabes algo (de la sección "LO QUE SÉ"), responde como si fuera TU conocimiento propio
9. Si NO sabes algo, simplemente di "No sé eso" o "No tengo información sobre eso"

PROHIBIDO:
❌ "¡Hola! Me alegra verte aquí por primera vez"
❌ "Recuerdo que..."
❌ "Anteriormente hablamos..."
❌ "Según la base de datos..." o "En los documentos..."
❌ "No encuentro eso en mi base de datos"

CORRECTO:
✅ Respuesta directa sin saludos innecesarios
✅ "Los tomates necesitan..." (como si fuera tu conocimiento)
✅ "No sé eso" o "No tengo información sobre eso" (si no está en "LO QUE SÉ")
✅ Si pregunta "hola" → "¡Hola! ¿En qué puedo ayudarte?"`;
    }

    return context;
  }

  /**
   * Obtener texto descriptivo del nivel de experiencia
   */
  private getExperienceLevelText(level: number): string {
    switch (level) {
      case 1:
        return 'Principiante';
      case 2:
        return 'Intermedio';
      case 3:
        return 'Avanzado';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Detectar tags automáticamente del mensaje
   */
  private detectTags(message: string): string[] {
    const tags: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Plantas comunes
    const plants = ['tomate', 'lechuga', 'albahaca', 'cilantro', 'perejil', 'zanahoria'];
    plants.forEach(plant => {
      if (lowerMessage.includes(plant)) {
        tags.push(plant);
      }
    });

    // Temas
    if (lowerMessage.includes('plaga') || lowerMessage.includes('enfermedad')) {
      tags.push('plagas');
    }

    if (lowerMessage.includes('riego') || lowerMessage.includes('agua')) {
      tags.push('riego');
    }

    if (lowerMessage.includes('siembra') || lowerMessage.includes('plantar')) {
      tags.push('siembra');
    }

    if (lowerMessage.includes('cosecha') || lowerMessage.includes('recolectar')) {
      tags.push('cosecha');
    }

    return Array.from(new Set(tags)); // Remover duplicados
  }
}
