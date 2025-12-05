/**
 * Caso de Uso: Gestionar Plantas del Huerto
 *
 * @deprecated Este caso de uso está obsoleto.
 * Use AddPlantToOrchardLayoutUseCase, MovePlantInLayoutUseCase, y RemovePlantFromLayoutUseCase en su lugar.
 */

import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { OrchardInfoDTO } from '../dtos/OrchardDTOs';
import { Orchard } from '@domain/entities/Orchard';

export class ManagePlantsUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async addPlant(orchardId: string, plantId: string): Promise<OrchardInfoDTO> {
    throw new Error('Este método está obsoleto. Use AddPlantToOrchardLayoutUseCase en su lugar.');
  }

  async removePlant(orchardId: string, plantId: string): Promise<OrchardInfoDTO> {
    throw new Error('Este método está obsoleto. Use RemovePlantFromLayoutUseCase en su lugar.');
  }

  private toDTO(orchard: Orchard): OrchardInfoDTO {
    return {
      _id: orchard.id,
      userId: orchard.userId,
      name: orchard.name,
      description: orchard.description,
      width: orchard.dimensions.width,
      height: orchard.dimensions.height,
      area: orchard.area,
      availableArea: orchard.availableArea,
      plants: orchard.plants.map(p => p.toJSON()),
      state: orchard.state,
      createAt: orchard.createAt,
      updateAt: orchard.updateAt,
      timeOfLife: orchard.timeOfLife,
      streakOfDays: orchard.streakOfDays,
      countPlants: orchard.countPlants
    };
  }
}
