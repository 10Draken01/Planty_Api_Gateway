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

  // LLM Provider (ollama o groq)
  llmProvider: process.env.LLM_PROVIDER || 'ollama',

  // Ollama
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
    chatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.2'
  },

  // Groq
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    chatModel: process.env.GROQ_CHAT_MODEL || 'llama-3.2-90b-text-preview',
    embeddingModel: process.env.GROQ_EMBEDDING_MODEL || 'nomic-embed-text'
  },

  // ChromaDB
  chroma: {
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT || '8000', 10),
    collectionName: process.env.CHROMA_COLLECTION_NAME || 'plantas_suchiapa',
    apiKey: process.env.CHROMA_API_KEY || '', // API Key opcional para autenticación
    authProvider: process.env.CHROMA_AUTH_PROVIDER || 'token' // token, basic, etc.
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
  console.log(`  - LLM Provider: ${config.llmProvider}`);

  if (config.llmProvider === 'groq') {
    console.log(`  - Groq API Key: ${config.groq.apiKey ? '***configurado***' : '❌ NO CONFIGURADO'}`);
    console.log(`  - Groq Chat Model: ${config.groq.chatModel}`);
  } else {
    console.log(`  - Ollama URL: ${config.ollama.baseUrl}`);
    console.log(`  - Ollama Embedding Model: ${config.ollama.embeddingModel}`);
    console.log(`  - Ollama Chat Model: ${config.ollama.chatModel}`);
  }

  console.log(`  - ChromaDB: ${config.chroma.host}:${config.chroma.port}`);
  console.log(`  - ChromaDB API Key: ${config.chroma.apiKey ? '***configurado***' : 'Sin autenticación'}`);
  console.log(`  - Colección: ${config.chroma.collectionName}`);
}
