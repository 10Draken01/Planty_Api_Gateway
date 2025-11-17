/**
 * Implementación del Repositorio de Orchards con MongoDB
 */

import { Collection, ObjectId } from 'mongodb';
import { Orchard, OrchardProps } from '@domain/entities/Orchard';
import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { MongoDBConnection } from '../database/MongoDBConnection';

export class MongoOrchardRepository implements OrchardRepository {
  private collection: Collection;
  private readonly COLLECTION_NAME = 'orchards';

  constructor(dbConnection: MongoDBConnection) {
    const db = dbConnection.getDatabase();
    this.collection = db.collection(this.COLLECTION_NAME);
  }

  async save(orchard: Orchard): Promise<Orchard> {
    try {
      const data = orchard.toJSON();
      await this.collection.insertOne(data as any);
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

      return Orchard.fromPersistence(doc as OrchardProps);
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

      return Orchard.fromPersistence(doc as OrchardProps);
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

      return docs.map(doc => Orchard.fromPersistence(doc as OrchardProps));
    } catch (error) {
      console.error('Error al listar huertos:', error);
      throw new Error('No se pudo listar los huertos');
    }
  }

  async findActive(): Promise<Orchard[]> {
    try {
      const docs = await this.collection
        .find({ state: true })
        .sort({ createAt: -1 })
        .toArray();

      return docs.map(doc => Orchard.fromPersistence(doc as OrchardProps));
    } catch (error) {
      console.error('Error al buscar huertos activos:', error);
      throw new Error('No se pudo buscar los huertos activos');
    }
  }

  async findInactive(): Promise<Orchard[]> {
    try {
      const docs = await this.collection
        .find({ state: false })
        .sort({ createAt: -1 })
        .toArray();

      return docs.map(doc => Orchard.fromPersistence(doc as OrchardProps));
    } catch (error) {
      console.error('Error al buscar huertos inactivos:', error);
      throw new Error('No se pudo buscar los huertos inactivos');
    }
  }

  async update(orchard: Orchard): Promise<Orchard> {
    try {
      const data = orchard.toJSON();
      const { _id, ...updateData } = data;

      const result = await this.collection.updateOne(
        { _id: _id },
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
      console.error('Error al verificar existencia de huerto:', error);
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
