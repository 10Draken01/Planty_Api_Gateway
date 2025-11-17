/**
 * Caso de Uso: Eliminar Huerto
 */

import { OrchardRepository } from '@domain/repositories/OrchardRepository';

export class DeleteOrchardUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async execute(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new Error('El ID del huerto es requerido');
    }

    // Verificar que el huerto exista
    const orchard = await this.orchardRepository.findById(id);

    if (!orchard) {
      throw new Error('Huerto no encontrado');
    }

    // Eliminar el huerto
    const deleted = await this.orchardRepository.delete(id);

    if (!deleted) {
      throw new Error('No se pudo eliminar el huerto');
    }

    return deleted;
  }
}
