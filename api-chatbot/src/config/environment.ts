/**
 * Configuración de Variables de Entorno
 */

import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Ollama
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
    chatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.2'
  },

  // ChromaDB
  chroma: {
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT || '8000', 10),
    collectionName: process.env.CHROMA_COLLECTION_NAME || 'plantas_suchiapa'
  },

  // PDF Processing
  pdf: {
    chunkSize: parseInt(process.env.CHUNK_SIZE || '1000', 10),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10)
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15', 10) * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    chatMaxRequests: parseInt(process.env.CHAT_RATE_LIMIT_MAX || '20', 10)
  },

  // JWT (para futura integración)
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
  }
};

/**
 * Valida que las variables de entorno críticas estén configuradas
 */
export function validateEnvironment(): void {
  const requiredEnvVars: string[] = [];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Variables de entorno faltantes (se usarán valores por defecto): ${missingVars.join(', ')}`
    );
  }

  console.log('✓ Configuración de entorno cargada');
  console.log(`  - Puerto: ${config.port}`);
  console.log(`  - Entorno: ${config.nodeEnv}`);
  console.log(`  - Ollama URL: ${config.ollama.baseUrl}`);
  console.log(`  - Ollama Embedding Model: ${config.ollama.embeddingModel}`);
  console.log(`  - Ollama Chat Model: ${config.ollama.chatModel}`);
  console.log(`  - ChromaDB: ${config.chroma.host}:${config.chroma.port}`);
  console.log(`  - Colección: ${config.chroma.collectionName}`);
}
