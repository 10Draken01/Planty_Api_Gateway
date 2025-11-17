/**
 * Configuración de Variables de Entorno
 */

import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const config = {
  // Servidor
  port: parseInt(process.env.PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // MongoDB
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/planty_orchards',
    dbName: process.env.MONGO_DB_NAME || 'planty_orchards'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos por defecto
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // JWT (para futura integración con autenticación)
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  }
};

/**
 * Valida que las variables de entorno requeridas estén presentes
 */
export function validateEnvironment(): void {
  const requiredVars = ['MONGO_URI'];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0 && config.nodeEnv === 'production') {
    console.warn(`⚠️  Variables de entorno faltantes: ${missing.join(', ')}`);
    console.warn('⚠️  Usando valores por defecto. Esto puede causar problemas en producción.');
  }

  console.log('\n✓ Configuración cargada:');
  console.log(`  - Puerto: ${config.port}`);
  console.log(`  - Entorno: ${config.nodeEnv}`);
  console.log(`  - CORS: ${config.corsOrigin}`);
  console.log(`  - MongoDB URI: ${config.mongodb.uri}`);
  console.log(`  - MongoDB DB: ${config.mongodb.dbName}`);
  console.log(`  - Rate Limit: ${config.rateLimit.maxRequests} requests / ${config.rateLimit.windowMs}ms\n`);
}
