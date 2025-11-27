import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { logger } from './config/logger';
import { mongoConnection } from './infrastructure/persistence/mongodb/connection';
import { MongoPlantRepository } from './infrastructure/persistence/mongodb/MongoPlantRepository';
import { MongoCompatibilityMatrixRepository } from './infrastructure/persistence/mongodb/MongoCompatibilityMatrixRepository';
import { DataSeeder } from './infrastructure/persistence/seeders/DataSeeder';
import { GenerateGardenUseCase } from './application/use-cases/GenerateGardenUseCase';
import { HealthController } from './infrastructure/http/controllers/HealthController';
import { GenerateController } from './infrastructure/http/controllers/GenerateController';
import { createRoutes } from './infrastructure/http/routes';
import { errorHandlerMiddleware } from './infrastructure/http/middlewares/ErrorHandlerMiddleware';

class AgService {
  private app: Application;
  private plantRepository: MongoPlantRepository;
  private compatibilityMatrixRepository: MongoCompatibilityMatrixRepository;

  constructor() {
    this.app = express();
    this.plantRepository = new MongoPlantRepository();
    this.compatibilityMatrixRepository = new MongoCompatibilityMatrixRepository();

    this.setupMiddlewares();
  }

  private setupMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Casos de uso
    const generateGardenUseCase = new GenerateGardenUseCase(
      this.plantRepository,
      this.compatibilityMatrixRepository
    );

    // Controladores
    const healthController = new HealthController(
      this.plantRepository,
      this.compatibilityMatrixRepository
    );
    const generateController = new GenerateController(generateGardenUseCase);

    // Rutas
    const router = createRoutes(healthController, generateController);
    this.app.use(`/${env.apiVersion}`, router);

    // Error handler
    this.app.use(errorHandlerMiddleware);
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Conectar a MongoDB
      await mongoConnection.connect();

      // Ejecutar seeder
      const dataSeeder = new DataSeeder(
        this.plantRepository,
        this.compatibilityMatrixRepository
      );
      await dataSeeder.seed();

      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database', { error });
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      // Inicializar base de datos
      await this.initializeDatabase();

      // Configurar rutas
      this.setupRoutes();

      // Iniciar servidor
      this.app.listen(env.port, () => {
        logger.info(`🚀 AG-Service running on port ${env.port}`);
        logger.info(`Environment: ${env.nodeEnv}`);
        logger.info(`API Version: ${env.apiVersion}`);
        logger.info(`Health check: http://localhost:${env.port}/${env.apiVersion}/health`);
      });
    } catch (error) {
      logger.error('Failed to start service', { error });
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    await mongoConnection.disconnect();
    logger.info('Service stopped');
  }
}

// Iniciar servicio
const service = new AgService();

service.start().catch((error) => {
  logger.error('Fatal error starting service', { error });
  process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGINT', async () => {
  logger.info('SIGINT signal received');
  await service.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received');
  await service.stop();
  process.exit(0);
});
