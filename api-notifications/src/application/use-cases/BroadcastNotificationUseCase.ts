import { FirebaseService } from '../../infrastructure/services/FirebaseService';
import { UsersServiceClient } from '../../infrastructure/http/UsersServiceClient';
import { BroadcastNotificationDTO, NotificationResponseDTO } from '../dtos/NotificationDTOs';
import { logger } from '../../infrastructure/services/LoggerService';

export class BroadcastNotificationUseCase {
  constructor(
    private firebaseService: FirebaseService,
    private usersServiceClient: UsersServiceClient
  ) {}

  async execute(dto: BroadcastNotificationDTO): Promise<NotificationResponseDTO> {
    try {
      logger.info('Iniciando broadcast de notificación a todos los usuarios');

      // 1. Obtener todos los usuarios que tengan tokenFCM
      const users = await this.usersServiceClient.getAllUsersWithFCMToken();

      if (users.length === 0) {
        return {
          success: false,
          message: 'No hay usuarios con tokenFCM registrados',
          successCount: 0,
          failureCount: 0,
        };
      }

      // 2. Extraer tokens válidos
      const tokens = users.map((user) => user.tokenFCM!).filter((token) => token);

      logger.info(`Enviando broadcast a ${tokens.length} usuarios`);

      // 3. Enviar notificaciones via Firebase
      const result = await this.firebaseService.sendToMultipleDevices(tokens, {
        title: dto.title,
        body: dto.body,
        data: dto.data,
        imageUrl: dto.imageUrl,
      });

      // 4. Construir respuesta
      logger.info(
        `Broadcast completado: ${result.successCount} exitosas, ${result.failureCount} fallidas`
      );

      return {
        success: result.successCount > 0,
        message: `Broadcast enviado a ${result.successCount} de ${users.length} usuarios`,
        successCount: result.successCount,
        failureCount: result.failureCount,
      };
    } catch (error: any) {
      logger.error('Error en BroadcastNotificationUseCase', error);
      return {
        success: false,
        message: error.message || 'Error desconocido al hacer broadcast',
        successCount: 0,
        failureCount: 0,
      };
    }
  }
}
