import { OrchardRepository } from '../../../domain/repositories/OrchardRepository';
import { Orchard } from '../../../domain/entities/Orchard';
import { OrchardModel, OrchardDocument } from './schemas/OrchardSchema';
import { Dimensions } from '../../../domain/value-objects/Dimensions';
import { Metrics } from '../../../domain/value-objects/Metrics';

export class MongoOrchardRepository implements OrchardRepository {
  async save(orchard: Orchard): Promise<string> {
    const doc = await OrchardModel.create({
      userId: orchard.userId,
      name: orchard.name,
      description: orchard.description,
      dimensions: orchard.dimensions.toJSON(),
      plants: orchard.plants.map(p => p.toJSON()),
      metrics: orchard.metrics.toJSON(),
      objective: orchard.objective,
      state: orchard.state,
      streakOfDays: orchard.streakOfDays,
      timeOfLife: orchard.timeOfLife,
      countPlants: orchard.totalPlants,
      calendar: orchard.calendar,
    });

    return doc._id.toString();
  }

  async findById(id: string): Promise<Orchard | null> {
    const doc = await OrchardModel.findById(id).exec();
    if (!doc) return null;

    // Reconstruir entidad de dominio (simplificado - no reconstruye PlantInstances completos)
    return doc.toObject() as any;
  }

  async findByUserId(userId: string): Promise<Orchard[]> {
    const docs = await OrchardModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return docs.map(doc => doc.toObject() as any);
  }

  async count(): Promise<number> {
    return await OrchardModel.countDocuments().exec();
  }
}
