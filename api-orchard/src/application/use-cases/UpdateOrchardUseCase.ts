/**
 * Caso de Uso: Actualizar Huerto
 */

import { Orchard } from '@domain/entities/Orchard';
import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { UpdateOrchardDTO, OrchardInfoDTO } from '../dtos/OrchardDTOs';

export class UpdateOrchardUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async execute(id: string, dto: UpdateOrchardDTO): Promise<OrchardInfoDTO> {
    if (!id || id.trim().length === 0) {
      throw new Error('El ID del huerto es requerido');
    }

    // Buscar el huerto
    const orchard = await this.orchardRepository.findById(id);

    if (!orchard) {
      throw new Error('Huerto no encontrado');
    }

    // Verificar que no exista otro huerto con el mismo nombre
    if (dto.name && dto.name !== orchard.name) {
      const exists = await this.orchardRepository.exists(dto.name);
      if (exists) {
        throw new Error(`Ya existe otro huerto con el nombre "${dto.name}"`);
      }
    }

    // Actualizar la entidad
    orchard.update(dto);

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
