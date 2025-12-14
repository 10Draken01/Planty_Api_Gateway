/**
 * Servicio de Chat usando Ollama
 */

import { IChatService } from '@application/use-cases/SendMessageWithMemoryUseCase';
import { Personality } from '@domain/entities/Personality';
import { Ollama } from 'ollama';

export class OllamaChatService implements IChatService {
  private ollama: Ollama;
  private model: string;
  private currentPersonality: Personality;

  constructor(baseUrl?: string, model?: string, personality?: Personality) {
    this.ollama = new Ollama({
      host: baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    });
    this.model = model || process.env.OLLAMA_CHAT_MODEL || 'llama3.2';
    this.currentPersonality = personality || Personality.getDefault();
  }

  setPersonality(personality: Personality): void {
    this.currentPersonality = personality;
  }

  getPersonality(): Personality {
    return this.currentPersonality;
  }

  async generateResponse(
    query: string,
    context: string
  ): Promise<string> {
    try {
      // Construir el prompt con contexto RAG
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(query, context);

      // Preparar mensajes para Ollama
      const messages: Array<{ role: string; content: string }> = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ];

      // Generar respuesta
      const response = await this.ollama.chat({
        model: this.model,
        messages: messages,
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          top_k: 40
        }
      });

      if (!response.message || !response.message.content) {
        throw new Error('No se pudo generar una respuesta');
      }

      return response.message.content;
    } catch (error) {
      console.error('Error generando respuesta:', error);
      throw new Error(
        `Error al generar respuesta con Ollama: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  private buildSystemPrompt(): string {
    return this.currentPersonality.systemPrompt;
  }

  private buildUserPrompt(query: string, context: string): string {
    if (context && context.trim().length > 0) {
      return `${context}

INSTRUCCIONES PARA TU RESPUESTA:
- Lee cuidadosamente la pregunta del usuario y el contexto proporcionado
- Genera una respuesta coherente, directa y relevante a la pregunta específica
- Usa ÚNICAMENTE la información proporcionada arriba
- Estructura tu respuesta de forma clara y organizada
- Sé específico y menciona detalles relevantes del contexto
- Mantén un tono entusiasta, amigable y divertido según tu personalidad
- Usa emojis relevantes para hacer la respuesta más amena
- Si la información es limitada, menciónalo de forma simpática y ofrece lo que sí sabes
- NUNCA menciones "base de datos", "documentos" o "información almacenada"
- Responde como si el conocimiento proporcionado fuera TU conocimiento propio
- No inventes información que no esté en el contexto proporcionado`;
    } else {
      return `💬 PREGUNTA DEL USUARIO:
"${query}"

⚠️ SITUACIÓN: No tienes información específica sobre esta pregunta.

INSTRUCCIONES PARA TU RESPUESTA:
- Di honestamente que no sabes sobre eso
- Usa frases como "No sé eso" o "No tengo información sobre eso"
- NUNCA digas "no está en mi base de datos" o "no encuentro documentos"
- Mantén un tono positivo, alegre y entusiasta
- Ofrece ayuda de forma general si es apropiado
- Sugiere al usuario que reformule su pregunta o pregunte sobre otras plantas
- Usa emojis para mantener la conversación amena
- NO inventes información sobre plantas que no conoces`;
    }
  }

  /**
   * Genera una respuesta en streaming (para futuras implementaciones)
   */
  async generateResponseStream(
    query: string,
    context: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(query, context);

    const stream = await this.ollama.chat({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true
    });

    for await (const chunk of stream) {
      if (chunk.message?.content) {
        onChunk(chunk.message.content);
      }
    }
  }

  /**
   * Verifica si el modelo está disponible
   */
  async checkModelAvailability(): Promise<boolean> {
    try {
      const models = await this.ollama.list();
      return models.models.some((m) => m.name.includes(this.model));
    } catch (error) {
      console.error('Error verificando disponibilidad del modelo:', error);
      return false;
    }
  }

  /**
   * Obtiene información del modelo
   */
  getModelInfo(): { baseUrl: string; model: string } {
    return {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: this.model
    };
  }
}
