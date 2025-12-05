/**
 * CASO DE USO - VerifyUserUseCase
 *
 * Marca un usuario como verificado (is_verified = true)
 * Este caso de uso es utilizado por el servicio de autenticación
 * para activar la cuenta después de verificar el código OTP 2FA.
 *
 * Principios aplicados:
 * - Single Responsibility: Solo maneja la verificación de usuario
 * - Use Case Pattern: Encapsula lógica de negocio específica
 */

import { User } from '../../domain/entities/User.js';
import { UserRepository } from '../../domain/repositories/UserRepository.js';

interface VerifyUserInput {
  email: string;
}

export class VerifyUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: VerifyUserInput): Promise<User> {
    const { email } = input;

    // Validar que el email esté presente
    if (!email) {
      throw new Error('El email es requerido');
    }

    // Verificar usuario
    const user = await this.userRepository.verifyUser(email);

    // Si no existe, lanzar error
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }
}
