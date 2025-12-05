/**
 * Implementación del Repositorio de Orchards con MongoDB
 *
 * ACTUALIZADO para soportar:
 * - Dimensions como Value Object
 * - Plants array con posiciones (PlantInLayout[])
 * - Serialización/Deserialización correcta
 */

import { Collection } from 'mongodb';
import { Orchard, OrchardProps } from '@domain/entities/Orchard';
import { PlantInLayout, PlantInLayoutProps } from '@domain/entities/PlantInLayout';
import { Position } from '@domain/value-objects/Position';
import { Dimensions } from '@domain/value-objects/Dimensions';
import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { MongoDBConnection } from '../database/MongoDBConnection';

export class MongoOrchardRepository implements OrchardRepository {
  private collection: Collection<any>;
  private readonly COLLECTION_NAME = 'orchards';
  private indexesCreated: boolean = false;

  constructor(dbConnection: MongoDBConnection) {
    const db = dbConnection.getDatabase();
    this.collection = db.collection(this.COLLECTION_NAME);
    this.ensureIndexes();
  }

  /**
   * Crea los índices necesarios en la colección
   */
  private async ensureIndexes(): Promise<void> {
    if (this.indexesCreated) {
      return;
    }

    try {
      // Índice en userId para búsquedas por usuario
      await this.collection.createIndex(
        { userId: 1 },
        {
          name: 'idx_userId',
          background: true
        }
      );

      // Índice compuesto: userId + name (para verificar nombres únicos por usuario)
      await this.collection.createIndex(
        { userId: 1, name: 1 },
        {
          name: 'idx_userId_name',
          background: true
        }
      );

      // Índice compuesto: userId + state
      await this.collection.createIndex(
        { userId: 1, state: 1 },
        {
          name: 'idx_userId_state',
          background: true
        }
      );

      // Índice en createAt para ordenamiento
      await this.collection.createIndex(
        { createAt: -1 },
        {
          name: 'idx_createAt',
          background: true
        }
      );

      this.indexesCreated = true;
      console.log('✓ Índices de MongoDB creados para la colección orchards');
    } catch (error) {
      console.error('⚠ Error al crear índices (puede que ya existan):', error);
    }
  }

  /**
   * ✅ NUEVO: Convierte un documento de MongoDB a la entidad Orchard
   * Reconstruye los Value Objects y Entities correctamente
   */
  private toDomain(doc: any): Orchard {
    // Reconstruir Dimensions
    const dimensions = new Dimensions(doc.width || doc.dimensions?.width, doc.height || doc.dimensions?.height);

    // Reconstruir PlantInLayout[]
    const plants = (doc.plants || []).map((plantData: any) => {
      const position = new Position(
        plantData.position?.x || 0,
        plantData.position?.y || 0
      );

      return PlantInLayout.fromPersistence({
        id: plantData.id,
        plantId: plantData.plantId,
        position,
        width: plantData.width || 1,
        height: plantData.height || 1,
        rotation: plantData.rotation || 0,
        status: plantData.status || 'planned',
        plantedAt: plantData.plantedAt ? new Date(plantData.plantedAt) : undefined
      });
    });

    // Reconstruir Orchard
    return Orchard.fromPersistence({
      _id: doc._id,
      userId: doc.userId,
      name: doc.name,
      description: doc.description,
      dimensions,
      plants,
      state: doc.state,
      createAt: new Date(doc.createAt),
      updateAt: new Date(doc.updateAt),
      timeOfLife: doc.timeOfLife || 0,
      streakOfDays: doc.streakOfDays || 0
    });
  }

  /**
   * ✅ NUEVO: Convierte la entidad Orchard a documento de MongoDB
   */
  private toDocument(orchard: Orchard): any {
    const json = orchard.toJSON();

    return {
      _id: json._id,
      userId: json.userId,
      name: json.name,
      description: json.description,
      width: json.width,
      height: json.height,
      plants: json.plants, // Ya viene serializado correctamente
      state: json.state,
      createAt: json.createAt,
      updateAt: json.updateAt,
      timeOfLife: json.timeOfLife,
      streakOfDays: json.streakOfDays
    };
  }

