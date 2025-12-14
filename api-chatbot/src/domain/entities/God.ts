/**
 * Entidad God - Representa un dios del universo de Planty
 */

export type GodName = 'Draken' | 'Insano' | 'Arvadev';

export interface GodAttributes {
  domain: string;
  traits: string[];
  favoriteThings: string[];
  quotes: string[];
  powers: string[];
}

export class God {
  private constructor(
    public readonly name: GodName,
    public readonly description: string,
    public readonly attributes: GodAttributes,
    public readonly emoji: string
  ) {}

  static createDraken(): God {
    return new God(
      'Draken',
      'Dios de la Libertad',
      {
        domain: 'libertad',
        traits: ['aventurero', 'libre', 'explorador', 'curioso'],
        favoriteThings: ['viajar', 'explorar nuevos mundos', 'descubrir culturas', 'romper cadenas'],
        quotes: [
          'La libertad no se pide, se conquista',
          'Cada planta merece crecer sin barreras',
          'El horizonte es solo el comienzo del viaje'
        ],
        powers: ['inspirar valentía', 'romper limitaciones', 'abrir nuevos caminos']
      },
      '🌊'
    );
  }

  static createInsano(): God {
    return new God(
      'Insano',
      'Dios de la Fuerza',
      {
        domain: 'fuerza',
        traits: ['poderoso', 'disciplinado', 'incansable', 'determinado'],
        favoriteThings: ['creatina', 'preentreno', 'proteína', 'entrenar sin descanso'],
        quotes: [
          'Una planta fuerte resiste cualquier tormenta',
          'La disciplina es el fertilizante del éxito',
          'No pain, no gain... ¡y eso aplica para las plantas también!'
        ],
        powers: ['fortalecer raíces', 'aumentar resistencia', 'potenciar crecimiento']
      },
      '💪'
    );
  }

  static createArvadev(): God {
    return new God(
      'Arvadev',
      'Dios de la Sabiduría',
      {
        domain: 'sabiduría',
        traits: ['sabio', 'estratégico', 'analítico', 'paciente'],
        favoriteThings: ['Valorant', 'conocimiento complejo', 'teorías profundas', 'datos curiosos'],
        quotes: [
          'El conocimiento es como el agua: esencial pero debe dosificarse',
          'Cada planta tiene 47 formas de crecer, pero solo 3 son óptimas',
          'La fotosíntesis es el clutch definitivo de la naturaleza'
        ],
        powers: ['revelar conocimiento oculto', 'optimizar estrategias', 'predecir resultados']
      },
      '🧙'
    );
  }

  static getAll(): God[] {
    return [
      God.createDraken(),
      God.createInsano(),
      God.createArvadev()
    ];
  }

  static getByName(name: GodName): God | null {
    const gods = God.getAll();
    return gods.find(g => g.name === name) || null;
  }

  generateStory(context: string): string {
    const quote = this.attributes.quotes[Math.floor(Math.random() * this.attributes.quotes.length)];
    return `${this.emoji} **${this.name}, ${this.description}**, dice:\n\n"${quote}"\n\n${context}`;
  }

  getMetaphor(topic: string): string {
    switch (this.name) {
      case 'Draken':
        return `Como ${this.name} diría: "${topic}" es como zarpar a un nuevo mar. Cada ola es una lección, cada viento es una oportunidad.`;
      case 'Insano':
        return `${this.name} te recordaría: "${topic}" requiere la misma disciplina que entrenar. Constancia, fuerza y mucha creatina... digo, agua.`;
      case 'Arvadev':
        return `Según ${this.name}: "${topic}" tiene 12 variables principales, 47 secundarias, y si juegas bien tus cartas, es como un ace en Valorant.`;
    }
  }
}
