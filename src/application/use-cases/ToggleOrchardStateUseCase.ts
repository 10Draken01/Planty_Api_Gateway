/**
 * Caso de Uso: Activar/Desactivar Huerto
 */

import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { OrchardInfoDTO } from '../dtos/OrchardDTOs';
import { Orchard } from '@domain/entities/Orchard';

export class ToggleOrchardStateUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async execute(id: string, activate: boolean): Promise<OrchardInfoDTO> {
    if (!id || id.trim().length === 0) {
      throw new Error('El ID del huerto es requerido');
    }

    const orchard = await this.orchardRepository.findById(id);

    if (!orchard) {
      throw new Error('Huerto no encontrado');
    }

    // Activar o desactivar
    if (activate) {
      orchard.activate();
    } else {
      orchard.deactivate();
    }

    // Guardar cambios
    const updatedOrchard = await this.orchardRepository.update(orchard);

    return this.toDTO(updatedOrchard);
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
