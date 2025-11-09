import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export interface GetUserByIdRequest {
  id: string;
}

export class GetUserByIdUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: GetUserByIdRequest): Promise<User> {
    // Validar que el ID no esté vacío
    if (!request.id || request.id.trim().length === 0) {
      throw new Error('El ID del usuario es requerido');
    }

    // Buscar usuario por ID
    const user = await this.userRepository.findById(request.id);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }
}