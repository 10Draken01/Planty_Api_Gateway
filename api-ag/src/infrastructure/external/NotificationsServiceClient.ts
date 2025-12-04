import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationsServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.services.notificationsServiceUrl,
      timeout: env.timeouts.externalServiceMs,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Error calling Notifications Service', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  async sendGardenGeneratedNotification(userId: string, solutionsCount: number, bestFitness: number): Promise<void> {
    try {
      await this.client.post(`/notify/user/${userId}`, {
        title: '🌱 Huerto Generado',
        body: `Tu huerto ha sido optimizado con éxito. ${solutionsCount} soluciones disponibles (Fitness: ${(bestFitness * 100).toFixed(1)}%)`,
        data: {
          type: 'garden_generated',
          solutionsCount,
          bestFitness,
        },
      });
      logger.debug(`Notification sent to user ${userId}`);
    } catch (error) {
      logger.warn(`Failed to send notification to user ${userId}`, { error });
      // No lanzar error, notificaciones son opcionales
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
