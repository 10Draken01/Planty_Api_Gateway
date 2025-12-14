/**
 * Implementación del Repositorio de Plants con MongoDB
 */

import { Collection } from 'mongodb';
import { Plant, PlantProps } from '@domain/entities/Plant';
import { PlantRepository } from '@domain/repositories/PlantRepository';
import { MongoDBConnection } from '../database/MongoDBConnection';

export class MongoPlantRepository implements PlantRepository {
  private collection: Collection<PlantProps>;

  constructor(private dbConnection: MongoDBConnection) {
    this.collection = dbConnection.getDatabase().collection<PlantProps>('plants');
    this.createIndexes();
  }

  /**
   * Crea índices en la colección para optimizar consultas
   */
  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ species: 1 }, { name: 'idx_species' });
      await this.collection.createIndex({ type: 1 }, { name: 'idx_type' });
      console.log('✓ Índices de plantas creados');
    } catch (error) {
      console.error('Error al crear índices:', error);
    }
  }

  /**
   * Obtiene todas las plantas
   */
  async findAll(): Promise<Plant[]> {
    try {
      const plants = await this.collection.find({}).sort({ _id: 1 }).toArray();
      return plants.map(p => Plant.fromPersistence(p));
    } catch (error) {
      console.error('Error al obtener todas las plantas:', error);
      throw new Error('Error al obtener plantas de la base de datos');
    }
  }

  /**
   * Busca una planta por su ID
   */
  async findById(id: number): Promise<Plant | null> {
    try {
      const plant = await this.collection.findOne({ _id: id });
      return plant ? Plant.fromPersistence(plant) : null;
    } catch (error) {
      console.error('Error al buscar planta por ID:', error);
      throw new Error('Error al buscar planta por ID');
    }
  }

  /**
   * Busca plantas por tipo (aromatic, medicinal, vegetable)
   */
  async findByType(type: string): Promise<Plant[]> {
    try {
      const plants = await this.collection.find({ type: type }).sort({ _id: 1 }).toArray();
      return plants.map(p => Plant.fromPersistence(p));
    } catch (error) {
      console.error('Error al buscar plantas por tipo:', error);
      throw new Error('Error al buscar plantas por tipo');
    }
  }

  /**
   * Busca plantas por nombre de especie
   */
  async findBySpecies(species: string): Promise<Plant | null> {
    try {
      const plant = await this.collection.findOne({ species: species });
      return plant ? Plant.fromPersistence(plant) : null;
    } catch (error) {
      console.error('Error al buscar planta por especie:', error);
      throw new Error('Error al buscar planta por especie');
    }
  }

  /**
   * Cuenta el total de plantas
   */
  async count(): Promise<number> {
    try {
      return await this.collection.countDocuments();
    } catch (error) {
      console.error('Error al contar plantas:', error);
      throw new Error('Error al contar plantas');
    }
  }
}
