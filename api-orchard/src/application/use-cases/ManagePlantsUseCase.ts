/**
 * Caso de Uso: Gestionar Plantas del Huerto
 */

import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { OrchardInfoDTO } from '../dtos/OrchardDTOs';
import { Orchard } from '@domain/entities/Orchard';

export class ManagePlantsUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async addPlant(orchardId: string, plantId: string): Promise<OrchardInfoDTO> {
    if (!orchardId || orchardId.trim().length === 0) {
      throw new Error('El ID del huerto es requerido');
    }

    if (!plantId || plantId.trim().length === 0) {
      throw new Error('El ID de la planta es requerido');
    }

    const orchard = await this.orchardRepository.findById(orchardId);

    if (!orchard) {
      throw new Error('Huerto no encontrado');
    }

    // Agregar planta
    orchard.addPlant(plantId);

    // Guardar cambios
    const updatedOrchard = await this.orchardRepository.update(orchard);

    return this.toDTO(updatedOrchard);
  }

  async removePlant(orchardId: string, plantId: string): Promise<OrchardInfoDTO> {
    if (!orchardId || orchardId.trim().length === 0) {
      throw new Error('El ID del huerto es requerido');
    }

    if (!plantId || plantId.trim().length === 0) {
      throw new Error('El ID de la planta es requerido');
    }

    const orchard = await this.orchardRepository.findById(orchardId);

    if (!orchard) {
      throw new Error('Huerto no encontrado');
    }

    // Remover planta
    orchard.removePlant(plantId);

    // Guardar cambios
    const updatedOrchard = await this.orchardRepository.update(orchard);

    return this.toDTO(updatedOrchard);
  }

  private toDTO(orchard: Orchard): OrchardInfoDTO {
    return {
      _id: orchard.id,
      name: orchard.name,
      description: orchard.description,
      plants_id: orchard.plants_id,
      width: orchard.width,
      height: orchard.height,
      area: orchard.area,
      state: orchard.state,
      createAt: orchard.createAt,
      updateAt: orchard.updateAt,
      timeOfLife: orchard.timeOfLife,
      streakOfDays: orchard.streakOfDays,
      countPlants: orchard.countPlants
    };
  }
}
