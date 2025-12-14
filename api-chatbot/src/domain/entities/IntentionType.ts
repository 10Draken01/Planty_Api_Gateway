/**
 * IntentionType - Tipos de intenciones detectables en mensajes del usuario
 */

export enum IntentionType {
  CHANGE_PERSONALITY = 'change_personality',
  REFERENCE_GOD = 'reference_god',
  REQUEST_STORY = 'request_story',
  CHANGE_TONE = 'change_tone',
  FIRST_INTERACTION = 'first_interaction',
  PLANT_QUESTION = 'plant_question',
  GENERAL_CHAT = 'general_chat'
}

export interface DetectedIntention {
  type: IntentionType;
  confidence: number;
  extractedData?: {
    personalityRequested?: string;
    godMentioned?: string;
    toneRequested?: string;
    plantMentioned?: string;
  };
}

export class Intention {
  static create(
    type: IntentionType,
    confidence: number,
    extractedData?: any
  ): DetectedIntention {
    return {
      type,
      confidence,
      extractedData
    };
  }
}
