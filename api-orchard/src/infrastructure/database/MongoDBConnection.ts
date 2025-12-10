/**
 * Conexión a MongoDB
 * Gestiona la conexión a la base de datos
 */

import { MongoClient, Db } from 'mongodb';
import { config } from '@config/environment';

export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {}

  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  async connect(): Promise<void> {
    try {
      if (this.client) {
        console.log('✓ Ya existe una conexión activa a MongoDB');
        return;
      }

      console.log('🔌 Conectando a MongoDB...');

      // Si hay credenciales configuradas, usar autenticación
      // Si no, conectar sin autenticación (desarrollo local)
      let uri: string;
      if (config.mongodb.rootUser && config.mongodb.rootPassword) {
        uri = `mongodb://${config.mongodb.rootUser}:${config.mongodb.rootPassword}@localhost:27017/admin?authSource=admin`;
        console.log('  → Conectando con autenticación...');
      } else {
        uri = `mongodb://localhost:27017/${config.mongodb.dbName}`;
        console.log('  → Conectando sin autenticación (desarrollo local)...');
      }

      this.client = new MongoClient(uri);
      await this.client.connect();

      this.db = this.client.db(config.mongodb.dbName);

      console.log(`✓ Conectado a MongoDB: ${config.mongodb.dbName}`);
    } catch (error) {
      console.error('✗ Error al conectar a MongoDB:', error);
      throw new Error('No se pudo conectar a MongoDB');
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        console.log('✓ Desconectado de MongoDB');
      }
    } catch (error) {
      console.error('✗ Error al desconectar de MongoDB:', error);
      throw error;
    }
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error('No hay conexión a la base de datos');
    }
    return this.db;
  }

  async isConnected(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      await this.client.db().admin().ping();
      return true;
    } catch {
      return false;
    }
  }
}
