/**
 * Script de inicialización para procesar PDFs automáticamente
 * Este script procesa el PDF educativo de Planty al iniciar el servicio
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuración
const API_BASE_URL = process.env.API_URL || 'http://localhost:3003/chat';
const PDF_DIR = path.join(__dirname, '..', 'src/pdf');
const PDF_FILENAME = 'Planty_Educative.pdf';

/**
 * Espera un tiempo en milisegundos
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica si el servicio está disponible
 */
async function waitForService(maxRetries = 10, delayMs = 2000) {
  console.log('\n⏳ Esperando que el servicio esté disponible...');

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      if (response.data.success) {
        console.log('✅ Servicio disponible\n');
        return true;
      }
    } catch (error) {
      console.log(`   Intento ${i + 1}/${maxRetries}...`);
      await sleep(delayMs);
    }
  }

  console.error('❌ El servicio no está disponible después de varios intentos');
  return false;
}

/**
 * Verifica si el PDF ya fue procesado
 */
async function isPdfProcessed() {
  try {
    const response = await axios.get(`${API_BASE_URL}/documents`);

    if (response.data.success && response.data.data) {
      const documents = response.data.data;
      const processed = documents.find(doc =>
        doc.filename === PDF_FILENAME &&
        doc.status === 'processed'
      );

      return !!processed;
    }

    return false;
  } catch (error) {
    console.error('Error verificando documentos:', error.message);
    return false;
  }
}

/**
 * Sube el PDF al servidor
 */
async function uploadPdf() {
  const pdfPath = path.join(PDF_DIR, PDF_FILENAME);

  // Verificar que el archivo existe
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ El archivo ${PDF_FILENAME} no existe en ${PDF_DIR}`);
    console.log('\n💡 Coloca el PDF educativo en la carpeta api-chatbot/src/pdf/\n');
    return null;
  }

  console.log(`📤 Subiendo PDF: ${PDF_FILENAME}...`);

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(pdfPath));

    const response = await axios.post(`${API_BASE_URL}/documents/upload`, form, {
      headers: {
        ...form.getHeaders()
      }
    });

    if (response.data.success) {
      console.log('✅ PDF subido exitosamente');
      return response.data.data.id;
    } else {
      console.error('❌ Error al subir PDF:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error al subir PDF:', error.message);
    return null;
  }
}

/**
 * Procesa el PDF (genera embeddings y almacena en ChromaDB)
 */
async function processPdf(documentId) {
  console.log(`\n🔄 Procesando PDF (ID: ${documentId})...`);
  console.log('   Este proceso puede tardar varios minutos dependiendo del tamaño del PDF');
  console.log('   Por favor, espera...\n');

  try {
    const response = await axios.post(`${API_BASE_URL}/documents/${documentId}/process`, {
      chunkSize: 1000,
      chunkOverlap: 200
    });

    if (response.data.success) {
      const data = response.data.data;
      console.log('\n✅ PDF procesado exitosamente');
      console.log(`   📊 Total de chunks generados: ${data.totalChunks}`);
      console.log(`   💾 Almacenados en ChromaDB: colección '${process.env.CHROMA_COLLECTION_NAME || 'plantas_suchiapa'}'`);
      return true;
    } else {
      console.error('❌ Error al procesar PDF:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al procesar PDF:', error.response?.data?.error || error.message);
    return false;
  }
}

/**
 * Muestra información del sistema
 */
async function showSystemInfo() {
  try {
    const response = await axios.get(`${API_BASE_URL}/info`);

    if (response.data.success) {
      const info = response.data.data;

      console.log('\n📊 Información del Sistema:');
      console.log('─────────────────────────────────────────────');
      console.log(`   Ollama Base URL: ${info.ollamaBaseUrl}`);
      console.log(`   Modelo de Embeddings: ${info.embeddingModel}`);
      console.log(`   Modelo de Chat: ${info.chatModel}`);
      console.log(`   ChromaDB: ${info.chromaHost}:${info.chromaPort}`);
      console.log(`   Colección: ${info.collectionName}`);

      if (info.services) {
        console.log('\n🔍 Estado de Servicios:');
        console.log(`   ChromaDB: ${info.services.chromadb ? '✅ Disponible' : '❌ No disponible'}`);
        console.log(`   Ollama Embedding: ${info.services.ollamaEmbedding ? '✅ Disponible' : '❌ No disponible'}`);
        console.log(`   Ollama Chat: ${info.services.ollamaChat ? '✅ Disponible' : '❌ No disponible'}`);
      }

      console.log('─────────────────────────────────────────────\n');
    }
  } catch (error) {
    console.log('ℹ️  No se pudo obtener información del sistema');
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     🚀 INICIALIZACIÓN DE PDF - PLANTY CHATBOT         ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // 1. Esperar que el servicio esté disponible
  const serviceReady = await waitForService();
  if (!serviceReady) {
    console.log('\n❌ Inicialización abortada: Servicio no disponible\n');
    process.exit(1);
  }

  // 2. Mostrar información del sistema
  await showSystemInfo();

  // 3. Verificar si ya fue procesado
  console.log('🔍 Verificando si el PDF ya fue procesado...');
  const alreadyProcessed = await isPdfProcessed();

  if (alreadyProcessed) {
    console.log('✅ El PDF ya fue procesado previamente');
    console.log('   No es necesario procesarlo nuevamente\n');
    console.log('💡 Si deseas reprocesarlo, elimina primero el documento existente\n');
    return;
  }

  console.log('ℹ️  El PDF no ha sido procesado aún\n');

  // 4. Subir PDF
  const documentId = await uploadPdf();
  if (!documentId) {
    console.log('\n❌ Inicialización abortada: No se pudo subir el PDF\n');
    process.exit(1);
  }

  // 5. Esperar un momento para que se guarde correctamente
  await sleep(1000);

  // 6. Procesar PDF
  const processed = await processPdf(documentId);
  if (!processed) {
    console.log('\n❌ Inicialización abortada: No se pudo procesar el PDF\n');
    process.exit(1);
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     ✅ INICIALIZACIÓN COMPLETADA EXITOSAMENTE         ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n🎉 El chatbot está listo para responder preguntas\n');
  console.log('💬 Ahora puedes enviar mensajes al endpoint:');
  console.log(`   POST ${API_BASE_URL}/message\n`);
}

// Ejecutar script
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { main, uploadPdf, processPdf };
