import { FirebaseService } from '../../infrastructure/services/FirebaseService';
import { UsersServiceClient } from '../../infrastructure/http/UsersServiceClient';
import { SendNotificationToUserDTO, NotificationResponseDTO } from '../dtos/NotificationDTOs';
import { logger } from '../../infrastructure/services/LoggerService';

export class SendNotificationToUserUseCase {
  constructor(
    private firebaseService: FirebaseService,
    private usersServiceClient: UsersServiceClient
  ) {}

  async execute(dto: SendNotificationToUserDTO): Promise<NotificationResponseDTO> {
    try {
      // 1. Obtener usuario del Users Service
      const user = await this.usersServiceClient.getUserById(dto.userId);

      if (!user) {
        return {
          success: false,
          message: `Usuario con ID ${dto.userId} no encontrado`,
        };
      }

      // 2. Verificar que el usuario tenga tokenFCM
      if (!user.tokenFCM) {
        return {
          success: false,
          message: `El usuario ${user.name} no tiene un tokenFCM registrado`,
        };
      }

      // 3. Enviar notificación via Firebase
      const result = await this.firebaseService.sendToDevice(user.tokenFCM, {
        title: dto.title,
        body: dto.body,
        data: dto.data,
        imageUrl: dto.imageUrl,
      });

      // 4. Verificar resultado
      if (result.success) {
        logger.info(`Notificación enviada exitosamente al usuario ${user.name} (${user.email})`);
        return {
          success: true,
          message: `Notificación enviada exitosamente a ${user.name}`,
          details: [
            {
              userId: user.id,
              sent: true,
            },
          ],
        };
      } else {
        logger.error(`Error al enviar notificación al usuario ${user.name}: ${result.error}`);
        return {
          success: false,
          message: `Error al enviar notificación: ${result.error}`,
          details: [
            {
              userId: user.id,
              sent: false,
              error: result.error,
            },
          ],
        };
      }
    } catch (error: any) {
      logger.error('Error en SendNotificationToUserUseCase', error);
      return {
        success: false,
        message: error.message || 'Error desconocido al enviar notificación',
      };
    }
  }
}
