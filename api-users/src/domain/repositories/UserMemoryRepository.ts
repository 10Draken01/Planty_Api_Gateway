/**
 * Repositorio de Memoria del Usuario - Interfaz del dominio
 */

import { UserMemoryDocument, UserFact, UserPlant, CommonProblem } from '../../infrastructure/database/models/UserMemoryModel';

export interface UserMemoryRepository {
  /**
   * Crear memoria nueva para un usuario
   */
  create(userId: string): Promise<UserMemoryDocument>;

  /**
   * Encontrar memoria por userId
   */
  findByUserId(userId: string): Promise<UserMemoryDocument | null>;

  /**
   * Encontrar o crear memoria de usuario
   */
  findOrCreate(userId: string): Promise<UserMemoryDocument>;

  /**
   * Agregar un hecho sobre el usuario
   */
  addFact(
    userId: string,
    fact: string,
    category: UserFact['category'],
    extractedFrom: UserFact['extractedFrom'],
    confidence?: number
  ): Promise<UserFact>;

  /**
   * Agregar o actualizar una planta del usuario
   */
  addOrUpdatePlant(
    userId: string,
    plantId: number,
    plantName: string,
    status: UserPlant['status'],
    note?: string
  ): Promise<UserPlant>;

  /**
   * Agregar o actualizar un problema común
   */
  addOrUpdateProblem(
    userId: string,
    problem: string,
    solution?: string
  ): Promise<CommonProblem>;

  /**
   * Obtener hechos activos
   */
  getActiveFacts(userId: string): Promise<UserFact[]>;

  /**
   * Obtener plantas por estado
   */
  getPlantsByStatus(userId: string, status: UserPlant['status']): Promise<UserPlant[]>;

  /**
   * Obtener problemas más frecuentes
   */
  getTopProblems(userId: string, limit?: number): Promise<CommonProblem[]>;

  /**
   * Desactivar un hecho (cuando nueva info lo contradice)
   */
  deactivateFact(userId: string, factId: string): Promise<boolean>;

  /**
   * Eliminar memoria de usuario
   */
  delete(userId: string): Promise<boolean>;
}
