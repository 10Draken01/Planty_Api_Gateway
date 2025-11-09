/**
 * CASO DE USO - GetUserByEmailUseCase
 *
 * Busca un usuario por su email en el repositorio.
 * Este caso de uso es utilizado por el servicio de autenticación
 * para validar credenciales de login.
 *
 * Principios aplicados:
 * - Single Responsibility: Solo maneja la búsqueda por email
 * - Use Case Pattern: Encapsula lógica de negocio específica
 */

import { User } from '../../domain/entities/User.js';
import { UserRepository } from '../../domain/repositories/UserRepository.js';

interface GetUserByEmailInput {
  email: string;
}

interface UserFounded {
  id: string;
  name: string;
  email: string;
  orchards_id: string[];
  count_orchards: number;
  experience_level: number;
  profile_image: string;
  createdAt: Date;
  historyTimeUse_ids: Date[];
}


export class GetUserByEmailUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: GetUserByEmailInput): Promise<UserFounded> {
    const { email } = input;

    // Validar que el email esté presente
    if (!email) {
      throw new Error('El email es requerido');
    }

    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(email);

    // Si no existe, lanzar error
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      orchards_id: user.orchards_id!,
      count_orchards: user.count_orchards!,
      experience_level: user.experience_level,
      profile_image: user.profile_image!,
      createdAt: user.createdAt,
      historyTimeUse_ids: user.historyTimeUse_ids
    };
  }
}
