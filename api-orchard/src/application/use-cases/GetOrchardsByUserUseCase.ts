/**
 * Caso de Uso: Obtener Huertos por Usuario
 */

import { Orchard } from '@domain/entities/Orchard';
import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { OrchardListDTO, OrchardInfoDTO } from '../dtos/OrchardDTOs';

export class GetOrchardsByUserUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async execute(userId: string): Promise<OrchardListDTO> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('El ID del usuario es requerido');
    }

    const orchards = await this.orchardRepository.findByUserId(userId);

    const total = orchards.length;
    const active = orchards.filter(o => o.state).length;

    return {
      orchards: orchards.map(o => this.toDTO(o)),
      total: total,
      active: active,
      inactive: total - active
    };
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
