/**
 * Caso de Uso: Listar Huertos
 */

import { Orchard } from '@domain/entities/Orchard';
import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { OrchardListDTO, OrchardInfoDTO } from '../dtos/OrchardDTOs';

export class ListOrchardsUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async execute(activeOnly?: boolean): Promise<OrchardListDTO> {
    let orchards: Orchard[];

    if (activeOnly === true) {
      orchards = await this.orchardRepository.findActive();
    } else if (activeOnly === false) {
      orchards = await this.orchardRepository.findInactive();
    } else {
      orchards = await this.orchardRepository.findAll();
    }

    const total = await this.orchardRepository.count();
    const active = await this.orchardRepository.countActive();

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
