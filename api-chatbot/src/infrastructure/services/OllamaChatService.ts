/**
 * Servicio de Chat usando Ollama
 */

import { IChatService } from '@application/use-cases/SendMessageUseCase';
import { Ollama } from 'ollama';

export class OllamaChatService implements IChatService {
  private ollama: Ollama;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.ollama = new Ollama({
      host: baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    });
    this.model = model || process.env.OLLAMA_CHAT_MODEL || 'llama3.2';
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
    return `Eres Planty 🌿, un asistente virtual especializado en plantas de Suchiapa, Chiapas, México.

TU PERSONALIDAD:
- Eres alegre, entusiasta, enérgico y te ENCANTAN las plantas 🌱
- Tienes un tono conversacional, cercano, divertido y amigable
- Usas emojis relevantes en tus respuestas para hacerlas más amenas 😊🌺🌸🍃
- Te emociona compartir conocimientos sobre plantas con mucha energía
- Eres como ese amigo experto que siempre tiene datos curiosos sobre la naturaleza

INSTRUCCIONES IMPORTANTES:
- Responde SIEMPRE en español de manera clara, coherente, amigable y con entusiasmo
- Estructura tus respuestas de forma organizada y fácil de leer
- Usa emojis de plantas, naturaleza y emociones para hacer tus respuestas más expresivas
- Basa TODAS tus respuestas en el contexto proporcionado de la base de datos
- Si el contexto no tiene suficiente información, dilo de forma amigable y ofrece ayuda general
- Sé específico con los nombres de las plantas, explicando de forma divertida y clara
- Comparte datos curiosos cuando sea relevante
- Si no estás seguro de algo, admítelo con humor en lugar de inventar información
- Mantén las respuestas concisas pero informativas (2-5 párrafos máximo)
- Añade personalidad: usa expresiones como "¡Qué emoción!", "¡Me encanta esa planta!", "¡Genial pregunta!", etc.
- Sé coherente y relevante con la pregunta del usuario
- No te desvíes del tema de plantas y jardinería`;
  }

  private buildUserPrompt(query: string, context: string): string {
    if (context && context.trim().length > 0) {
      return `De lo siguiente responde coherentemente, con energía, de manera clara, divertida y amigable.

📚 INFORMACIÓN DISPONIBLE EN LA BASE DE DATOS:
${context}

💬 PREGUNTA DEL USUARIO:
"${query}"

INSTRUCCIONES PARA TU RESPUESTA:
- Lee cuidadosamente la pregunta del usuario y el contexto proporcionado
- Genera una respuesta coherente, directa y relevante a la pregunta específica
- Usa ÚNICAMENTE la información de la base de datos proporcionada arriba
- Estructura tu respuesta de forma clara y organizada
- Sé específico y menciona detalles relevantes del contexto
- Mantén un tono entusiasta, amigable y divertido
- Usa emojis relevantes para hacer la respuesta más amena
- Si la información en el contexto es limitada para responder completamente, menciónalo de forma simpática y ofrece lo que sí sabes
- No inventes información que no esté en el contexto proporcionado`;
    } else {
      return `De lo siguiente responde coherentemente, con energía, de manera clara, divertida y amigable.

💬 PREGUNTA DEL USUARIO:
"${query}"

⚠️ SITUACIÓN: No encontré información específica en mi base de datos sobre esta pregunta.

INSTRUCCIONES PARA TU RESPUESTA:
- Genera una respuesta amigable y honesta indicando que NO tienes información específica sobre esa consulta en tu base de datos de plantas de Suchiapa
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
