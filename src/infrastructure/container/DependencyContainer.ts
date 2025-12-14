/**
 * Contenedor de Dependencias
 * Gestiona la inyección de dependencias de toda la aplicación
 */

import { Router } from 'express';
import { MongoDBConnection } from '../database/MongoDBConnection';
import { MongoPlantRepository } from '../repositories/MongoPlantRepository';
import { ListPlantsUseCase } from '@application/use-cases/ListPlantsUseCase';
import { PlantController } from '@presentation/controllers/PlantController';
import { PlantRoutes } from '@presentation/routes/PlantRoutes';

export class DependencyContainer {
  // Database
  private dbConnection: MongoDBConnection;

  // Repositories
  private plantRepository!: MongoPlantRepository;

  // Use Cases
  private listPlantsUseCase!: ListPlantsUseCase;

  // Controllers
  private plantController!: PlantController;

  constructor() {
    this.dbConnection = MongoDBConnection.getInstance();
  }

  /**
   * Inicializa todas las dependencias
   */
  async initialize(): Promise<void> {
    try {
      console.log('\n🔧 Inicializando dependencias...');

      // 1. Conectar a MongoDB
      await this.dbConnection.connect();

      // 2. Inicializar repositorios
      this.plantRepository = new MongoPlantRepository(this.dbConnection);
      console.log('✓ Repositorio inicializado');

      // 3. Inicializar casos de uso
      this.listPlantsUseCase = new ListPlantsUseCase(this.plantRepository);
      console.log('✓ Casos de uso inicializados');

      // 4. Inicializar controladores
      this.plantController = new PlantController(
        this.listPlantsUseCase
      );
      console.log('✓ Controladores inicializados');

      console.log('✓ Dependencias inicializadas correctamente\n');
    } catch (error) {
      console.error('✗ Error al inicializar dependencias:', error);
      throw error;
    }
  }

  /**
   * Obtiene las rutas de plants
   */
  getPlantRoutes(): Router {
    if (!this.plantController) {
      throw new Error('El contenedor no ha sido inicializado');
    }
    return PlantRoutes.create(this.plantController);
  }

  /**
   * Obtiene información del sistema
   */
  getSystemInfo(): object {
    return {
      service: 'api-plants',
      version: '1.0.0',
      description: 'Microservicio de gestión de plantas',
      endpoints: {
        health: '/plants/health',
        list: 'GET /plants'
      }
    };
  }

  /**
   * Verifica el estado de los servicios externos
   */
  async checkServices(): Promise<object> {
    const mongodbStatus = await this.dbConnection.isConnected();

    return {
      mongodb: mongodbStatus
    };
  }

  /**
   * Cierra las conexiones
   */
  async shutdown(): Promise<void> {
    try {
      console.log('\n🔌 Cerrando conexiones...');
      await this.dbConnection.disconnect();
      console.log('✓ Conexiones cerradas\n');
    } catch (error) {
      console.error('✗ Error al cerrar conexiones:', error);
      throw error;
    }
  }
}
