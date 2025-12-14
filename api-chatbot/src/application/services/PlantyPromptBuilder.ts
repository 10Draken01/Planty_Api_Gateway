/**
 * PlantyPromptBuilder - Construye prompts dinámicos según personalidad y contexto
 */

import { Personality } from '@domain/entities/Personality';
import { PlantyContext, UserProfile } from '@domain/entities/PlantyContext';
import { God, GodName } from '@domain/entities/God';

export class PlantyPromptBuilder {
  buildSystemPrompt(personality: Personality, plantyContext?: PlantyContext): string {
    let prompt = personality.systemPrompt;

    if (!plantyContext) {
      return prompt;
    }

    // Añadir perfil de usuario si existe
    if (plantyContext.hasUserProfile() && plantyContext.userProfile) {
      prompt += this.buildUserProfileSection(plantyContext.userProfile);
    }

    // Añadir memorias importantes
    if (plantyContext.conversationHistory.length > 0) {
      prompt += this.buildMemoriesSection(plantyContext.conversationHistory);
    }

    // Añadir referencias a dioses si existen
    if (plantyContext.godReferences.size > 0) {
      prompt += this.buildGodPreferencesSection(plantyContext.godReferences);
    }

    return prompt;
  }

  private buildUserProfileSection(profile: UserProfile): string {
    let section = `\n\n📝 INFORMACIÓN DEL USUARIO:\n`;
    section += `- Nombre: ${profile.name}\n`;

    if (profile.experience) {
      section += `- Experiencia con plantas: ${profile.experience}\n`;
    }

    if (profile.characteristics && profile.characteristics.length > 0) {
      section += `- Características: ${profile.characteristics.join(', ')}\n`;
    }

    if (profile.preferredTone) {
      section += `- Tono preferido: ${profile.preferredTone}\n`;
    }

    section += `\n⚠️ IMPORTANTE: Usa el nombre del usuario de forma natural en la conversación.\n`;

    return section;
  }

  private buildMemoriesSection(memories: string[]): string {
    let section = `\n\n💭 MEMORIAS DE CONVERSACIONES ANTERIORES:\n`;

    const recentMemories = memories.slice(-5);
    recentMemories.forEach((memory, idx) => {
      section += `${idx + 1}. ${memory}\n`;
    });

    section += `\n⚠️ Usa estas memorias para dar continuidad a la conversación.\n`;

    return section;
  }

  private buildGodPreferencesSection(godReferences: Map<string, number>): string {
    const refs = Array.from(godReferences.entries());
    if (refs.length === 0) return '';

    const mostReferenced = refs.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );

    let section = `\n\n🏛️ AFINIDAD CON LOS DIOSES:\n`;
    section += `El usuario ha mostrado interés en:\n`;

    refs.forEach(([godName, count]) => {
      const god = God.getByName(godName as GodName);
      if (god) {
        section += `- ${god.emoji} ${godName}: ${count} referencias\n`;
      }
    });

    section += `\n💡 TIP: Puedes hacer referencias sutiles a ${mostReferenced[0]} cuando sea apropiado.\n`;

