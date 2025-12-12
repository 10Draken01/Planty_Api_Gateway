import { FirebaseService } from '../../infrastructure/services/FirebaseService';
import { UsersServiceClient } from '../../infrastructure/http/UsersServiceClient';
import { SendNotificationToUsersDTO, NotificationResponseDTO } from '../dtos/NotificationDTOs';
import { logger } from '../../infrastructure/services/LoggerService';

export class SendNotificationToMultipleUsersUseCase {
  constructor(
    private firebaseService: FirebaseService,
    private usersServiceClient: UsersServiceClient
  ) {}

  async execute(dto: SendNotificationToUsersDTO): Promise<NotificationResponseDTO> {
    try {
      // 1. Obtener usuarios del Users Service
      const users = await this.usersServiceClient.getUsersByIds(dto.userIds);

      if (users.length === 0) {
        return {
          success: false,
          message: 'No se encontraron usuarios válidos',
          successCount: 0,
          failureCount: dto.userIds.length,
        };
      }

      // 2. Filtrar usuarios que tengan tokenFCM
      const usersWithToken = users.filter((user) => user.tokenFCM);

      if (usersWithToken.length === 0) {
        return {
          success: false,
          message: 'Ninguno de los usuarios tiene un tokenFCM registrado',
          successCount: 0,
          failureCount: users.length,
        };
      }

      // 3. Extraer tokens
      const tokens = usersWithToken.map((user) => user.tokenFCM!);

      logger.info(`Enviando notificaciones a ${tokens.length} usuarios`);

      // 4. Enviar notificaciones via Firebase
      const result = await this.firebaseService.sendToMultipleDevices(tokens, {
        title: dto.title,
        body: dto.body,
        data: dto.data,
        imageUrl: dto.imageUrl,
      });

      // 5. Construir respuesta detallada
      const details = usersWithToken.map((user, index) => ({
        userId: user.id,
        sent: result.results[index]?.success || false,
        error: result.results[index]?.error,
      }));

      logger.info(
        `Notificaciones enviadas: ${result.successCount} exitosas, ${result.failureCount} fallidas`
      );

      return {
        success: result.successCount > 0,
        message: `Se enviaron ${result.successCount} notificaciones de ${usersWithToken.length} intentos`,
        successCount: result.successCount,
        failureCount: result.failureCount,
        details,
      };
    } catch (error: any) {
      logger.error('Error en SendNotificationToMultipleUsersUseCase', error);
      return {
        success: false,
        message: error.message || 'Error desconocido al enviar notificaciones',
        successCount: 0,
        failureCount: dto.userIds.length,
      };
    }
  }
}
