/**
 * Implementación MongoDB del repositorio de Memoria del Usuario
 */

import { UserMemoryRepository } from '../../domain/repositories/UserMemoryRepository';
import { UserMemoryModel, UserMemoryDocument, UserFact, UserPlant, CommonProblem } from '../database/models/UserMemoryModel';

export class MongoUserMemoryRepository implements UserMemoryRepository {
  async create(userId: string): Promise<UserMemoryDocument> {
    const memory = UserMemoryModel.createNew(userId);
    return await memory.save();
  }

  async findByUserId(userId: string): Promise<UserMemoryDocument | null> {
    return await UserMemoryModel.findOne({ userId });
  }

  async findOrCreate(userId: string): Promise<UserMemoryDocument> {
    let memory = await this.findByUserId(userId);

    if (!memory) {
      memory = await this.create(userId);
    }

    return memory;
  }

  async addFact(
    userId: string,
    fact: string,
    category: UserFact['category'],
    extractedFrom: UserFact['extractedFrom'],
    confidence: number = 0.8
  ): Promise<UserFact> {
    const memory = await this.findOrCreate(userId);

    const newFact = memory.addFact(fact, category, extractedFrom, confidence);
    await memory.save();

    return newFact;
  }

  async addOrUpdatePlant(
    userId: string,
    plantId: number,
    plantName: string,
    status: UserPlant['status'],
    note?: string
  ): Promise<UserPlant> {
    const memory = await this.findOrCreate(userId);

    const plant = memory.addOrUpdatePlant(plantId, plantName, status, note);
    await memory.save();

    return plant;
  }

  async addOrUpdateProblem(
    userId: string,
    problem: string,
    solution?: string
  ): Promise<CommonProblem> {
    const memory = await this.findOrCreate(userId);

    const problemObj = memory.addOrUpdateProblem(problem, solution);
    await memory.save();

    return problemObj;
  }

  async getActiveFacts(userId: string): Promise<UserFact[]> {
    const memory = await this.findByUserId(userId);

    if (!memory) {
      return [];
    }

    return memory.getActiveFacts();
  }

  async getPlantsByStatus(userId: string, status: UserPlant['status']): Promise<UserPlant[]> {
    const memory = await this.findByUserId(userId);

    if (!memory) {
      return [];
    }

    return memory.getPlantsByStatus(status);
  }

  async getTopProblems(userId: string, limit: number = 5): Promise<CommonProblem[]> {
    const memory = await this.findByUserId(userId);

    if (!memory) {
      return [];
    }

    return memory.getTopProblems(limit);
  }

  async deactivateFact(userId: string, factId: string): Promise<boolean> {
    const memory = await this.findByUserId(userId);

    if (!memory) {
      return false;
    }

    const fact = memory.facts.find((f: UserFact) => f.id === factId);

    if (fact) {
      fact.isActive = false;
      await memory.save();
      return true;
    }

    return false;
  }

  async delete(userId: string): Promise<boolean> {
    const result = await UserMemoryModel.deleteOne({ userId });
    return result.deletedCount ? result.deletedCount > 0 : false;
  }

  /**
   * Métodos auxiliares
   */
  async getAllUserPlants(userId: string): Promise<UserPlant[]> {
    const memory = await this.findByUserId(userId);
    return memory?.userPlants || [];
  }

  async getFactsByCategory(userId: string, category: UserFact['category']): Promise<UserFact[]> {
    const memory = await this.findByUserId(userId);

    if (!memory) {
      return [];
    }

    return memory.facts.filter((f: UserFact) => f.category === category && f.isActive);
  }
}
