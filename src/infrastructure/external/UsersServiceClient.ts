import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  experience_level?: 1 | 2 | 3;
}

export class UsersServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.services.usersServiceUrl,
      timeout: env.timeouts.externalServiceMs,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para logging
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Error calling Users Service', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  async getUserById(userId: string): Promise<UserDTO | null> {
    try {
      const response = await this.client.get(`/${userId}`);
      return response.data?.data || null;
    } catch (error) {
      logger.warn(`Failed to fetch user ${userId}`, { error });
      return null;
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
