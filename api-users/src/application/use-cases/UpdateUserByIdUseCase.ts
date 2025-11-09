import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export interface UpdateUserByIdRequest {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  experience_level?: number;
  profile_image?: string;
}

export class UpdateUserByIdUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(request: UpdateUserByIdRequest): Promise<User> {
    // Validar que el ID no esté vacío
    if (!request.id || request.id.trim().length === 0) {
      throw new Error('El ID del usuario es requerido');
    }

    // Buscar usuario existente
    const existingUser = await this.userRepository.findById(request.id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    // Validar email si se está actualizando
    if (request.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.email)) {
        throw new Error('Formato de email inválido');
      }

      // Verificar que el email no esté en uso por otro usuario
      const userWithEmail = await this.userRepository.findByEmail(request.email);
      if (userWithEmail && userWithEmail.id !== request.id) {
        throw new Error('El email ya está en uso por otro usuario');
      }
    }

    // Validar nombre si se está actualizando
    if (request.name !== undefined) {
      if (!request.name || request.name.trim().length === 0) {
        throw new Error('El nombre no puede estar vacío');
      }
      if (request.name.trim().length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
      }
    }

    // Validar contraseña si se está actualizando
    if (request.password !== undefined) {
      if (request.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
    }

    // Crear usuario actualizado
    const updatedUser = new User({
      id: existingUser.id,
      name: request.name !== undefined ? request.name.trim() : existingUser.name,
      email: request.email !== undefined ? request.email.toLowerCase() : existingUser.email,
      password: existingUser.password,
      experience_level: request.experience_level !== undefined ? request.experience_level : existingUser.experience_level,
      profile_image: request.profile_image !== undefined ? request.profile_image : existingUser.profile_image,
      createdAt: existingUser.createdAt,
      historyTimeUse_ids: existingUser.historyTimeUse_ids // Mantener historial original (no actualizable)
    });

    // Guardar cambios
    return await this.userRepository.update(updatedUser);
  }
}