/**
 * Script para limpiar una sesión de prueba específica
 * Uso: cd api-users && node ../clear-test-session.js <sessionId>
 */

// Verificar que se ejecute desde api-users
const path = require('path');
const fs = require('fs');

// Intentar cargar mongodb desde api-users/node_modules
let MongoClient;
try {
  MongoClient = require('./api-users/node_modules/mongodb').MongoClient;
} catch (e) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e2) {
    console.error('❌ Error: No se encontró el módulo mongodb');
    console.log('\n💡 Solución: Ejecuta este comando desde la carpeta api-users:');
    console.log('   cd api-users');
    console.log('   node ../clear-test-session.js <sessionId>');
    process.exit(1);
  }
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/planty_users';
const sessionId = process.argv[2];

if (!sessionId) {
  console.error('❌ Error: Debes proporcionar un sessionId');
  console.log('\nUso desde la raíz del proyecto:');
  console.log('   cd api-users');
  console.log('   node ../clear-test-session.js <sessionId>');
  console.log('\nEjemplo:');
  console.log('   node ../clear-test-session.js sess_1764876052377');
  process.exit(1);
}

async function clearSession() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db();
    const conversationsCollection = db.collection('conversations');

    // Buscar la conversación
    const conversation = await conversationsCollection.findOne({ sessionId });

    if (!conversation) {
      console.log(`⚠️  No se encontró ninguna conversación con sessionId: ${sessionId}`);
      return;
    }

    console.log(`\n📊 Información de la sesión:`);
    console.log(`   - ID: ${conversation._id}`);
    console.log(`   - Usuario: ${conversation.userId}`);
    console.log(`   - Mensajes: ${conversation.messages?.length || 0}`);
    console.log(`   - Activa: ${conversation.isActive}`);
    console.log(`   - Creada: ${conversation.createdAt}`);

    if (conversation.messages && conversation.messages.length > 0) {
      console.log(`\n💬 Mensajes en la conversación:`);
      conversation.messages.forEach((msg, index) => {
        console.log(`   [${index + 1}] ${msg.role}: ${msg.content.substring(0, 50)}...`);
      });
    }

    // Preguntar si desea eliminar
    console.log(`\n⚠️  ¿Deseas eliminar esta sesión? (Ctrl+C para cancelar)`);
    console.log(`   Ejecutando eliminación en 3 segundos...`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Eliminar la conversación
    const result = await conversationsCollection.deleteOne({ sessionId });

    if (result.deletedCount > 0) {
      console.log(`\n✅ Sesión eliminada exitosamente`);
    } else {
      console.log(`\n❌ No se pudo eliminar la sesión`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n👋 Conexión cerrada');
  }
}

clearSession();
