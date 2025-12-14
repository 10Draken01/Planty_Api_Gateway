/**
 * IntentionDetectorService - Detecta intenciones en mensajes del usuario
 * Usa NLP básico con patrones y palabras clave
 */

import { IntentionType, DetectedIntention, Intention } from '@domain/entities/IntentionType';

export class IntentionDetectorService {
  private personalityKeywords = {
    amigable: ['amigable', 'amable', 'cercano', 'cálido', 'normal', 'default'],
    divertido: ['divertido', 'gracioso', 'cómico', 'humor', 'bromista', 'chistoso'],
    epico: ['épico', 'epico', 'legendario', 'místico', 'narrativo', 'heroico'],
    sabio: ['sabio', 'inteligente', 'profundo', 'reflexivo', 'filosófico', 'analítico']
  };

  private godKeywords = {
    Draken: ['draken', 'libertad', 'viajar', 'explorar', 'aventura'],
    Insano: ['insano', 'fuerza', 'fuerte', 'creatina', 'entrenar', 'gym'],
    Arvadev: ['arvadev', 'sabiduría', 'sabiduria', 'valorant', 'conocimiento', 'ciencia']
  };

  private personalityChangePatterns = [
    /cambia (a|tu) personalidad a? (.+)/i,
    /s[eé] m[aá]s (.+)/i,
    /quiero que seas (.+)/i,
    /puedes ser (.+)/i,
    /habla (como|más) (.+)/i,
    /modo (.+)/i,
    /activa personalidad (.+)/i,
    /personalidad: (.+)/i
  ];

  private storyRequestPatterns = [
    /cu[eé]ntame (una |)historia/i,
    /habla(me|) (de|sobre) (draken|insano|arvadev)/i,
    /qui[eé]n (es|son) (draken|insano|arvadev)/i,
    /qu[eé] (dice|ense[ñn]a) (draken|insano|arvadev)/i
  ];

  private toneChangePatterns = [
    /s[eé] m[aá]s (serio|formal|casual|divertido)/i,
    /habla m[aá]s (serio|formal|casual|simple)/i,
    /menos (emojis|emoticones)/i,
    /m[aá]s (emojis|emoticones)/i
  ];

  detect(message: string): DetectedIntention[] {
    const intentions: DetectedIntention[] = [];
    const lowerMessage = message.toLowerCase();

    // Detectar cambio de personalidad
    const personalityIntention = this.detectPersonalityChange(lowerMessage);
    if (personalityIntention) {
      intentions.push(personalityIntention);
    }

    // Detectar referencias a dioses
    const godIntention = this.detectGodReference(lowerMessage);
    if (godIntention) {
      intentions.push(godIntention);
    }

    // Detectar solicitud de historia
    const storyIntention = this.detectStoryRequest(lowerMessage);
    if (storyIntention) {
      intentions.push(storyIntention);
    }

    // Detectar cambio de tono
    const toneIntention = this.detectToneChange(lowerMessage);
    if (toneIntention) {
      intentions.push(toneIntention);
    }

    // Detectar primera interacción
    const firstIntention = this.detectFirstInteraction(lowerMessage);
    if (firstIntention) {
      intentions.push(firstIntention);
    }

    // Si no hay intenciones especiales, clasificar como pregunta de plantas
    if (intentions.length === 0) {
      intentions.push(this.classifyGeneralMessage(lowerMessage));
    }

    return intentions;
  }

  private detectPersonalityChange(message: string): DetectedIntention | null {
    for (const pattern of this.personalityChangePatterns) {
      const match = message.match(pattern);
      if (match) {
        const requestedStyle = match[match.length - 1].toLowerCase();

        // Buscar qué personalidad coincide
        for (const [personality, keywords] of Object.entries(this.personalityKeywords)) {
          if (keywords.some(kw => requestedStyle.includes(kw))) {
            return Intention.create(
              IntentionType.CHANGE_PERSONALITY,
              0.9,
              { personalityRequested: personality }
            );
          }
        }

        // Si no coincide con ninguna predefinida pero claramente quiere cambiar
        return Intention.create(
          IntentionType.CHANGE_PERSONALITY,
          0.6,
          { personalityRequested: requestedStyle }
        );
      }
    }

    return null;
  }

  private detectGodReference(message: string): DetectedIntention | null {
    for (const [godName, keywords] of Object.entries(this.godKeywords)) {
      if (keywords.some(kw => message.includes(kw))) {
        return Intention.create(
          IntentionType.REFERENCE_GOD,
          0.8,
          { godMentioned: godName }
        );
      }
    }

    return null;
  }

  private detectStoryRequest(message: string): DetectedIntention | null {
    for (const pattern of this.storyRequestPatterns) {
      const match = message.match(pattern);
      if (match) {
        const godMentioned = match.find((m: string) =>
          ['draken', 'insano', 'arvadev'].includes(m?.toLowerCase())
        );

        return Intention.create(
          IntentionType.REQUEST_STORY,
          0.85,
          { godMentioned: godMentioned || 'random' }
        );
      }
    }

    return null;
  }

  private detectToneChange(message: string): DetectedIntention | null {
    for (const pattern of this.toneChangePatterns) {
      const match = message.match(pattern);
      if (match) {
        return Intention.create(
          IntentionType.CHANGE_TONE,
          0.75,
          { toneRequested: match[1] }
        );
      }
    }

    return null;
  }

  private detectFirstInteraction(message: string): DetectedIntention | null {
    const greetings = ['hola', 'buenos', 'buenas', 'saludos', 'hey', 'holi', 'que tal'];
    const isGreeting = greetings.some(g => message.includes(g));
    const isShort = message.split(' ').length <= 3;

    if (isGreeting && isShort) {
      return Intention.create(IntentionType.FIRST_INTERACTION, 0.9);
    }

    return null;
  }

  private classifyGeneralMessage(message: string): DetectedIntention {
    const plantKeywords = [
      'planta', 'tomate', 'lechuga', 'riego', 'regar', 'agua',
      'plagas', 'hojas', 'flores', 'frutos', 'cultivo', 'cultivar',
      'sembrar', 'cosecha', 'tierra', 'suelo', 'fertilizante'
    ];

    const hasPlantKeyword = plantKeywords.some(kw => message.includes(kw));

    if (hasPlantKeyword) {
      return Intention.create(IntentionType.PLANT_QUESTION, 0.8);
    }

    return Intention.create(IntentionType.GENERAL_CHAT, 0.5);
  }

  getHighestConfidenceIntention(intentions: DetectedIntention[]): DetectedIntention | null {
    if (intentions.length === 0) return null;

    return intentions.reduce((prev, current) =>
      (current.confidence > prev.confidence) ? current : prev
    );
  }
}