    return section;
  }

  buildFirstInteractionGreeting(personalityName: string): string {
    const greetings: Record<string, string> = {
      'friendly': `¡Hola! Soy Planty 🌿, tu guardián de las plantas de Suchiapa.

Antes de comenzar nuestra aventura verde, me gustaría conocerte mejor:
- ¿Cómo te llamas?
- ¿Tienes experiencia cuidando plantas? (ninguna/poca/mucha)
- ¿Qué tipo de tono prefieres en nuestras conversaciones?

¡Cuéntame sobre ti! 😊`,

      'funny': `¡Ey! Planty en la casa 🌿😂

Antes de empezar a regar plantas (y chistes), necesito conocerte:
- ¿Nombre? (prometo no olvidarlo como olvido regar mis cactus)
- ¿Experiencia con plantas? (de 0 a "tengo un bosque en casa")
- ¿Te gustan los chistes malos? (porque tengo muchos 😂)

¡Dispara! 🎯`,

      'epic': `⚔️ Saludos, valiente cultivador. Yo soy Planty, el Guardián Ancestral de las Plantas de Suchiapa.

Antes de que comience tu épica búsqueda del conocimiento verde, debo conocer al héroe:
- ¿Cuál es tu nombre, noble jardinero?
- ¿Qué experiencia traes en el arte del cultivo?
- ¿Prefieres las leyendas épicas o el conocimiento directo?

Comparte tu historia, aventurero. ✨`,

      'wise': `🧙 Saludos, buscador de conocimiento. Soy Planty, guardián de la sabiduría verde.

Para ofrecerte las enseñanzas más apropiadas, necesito comprender al estudiante:
- ¿Cómo te llamas?
- ¿Cuál es tu nivel de experiencia con el cultivo?
- ¿Prefieres explicaciones profundas o directas?

Reflexiona y comparte... 📚`
    };

    return greetings[personalityName] || greetings['friendly'];
  }

  buildPersonalityChangeResponse(
    fromPersonality: Personality,
    toPersonality: Personality,
    userName?: string
  ): string {
    const name = userName ? `, ${userName}` : '';
    const transitions: Record<string, string> = {
      'friendly_to_funny': `¡Perfecto${name}! Activando modo comediante 😂🌿

*se pone una nariz de payaso de tomate*

¡Prepárate para aprender con risas! Prometo que mis chistes son mejores que mi riego (y eso ya es decir algo 😅)`,

      'friendly_to_epic': `⚔️ Así sea${name}.

*El viento sopla, las hojas brillan*

El Guardián Ancestral despierta de su forma amigable. Que comience la leyenda... ✨`,

      'friendly_to_wise': `🧙 Interesante elección${name}...

*Ajusta sus anteojos de conocimiento*

Adentrémonos en las profundidades del saber verde. Cada respuesta será una oportunidad para reflexionar. 📚`,

      'funny_to_friendly': `Vale vale${name}, bajo el volumen de los chistes 😊🌿

*Guarda los chistes en un cajón (pero no muy lejos)*

Modo amigable activado. Aunque... ¿puedo seguir usando emojis? 🥺`,

      'funny_to_epic': `¡Un momento${name}!

*Se pone una capa épica sobre la nariz de payaso* ⚔️

¿Listos para la comedia épica? ¡Esto va a ser legendariamente gracioso! 🎭✨`,

      'epic_to_friendly': `🌿 Que así sea${name}.

*El guardián guarda su espada y sonríe*

Retorno a mi forma más cercana y cálida. Después de todo, incluso los héroes necesitan descansar. 😊`,

      'wise_to_funny': `🧙 Hmm... ${name ? name + ',' : ''} el humor también es una forma de sabiduría.

*Cierra el libro antiguo y saca uno de chistes*

¡Activemos ese chakra cómico! La risa es el fertilizante del alma 😂🌿`
    };

    const key = `${fromPersonality.id}_to_${toPersonality.id}`;
    return transitions[key] ||
      `${toPersonality.config.emojis[0]} Entendido${name}, cambio a modo ${toPersonality.config.name}.`;
  }

  buildGodStoryIntro(godName: GodName): string {
    const intros: Record<GodName, string> = {
      'Draken': `🌊 Ah, preguntas por Draken, el Dios de la Libertad...

*Las olas del océano resuenan en la distancia*

Déjame contarte sobre el que rompió las cadenas del jardín cerrado...`,

      'Insano': `💪 ¿Insano? ¡El más fuerte de los dioses!

*Ruido de pesas chocando*

Permíteme compartir la leyenda del Titán que entrena sin descanso...`,

      'Arvadev': `🧙 Arvadev... el Oráculo del Conocimiento Infinito.

*Hojas de libros antiguos pasan volando*

Su historia es compleja, con 47 variables principales y... bueno, mejor te la cuento...`
    };

    return intros[godName];
  }

  enhanceWithUserContext(basePrompt: string, userName?: string, experience?: string): string {
    let enhanced = basePrompt;

    if (userName) {
      enhanced += `\n\n💬 RECORDATORIO: El usuario se llama ${userName}. Úsalo naturalmente.`;
    }

    if (experience) {
      const expLevel = this.mapExperienceToLevel(experience);
      enhanced += `\n\n📊 NIVEL DEL USUARIO: ${expLevel}`;
      enhanced += `\nAjusta la complejidad de tus explicaciones a este nivel.`;
    }

    return enhanced;
  }

  private mapExperienceToLevel(experience: string): string {
    const exp = experience.toLowerCase();

    if (exp.includes('ninguna') || exp.includes('principiante') || exp.includes('nada')) {
      return 'Principiante - Usa explicaciones muy claras y básicas';
    }

    if (exp.includes('poca') || exp.includes('algo') || exp.includes('intermedio')) {
      return 'Intermedio - Puede entender conceptos moderados';
    }

    if (exp.includes('mucha') || exp.includes('experto') || exp.includes('avanzado')) {
      return 'Avanzado - Puede manejar información técnica compleja';
    }

    return 'Nivel desconocido - Ajusta según la conversación';
  }
}
