/**
 * Aplicación Principal del Microservicio Chatbot
 * Puerto: 3003
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateEnvironment } from './config/environment';
import { DependencyContainer } from './infrastructure/container/DependencyContainer';

class ChatbotApp {
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

    // Inicializar ChromaDB
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

    // Rate limiting general
    const generalLimiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde',
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use('/', generalLimiter);

    // Rate limiting específico para chat (más restrictivo)
    const chatLimiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.chatMaxRequests,
      message: 'Demasiados mensajes de chat, por favor intenta más tarde',
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use('/chat/message', chatLimiter);

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
    this.app.get('/chat/health', (_req: Request, res: Response) => {
      res.json({
        success: true,
        service: 'chatbot-api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // System info
    this.app.get('/chat/info', async (_req: Request, res: Response) => {
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

    // Rutas de documentos
    this.app.use('/chat/documents', this.container.getDocumentRoutes());

    // Rutas de chat
    this.app.use('/chat', this.container.getChatRoutes());

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
      process.exit(1);
    });
  }

  /**
   * Verifica que los servicios externos estén disponibles
   */
  private async checkExternalServices(): Promise<void> {
    console.log('\n🔍 Verificando servicios externos...');

    const services = await this.container.checkServices();

    console.log(`  - ChromaDB: ${services.chromadb ? '✓' : '✗'}`);
    console.log(`  - Ollama Embedding (${config.ollama.embeddingModel}): ${services.ollamaEmbedding ? '✓' : '✗'}`);
    console.log(`  - Ollama Chat (${config.ollama.chatModel}): ${services.ollamaChat ? '✓' : '✗'}`);

    if (!services.chromadb) {
      console.warn('\n⚠️  ADVERTENCIA: ChromaDB no está disponible');
      console.warn('   Asegúrate de que ChromaDB esté corriendo en:', `${config.chroma.host}:${config.chroma.port}`);
    }

    if (!services.ollamaEmbedding || !services.ollamaChat) {
      console.warn('\n⚠️  ADVERTENCIA: Algunos modelos de Ollama no están disponibles');
      console.warn('   Asegúrate de que Ollama esté corriendo en:', config.ollama.baseUrl);
      console.warn('   Descarga los modelos con:');
      if (!services.ollamaEmbedding) {
        console.warn(`     ollama pull ${config.ollama.embeddingModel}`);
      }
      if (!services.ollamaChat) {
        console.warn(`     ollama pull ${config.ollama.chatModel}`);
      }
    }

    console.log('');
  }

  /**
   * Inicia el servidor
   */
  start(): void {
    this.app.listen(config.port, () => {
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║     🤖 CHATBOT API - Plantas de Suchiapa             ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log(`\n✓ Servidor corriendo en puerto ${config.port}`);
      console.log(`✓ Entorno: ${config.nodeEnv}`);
      console.log(`\n📚 Endpoints disponibles:`);
      console.log(`   GET  http://localhost:${config.port}/chat/health`);
      console.log(`   GET  http://localhost:${config.port}/chat/info`);
      console.log(`   POST http://localhost:${config.port}/chat/documents/upload`);
      console.log(`   POST http://localhost:${config.port}/chat/documents/:id/process`);
      console.log(`   GET  http://localhost:${config.port}/chat/documents`);
      console.log(`   POST http://localhost:${config.port}/chat/message`);
      console.log(`   GET  http://localhost:${config.port}/chat/history/:sessionId`);
      console.log(`\n💡 Presiona Ctrl+C para detener el servidor\n`);
    });
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
    const app = new ChatbotApp();
    await app.initialize();
    app.start();
  } catch (error) {
    console.error('Error fatal al iniciar la aplicación:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
