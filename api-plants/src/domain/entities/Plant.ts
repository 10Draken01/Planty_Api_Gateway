/**
 * Entidad de Dominio: Plant (Planta)
 * Representa una planta con sus propiedades y reglas de negocio
 */

export interface PlantProps {
  _id: number;
  species: string;
  scientificName: string;
  type: string[];
  sunRequirement: 'low' | 'medium' | 'high';
  weeklyWatering: number;
  harvestDays: number;
  soilType: string;
  waterPerKg: number;
  benefits: string[];
  size: number;
}

export class Plant {
  private constructor(private props: PlantProps) {}

  /**
   * Factory method para crear una nueva instancia de Plant
   */
  static create(data: PlantProps): Plant {
    // Validaciones de negocio
    if (!data.species || data.species.trim().length === 0) {
      throw new Error('El nombre de la especie es requerido');
    }

    if (!data.scientificName || data.scientificName.trim().length === 0) {
      throw new Error('El nombre científico es requerido');
    }

    if (!data.type || data.type.length === 0) {
      throw new Error('El tipo de planta es requerido');
    }

    if (data.weeklyWatering < 0) {
      throw new Error('El riego semanal no puede ser negativo');
    }

    if (data.harvestDays <= 0) {
      throw new Error('Los días de cosecha deben ser mayores a 0');
    }

    if (data.size <= 0) {
      throw new Error('El tamaño debe ser mayor a 0');
    }

    return new Plant({
      _id: data._id,
      species: data.species.trim(),
      scientificName: data.scientificName.trim(),
      type: data.type,
      sunRequirement: data.sunRequirement,
      weeklyWatering: data.weeklyWatering,
      harvestDays: data.harvestDays,
      soilType: data.soilType.trim(),
      waterPerKg: data.waterPerKg,
      benefits: data.benefits,
      size: data.size
    });
  }

  /**
   * Factory method para reconstruir desde persistencia
   */
  static fromPersistence(props: PlantProps): Plant {
    return new Plant(props);
  }

  // Getters
  get id(): number {
    return this.props._id;
  }

  get species(): string {
    return this.props.species;
  }

  get scientificName(): string {
    return this.props.scientificName;
  }

  get type(): string[] {
    return [...this.props.type];
  }

  get sunRequirement(): 'low' | 'medium' | 'high' {
    return this.props.sunRequirement;
  }

  get weeklyWatering(): number {
    return this.props.weeklyWatering;
  }

  get harvestDays(): number {
    return this.props.harvestDays;
  }

  get soilType(): string {
    return this.props.soilType;
  }

  get waterPerKg(): number {
    return this.props.waterPerKg;
  }

  get benefits(): string[] {
    return [...this.props.benefits];
  }

  get size(): number {
    return this.props.size;
  }

  // Métodos de negocio

  /**
   * Verifica si la planta es aromática
   */
  isAromatic(): boolean {
    return this.props.type.includes('aromatic');
  }

  /**
   * Verifica si la planta es medicinal
   */
  isMedicinal(): boolean {
    return this.props.type.includes('medicinal');
  }

  /**
   * Verifica si la planta es vegetal
   */
  isVegetable(): boolean {
    return this.props.type.includes('vegetable');
  }

  /**
   * Verifica si la planta requiere mucho sol
   */
  requiresHighSun(): boolean {
    return this.props.sunRequirement === 'high';
  }

  /**
   * Calcula el agua total necesaria por semana (aproximado)
   */
  calculateWeeklyWaterNeeds(): number {
    return this.props.weeklyWatering;
  }

  /**
   * Convierte la entidad a un objeto plano para persistencia
   */
  toJSON(): PlantProps {
    return {
      _id: this.props._id,
      species: this.props.species,
      scientificName: this.props.scientificName,
      type: [...this.props.type],
      sunRequirement: this.props.sunRequirement,
      weeklyWatering: this.props.weeklyWatering,
      harvestDays: this.props.harvestDays,
      soilType: this.props.soilType,
      waterPerKg: this.props.waterPerKg,
      benefits: [...this.props.benefits],
      size: this.props.size
    };
  }
}
