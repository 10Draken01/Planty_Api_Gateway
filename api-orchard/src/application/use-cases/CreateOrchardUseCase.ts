/**
 * Caso de Uso: Crear Huerto
 */

import { Orchard } from '@domain/entities/Orchard';
import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { CreateOrchardDTO, OrchardInfoDTO } from '../dtos/OrchardDTOs';

export class CreateOrchardUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async execute(dto: CreateOrchardDTO): Promise<OrchardInfoDTO> {
    // Validaciones
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('El ID del usuario es requerido');
    }

    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('El nombre del huerto es requerido');
    }

    if (!dto.description) {
      throw new Error('La descripción del huerto es requerida');
    }

    if (dto.width <= 0 || dto.height <= 0) {
      throw new Error('Las dimensiones del huerto deben ser mayores a 0');
    }

    // Verificar que no exista un huerto con el mismo nombre
    const exists = await this.orchardRepository.exists(dto.name);
    if (exists) {
      throw new Error(`Ya existe un huerto con el nombre "${dto.name}"`);
    }

    // Crear la entidad
    const orchard = Orchard.create({
      userId: dto.userId,
      name: dto.name,
      description: dto.description,
      plants_id: dto.plants_id || [],
      width: dto.width,
      height: dto.height,
      state: dto.state !== undefined ? dto.state : true
    });

    // Guardar en el repositorio
    const savedOrchard = await this.orchardRepository.save(orchard);

    // Retornar DTO de respuesta
    return this.toDTO(savedOrchard);
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
