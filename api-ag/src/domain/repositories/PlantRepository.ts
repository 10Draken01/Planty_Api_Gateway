import { Plant } from '../entities/Plant';

export interface PlantRepository {
  findAll(): Promise<Plant[]>;
  findById(id: number): Promise<Plant | null>;
  findBySpecies(species: string): Promise<Plant | null>;
  findByType(type: string): Promise<Plant[]>;
  count(): Promise<number>;
  create(plant: Plant): Promise<void>;
  createMany(plants: Plant[]): Promise<void>;
}
