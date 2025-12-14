import { IOrchardRepository } from '@domain/repositories/IOrchardRepository';
import { Orchard } from '@domain/entities/Orchard';

export interface GetOrchardsByUserIdsDTO {
  userIds: string[];
}

export class GetOrchardsByUserIdsUseCase {
  constructor(private orchardRepository: IOrchardRepository) {}

  async execute(dto: GetOrchardsByUserIdsDTO): Promise<Orchard[]> {
    const { userIds } = dto;

    if (!userIds || userIds.length === 0) {
      throw new Error('La lista de IDs de usuarios no puede estar vacía');
    }

    // Validar que todos los IDs sean strings válidos
    const invalidIds = userIds.filter(id => typeof id !== 'string' || id.trim().length === 0);
    if (invalidIds.length > 0) {
      throw new Error('Algunos IDs de usuarios no son válidos');
    }

    // Obtener todos los huertos de los usuarios especificados
    const orchards = await this.orchardRepository.findByUserIds(userIds);

    return orchards;
  }
}
