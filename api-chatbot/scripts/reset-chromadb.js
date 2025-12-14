/**
 * Script para resetear la colección de ChromaDB
 * Útil cuando cambias el modelo de embeddings y las dimensiones no coinciden
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3003/chat';

async function resetChromaDB() {
  console.log('\n🔄 Reseteando ChromaDB...\n');

  try {
    // 1. Obtener todos los documentos
    console.log('📋 Obteniendo documentos...');
    const docsResponse = await axios.get(`${API_BASE_URL}/documents`);
    const documents = docsResponse.data.data.documents || [];

    console.log(`   Encontrados: ${documents.length} documentos\n`);

    // 2. Eliminar cada documento (esto limpiará ChromaDB)
    for (const doc of documents) {
      console.log(`🗑️  Eliminando documento: ${doc.filename} (${doc.id})`);
      await axios.delete(`${API_BASE_URL}/documents/${doc.id}`);
    }

    console.log('\n✅ ChromaDB reseteado exitosamente');
    console.log('💡 Ahora puedes procesar el PDF con el modelo correcto\n');
    console.log('Ejecuta: npm run init-pdf\n');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message);
    process.exit(1);
  }
}

resetChromaDB();
