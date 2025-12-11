/**
 * Servicio Ollama simplificado para generación de texto
 * Wrapper sobre OllamaChatService para uso general
 */

import { Ollama } from 'ollama';

export class OllamaService {
  private ollama: Ollama;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.ollama = new Ollama({
      host: baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    });
    this.model = model || process.env.OLLAMA_CHAT_MODEL || 'llama3.2';
  }

  /**
   * Genera texto basado en un prompt simple
   */
  async generateText(prompt: string): Promise<string> {
    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
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
      console.error('Error generando texto con Ollama:', error);
      throw new Error(
        `Error al generar texto: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  /**
   * Verifica disponibilidad del modelo
   */
  async checkModelAvailability(): Promise<boolean> {
    try {
      await this.ollama.chat({
        model: this.model,
        messages: [{ role: 'user', content: 'test' }],
        stream: false
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  getModelInfo(): { model: string; baseUrl: string } {
    return {
      model: this.model,
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    };
  }
}
