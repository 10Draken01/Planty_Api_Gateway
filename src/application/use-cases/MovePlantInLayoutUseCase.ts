/**
 * Caso de Uso: Mover Planta en el Layout
 *
 * Permite mover una planta a una nueva posición dentro del huerto,
 * validando que la nueva posición sea válida (sin colisiones y dentro de límites)
 */

import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { Position } from '@domain/value-objects/Position';

export interface MovePlantInLayoutDTO {
  orchardId: string;
  plantInstanceId: string;  // ID de la instancia de la planta en el layout
  newX: number;
  newY: number;
}

export interface MovePlantInLayoutResponse {
  orchardId: string;
  plantInstanceId: string;
  newPosition: { x: number; y: number };
  message: string;
}

export class MovePlantInLayoutUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async execute(dto: MovePlantInLayoutDTO): Promise<MovePlantInLayoutResponse> {
    // Validaciones de entrada
    if (!dto.orchardId || dto.orchardId.trim().length === 0) {
      throw new Error('El ID del huerto es requerido');
    }

    if (!dto.plantInstanceId || dto.plantInstanceId.trim().length === 0) {
      throw new Error('El ID de la instancia de la planta es requerido');
    }

    if (dto.newX < 0 || dto.newY < 0) {
      throw new Error('Las nuevas coordenadas deben ser no negativas');
    }

    // Buscar el huerto
    const orchard = await this.orchardRepository.findById(dto.orchardId);

    if (!orchard) {
      throw new Error(`Huerto con ID ${dto.orchardId} no encontrado`);
    }

    // Crear la nueva posición
    const newPosition = new Position(dto.newX, dto.newY);

    // Mover la planta
    // Las validaciones de dominio (colisiones, límites) se ejecutan dentro de movePlant
    orchard.movePlant(dto.plantInstanceId, newPosition);

    // Persistir cambios
    const updatedOrchard = await this.orchardRepository.update(orchard);

    return {
      orchardId: updatedOrchard.id,
      plantInstanceId: dto.plantInstanceId,
      newPosition: newPosition.toJSON(),
      message: 'Planta movida exitosamente'
    };
  }
}
