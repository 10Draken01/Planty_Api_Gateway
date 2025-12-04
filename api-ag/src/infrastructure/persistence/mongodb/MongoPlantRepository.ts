import { PlantRepository } from '../../../domain/repositories/PlantRepository';
import { Plant, PlantProps } from '../../../domain/entities/Plant';
import { PlantModel, PlantDocument } from './schemas/PlantSchema';

export class MongoPlantRepository implements PlantRepository {
  private toDomain(doc: PlantDocument): Plant {
    return new Plant({
      id: doc.id,
      species: doc.species,
      scientificName: doc.scientificName,
      type: doc.type,
      sunRequirement: doc.sunRequirement,
      weeklyWatering: doc.weeklyWatering,
      harvestDays: doc.harvestDays,
      soilType: doc.soilType,
      waterPerKg: doc.waterPerKg,
      benefits: doc.benefits,
      size: doc.size,
    });
  }

  async findAll(): Promise<Plant[]> {
    const docs = await PlantModel.find().sort({ id: 1 }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async findById(id: number): Promise<Plant | null> {
    const doc = await PlantModel.findOne({ id }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findBySpecies(species: string): Promise<Plant | null> {
    const doc = await PlantModel.findOne({ species }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByType(type: string): Promise<Plant[]> {
    const docs = await PlantModel.find({ type }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async count(): Promise<number> {
    return await PlantModel.countDocuments().exec();
  }

  async create(plant: Plant): Promise<void> {
    await PlantModel.create({
      id: plant.id,
      species: plant.species,
      scientificName: plant.scientificName,
      type: plant.type,
      sunRequirement: plant.sunRequirement,
      weeklyWatering: plant.weeklyWatering,
      harvestDays: plant.harvestDays,
      soilType: plant.soilType,
      waterPerKg: plant.waterPerKg,
      benefits: plant.benefits,
      size: plant.size,
    });
  }

  async createMany(plants: Plant[]): Promise<void> {
    const docs = plants.map(plant => ({
      id: plant.id,
      species: plant.species,
      scientificName: plant.scientificName,
      type: plant.type,
      sunRequirement: plant.sunRequirement,
      weeklyWatering: plant.weeklyWatering,
      harvestDays: plant.harvestDays,
      soilType: plant.soilType,
      waterPerKg: plant.waterPerKg,
      benefits: plant.benefits,
      size: plant.size,
    }));

    await PlantModel.insertMany(docs);
  }
}
