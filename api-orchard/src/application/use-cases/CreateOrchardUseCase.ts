/**
 * Caso de Uso: Crear Huerto (ACTUALIZADO)
 *
 * CAMBIOS:
 * - Eliminado: plants_id
 * - Agregado: width y height para crear Dimensions
 * - El huerto se crea sin plantas (layout vacío)
 */

import { Orchard } from '@domain/entities/Orchard';
import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { Dimensions } from '@domain/value-objects/Dimensions';
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

    if (!dto.width || dto.width <= 0) {
      throw new Error('El ancho del huerto debe ser mayor a 0');
    }

    if (!dto.height || dto.height <= 0) {
      throw new Error('El alto del huerto debe ser mayor a 0');
    }

    // Validar máximo 3 huertos por usuario
    const userOrchards = await this.orchardRepository.findByUserId(dto.userId);
    if (userOrchards.length >= 3) {
      throw new Error('Has alcanzado el límite de 3 huertos. Elimina uno existente para crear uno nuevo.');
    }

    // Verificar que no exista un huerto con el mismo nombre para este usuario
    const exists = await this.orchardRepository.existsByUserAndName(
      dto.userId,
      dto.name
    );

    if (exists) {
      throw new Error(`Ya existe un huerto con el nombre "${dto.name}" para este usuario`);
    }

    // Crear dimensiones
    const dimensions = new Dimensions(dto.width, dto.height);

    // Crear la entidad
    const orchard = Orchard.create({
      userId: dto.userId,
      name: dto.name,
      description: dto.description,
      plants: dto.plants,
      dimensions,
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
      width: orchard.dimensions.width,
      height: orchard.dimensions.height,
      area: orchard.area,
      availableArea: orchard.getAvailableArea(),
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
