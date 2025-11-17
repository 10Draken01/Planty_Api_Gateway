/**
 * Aplicación Principal del Microservicio Orchard
 * Puerto: 3004
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateEnvironment } from './config/environment';
import { DependencyContainer } from './infrastructure/container/DependencyContainer';

class OrchardApp {
  private app: Application;
  private container: DependencyContainer;

  constructor() {
    this.app = express();
    this.container = new DependencyContainer();
  }

  /**
   * Inicializa la aplicación
   */
  async initialize(): Promise<void> {
    // Validar configuración
    validateEnvironment();

    // Configurar middlewares
    this.setupMiddlewares();

    // Inicializar dependencias
    await this.container.initialize();

    // Verificar servicios externos
    await this.checkExternalServices();

    // Configurar rutas
    this.setupRoutes();

    // Configurar manejo de errores
    this.setupErrorHandling();
  }

  /**
   * Configura los middlewares de Express
   */
  private setupMiddlewares(): void {
    // CORS
    this.app.use(
      cors({
        origin: config.corsOrigin,
        credentials: true
      })
    );

    // Helmet para seguridad
    this.app.use(helmet());

    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde',
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use('/orchards', limiter);

    // Logger de peticiones
    this.app.use((req, _res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Configura las rutas de la API
   */
  private setupRoutes(): void {
    // Health check general
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        success: true,
        service: 'orchard-api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // System info
    this.app.get('/info', async (_req: Request, res: Response) => {
      try {
        const systemInfo = this.container.getSystemInfo();
        const services = await this.container.checkServices();

        res.json({
          success: true,
          data: {
            ...systemInfo,
            services
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Error obteniendo información del sistema'
        });
      }
    });

    // Rutas de orchards
    this.app.use('/orchards', this.container.getOrchardRoutes());

    // Ruta 404
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
      });
    });
  }

  /**
   * Configura el manejo de errores
   */
  private setupErrorHandling(): void {
    // Manejo global de errores
    this.app.use((err: Error, _req: Request, res: Response, _next: any) => {
      console.error('Error no manejado:', err);

      res.status(500).json({
        success: false,
        error: config.nodeEnv === 'development' ? err.message : 'Error interno del servidor'
      });
    });

    // Manejo de promesas rechazadas
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Promesa rechazada sin manejar:', promise, 'Razón:', reason);
    });

    // Manejo de excepciones no capturadas
    process.on('uncaughtException', (error) => {
      console.error('Excepción no capturada:', error);
      this.shutdown();
    });

    // Manejo de señales de terminación
    process.on('SIGTERM', () => {
      console.log('SIGTERM recibido, cerrando servidor...');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT recibido, cerrando servidor...');
      this.shutdown();
    });
  }

  /**
   * Verifica que los servicios externos estén disponibles
   */
  private async checkExternalServices(): Promise<void> {
    console.log('🔍 Verificando servicios externos...');

    const services = await this.container.checkServices();

    console.log(`  - MongoDB: ${services.mongodb ? '✓' : '✗'}`);

    if (!services.mongodb) {
      console.warn('\n⚠️  ADVERTENCIA: MongoDB no está disponible');
      console.warn('   Asegúrate de que MongoDB esté corriendo en:', config.mongodb.uri);
    }

    console.log('');
  }

  /**
   * Inicia el servidor
   */
  start(): void {
    this.app.listen(config.port, () => {
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║      ORCHARD API - Gestión de Huertos              ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log(`\n✓ Servidor corriendo en puerto ${config.port}`);
      console.log(`✓ Entorno: ${config.nodeEnv}`);
      console.log(`\n📚 Endpoints disponibles:`);
      console.log(`   GET    http://localhost:${config.port}/health`);
      console.log(`   GET    http://localhost:${config.port}/info`);
      console.log(`   GET    http://localhost:${config.port}/orchards/health`);
      console.log(`   POST   http://localhost:${config.port}/orchards`);
      console.log(`   GET    http://localhost:${config.port}/orchards`);
      console.log(`   GET    http://localhost:${config.port}/orchards/:id`);
      console.log(`   PUT    http://localhost:${config.port}/orchards/:id`);
      console.log(`   DELETE http://localhost:${config.port}/orchards/:id`);
      console.log(`   PATCH  http://localhost:${config.port}/orchards/:id/activate`);
      console.log(`   PATCH  http://localhost:${config.port}/orchards/:id/deactivate`);
      console.log(`   POST   http://localhost:${config.port}/orchards/:id/plants`);
      console.log(`   DELETE http://localhost:${config.port}/orchards/:id/plants/:plantId`);
      console.log(`\n💡 Presiona Ctrl+C para detener el servidor\n`);
    });
  }

  /**
   * Cierra el servidor y las conexiones
   */
  private async shutdown(): Promise<void> {
    try {
      await this.container.shutdown();
      process.exit(0);
    } catch (error) {
      console.error('Error durante el cierre:', error);
      process.exit(1);
    }
  }

  /**
   * Obtiene la instancia de Express (para testing)
   */
  getApp(): Application {
    return this.app;
  }
}

// Iniciar la aplicación
async function main() {
  try {
    const app = new OrchardApp();
    await app.initialize();
    app.start();
  } catch (error) {
    console.error('Error fatal al iniciar la aplicación:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
