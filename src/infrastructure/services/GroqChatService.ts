/**
 * Servicio de Chat usando Groq API
 */

import { IChatService } from '@application/use-cases/SendMessageWithMemoryUseCase';
import { config } from '@config/environment';
import { Personality } from '@domain/entities/Personality';
import axios from 'axios';

export class GroqChatService implements IChatService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.groq.com/openai/v1';
  private currentPersonality: Personality;

  constructor(apiKey?: string, model?: string, personality?: Personality) {
    this.apiKey = apiKey || config.groq.apiKey;
    this.model = model || config.groq.chatModel;
    this.currentPersonality = personality || Personality.getDefault();

    if (!this.apiKey) {
      throw new Error('Groq API Key no configurado. Por favor, establece GROQ_API_KEY en las variables de entorno.');
    }
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

      // Preparar mensajes para Groq
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ];

      // Hacer petición a Groq API
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          temperature: 0.8,
          max_tokens: 1024,
          top_p: 0.9,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 segundos
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('No se pudo generar una respuesta de Groq');
      }

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Error generando respuesta con Groq:', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('API Key de Groq inválido. Verifica tu configuración.');
        } else if (error.response?.status === 429) {
          throw new Error('Límite de rate limit de Groq excedido. Intenta nuevamente más tarde.');
        } else if (error.response) {
          throw new Error(`Error de Groq API: ${error.response.data?.error?.message || error.message}`);
        }
      }

      throw new Error(
        `Error al generar respuesta con Groq: ${error instanceof Error ? error.message : 'Error desconocido'}`
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
   * Verifica si el API Key está disponible y es válido
   */
  async checkModelAvailability(): Promise<boolean> {
    try {
      // Hacer una petición simple para verificar el API key
      const response = await axios.get(
        `${this.baseUrl}/models`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error('Error verificando disponibilidad de Groq:', error);
      return false;
    }
  }

  /**
   * Obtiene información del modelo
   */
  getModelInfo(): { baseUrl: string; model: string; provider: string } {
    return {
      baseUrl: this.baseUrl,
      model: this.model,
      provider: 'groq'
    };
  }

  /**
   * Obtiene lista de modelos disponibles
   */
  async listAvailableModels(): Promise<string[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/models`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('Error obteniendo modelos de Groq:', error);
      return [];
    }
  }
}
