import admin from 'firebase-admin';
import fs from 'fs';
import config from '../../config/environment';
import { logger } from '../services/LoggerService';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class FirebaseService {
  private static instance: FirebaseService;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Inicializa Firebase Admin SDK
   */
  public initialize(): void {
    if (this.initialized) {
      logger.warn('Firebase ya está inicializado');
      return;
    }

    try {
      // Verificar que existe el archivo de service account
      if (!fs.existsSync(config.firebaseServiceAccountPath)) {
        throw new Error(
          `No se encontró el archivo de service account en: ${config.firebaseServiceAccountPath}`
        );
      }

      // Leer el service account
      const serviceAccount = JSON.parse(
        fs.readFileSync(config.firebaseServiceAccountPath, 'utf8')
      );

      // Inicializar Firebase
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.initialized = true;
      logger.info('Firebase Admin SDK inicializado correctamente');
    } catch (error) {
      logger.error('Error al inicializar Firebase Admin SDK', error);
      throw error;
    }
  }

  /**
   * Envía una notificación push a un único dispositivo
   */
  public async sendToDevice(
    tokenFCM: string,
    payload: NotificationPayload
  ): Promise<SendNotificationResult> {
    if (!this.initialized) {
      throw new Error('Firebase no ha sido inicializado');
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        ...(payload.data && { data: payload.data }),
        token: tokenFCM,
      };

      const response = await admin.messaging().send(message);

      logger.info(`Notificación enviada exitosamente: ${response}`);

      return {
        success: true,
        messageId: response,
      };
    } catch (error: any) {
      logger.error('Error al enviar notificación', error);

      return {
        success: false,
        error: error.message || 'Error desconocido al enviar notificación',
      };
    }
  }

  /**
   * Envía notificaciones a múltiples dispositivos
   */
  public async sendToMultipleDevices(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<{
    successCount: number;
    failureCount: number;
    results: SendNotificationResult[];
  }> {
    if (!this.initialized) {
      throw new Error('Firebase no ha sido inicializado');
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, results: [] };
    }

    // Filtrar tokens vacíos o inválidos
    const validTokens = tokens.filter((token) => token && token.length > 100);

    if (validTokens.length === 0) {
      logger.warn('No hay tokens válidos para enviar notificaciones');
      return { successCount: 0, failureCount: 0, results: [] };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        ...(payload.data && { data: payload.data }),
      };

      const response = await admin.messaging().sendEachForMulticast({
        tokens: validTokens,
        ...message,
      });

      logger.info(
        `Notificaciones enviadas: ${response.successCount} exitosas, ${response.failureCount} fallidas`
      );

      // Procesar resultados individuales
      const results: SendNotificationResult[] = response.responses.map((res, index) => {
        if (res.success) {
          return {
            success: true,
            messageId: res.messageId,
          };
        } else {
          return {
            success: false,
            error: res.error?.message || 'Error desconocido',
          };
        }
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        results,
      };
    } catch (error: any) {
      logger.error('Error al enviar notificaciones múltiples', error);
      throw error;
    }
  }

  /**
   * Envía notificaciones a un topic (para broadcast)
   */
  public async sendToTopic(
    topic: string,
    payload: NotificationPayload
  ): Promise<SendNotificationResult> {
    if (!this.initialized) {
      throw new Error('Firebase no ha sido inicializado');
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        ...(payload.data && { data: payload.data }),
        topic,
      };

      const response = await admin.messaging().send(message);

      logger.info(`Notificación enviada al topic '${topic}': ${response}`);

      return {
        success: true,
        messageId: response,
      };
    } catch (error: any) {
      logger.error(`Error al enviar notificación al topic '${topic}'`, error);

      return {
        success: false,
        error: error.message || 'Error desconocido al enviar notificación',
      };
    }
  }

  /**
   * Suscribe un token a un topic
   */
  public async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Firebase no ha sido inicializado');
    }

    try {
      await admin.messaging().subscribeToTopic(tokens, topic);
      logger.info(`${tokens.length} tokens suscritos al topic '${topic}'`);
    } catch (error) {
      logger.error(`Error al suscribir tokens al topic '${topic}'`, error);
      throw error;
    }
  }

  /**
   * Verifica si un token es válido
   */
  public async validateToken(token: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Firebase no ha sido inicializado');
    }

    try {
      // Intentar enviar un mensaje de prueba (dry run)
      await admin.messaging().send(
        {
          token,
          notification: {
            title: 'Test',
            body: 'Test',
          },
        },
        true // dry run
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}
