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

export class GetUserByEmailUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: GetUserByEmailInput): Promise<User> {
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

    return user;
  }
}
