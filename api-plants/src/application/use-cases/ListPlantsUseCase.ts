/**
 * Caso de Uso: Listar Plantas
 */

import { Plant } from '@domain/entities/Plant';
import { PlantRepository } from '@domain/repositories/PlantRepository';
import { PlantListDTO, PlantInfoDTO } from '../dtos/PlantDTOs';

export class ListPlantsUseCase {
  constructor(private plantRepository: PlantRepository) {}

  async execute(): Promise<PlantListDTO> {
    const plants = await this.plantRepository.findAll();
    const total = await this.plantRepository.count();

    return {
      plants: plants.map(p => this.toDTO(p)),
      total: total
    };
  }

  private toDTO(plant: Plant): PlantInfoDTO {
    return {
      _id: plant.id,
      species: plant.species,
      scientificName: plant.scientificName,
      type: plant.type,
      sunRequirement: plant.sunRequirement,
      weeklyWatering: plant.weeklyWatering,
      harvestDays: plant.harvestDays,
      soilType: plant.soilType,
      waterPerKg: plant.waterPerKg,
      benefits: plant.benefits,
      size: plant.size
    };
  }
}
