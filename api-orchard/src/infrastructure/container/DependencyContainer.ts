/**
 * Contenedor de Dependencias (ACTUALIZADO)
 * Gestiona la inyección de dependencias de toda la aplicación
 *
 * NUEVOS CASOS DE USO:
 * - AddPlantToOrchardLayoutUseCase
 * - MovePlantInLayoutUseCase
 * - RemovePlantFromLayoutUseCase
 */

import { Router } from 'express';
import { MongoDBConnection } from '../database/MongoDBConnection';
import { MongoOrchardRepository } from '../repositories/MongoOrchardRepository';
import { CreateOrchardUseCase } from '@application/use-cases/CreateOrchardUseCase';
import { GetOrchardUseCase } from '@application/use-cases/GetOrchardUseCase';
import { ListOrchardsUseCase } from '@application/use-cases/ListOrchardsUseCase';
import { GetOrchardsByUserUseCase } from '@application/use-cases/GetOrchardsByUserUseCase';
import { UpdateOrchardUseCase } from '@application/use-cases/UpdateOrchardUseCase';
import { DeleteOrchardUseCase } from '@application/use-cases/DeleteOrchardUseCase';
import { ToggleOrchardStateUseCase } from '@application/use-cases/ToggleOrchardStateUseCase';
import { AddPlantToOrchardLayoutUseCase } from '@application/use-cases/AddPlantToOrchardLayoutUseCase';
import { MovePlantInLayoutUseCase } from '@application/use-cases/MovePlantInLayoutUseCase';
import { RemovePlantFromLayoutUseCase } from '@application/use-cases/RemovePlantFromLayoutUseCase';
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
  private getOrchardsByUserUseCase!: GetOrchardsByUserUseCase;
  private updateOrchardUseCase!: UpdateOrchardUseCase;
  private deleteOrchardUseCase!: DeleteOrchardUseCase;
  private toggleOrchardStateUseCase!: ToggleOrchardStateUseCase;
  private addPlantToLayoutUseCase!: AddPlantToOrchardLayoutUseCase;
  private movePlantInLayoutUseCase!: MovePlantInLayoutUseCase;
  private removePlantFromLayoutUseCase!: RemovePlantFromLayoutUseCase;

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
      this.getOrchardsByUserUseCase = new GetOrchardsByUserUseCase(this.orchardRepository);
      this.updateOrchardUseCase = new UpdateOrchardUseCase(this.orchardRepository);
      this.deleteOrchardUseCase = new DeleteOrchardUseCase(this.orchardRepository);
      this.toggleOrchardStateUseCase = new ToggleOrchardStateUseCase(this.orchardRepository);

      // ✅ NUEVOS CASOS DE USO PARA LAYOUT
      this.addPlantToLayoutUseCase = new AddPlantToOrchardLayoutUseCase(this.orchardRepository);
      this.movePlantInLayoutUseCase = new MovePlantInLayoutUseCase(this.orchardRepository);
      this.removePlantFromLayoutUseCase = new RemovePlantFromLayoutUseCase(this.orchardRepository);

      console.log('✓ Casos de uso inicializados');

      // 4. Inicializar controladores
      this.orchardController = new OrchardController(
        this.createOrchardUseCase,
        this.getOrchardUseCase,
        this.listOrchardsUseCase,
        this.getOrchardsByUserUseCase,
        this.updateOrchardUseCase,
        this.deleteOrchardUseCase,
        this.toggleOrchardStateUseCase,
        this.addPlantToLayoutUseCase,      // ✅ NUEVO
        this.movePlantInLayoutUseCase,     // ✅ NUEVO
        this.removePlantFromLayoutUseCase  // ✅ NUEVO
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
      version: '2.0.0',  // ✅ Actualizado
      description: 'Microservicio de gestión de huertos con sistema de layout',
      endpoints: {
        health: '/orchards/health',
        // CRUD básico
        create: 'POST /orchards',
        list: 'GET /orchards',
        getByUserId: 'GET /orchards/user/:userId',
        getById: 'GET /orchards/:id',
        update: 'PUT /orchards/:id',
        delete: 'DELETE /orchards/:id',
        // Estado
        activate: 'PATCH /orchards/:id/activate',
        deactivate: 'PATCH /orchards/:id/deactivate',
        // ✅ NUEVOS: Layout management
        addPlantToLayout: 'POST /orchards/:id/plants/layout',
        movePlantInLayout: 'PATCH /orchards/:id/plants/layout/:plantInstanceId/move',
        removePlantFromLayout: 'DELETE /orchards/:id/plants/layout/:plantInstanceId'
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
