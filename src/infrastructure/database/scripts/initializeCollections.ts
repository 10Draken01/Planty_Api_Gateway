/**
 * Script de Inicialización de Colecciones MongoDB para Chatbot RAG
 *
 * Este script crea todas las colecciones necesarias con sus índices
 * para el sistema de memoria híbrida del chatbot.
 *
 * Uso:
 *   ts-node src/infrastructure/database/scripts/initializeCollections.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/users_db';

interface IndexDefinition {
  keys: Record<string, 1 | -1>;
  options?: mongoose.IndexOptions;
}

async function createCollection(
  db: mongoose.Connection,
  collectionName: string,
  indexes: IndexDefinition[]
) {
  console.log(`\n📦 Creando colección: ${collectionName}`);

  try {
    // Verificar si la colección ya existe
    const collections = await db.db.listCollections({ name: collectionName }).toArray();

    if (collections.length > 0) {
      console.log(`  ⚠️  La colección '${collectionName}' ya existe`);
      console.log(`  🔄 Actualizando índices...`);
    } else {
      await db.db.createCollection(collectionName);
      console.log(`  ✅ Colección '${collectionName}' creada`);
    }

    // Crear índices
    const collection = db.db.collection(collectionName);

    for (const index of indexes) {
      try {
        await collection.createIndex(index.keys, index.options || {});
        const indexName = Object.keys(index.keys).join('_');
        console.log(`    ✓ Índice creado: ${indexName}`);
      } catch (error: any) {
        if (error.code === 85 || error.code === 86) {
          // Index already exists
          console.log(`    ℹ️  Índice ya existe: ${Object.keys(index.keys).join('_')}`);
        } else {
          throw error;
        }
      }
    }

    console.log(`  ✅ Colección '${collectionName}' lista`);
  } catch (error) {
    console.error(`  ❌ Error en colección '${collectionName}':`, error);
    throw error;
  }
}

async function initializeCollections() {
  console.log('🚀 Iniciando configuración de MongoDB para Chatbot RAG\n');
  console.log(`📍 Conectando a: ${MONGODB_URI}\n`);

  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection;

    // ============================================
    // 1. Colección: users (ya existe, solo agregar índices nuevos)
    // ============================================
    await createCollection(db, 'users', [
      { keys: { email: 1 }, options: { unique: true } },
      { keys: { experience_level: 1 } },
      { keys: { 'chatMetrics.lastActiveAt': 1 } },
      { keys: { 'chatPreferences.interests': 1 } }
    ]);

    // ============================================
    // 2. Colección: conversations (NUEVA)
    // ============================================
    await createCollection(db, 'conversations', [
      { keys: { userId: 1, sessionId: 1 } },
      { keys: { userId: 1, 'sessionMetadata.lastMessageAt': -1 } },
      { keys: { isActive: 1 } },
      { keys: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } }, // TTL Index
      { keys: { 'sessionMetadata.tags': 1 } }
    ]);

    // ============================================
    // 3. Colección: user_memories (NUEVA)
    // ============================================
    await createCollection(db, 'user_memories', [
      { keys: { userId: 1 }, options: { unique: true } },
      { keys: { 'facts.category': 1 } },
      { keys: { 'userPlants.status': 1 } },
      { keys: { 'commonProblems.frequency': -1 } }
    ]);

    // ============================================
    // 4. Colección: documents (NUEVA - Backup de ChromaDB)
    // ============================================
    await createCollection(db, 'documents', [
      { keys: { documentId: 1 }, options: { unique: true } },
      { keys: { 'processing.status': 1 } },
      { keys: { 'metadata.uploadedBy': 1 } },
      { keys: { isActive: 1 } }
    ]);

    // ============================================
    // 5. Colección: embedding_cache (NUEVA - Opcional)
    // ============================================
    await createCollection(db, 'embedding_cache', [
      { keys: { normalizedText: 1 }, options: { unique: true } },
      { keys: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } }, // TTL Index
      { keys: { 'usage.lastUsed': 1 } }
    ]);

    console.log('\n✨ ¡Todas las colecciones fueron inicializadas correctamente!');
    console.log('\n📊 Resumen de colecciones:');
    console.log('  1. users - Usuarios con preferencias de chatbot');
    console.log('  2. conversations - Historial de conversaciones');
    console.log('  3. user_memories - Memoria extraída de usuarios');
    console.log('  4. documents - Backup de documentos vectorizados');
    console.log('  5. embedding_cache - Cache de embeddings');

    console.log('\n🎉 Base de datos lista para el chatbot RAG mejorado');
  } catch (error) {
    console.error('\n❌ Error durante la inicialización:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

// Ejecutar
if (require.main === module) {
  initializeCollections()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initializeCollections };
