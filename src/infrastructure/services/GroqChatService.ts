/**
 * Servicio de Chat usando Groq API
 */

import { IChatService } from '@application/use-cases/SendMessageWithMemoryUseCase';
import { config } from '@config/environment';
import axios from 'axios';

export class GroqChatService implements IChatService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || config.groq.apiKey;
    this.model = model || config.groq.chatModel;

    if (!this.apiKey) {
      throw new Error('Groq API Key no configurado. Por favor, establece GROQ_API_KEY en las variables de entorno.');
    }
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
