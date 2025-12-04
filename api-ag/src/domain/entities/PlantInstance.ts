import { Plant } from './Plant';
import { Position } from '../value-objects/Position';

export interface PlantInstanceProps {
  plant: Plant;
  quantity: number;
  position: Position;
  plantedAt?: Date;
  status?: 'pending' | 'planted' | 'growing' | 'harvest_ready' | 'harvested';
}

export class PlantInstance {
  public readonly plant: Plant;
  public readonly quantity: number;
  public readonly position: Position;
  public readonly plantedAt?: Date;
  public readonly status: 'pending' | 'planted' | 'growing' | 'harvest_ready' | 'harvested';

  constructor(props: PlantInstanceProps) {
    if (props.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    this.plant = props.plant;
    this.quantity = props.quantity;
    this.position = props.position;
    this.plantedAt = props.plantedAt;
    this.status = props.status || 'pending';
  }

  get totalArea(): number {
    return this.plant.size * this.quantity;
  }

  get totalWeeklyWater(): number {
    return this.plant.weeklyWatering * this.quantity;
  }

  get totalCost(): number {
    return this.plant.estimatedCost() * this.quantity;
  }

  toJSON() {
    return {
      plantId: this.plant.id,
      name: this.plant.species,
      scientificName: this.plant.scientificName,
      quantity: this.quantity,
      position: this.position.toJSON(),
      area: this.totalArea,
      type: this.plant.type,
      status: this.status,
      plantedAt: this.plantedAt?.toISOString(),
    };
  }
}
