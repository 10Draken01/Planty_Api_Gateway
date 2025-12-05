/**
 * Script para verificar qué datos tiene un usuario
 * Uso: cd api-users && node ../check-user-data.js <userId>
 */

const path = require('path');

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
    console.log('   node ../check-user-data.js <userId>');
    process.exit(1);
  }
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/planty_users';
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Debes proporcionar un userId');
  console.log('\nUso:');
  console.log('   cd api-users');
  console.log('   node ../check-user-data.js <userId>');
  console.log('\nEjemplo:');
  console.log('   node ../check-user-data.js 17648757299771cx3evtsv');
  process.exit(1);
}

async function checkUserData() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db();

    // 1. Verificar usuario
    console.log('👤 INFORMACIÓN DEL USUARIO:');
    console.log('━'.repeat(60));
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: userId });

    if (!user) {
      console.log(`⚠️  No se encontró el usuario: ${userId}`);
    } else {
      console.log(`✅ Usuario encontrado:`);
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Nombre: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Nivel: ${user.experience_level}`);
      console.log(`   - Creado: ${user.createdAt}`);
    }

    // 2. Verificar memoria del usuario
    console.log('\n\n🧠 MEMORIA DEL USUARIO (UserMemory):');
    console.log('━'.repeat(60));
    const memoryCollection = db.collection('user_memories');
    const memory = await memoryCollection.findOne({ userId });

    if (!memory) {
      console.log(`⚠️  No hay memoria guardada para este usuario`);
    } else {
      console.log(`✅ Memoria encontrada:`);
      console.log(`   - Plantas activas: ${memory.userPlants?.length || 0}`);
      console.log(`   - Problemas comunes: ${memory.commonProblems?.length || 0}`);
      console.log(`   - Hechos guardados: ${memory.facts?.length || 0}`);

      if (memory.userPlants && memory.userPlants.length > 0) {
        console.log(`\n   📝 Plantas:`);
        memory.userPlants.forEach((plant, i) => {
          console.log(`      ${i + 1}. ${plant.plantName} (${plant.status})`);
        });
      }

      if (memory.commonProblems && memory.commonProblems.length > 0) {
        console.log(`\n   ⚠️  Problemas:`);
        memory.commonProblems.forEach((problem, i) => {
          console.log(`      ${i + 1}. ${problem.problem} (frecuencia: ${problem.frequency})`);
        });
      }

      if (memory.facts && memory.facts.length > 0) {
        console.log(`\n   💡 Hechos guardados:`);
        const activeFacts = memory.facts.filter(f => f.isActive);
        activeFacts.slice(0, 5).forEach((fact, i) => {
          console.log(`      ${i + 1}. ${fact.fact}`);
        });
      }
    }

    // 3. Verificar conversaciones
    console.log('\n\n💬 CONVERSACIONES DEL USUARIO:');
    console.log('━'.repeat(60));
    const conversationsCollection = db.collection('conversations');
    const conversations = await conversationsCollection
      .find({ userId })
      .sort({ 'sessionMetadata.lastMessageAt': -1 })
      .limit(5)
      .toArray();

    if (conversations.length === 0) {
      console.log(`⚠️  No hay conversaciones para este usuario`);
    } else {
      console.log(`✅ Se encontraron ${conversations.length} conversación(es) reciente(s):\n`);
      conversations.forEach((conv, i) => {
        console.log(`   ${i + 1}. SessionId: ${conv.sessionId}`);
        console.log(`      - Mensajes: ${conv.messages?.length || 0}`);
        console.log(`      - Activa: ${conv.isActive ? 'Sí' : 'No'}`);
        console.log(`      - Última actividad: ${conv.sessionMetadata?.lastMessageAt || 'N/A'}`);
        console.log(`      - Tags: ${conv.sessionMetadata?.tags?.join(', ') || 'ninguno'}`);

        if (conv.messages && conv.messages.length > 0) {
          console.log(`      - Últimos 3 mensajes:`);
          conv.messages.slice(-3).forEach((msg, j) => {
            const preview = msg.content.substring(0, 50);
            console.log(`         [${msg.role}]: ${preview}${msg.content.length > 50 ? '...' : ''}`);
          });
        }
        console.log('');
      });
    }

    // 4. Recomendación
    console.log('\n💡 RECOMENDACIÓN:');
    console.log('━'.repeat(60));
    if (memory && (memory.userPlants?.length > 0 || memory.facts?.length > 0)) {
      console.log('⚠️  El usuario tiene información en su memoria de largo plazo.');
      console.log('   Esto puede hacer que el bot mencione plantas o problemas');
      console.log('   aunque no hayan sido parte de la conversación actual.\n');
      console.log('   Opciones:');
      console.log('   1. Usa un userId diferente para pruebas');
      console.log('   2. Limpia la memoria del usuario (ver script de limpieza)');
      console.log('   3. Las instrucciones del LLM ahora deberían manejar esto correctamente');
    } else {
      console.log('✅ El perfil del usuario está limpio.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n👋 Conexión cerrada');
  }
}

checkUserData();
