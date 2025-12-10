import { UserRepository } from '../../domain/repositories/UserRepository';

interface ListUsersRequest {
  limit?: number;
  offset?: number;
}

export class ListUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: ListUsersRequest = {}) {
    const limit = request.limit || 100;
    const offset = request.offset || 0;

    const users = await this.userRepository.findAll(limit, offset);

    // Remover contraseñas de todos los usuarios
    return users.map(user => {
      const userData = user.toJSON();
      delete (userData as any).password;
      return userData;
    });
  }
}
