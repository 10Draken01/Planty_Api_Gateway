/**
 * InMemoryPlantyContextRepository - Implementación temporal en memoria
 * TODO: Reemplazar por UsersServicePlantyContextRepository cuando api-users esté listo
 */

import { IPlantyContextRepository } from '@domain/repositories/PlantyContextRepository';
import { PlantyContext } from '@domain/entities/PlantyContext';

export class InMemoryPlantyContextRepository implements IPlantyContextRepository {
  private contexts: Map<string, PlantyContext>;

  constructor() {
    this.contexts = new Map();
    console.log('  ⚠️  Usando PlantyContext en MEMORIA (temporal - no persistente)');
  }

  async getByUserId(userId: string): Promise<PlantyContext | null> {
    return this.contexts.get(userId) || null;
  }

  async save(context: PlantyContext): Promise<void> {
    this.contexts.set(context.userId, context);
  }

  async delete(userId: string): Promise<void> {
    this.contexts.delete(userId);
  }

  async exists(userId: string): Promise<boolean> {
    return this.contexts.has(userId);
  }

  /**
   * Método adicional para debugging
   */
  size(): number {
    return this.contexts.size;
  }

  /**
   * Limpiar todos los contextos (útil para testing)
   */
  clear(): void {
    this.contexts.clear();
  }
}
