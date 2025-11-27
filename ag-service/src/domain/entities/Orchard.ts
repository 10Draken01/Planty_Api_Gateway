import { Dimensions } from '../value-objects/Dimensions';
import { Metrics } from '../value-objects/Metrics';
import { PlantInstance } from './PlantInstance';

export interface OrchardCalendar {
  season: string;
  hemisphere: 'north' | 'south';
  plantingSchedule: Array<{
    plantId: number;
    plant: string;
    plantingWeek: number;
    harvestWeek: number;
    daysToHarvest: number;
    notes: string;
  }>;
  monthlyTasks: Array<{
    month: string;
    week: number;
    tasks: string[];
  }>;
}

export interface OrchardProps {
  userId?: string;
  name?: string;
  description?: string;
  dimensions: Dimensions;
  plants: PlantInstance[];
  metrics: Metrics;
  objective: 'alimenticio' | 'medicinal' | 'sostenible' | 'ornamental';
  state?: boolean;
  streakOfDays?: number;
  timeOfLife?: number;
  calendar?: OrchardCalendar;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Orchard {
  public userId?: string;
  public name: string;
  public description: string;
  public dimensions: Dimensions;
  public plants: PlantInstance[];
  public metrics: Metrics;
  public objective: 'alimenticio' | 'medicinal' | 'sostenible' | 'ornamental';
  public state: boolean;
  public streakOfDays: number;
  public timeOfLife: number;
  public calendar?: OrchardCalendar;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: OrchardProps) {
    this.userId = props.userId;
    this.name = props.name || 'Mi Huerto';
    this.description = props.description || '';
    this.dimensions = props.dimensions;
    this.plants = props.plants;
    this.metrics = props.metrics;
    this.objective = props.objective;
    this.state = props.state ?? true;
    this.streakOfDays = props.streakOfDays ?? 0;
    this.timeOfLife = props.timeOfLife ?? 0;
    this.calendar = props.calendar;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  get totalPlants(): number {
    return this.plants.reduce((sum, p) => sum + p.quantity, 0);
  }

  get usedArea(): number {
    return this.plants.reduce((sum, p) => sum + p.totalArea, 0);
  }

  get availableArea(): number {
    return this.dimensions.totalArea - this.usedArea;
  }

  getCategoryBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {
      vegetable: 0,
      medicinal: 0,
      aromatic: 0,
      ornamental: 0,
    };

    this.plants.forEach(plantInstance => {
      plantInstance.plant.type.forEach(type => {
        if (type in breakdown) {
          breakdown[type] += plantInstance.quantity;
        }
      });
    });

    const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
    if (total === 0) return breakdown;

    // Convertir a porcentajes
    Object.keys(breakdown).forEach(key => {
      breakdown[key] = Math.round((breakdown[key] / total) * 100);
    });

    return breakdown;
  }

  toJSON() {
    return {
      userId: this.userId,
      name: this.name,
      description: this.description,
      dimensions: this.dimensions.toJSON(),
      plants: this.plants.map(p => p.toJSON()),
      metrics: this.metrics.toJSON(),
      objective: this.objective,
      state: this.state,
      streakOfDays: this.streakOfDays,
      timeOfLife: this.timeOfLife,
      countPlants: this.totalPlants,
      calendar: this.calendar,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
