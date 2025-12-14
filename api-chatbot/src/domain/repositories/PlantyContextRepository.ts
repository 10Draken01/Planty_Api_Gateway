/**
 * PlantyContextRepository - Interfaz para persistencia de PlantyContext
 */

import { PlantyContext } from '../entities/PlantyContext';

export interface IPlantyContextRepository {
  getByUserId(userId: string): Promise<PlantyContext | null>;
  save(context: PlantyContext): Promise<void>;
  delete(userId: string): Promise<void>;
  exists(userId: string): Promise<boolean>;
}
