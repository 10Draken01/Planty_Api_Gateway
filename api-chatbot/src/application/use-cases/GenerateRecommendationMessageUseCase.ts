/**
 * Caso de Uso: Generar Mensajes de Recomendación
 *
 * Genera dos mensajes personalizados con Planty:
 * 1. FCM: Notificación push corta y llamativa
 * 2. View: Mensaje largo y detallado para la vista
 */

import { OllamaService } from '../../infrastructure/services/OllamaService';

export interface RecommendationMessageDTO {
  user: {
    _id: string;
    name: string;
    country: string;
    interest?: string;
  };
  currentOrchards: Array<{
    _id: string;
    name: string;
    surface?: number;
    numPlants?: number;
  }>;
  recommendedOrchards: Array<{
    _id: string;
    name: string;
    surface?: number;
    numPlants?: number;
    numPlantTypes?: number;
    avgPlantAge?: number;
    owner_name?: string;
  }>;
}

export interface RecommendationMessagesResponse {
  fcm_message: string;
  view_message: string;
  generated_at: string;
}

export class GenerateRecommendationMessageUseCase {
  constructor(private ollamaService: OllamaService) {}

  async execute(dto: RecommendationMessageDTO): Promise<RecommendationMessagesResponse> {
    const { user, currentOrchards, recommendedOrchards } = dto;

    // Validaciones
    if (!user || !user._id || !user.name) {
      throw new Error('Datos de usuario inválidos');
    }

    if (!recommendedOrchards || recommendedOrchards.length === 0) {
      throw new Error('No hay huertos recomendados');
    }

    // Preparar contexto para Planty
    const currentOrchardsText = currentOrchards.length > 0
      ? currentOrchards.map(o => `"${o.name}" (${o.surface || 0}m², ${o.numPlants || 0} plantas)`).join(', ')
      : 'ningún huerto todavía';

    const recommendedOrchardsText = recommendedOrchards
      .map((o, i) => {
        const details = [];
        if (o.surface) details.push(`${o.surface}m²`);
        if (o.numPlants) details.push(`${o.numPlants} plantas`);
        if (o.numPlantTypes) details.push(`${o.numPlantTypes} especies`);
        if (o.avgPlantAge) details.push(`${Math.round(o.avgPlantAge)} días promedio`);
        if (o.owner_name) details.push(`de ${o.owner_name}`);

        return `${i + 1}. "${o.name}" (${details.join(', ')})`;
      })
      .join('\n');

    // Generar mensaje FCM (corto y llamativo)
    const fcmPrompt = `Eres Planty, una planta divertida, energética y amigable que ayuda a jardineros.

Usuario: ${user.name}
País: ${user.country}
Huertos actuales: ${currentOrchardsText}

Se han encontrado ${recommendedOrchards.length} huertos recomendados para ${user.name}.

TAREA: Genera UNA SOLA notificación push muy corta (máximo 80 caracteres) que:
- Sea emocionante y llamativa
- Use emojis de plantas 🌱🌿🪴
- Invite a ver las recomendaciones
- Sea directa y amigable

IMPORTANTE: Responde SOLO con el texto de la notificación, sin comillas, sin explicaciones adicionales.

Ejemplo: "¡${user.name}! 🌱 Tengo ${recommendedOrchards.length} huertos increíbles para ti 🪴✨"`;

    // Generar mensaje Vista (largo y detallado)
    const viewPrompt = `Eres Planty, una planta divertida, energética y amigable que ayuda a jardineros.

Usuario: ${user.name}
País: ${user.country}
Interés: ${user.interest || 'jardinería'}
Huertos actuales: ${currentOrchardsText}

HUERTOS RECOMENDADOS PARA ${user.name.toUpperCase()}:
${recommendedOrchardsText}

TAREA: Genera un mensaje personalizado y entusiasta (150-250 palabras) que:
1. Saluda a ${user.name} con energía 🌱
2. Menciona brevemente sus huertos actuales (si tiene)
3. Presenta las ${recommendedOrchards.length} recomendaciones de manera emocionante
4. Destaca 1-2 características interesantes de los huertos recomendados
5. Motiva a ${user.name} a explorar estos huertos
6. Usa emojis de plantas y jardinería 🌿🪴🌻🥕🍅
7. Mantén un tono amigable, divertido y cercano
8. Termina con una frase motivadora sobre jardinería

IMPORTANTE: Responde SOLO con el mensaje, sin comillas, sin explicaciones adicionales. Usa saltos de línea para separar párrafos.`;

    try {
      // Generar ambos mensajes en paralelo
      const [fcmMessage, viewMessage] = await Promise.all([
        this.ollamaService.generateText(fcmPrompt),
        this.ollamaService.generateText(viewPrompt)
      ]);

      // Limpiar mensajes
      const cleanFcm = fcmMessage.trim().replace(/^["']|["']$/g, '');
      const cleanView = viewMessage.trim().replace(/^["']|["']$/g, '');

      return {
        fcm_message: cleanFcm,
        view_message: cleanView,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generando mensajes con Planty:', error);

      // Fallback: Mensajes genéricos pero funcionales
      const fallbackFcm = `¡${user.name}! 🌱 Descubre ${recommendedOrchards.length} huertos perfectos para ti 🪴`;

      const fallbackView = `¡Hola ${user.name}! 🌿

Soy Planty y tengo noticias emocionantes para ti 🎉

${currentOrchards.length > 0
  ? `Veo que ya tienes ${currentOrchards.length} ${currentOrchards.length === 1 ? 'huerto' : 'huertos'} (${currentOrchardsText}). ¡Increíble! 🌱`
  : '¡Es hora de empezar tu aventura verde! 🌱'}

He encontrado ${recommendedOrchards.length} huertos que te van a encantar:

${recommendedOrchards.map((o, i) => {
  const size = o.surface ? `${o.surface}m²` : '';
  const plants = o.numPlants ? `${o.numPlants} plantas` : '';
  return `${i + 1}. ${o.name} ${size && plants ? `(${size}, ${plants})` : size || plants}`;
}).join('\n')}

Estos huertos han sido seleccionados especialmente para ti basándome en tu perfil y preferencias. ¡Hay mucho que aprender de ellos! 🌻

¿Qué esperas? ¡Explora estas recomendaciones y lleva tu jardinería al siguiente nivel! 🚀🌿

Con cariño verde,
Planty 🪴`;

      return {
        fcm_message: fallbackFcm,
        view_message: fallbackView,
        generated_at: new Date().toISOString()
      };
    }
  }
}