  async save(orchard: Orchard): Promise<Orchard> {
    try {
      const doc = this.toDocument(orchard);
      await this.collection.insertOne(doc);
      return orchard;
    } catch (error) {
      console.error('Error al guardar huerto:', error);
      throw new Error('No se pudo guardar el huerto');
    }
  }

  async findById(id: string): Promise<Orchard | null> {
    try {
      const doc = await this.collection.findOne({ _id: id });

      if (!doc) {
        return null;
      }

      return this.toDomain(doc);
    } catch (error) {
      console.error('Error al buscar huerto por ID:', error);
      throw new Error('No se pudo buscar el huerto');
    }
  }

  async findByName(name: string): Promise<Orchard | null> {
    try {
      const doc = await this.collection.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });

      if (!doc) {
        return null;
      }

      return this.toDomain(doc);
    } catch (error) {
      console.error('Error al buscar huerto por nombre:', error);
      throw new Error('No se pudo buscar el huerto');
    }
  }

  async findAll(): Promise<Orchard[]> {
    try {
      const docs = await this.collection
        .find({})
        .sort({ createAt: -1 })
        .toArray();

      return docs.map(doc => this.toDomain(doc));
    } catch (error) {
      console.error('Error al obtener todos los huertos:', error);
      throw new Error('No se pudieron obtener los huertos');
    }
  }

  async findActive(): Promise<Orchard[]> {
    try {
      const docs = await this.collection
        .find({ state: true })
        .sort({ createAt: -1 })
        .toArray();

      return docs.map(doc => this.toDomain(doc));
    } catch (error) {
      console.error('Error al obtener huertos activos:', error);
      throw new Error('No se pudieron obtener los huertos activos');
    }
  }

  async findInactive(): Promise<Orchard[]> {
    try {
      const docs = await this.collection
        .find({ state: false })
        .sort({ createAt: -1 })
        .toArray();

      return docs.map(doc => this.toDomain(doc));
    } catch (error) {
      console.error('Error al obtener huertos inactivos:', error);
      throw new Error('No se pudieron obtener los huertos inactivos');
    }
  }

  async findByUserId(userId: string): Promise<Orchard[]> {
    try {
      const docs = await this.collection
        .find({ userId })
        .sort({ createAt: -1 })
        .toArray();

      return docs.map(doc => this.toDomain(doc));
    } catch (error) {
      console.error('Error al buscar huertos por userId:', error);
      throw new Error('No se pudieron obtener los huertos del usuario');
    }
  }

  async update(orchard: Orchard): Promise<Orchard> {
    try {
      const doc = this.toDocument(orchard);
      const { _id, ...updateData } = doc;

      const result = await this.collection.updateOne(
        { _id },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Huerto no encontrado');
      }

      return orchard;
    } catch (error) {
      console.error('Error al actualizar huerto:', error);
      throw new Error('No se pudo actualizar el huerto');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar huerto:', error);
      throw new Error('No se pudo eliminar el huerto');
    }
  }

  async exists(name: string): Promise<boolean> {
    try {
      const count = await this.collection.countDocuments({
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });

      return count > 0;
    } catch (error) {
      console.error('Error al verificar existencia del huerto:', error);
      throw new Error('No se pudo verificar la existencia del huerto');
    }
  }

  /**
   * ✅ NUEVO: Verifica si existe un huerto con el nombre dado para un usuario específico
   */
  async existsByUserAndName(userId: string, name: string): Promise<boolean> {
    try {
      const count = await this.collection.countDocuments({
        userId,
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });

      return count > 0;
    } catch (error) {
      console.error('Error al verificar existencia del huerto por usuario y nombre:', error);
      throw new Error('No se pudo verificar la existencia del huerto');
    }
  }

  async count(): Promise<number> {
    try {
      return await this.collection.countDocuments({});
    } catch (error) {
      console.error('Error al contar huertos:', error);
      throw new Error('No se pudo contar los huertos');
    }
  }

  async countActive(): Promise<number> {
    try {
      return await this.collection.countDocuments({ state: true });
    } catch (error) {
      console.error('Error al contar huertos activos:', error);
      throw new Error('No se pudo contar los huertos activos');
    }
  }
}
