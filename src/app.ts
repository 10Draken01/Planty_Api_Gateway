import express, { Application } from 'express';
import cors from 'cors';
import config from './config/environment';
import { logger } from './infrastructure/services/LoggerService';
import { FirebaseService } from './infrastructure/services/FirebaseService';
import { UsersServiceClient } from './infrastructure/http/UsersServiceClient';
import { SendNotificationToUserUseCase } from './application/use-cases/SendNotificationToUserUseCase';
import { SendNotificationToMultipleUsersUseCase } from './application/use-cases/SendNotificationToMultipleUsersUseCase';
import { BroadcastNotificationUseCase } from './application/use-cases/BroadcastNotificationUseCase';
import { NotificationController } from './presentation/controllers/NotificationController';
import { NotificationRoutes } from './presentation/routes/NotificationRoutes';

class NotificationsApp {
  private app: Application;
  private firebaseService: FirebaseService;
  private usersServiceClient: UsersServiceClient;

  constructor() {
    this.app = express();
    this.firebaseService = FirebaseService.getInstance();
    this.usersServiceClient = new UsersServiceClient();

    this.initializeMiddlewares();
    this.initializeFirebase();
    this.initializeRoutes();
    this.initializeErrorHandlers();
  }

  private initializeMiddlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private initializeFirebase(): void {
    try {
      this.firebaseService.initialize();
      logger.info('Firebase Admin SDK inicializado correctamente');
    } catch (error) {
      logger.error('Error crítico al inicializar Firebase', error);
      process.exit(1);
    }
  }

  private initializeRoutes(): void {
    // Crear casos de uso
    const sendNotificationToUserUseCase = new SendNotificationToUserUseCase(
      this.firebaseService,
      this.usersServiceClient
    );

    const sendNotificationToMultipleUsersUseCase = new SendNotificationToMultipleUsersUseCase(
      this.firebaseService,
      this.usersServiceClient
    );

    const broadcastNotificationUseCase = new BroadcastNotificationUseCase(
      this.firebaseService,
      this.usersServiceClient
    );

    // Crear controlador
    const notificationController = new NotificationController(
      sendNotificationToUserUseCase,
      sendNotificationToMultipleUsersUseCase,
      broadcastNotificationUseCase
    );

    // Registrar rutas
    const notificationRoutes = NotificationRoutes.create(notificationController);
    this.app.use('/notify', notificationRoutes);

    // Ruta raíz
    this.app.get('/', (_req, res) => {
      res.json({
        service: 'Notifications Service',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: 'GET /notify/health',
          sendToUser: 'POST /notify/user/:id',
          sendToMultipleUsers: 'POST /notify/users',
          broadcast: 'POST /notify/broadcast',
        },
      });
    });
  }

  private initializeErrorHandlers(): void {
    // Manejo de rutas no encontradas
    this.app.use((_req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
      });
    });

    // Manejo global de errores
    this.app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Error no manejado', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: config.nodeEnv === 'development' ? error.message : undefined,
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Verificar conectividad con Users Service
      const usersServiceAvailable = await this.usersServiceClient.healthCheck();
      if (!usersServiceAvailable) {
        logger.warn('ADVERTENCIA: Users Service no está disponible');
      } else {
        logger.info('Conexión con Users Service establecida');
      }

      // Iniciar servidor
      this.app.listen(config.port, () => {
        logger.info(`🚀 Notifications Service corriendo en puerto ${config.port}`);
        logger.info(`Ambiente: ${config.nodeEnv}`);
        logger.info(`Users Service URL: ${config.usersServiceUrl}`);
      });
    } catch (error) {
      logger.error('Error al iniciar el servidor', error);
      process.exit(1);
    }
  }
}

// Iniciar aplicación
const app = new NotificationsApp();
app.start();

export default app;
