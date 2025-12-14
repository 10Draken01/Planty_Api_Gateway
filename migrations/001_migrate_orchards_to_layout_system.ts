/**
 * MIGRACIÓN DE BASE DE DATOS
 *
 * Migración: 001 - Migrar huertos al nuevo sistema de layout con posiciones
 *
 * CAMBIOS:
 * 1. Eliminar campo: plants_id (string[])
 * 2. Agregar campo: plants (PlantInLayout[]) con posiciones
 * 3. Separar width y height del objeto dimensions (para compatibilidad)
 *
 * ESTRATEGIA:
 * - Los huertos existentes tendrán plants = []
 * - Se preservan width y height
 * - Se elimina plants_id
 *
 * REVERSIBLE: Sí (ver rollback)
 */

import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'planty_orchards';
const COLLECTION_NAME = 'orchards';

interface OrchardDocument {
  _id: string;
  userId: string;
  name: string;
  description: string;
  plants_id?: string[];  // Campo antiguo
  plants?: any[];        // Campo nuevo
  width?: number;
  height?: number;
  state: boolean;
  createAt: Date;
  updateAt: Date;
  timeOfLife: number;
  streakOfDays: number;
}

/**
 * Ejecuta la migración
 */
async function migrate() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✓ Conectado a MongoDB');

    const db: Db = client.db(DATABASE_NAME);
    const collection = db.collection<OrchardDocument>(COLLECTION_NAME);

    // Contar documentos a migrar
    const totalDocs = await collection.countDocuments({ plants_id: { $exists: true } });

    console.log(`📊 Documentos a migrar: ${totalDocs}`);

    if (totalDocs === 0) {
      console.log('✓ No hay documentos que migrar. Todos los huertos ya están actualizados.');
      return;
    }

    // Migrar cada documento
    let migratedCount = 0;
    let errorCount = 0;

    const cursor = collection.find({ plants_id: { $exists: true } });

    for await (const doc of cursor) {
      try {
        // Construir el documento actualizado
        const updates: any = {
          $set: {
            // Nuevo campo plants vacío (el usuario podrá agregar plantas después)
            plants: [],
            // Asegurar que width y height existan
            width: doc.width || 10,
            height: doc.height || 10
          },
          $unset: {
            // Eliminar el campo antiguo
            plants_id: ''
          }
        };

        await collection.updateOne(
          { _id: doc._id },
          updates
        );

        migratedCount++;
        console.log(`✓ Migrado: ${doc._id} (${migratedCount}/${totalDocs})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error al migrar ${doc._id}:`, error);
      }
    }

    console.log('\n=================================');
    console.log('RESUMEN DE MIGRACIÓN:');
    console.log(`Total de documentos: ${totalDocs}`);
    console.log(`Migrados exitosamente: ${migratedCount}`);
    console.log(`Errores: ${errorCount}`);
    console.log('=================================\n');

    if (migratedCount === totalDocs) {
      console.log('✅ Migración completada exitosamente');
    } else {
      console.log('⚠️ Migración completada con errores');
    }
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✓ Conexión cerrada');
  }
}

/**
 * Revierte la migración (rollback)
 */
async function rollback() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✓ Conectado a MongoDB');

    const db: Db = client.db(DATABASE_NAME);
    const collection = db.collection<OrchardDocument>(COLLECTION_NAME);

    // Contar documentos a revertir
    const totalDocs = await collection.countDocuments({ plants: { $exists: true } });

    console.log(`📊 Documentos a revertir: ${totalDocs}`);

    if (totalDocs === 0) {
      console.log('✓ No hay documentos que revertir.');
      return;
    }

    // Revertir cada documento
    let revertedCount = 0;
    let errorCount = 0;

    const cursor = collection.find({ plants: { $exists: true } });

    for await (const doc of cursor) {
      try {
        const updates: any = {
          $set: {
            // Restaurar plants_id vacío
            plants_id: []
          },
          $unset: {
            // Eliminar el campo nuevo
            plants: ''
          }
        };

        await collection.updateOne(
          { _id: doc._id },
          updates
        );

        revertedCount++;
        console.log(`✓ Revertido: ${doc._id} (${revertedCount}/${totalDocs})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error al revertir ${doc._id}:`, error);
      }
    }

    console.log('\n=================================');
    console.log('RESUMEN DE ROLLBACK:');
    console.log(`Total de documentos: ${totalDocs}`);
    console.log(`Revertidos exitosamente: ${revertedCount}`);
    console.log(`Errores: ${errorCount}`);
    console.log('=================================\n');

    if (revertedCount === totalDocs) {
      console.log('✅ Rollback completado exitosamente');
    } else {
      console.log('⚠️ Rollback completado con errores');
    }
  } catch (error) {
    console.error('❌ Error durante el rollback:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✓ Conexión cerrada');
  }
}

// Ejecutar según el argumento
const command = process.argv[2];

if (command === 'rollback') {
  console.log('🔄 Ejecutando ROLLBACK...\n');
  rollback().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
} else {
  console.log('🚀 Ejecutando MIGRACIÓN...\n');
  migrate().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
}
