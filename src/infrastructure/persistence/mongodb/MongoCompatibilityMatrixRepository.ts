import { CompatibilityMatrixRepository, CompatibilityEntry } from '../../../domain/repositories/CompatibilityMatrixRepository';
import { CompatibilityMatrixModel } from './schemas/CompatibilityMatrixSchema';

export class MongoCompatibilityMatrixRepository implements CompatibilityMatrixRepository {
  private cache: Map<string, Map<string, number>> | null = null;

  async getCompatibility(plant1: string, plant2: string): Promise<number> {
    // Intentar desde cache primero
    if (this.cache) {
      const score = this.cache.get(plant1)?.get(plant2);
      if (score !== undefined) {
        return score;
      }
    }

    // Buscar en BD
    const entry = await CompatibilityMatrixModel.findOne({
      plant1,
      plant2,
    }).exec();

    if (entry) {
      return entry.score;
    }

    // Si no existe, retornar 0 (neutral)
    return 0;
  }

  async getAllCompatibilities(): Promise<Map<string, Map<string, number>>> {
    // Si ya tenemos cache, retornarlo
    if (this.cache) {
      return this.cache;
    }

    // Cargar toda la matriz
    const entries = await CompatibilityMatrixModel.find().exec();

    const matrix = new Map<string, Map<string, number>>();

    entries.forEach(entry => {
      if (!matrix.has(entry.plant1)) {
        matrix.set(entry.plant1, new Map());
      }
      matrix.get(entry.plant1)!.set(entry.plant2, entry.score);
    });

    // Cachear para futuras consultas
    this.cache = matrix;

    return matrix;
  }

  async count(): Promise<number> {
    return await CompatibilityMatrixModel.countDocuments().exec();
  }

  async createMany(entries: CompatibilityEntry[]): Promise<void> {
    const docs = entries.map(entry => ({
      plant1: entry.plant1,
      plant2: entry.plant2,
      score: entry.score,
    }));

    await CompatibilityMatrixModel.insertMany(docs);

    // Invalidar cache
    this.cache = null;
  }

  clearCache(): void {
    this.cache = null;
  }
}
