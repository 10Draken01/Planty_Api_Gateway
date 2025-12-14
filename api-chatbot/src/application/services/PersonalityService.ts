/**
 * PersonalityService - Gestiona las personalidades de Planty (Strategy Pattern)
 */

import { Personality, PersonalityType } from '@domain/entities/Personality';
import { PlantyContext } from '@domain/entities/PlantyContext';

export interface IPersonalityService {
  getAvailablePersonalities(): Personality[];
  getPersonalityById(id: string): Personality | null;
  getPersonalityByType(type: PersonalityType): Personality | null;
  getDefaultPersonality(): Personality;
  buildSystemPrompt(personality: Personality, context?: any): string;
  validatePersonalityId(id: string): boolean;
}

export class PersonalityService implements IPersonalityService {
  private personalities: Map<string, Personality>;

  constructor() {
    this.personalities = new Map();
    this.loadPredefinedPersonalities();
  }

  private loadPredefinedPersonalities(): void {
    const predefined = Personality.getAllPredefined();
    predefined.forEach(p => {
      this.personalities.set(p.id, p);
    });
  }

  getAvailablePersonalities(): Personality[] {
    return Array.from(this.personalities.values());
  }

  getPersonalityById(id: string): Personality | null {
    return this.personalities.get(id) || null;
  }

  getPersonalityByType(type: PersonalityType): Personality | null {
    const all = this.getAvailablePersonalities();
    return all.find(p => p.config.type === type) || null;
  }

  getDefaultPersonality(): Personality {
    const friendly = this.personalities.get('friendly');
    if (!friendly) {
      throw new Error('Default personality not found');
    }
    return friendly;
  }

  buildSystemPrompt(personality: Personality, context?: any): string {
    let prompt = personality.systemPrompt;

    // Si hay contexto adicional, enriquecerlo
    if (context?.userProfile) {
      prompt += `\n\n📝 SOBRE EL USUARIO:\n`;
      prompt += `- Nombre: ${context.userProfile.name}\n`;
      if (context.userProfile.experience) {
        prompt += `- Experiencia: ${context.userProfile.experience}\n`;
      }
      if (context.userProfile.preferredTone) {
        prompt += `- Tono preferido: ${context.userProfile.preferredTone}\n`;
      }
    }

    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      prompt += `\n\n💭 MEMORIAS IMPORTANTES:\n`;
      context.conversationHistory.slice(-3).forEach((memory: string, idx: number) => {
        prompt += `${idx + 1}. ${memory}\n`;
      });
    }

    return prompt;
  }

  validatePersonalityId(id: string): boolean {
    return this.personalities.has(id);
  }

  addCustomPersonality(personality: Personality): void {
    if (this.personalities.has(personality.id)) {
      throw new Error(`Personality with id ${personality.id} already exists`);
    }
    this.personalities.set(personality.id, personality);
  }

  getPersonalityTransitionMessage(from: Personality, to: Personality): string {
    const transitions: Record<string, string> = {
      'friendly_to_funny': '¡Perfecto! Activando modo comediante 😂🌿 ¡Prepárate para aprender con risas!',
      'friendly_to_epic': '⚔️ Así sea, valiente jardinero. El Guardián Ancestral despierta. ✨',
      'friendly_to_wise': '🧙 Interesante elección. Adentrémonos en las profundidades del conocimiento verde...',

      'funny_to_friendly': 'Vale vale, bajo el volumen de los chistes 😊🌿 Modo amigable activado.',
      'funny_to_epic': '¡Un momento! *se pone capa épica* ⚔️ ¿Listos para la leyenda? 🎭',
      'funny_to_wise': '🧙 Ajá, hora de ponerse serios... bueno, sabios. Déjame ajustar mis anteojos de conocimiento 📚',

      'epic_to_friendly': '🌿 Que así sea. El guardián retorna a su forma más cercana y cálida.',
      'epic_to_funny': '⚔️ Incluso los héroes necesitan reír. ¡Que comience la comedia épica! 😂',
      'epic_to_wise': '🧙 De la épica a la sabiduría... un camino natural para el guardián ancestral.',

      'wise_to_friendly': '🌿 Como la naturaleza nos enseña, a veces lo simple es lo más sabio.',
      'wise_to_funny': '🧙 Hmm... el humor también es una forma de sabiduría. ¡Activemos ese chakra cómico! 😂',
      'wise_to_epic': '⚔️ La sabiduría y la épica son hermanas. Continuemos este viaje legendario.'
    };

    const key = `${from.id}_to_${to.id}`;
    return transitions[key] ||
      `${to.config.emojis[0]} Entendido, cambio a modo ${to.config.name}.`;
  }

  getPersonalityStats(plantyContext: PlantyContext): any {
    return {
      currentPersonality: plantyContext.currentPersonality,
      personalityChanges: plantyContext.conversationHistory.filter(
        h => h.includes('personalidad') || h.includes('modo')
      ).length,
      godReferences: Object.fromEntries(plantyContext.godReferences),
      mostReferencedGod: this.getMostReferencedGod(plantyContext)
    };
  }

  private getMostReferencedGod(context: PlantyContext): string | null {
    if (context.godReferences.size === 0) return null;

    let maxGod: string | null = null;
    let maxCount = 0;

    context.godReferences.forEach((count, god) => {
      if (count > maxCount) {
        maxCount = count;
        maxGod = god;
      }
    });

    return maxGod;
  }
}
