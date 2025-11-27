export interface PlantProps {
  id: number;
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
  public readonly id: number;
  public readonly species: string;
  public readonly scientificName: string;
  public readonly type: string[];
  public readonly sunRequirement: 'low' | 'medium' | 'high';
  public readonly weeklyWatering: number;
  public readonly harvestDays: number;
  public readonly soilType: string;
  public readonly waterPerKg: number;
  public readonly benefits: string[];
  public readonly size: number;

  constructor(props: PlantProps) {
    this.id = props.id;
    this.species = props.species;
    this.scientificName = props.scientificName;
    this.type = props.type;
    this.sunRequirement = props.sunRequirement;
    this.weeklyWatering = props.weeklyWatering;
    this.harvestDays = props.harvestDays;
    this.soilType = props.soilType;
    this.waterPerKg = props.waterPerKg;
    this.benefits = props.benefits;
    this.size = props.size;
  }

  hasType(type: string): boolean {
    return this.type.includes(type);
  }

  isMedicinal(): boolean {
    return this.hasType('medicinal');
  }

  isEdible(): boolean {
    return this.hasType('vegetable');
  }

  isAromatic(): boolean {
    return this.hasType('aromatic');
  }

  isOrnamental(): boolean {
    return this.hasType('ornamental');
  }

  estimatedCost(): number {
    // Costo estimado: 50 MXN por m²
    return this.size * 50;
  }

  toJSON() {
    return {
      id: this.id,
      species: this.species,
      scientificName: this.scientificName,
      type: this.type,
      sunRequirement: this.sunRequirement,
      weeklyWatering: this.weeklyWatering,
      harvestDays: this.harvestDays,
      soilType: this.soilType,
      waterPerKg: this.waterPerKg,
      benefits: this.benefits,
      size: this.size,
    };
  }
}
