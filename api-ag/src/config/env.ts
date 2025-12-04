import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvironmentConfig {
  // Server
  nodeEnv: string;
  port: number;
  apiVersion: string;

  // MongoDB
  mongo: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    uri?: string;
  };

  // External Services
  services: {
    usersServiceUrl: string;
    notificationsServiceUrl: string;
  };

  // Genetic Algorithm Parameters
  ag: {
    populationSize: number;
    maxGenerations: number;
    crossoverProbability: number;
    mutationRate: number;
    insertionRate: number;
    deletionRate: number;
    tournamentK: number;
    eliteCount: number;
    patience: number;
    convergenceThreshold: number;
  };

  // Timeouts
  timeouts: {
    agExecutionMs: number;
    externalServiceMs: number;
  };

  // Logging
  logLevel: string;

  // Location Defaults
  location: {
    defaultLatitude: number;
    defaultLongitude: number;
  };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
};

const getNumberEnvVar = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseFloat(value) : defaultValue;
};

export const env: EnvironmentConfig = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: getNumberEnvVar('PORT', 3005),
  apiVersion: getEnvVar('API_VERSION', 'v1'),

  mongo: {
    host: getEnvVar('MONGO_HOST', 'localhost'),
    port: getNumberEnvVar('MONGO_PORT', 27017),
    user: getEnvVar('MONGO_ROOT_USER', 'admin'),
    password: getEnvVar('MONGO_ROOT_PASSWORD', 'password123'),
    database: getEnvVar('MONGO_DATABASE', 'plantgen_ag'),
    uri: process.env.MONGO_URI,
  },

  services: {
    usersServiceUrl: getEnvVar('USERS_SERVICE_URL', 'http://localhost:3001'),
    notificationsServiceUrl: getEnvVar('NOTIFICATIONS_SERVICE_URL', 'http://localhost:3003'),
  },

  ag: {
    populationSize: getNumberEnvVar('AG_POPULATION_SIZE', 40),
    maxGenerations: getNumberEnvVar('AG_MAX_GENERATIONS', 150),
    crossoverProbability: getNumberEnvVar('AG_CROSSOVER_PROBABILITY', 0.85),
    mutationRate: getNumberEnvVar('AG_MUTATION_RATE', 0.08),
    insertionRate: parseFloat(process.env.AG_INSERTION_RATE || '0.1'), 
    deletionRate: parseFloat(process.env.AG_DELETION_RATE || '0.05'), 
    tournamentK: getNumberEnvVar('AG_TOURNAMENT_K', 3),
    eliteCount: getNumberEnvVar('AG_ELITE_COUNT', 3),
    patience: getNumberEnvVar('AG_PATIENCE', 20),
    convergenceThreshold: getNumberEnvVar('AG_CONVERGENCE_THRESHOLD', 0.001),
  },

  timeouts: {
    agExecutionMs: getNumberEnvVar('AG_EXECUTION_TIMEOUT_MS', 30000),
    externalServiceMs: getNumberEnvVar('EXTERNAL_SERVICE_TIMEOUT_MS', 5000),
  },

  logLevel: getEnvVar('LOG_LEVEL', 'debug'),

  location: {
    defaultLatitude: getNumberEnvVar('DEFAULT_LATITUDE', 16.75),
    defaultLongitude: getNumberEnvVar('DEFAULT_LONGITUDE', -93.11),
  },
};

export const getMongoUri = (): string => {
  if (env.mongo.uri) {
    return env.mongo.uri;
  }

  return `mongodb://${env.mongo.user}:${env.mongo.password}@${env.mongo.host}:${env.mongo.port}/${env.mongo.database}?authSource=admin`;
};
