import { Request, Response } from 'express';
import { env } from '../config/environment';

export class HealthController {
  public static async check(req: Request, res: Response): Promise<void> {
    try {
      const config = env.get();
      const services = config.services;

      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        version: '1.0.0',
        uptime: process.uptime(),
        services: {
          configured: Object.keys(services).length,
          endpoints: Object.entries(services).map(([name, url]) => ({
            name,
            url,
            configured: !!url && url !== '',
          })),
        },
      };

      res.status(200).json(health);
    } catch (error: any) {
      res.status(503).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: error.message,
        message: 'Configuration error detected',
      });
    }
  }

  public static async detailed(req: Request, res: Response): Promise<void> {
    try {
      const config = env.get();

      const detailedHealth = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        application: {
          name: 'API Gateway',
          version: '1.0.0',
          environment: config.nodeEnv,
          port: config.port,
        },
        system: {
          uptime: process.uptime(),
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: 'MB',
          },
          node: process.version,
        },
        services: Object.entries(config.services).map(([name, url]) => ({
          name,
          url,
          status: 'configured',
        })),
        security: {
          cors: config.cors.origin,
          jwtConfigured: !!config.jwt.secret && config.jwt.secret !== 'default-secret-change-in-production',
        },
      };

      res.status(200).json(detailedHealth);
    } catch (error: any) {
      res.status(503).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }
}
