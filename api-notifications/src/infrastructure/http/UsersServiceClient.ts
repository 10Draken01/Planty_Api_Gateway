import axios, { AxiosInstance } from 'axios';
import config from '../../config/environment';
import { logger } from '../services/LoggerService';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  tokenFCM?: string;
}

export class UsersServiceClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.usersServiceUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.info(`Request to Users Service: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Error en request a Users Service', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.info(
          `Response from Users Service: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        logger.error('Error en response de Users Service', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtiene un usuario por su ID
   */
  async getUserById(userId: string): Promise<UserDTO | null> {
    try {
      const response = await this.axiosInstance.get(`/api/${userId}`);

      if (response.data && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Usuario no encontrado: ${userId}`);
        return null;
      }

      logger.error(`Error al obtener usuario ${userId}`, error);
      throw new Error('Error al comunicarse con Users Service');
    }
  }

  /**
   * Obtiene múltiples usuarios por sus IDs
   */
  async getUsersByIds(userIds: string[]): Promise<UserDTO[]> {
    if (userIds.length === 0) {
      return [];
    }

    try {
      // Hacer peticiones en paralelo
      const promises = userIds.map((id) => this.getUserById(id));
      const results = await Promise.allSettled(promises);

      // Filtrar solo los resultados exitosos y no nulos
      const users: UserDTO[] = results
        .filter(
          (result): result is PromiseFulfilledResult<UserDTO> =>
            result.status === 'fulfilled' && result.value !== null
        )
        .map((result) => result.value);

      return users;
    } catch (error) {
      logger.error('Error al obtener múltiples usuarios', error);
      throw new Error('Error al comunicarse con Users Service');
    }
  }

  /**
   * Obtiene todos los usuarios que tienen tokenFCM válido
   * NOTA: Este endpoint debe implementarse en el Users Service
   */
  async getAllUsersWithFCMToken(): Promise<UserDTO[]> {
    try {
      // Endpoint hipotético que retorna usuarios con tokenFCM
      // Si no existe en tu Users Service, deberás implementarlo
      const response = await this.axiosInstance.get('/with-fcm-token');

      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      // Si el endpoint no existe (404), retornar array vacío
      if (error.response?.status === 404) {
        logger.warn('Endpoint /with-fcm-token no implementado en Users Service');
        return [];
      }

      logger.error('Error al obtener usuarios con FCM token', error);
      throw new Error('Error al comunicarse con Users Service');
    }
  }

  /**
   * Verifica si el Users Service está disponible
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Intentar hacer un ping al Users Service
      const response = await this.axiosInstance.get('/api/health', {
        timeout: 3000,
      });

      return response.status === 200;
    } catch (error) {
      logger.error('Users Service no está disponible', error);
      return false;
    }
  }
}
