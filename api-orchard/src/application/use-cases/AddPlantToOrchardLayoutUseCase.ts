/**
 * Caso de Uso: Agregar Planta al Layout del Huerto
 *
 * Este caso de uso permite agregar una planta con su posición específica
 * al layout del huerto, validando colisiones y límites.
 */

import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { Position } from '@domain/value-objects/Position';

export interface AddPlantToLayoutDTO {
  orchardId: string;
  plantId: number;  // ID de la planta en la BD de plantas
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface AddPlantToLayoutResponse {
  orchardId: string;
  plantInstance: {
    id: string;
    plantId: number;
    position: { x: number; y: number };
    width: number;
    height: number;
    rotation: number;
    status: string;
  };
  message: string;
}

export class AddPlantToOrchardLayoutUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async execute(dto: AddPlantToLayoutDTO): Promise<AddPlantToLayoutResponse> {
    // Validaciones de entrada
    if (!dto.orchardId || dto.orchardId.trim().length === 0) {
      throw new Error('El ID del huerto es requerido');
    }

    if (!dto.plantId || dto.plantId <= 0) {
      throw new Error('El ID de la planta es inválido');
    }

    if (dto.x < 0 || dto.y < 0) {
      throw new Error('Las coordenadas deben ser no negativas');
    }

    if (dto.width !== undefined && dto.width <= 0) {
      throw new Error('El ancho debe ser mayor a 0');
    }

    if (dto.height !== undefined && dto.height <= 0) {
      throw new Error('El alto debe ser mayor a 0');
    }

    // Buscar el huerto
    const orchard = await this.orchardRepository.findById(dto.orchardId);

    if (!orchard) {
      throw new Error(`Huerto con ID ${dto.orchardId} no encontrado`);
    }

    // Crear la posición
    const position = new Position(dto.x, dto.y);

    // Agregar planta al layout
    // Las validaciones de dominio (colisiones, límites) se ejecutan dentro de addPlantToLayout
    const newPlant = orchard.addPlantToLayout({
      plantId: dto.plantId,
      position,
      width: dto.width ?? 1,
      height: dto.height ?? 1,
      rotation: dto.rotation ?? 0
    });

    // Persistir cambios
    const updatedOrchard = await this.orchardRepository.update(orchard);

    return {
      orchardId: updatedOrchard.id,
      plantInstance: newPlant.toJSON(),
      message: 'Planta agregada exitosamente al layout del huerto'
    };
  }
}
