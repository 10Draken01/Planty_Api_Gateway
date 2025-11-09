import { UserRepository } from '../../domain/repositories/UserRepository';

export interface DeleteUserByIdRequest {
  id: string;
}

export class DeleteUserByIdUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: DeleteUserByIdRequest): Promise<void> {
    // Validar que el ID no esté vacío
    if (!request.id || request.id.trim().length === 0) {
      throw new Error('El ID del usuario es requerido');
    }

    // Verificar que el usuario existe antes de eliminarlo
    const existingUser = await this.userRepository.findById(request.id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    // Eliminar usuario
    const wasDeleted = await this.userRepository.delete(request.id);
    
    if (!wasDeleted) {
      throw new Error('Error al eliminar el usuario');
    }
  }
}