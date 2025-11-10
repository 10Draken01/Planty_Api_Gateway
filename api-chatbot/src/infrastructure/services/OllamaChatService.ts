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
    context: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      // Construir el prompt con contexto RAG
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(query, context);

      // Preparar mensajes para Ollama
      const messages: Array<{ role: string; content: string }> = [];

      // Agregar mensaje de sistema
      messages.push({
        role: 'system',
        content: systemPrompt
      });

      // Agregar historial de conversación (si existe)
      if (conversationHistory && conversationHistory.length > 0) {
        // Solo los últimos 4 mensajes para no saturar el contexto
        const recentHistory = conversationHistory.slice(-4);
        messages.push(...recentHistory);
      }

      // Agregar pregunta actual con contexto
      messages.push({
        role: 'user',
        content: userPrompt
      });

      // Generar respuesta
      const response = await this.ollama.chat({
        model: this.model,
        messages: messages,
        stream: false,
        options: {
          temperature: 0.7,
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
    return `Eres un asistente experto en plantas de Suchiapa, Chiapas, México.
Tu objetivo es ayudar a los usuarios a obtener información precisa sobre las plantas de esta región.

INSTRUCCIONES:
- Responde siempre en español de manera clara y concisa
- Basa tus respuestas en el contexto proporcionado
- Si el contexto no contiene información suficiente para responder, indícalo claramente
- Sé específico y preciso con los nombres de las plantas
- Proporciona información útil sobre usos, características, cuidados, etc.
- Si no estás seguro de algo, admítelo en lugar de inventar información
- Mantén un tono amigable y educativo`;
  }

  private buildUserPrompt(query: string, context: string): string {
    if (context && context.trim().length > 0) {
      return `CONTEXTO RELEVANTE:
${context}

PREGUNTA DEL USUARIO:
${query}

Por favor, responde la pregunta basándote en el contexto proporcionado. Si el contexto no es suficiente para responder completamente, indícalo.`;
    } else {
      return `PREGUNTA DEL USUARIO:
${query}

Nota: No se encontró contexto específico en la base de conocimientos. Proporciona una respuesta general si es posible, o indica que necesitas más información.`;
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
