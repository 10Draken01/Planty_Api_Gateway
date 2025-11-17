/**
 * Contenedor de Dependencias
 * Gestiona la inyección de dependencias de toda la aplicación
 */

import { Router } from 'express';
import { MongoDBConnection } from '../database/MongoDBConnection';
import { MongoOrchardRepository } from '../repositories/MongoOrchardRepository';
import { CreateOrchardUseCase } from '@application/use-cases/CreateOrchardUseCase';
import { GetOrchardUseCase } from '@application/use-cases/GetOrchardUseCase';
import { ListOrchardsUseCase } from '@application/use-cases/ListOrchardsUseCase';
import { UpdateOrchardUseCase } from '@application/use-cases/UpdateOrchardUseCase';
import { DeleteOrchardUseCase } from '@application/use-cases/DeleteOrchardUseCase';
import { ToggleOrchardStateUseCase } from '@application/use-cases/ToggleOrchardStateUseCase';
import { ManagePlantsUseCase } from '@application/use-cases/ManagePlantsUseCase';
import { OrchardController } from '@presentation/controllers/OrchardController';
import { OrchardRoutes } from '@presentation/routes/OrchardRoutes';

export class DependencyContainer {
  // Database
  private dbConnection: MongoDBConnection;

  // Repositories
  private orchardRepository!: MongoOrchardRepository;

  // Use Cases
  private createOrchardUseCase!: CreateOrchardUseCase;
  private getOrchardUseCase!: GetOrchardUseCase;
  private listOrchardsUseCase!: ListOrchardsUseCase;
  private updateOrchardUseCase!: UpdateOrchardUseCase;
  private deleteOrchardUseCase!: DeleteOrchardUseCase;
  private toggleOrchardStateUseCase!: ToggleOrchardStateUseCase;
  private managePlantsUseCase!: ManagePlantsUseCase;

  // Controllers
  private orchardController!: OrchardController;

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
      this.orchardRepository = new MongoOrchardRepository(this.dbConnection);
      console.log('✓ Repositorio inicializado');

      // 3. Inicializar casos de uso
      this.createOrchardUseCase = new CreateOrchardUseCase(this.orchardRepository);
      this.getOrchardUseCase = new GetOrchardUseCase(this.orchardRepository);
      this.listOrchardsUseCase = new ListOrchardsUseCase(this.orchardRepository);
      this.updateOrchardUseCase = new UpdateOrchardUseCase(this.orchardRepository);
      this.deleteOrchardUseCase = new DeleteOrchardUseCase(this.orchardRepository);
      this.toggleOrchardStateUseCase = new ToggleOrchardStateUseCase(this.orchardRepository);
      this.managePlantsUseCase = new ManagePlantsUseCase(this.orchardRepository);
      console.log('✓ Casos de uso inicializados');

      // 4. Inicializar controladores
      this.orchardController = new OrchardController(
        this.createOrchardUseCase,
        this.getOrchardUseCase,
        this.listOrchardsUseCase,
        this.updateOrchardUseCase,
        this.deleteOrchardUseCase,
        this.toggleOrchardStateUseCase,
        this.managePlantsUseCase
      );
      console.log('✓ Controladores inicializados');

      console.log('✓ Dependencias inicializadas correctamente\n');
    } catch (error) {
      console.error('✗ Error al inicializar dependencias:', error);
      throw error;
    }
  }

  /**
   * Obtiene las rutas de orchards
   */
  getOrchardRoutes(): Router {
    if (!this.orchardController) {
      throw new Error('El contenedor no ha sido inicializado');
    }
    return OrchardRoutes.create(this.orchardController);
  }

  /**
   * Obtiene información del sistema
   */
  getSystemInfo(): object {
    return {
      service: 'api-orchard',
      version: '1.0.0',
      description: 'Microservicio de gestión de huertos',
      endpoints: {
        health: '/orchards/health',
        create: 'POST /orchards',
        list: 'GET /orchards',
        getById: 'GET /orchards/:id',
        update: 'PUT /orchards/:id',
        delete: 'DELETE /orchards/:id',
        activate: 'PATCH /orchards/:id/activate',
        deactivate: 'PATCH /orchards/:id/deactivate',
        addPlant: 'POST /orchards/:id/plants',
        removePlant: 'DELETE /orchards/:id/plants/:plantId'
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
