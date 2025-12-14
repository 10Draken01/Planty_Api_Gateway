/**
 * GodStorytellerService - Genera historias y metáforas con los dioses
 */

import { God, GodName } from '@domain/entities/God';

export interface StoryContext {
  plantProblem?: string;
  userQuestion?: string;
  topic?: string;
}

export class GodStorytellerService {
  private gods: Map<GodName, God>;

  constructor() {
    this.gods = new Map();
    this.loadGods();
  }

  private loadGods(): void {
    const allGods = God.getAll();
    allGods.forEach(god => {
      this.gods.set(god.name, god);
    });
  }

  generateStory(godName: GodName, context: StoryContext): string {
    const god = this.gods.get(godName);
    if (!god) {
      return this.generateRandomGodStory(context);
    }

    const contextText = this.buildContextText(context);
    return god.generateStory(contextText);
  }

  generateRandomGodStory(context: StoryContext): string {
    const allGods = Array.from(this.gods.values());
    const randomGod = allGods[Math.floor(Math.random() * allGods.length)];

    const contextText = this.buildContextText(context);
    return randomGod.generateStory(contextText);
  }

  getGodTeaching(godName: GodName, topic: string): string {
    const god = this.gods.get(godName);
    if (!god) {
      return `Los dioses antiguos nos enseñan que ${topic} requiere sabiduría y paciencia.`;
    }

    return god.getMetaphor(topic);
  }

  createMetaphorForPlantProblem(problem: string): string {
    // Seleccionar el dios más apropiado según el problema
    const god = this.selectGodForProblem(problem);

    if (problem.includes('riego') || problem.includes('agua')) {
      return `${god.emoji} ${god.name} dice: "Como el agua fluye libremente, así debe ser tu riego. Ni demasiado ni muy poco, el balance es la clave."`;
    }

    if (problem.includes('plaga') || problem.includes('enfermedad')) {
      return `${god.emoji} ${god.name} proclama: "La fuerza de una planta se mide en su resistencia. Fortalece sus raíces y ninguna plaga la vencerá."`;
    }

    if (problem.includes('crecimiento') || problem.includes('lento')) {
      return `${god.emoji} ${god.name} reflexiona: "El conocimiento nos dice que cada planta tiene su propio ritmo. La paciencia es sabiduría en acción."`;
    }

    return god.getMetaphor(problem);
  }

  private selectGodForProblem(problem: string): God {
    const lowerProblem = problem.toLowerCase();

    if (lowerProblem.includes('riego') || lowerProblem.includes('agua') ||
        lowerProblem.includes('libertad') || lowerProblem.includes('espacio')) {
      return this.gods.get('Draken')!;
    }

    if (lowerProblem.includes('plaga') || lowerProblem.includes('fuerte') ||
        lowerProblem.includes('resistencia') || lowerProblem.includes('débil')) {
      return this.gods.get('Insano')!;
    }

    if (lowerProblem.includes('cómo') || lowerProblem.includes('por qué') ||
        lowerProblem.includes('ciencia') || lowerProblem.includes('explicar')) {
      return this.gods.get('Arvadev')!;
    }

    // Default: random
    const allGods = Array.from(this.gods.values());
    return allGods[Math.floor(Math.random() * allGods.length)];
  }

  private buildContextText(context: StoryContext): string {
    if (context.plantProblem) {
      return `En relación al problema: ${context.plantProblem}`;
    }

    if (context.userQuestion) {
      return `Sobre la pregunta: ${context.userQuestion}`;
    }

    if (context.topic) {
      return `Acerca de: ${context.topic}`;
    }

    return 'en el arte de cultivar plantas con sabiduría';
  }

  getAllGodsInfo(): any[] {
    return Array.from(this.gods.values()).map(god => ({
      name: god.name,
      description: god.description,
      emoji: god.emoji,
      domain: god.attributes.domain,
      traits: god.attributes.traits,
      favoriteThings: god.attributes.favoriteThings,
      sampleQuote: god.attributes.quotes[0]
    }));
  }

  getGodByName(name: GodName): God | undefined {
    return this.gods.get(name);
  }

  enhanceResponseWithGodWisdom(response: string, godName?: GodName): string {
    if (!godName) {
      return response;
    }

    const god = this.gods.get(godName);
    if (!god) {
      return response;
    }

    const quote = god.attributes.quotes[Math.floor(Math.random() * god.attributes.quotes.length)];

    return `${response}\n\n---\n\n${god.emoji} **Sabiduría de ${god.name}**: "${quote}"`;
  }
}
