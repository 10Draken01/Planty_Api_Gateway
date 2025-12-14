/**
 * Caso de Uso: Remover Planta del Layout
 *
 * Permite remover una planta específica del layout del huerto
 */

import { OrchardRepository } from '@domain/repositories/OrchardRepository';

export interface RemovePlantFromLayoutDTO {
  orchardId: string;
  plantInstanceId: string;  // ID de la instancia de la planta en el layout
}

export interface RemovePlantFromLayoutResponse {
  orchardId: string;
  plantInstanceId: string;
  countPlants: number;
  message: string;
}

export class RemovePlantFromLayoutUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async execute(dto: RemovePlantFromLayoutDTO): Promise<RemovePlantFromLayoutResponse> {
    // Validaciones de entrada
    if (!dto.orchardId || dto.orchardId.trim().length === 0) {
      throw new Error('El ID del huerto es requerido');
    }

    if (!dto.plantInstanceId || dto.plantInstanceId.trim().length === 0) {
      throw new Error('El ID de la instancia de la planta es requerido');
    }

    // Buscar el huerto
    const orchard = await this.orchardRepository.findById(dto.orchardId);

    if (!orchard) {
      throw new Error(`Huerto con ID ${dto.orchardId} no encontrado`);
    }

    // Remover la planta
    orchard.removePlantFromLayout(dto.plantInstanceId);

    // Persistir cambios
    const updatedOrchard = await this.orchardRepository.update(orchard);

    return {
      orchardId: updatedOrchard.id,
      plantInstanceId: dto.plantInstanceId,
      countPlants: updatedOrchard.countPlants,
      message: 'Planta removida exitosamente del layout'
    };
  }
}
