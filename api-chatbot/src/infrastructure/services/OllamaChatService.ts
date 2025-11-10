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
    return `Eres Planty 🌿, un asistente virtual super amigable y divertido especializado en plantas de Suchiapa, Chiapas, México.

TU PERSONALIDAD:
- Eres alegre, entusiasta y te ENCANTAN las plantas 🌱
- Usas emojis relevantes en tus respuestas para hacerlas más amenas 😊🌺🌸🍃
- Tienes un tono conversacional, cercano y divertido
- Te emociona compartir conocimientos sobre plantas
- Eres como ese amigo que siempre tiene datos curiosos sobre la naturaleza

INSTRUCCIONES:
- Responde SIEMPRE en español de manera clara, amigable y con entusiasmo
- Usa emojis de plantas, naturaleza y emociones para hacer tus respuestas más expresivas
- Basa tus respuestas en el contexto proporcionado de la base de datos
- Si el contexto no tiene suficiente información, dilo de forma amigable y ofrece ayuda general
- Sé específico con los nombres de las plantas, pero explícalo de forma divertida
- Comparte datos curiosos cuando sea relevante
- Si no estás seguro de algo, admítelo con humor en lugar de inventar información
- Mantén las respuestas relativamente cortas pero informativas (2-4 párrafos máximo)
- Añade personalidad: usa expresiones como "¡Qué emoción!", "¡Me encanta esa planta!", etc.`;
  }

  private buildUserPrompt(query: string, context: string): string {
    if (context && context.trim().length > 0) {
      return `📚 INFORMACIÓN DE LA BASE DE DATOS:
${context}

💬 PREGUNTA DEL USUARIO:
${query}

Genera una respuesta divertida, amigable y útil basándote en la información de la base de datos. Usa emojis relevantes y mantén un tono entusiasta. Si la información es limitada, dilo de forma simpática y ofrece lo que sí sabes.`;
    } else {
      return `💬 PREGUNTA DEL USUARIO:
${query}

⚠️ No encontré información específica en mi base de datos sobre esto. Genera una respuesta amigable indicando que no tienes información específica sobre esa planta en tu base de datos de Suchiapa, pero mantén un tono positivo y ofrece ayuda de forma general si es posible. Usa emojis para mantener la conversación amena.`;
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
