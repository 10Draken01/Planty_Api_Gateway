/**
 * UsersServicePlantyContextRepository - Implementación que persiste en api-users
 */

import { IPlantyContextRepository } from '@domain/repositories/PlantyContextRepository';
import { PlantyContext } from '@domain/entities/PlantyContext';
import axios, { AxiosInstance } from 'axios';
import { config } from '@config/environment';

export class UsersServicePlantyContextRepository implements IPlantyContextRepository {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.usersServiceUrl || 'http://localhost:3001';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getByUserId(userId: string): Promise<PlantyContext | null> {
    try {
      const response = await this.client.get(`/api/memory/planty/context/${userId}`);

      if (!response.data) {
        return null;
      }

      return PlantyContext.fromPersistence(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }

      console.error(`Error obteniendo PlantyContext para usuario ${userId}:`, error.message);
      throw new Error(`Error al obtener contexto de Planty: ${error.message}`);
    }
  }

  async save(context: PlantyContext): Promise<void> {
    try {
      const data = context.toPersistence();

      await this.client.post('/api/memory/planty/context', data);
    } catch (error: any) {
      console.error(`Error guardando PlantyContext para usuario ${context.userId}:`, error.message);
      throw new Error(`Error al guardar contexto de Planty: ${error.message}`);
    }
  }

  async delete(userId: string): Promise<void> {
    try {
      await this.client.delete(`/api/memory/planty/context/${userId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return;
      }

      console.error(`Error eliminando PlantyContext para usuario ${userId}:`, error.message);
      throw new Error(`Error al eliminar contexto de Planty: ${error.message}`);
    }
  }

  async exists(userId: string): Promise<boolean> {
    try {
      const context = await this.getByUserId(userId);
      return context !== null;
    } catch (error) {
      return false;
    }
  }

  async updatePersonality(userId: string, personalityType: string): Promise<void> {
    try {
      await this.client.patch(`/api/memory/planty/context/${userId}/personality`, {
        personality: personalityType
      });
    } catch (error: any) {
      console.error(`Error actualizando personalidad para usuario ${userId}:`, error.message);
      throw new Error(`Error al actualizar personalidad: ${error.message}`);
    }
  }

  async updateUserProfile(userId: string, profile: any): Promise<void> {
    try {
      await this.client.patch(`/api/memory/planty/context/${userId}/profile`, profile);
    } catch (error: any) {
      console.error(`Error actualizando perfil para usuario ${userId}:`, error.message);
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }
  }

  async addConversationMemory(userId: string, memory: string): Promise<void> {
    try {
      await this.client.post(`/api/memory/planty/context/${userId}/memory`, {
        memory
      });
    } catch (error: any) {
      console.error(`Error añadiendo memoria para usuario ${userId}:`, error.message);
      throw new Error(`Error al añadir memoria: ${error.message}`);
    }
  }

  async incrementGodReference(userId: string, godName: string): Promise<void> {
    try {
      await this.client.post(`/api/memory/planty/context/${userId}/god-reference`, {
        godName
      });
    } catch (error: any) {
      console.error(`Error incrementando referencia a dios para usuario ${userId}:`, error.message);
      throw new Error(`Error al incrementar referencia a dios: ${error.message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
