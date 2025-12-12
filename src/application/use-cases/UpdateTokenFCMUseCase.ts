import { UserRepository } from '../../domain/repositories/UserRepository';

export interface UpdateTokenFCMDTO {
  userId: string;
  tokenFCM: string;
}

export class UpdateTokenFCMUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(dto: UpdateTokenFCMDTO): Promise<void> {
    const { userId, tokenFCM } = dto;

    // Validar entrada
    if (!userId || !tokenFCM) {
      throw new Error('El userId y tokenFCM son requeridos');
    }

    // Validar formato básico del token (FCM tokens son strings largos)
    if (tokenFCM.length < 100) {
      throw new Error('El formato del tokenFCM no es válido');
    }

    // Obtener usuario
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Actualizar token
    user.tokenFCM = tokenFCM;

    // Persistir cambios
    await this.userRepository.update(user);
  }
}
