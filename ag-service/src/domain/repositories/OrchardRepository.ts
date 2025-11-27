import { Orchard } from '../entities/Orchard';

export interface OrchardRepository {
  save(orchard: Orchard): Promise<string>;
  findById(id: string): Promise<Orchard | null>;
  findByUserId(userId: string): Promise<Orchard[]>;
  count(): Promise<number>;
}
