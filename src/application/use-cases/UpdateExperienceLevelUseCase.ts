import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export interface UpdateExperienceLevelRequest {
  userId: string;
  experience_level: number;
}

export class UpdateExperienceLevelUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(request: UpdateExperienceLevelRequest): Promise<User> {
    // Validar que el userId no esté vacío
    if (!request.userId || request.userId.trim().length === 0) {
      throw new Error('El ID del usuario es requerido');
    }

    // Validar que el nivel de experiencia sea válido
    if (!request.experience_level) {
      throw new Error('El nivel de experiencia es requerido');
    }

    if (request.experience_level < 1 || request.experience_level > 3) {
      throw new Error('El nivel de experiencia debe estar entre 1 y 3');
    }

    // Buscar usuario existente
    const existingUser = await this.userRepository.findById(request.userId);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    // Crear usuario actualizado solo con el cambio de nivel de experiencia
    const updatedUser = new User({
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      password: existingUser.password,
      is_verified: existingUser.is_verified,
      count_orchards: existingUser.count_orchards,
      experience_level: request.experience_level as 1 | 2 | 3 | 4,
      profile_image: existingUser.profile_image,
      tokenFCM: existingUser.tokenFCM,
      createdAt: existingUser.createdAt,
      historyTimeUse_ids: existingUser.historyTimeUse_ids,
      preferred_plant_category: existingUser.preferred_plant_category,
      favorite_plants: existingUser.favorite_plants
    });

    // Guardar cambios
    return await this.userRepository.update(updatedUser);
  }
}
