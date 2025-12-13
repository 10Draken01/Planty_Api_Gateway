import dotenv from 'dotenv';

dotenv.config();

interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  jwt: {
    secret: string;
  };
  cors: {
    origin: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    authMaxAttempts: number;
    createMaxAttempts: number;
  };
  services: {
    users: string;
    auth: string;
    chatbot: string;
    orchard: string;
    algorithmGen: string;
    plant: string;
    recommender: string;
  };
}

class Environment {
  private static instance: Environment;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validate();
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private loadConfig(): EnvironmentConfig {
    return {
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      },
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15', 10) * 60 * 1000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        authMaxAttempts: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
        createMaxAttempts: parseInt(process.env.CREATE_RATE_LIMIT_MAX || '3', 10),
      },
      services: {
        users: this.getRequiredEnv('USERS_SERVICE_URL'),
        auth: this.getRequiredEnv('AUTH_SERVICE_URL'),
        chatbot: this.getRequiredEnv('CHATBOT_SERVICE_URL'),
        orchard: this.getRequiredEnv('ORCHARD_SERVICE_URL'),
        algorithmGen: this.getRequiredEnv('ALGORITHM_GEN_SERVICE_URL'),
        plant: this.getRequiredEnv('PLANT_SERVICE_URL'),
        recommender: this.getRequiredEnv('RECOMMENDER_SERVICE_URL'),
      },
    };
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private validate(): void {
    if (this.config.nodeEnv === 'production') {
      if (this.config.jwt.secret === 'default-secret-change-in-production') {
        throw new Error('JWT_SECRET must be set in production environment');
      }

      if (this.config.cors.origin === '*') {
        console.warn('WARNING: CORS is set to allow all origins in production. This is not recommended for security.');
      }
    }

    if (this.config.port < 1 || this.config.port > 65535) {
      throw new Error(`Invalid PORT: ${this.config.port}. Must be between 1 and 65535.`);
    }
  }

  public get(): EnvironmentConfig {
    return { ...this.config };
  }

  public getServiceUrl(serviceName: keyof EnvironmentConfig['services']): string {
    return this.config.services[serviceName];
  }
}

export const env = Environment.getInstance();
export type { EnvironmentConfig };
