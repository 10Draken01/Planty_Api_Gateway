/**
 * Script para procesar automáticamente el PDF de Planty y almacenarlo en ChromaDB
 *
 * Uso: ts-node -r tsconfig-paths/register scripts/process-planty-pdf.ts
 */

import { DependencyContainer } from '../src/infrastructure/container/DependencyContainer';
import { UploadDocumentDTO } from '../src/application/dtos/DocumentDTOs';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log('🌿 Iniciando procesamiento del PDF de Planty...\n');

  try {
    // 1. Inicializar container
    const container = new DependencyContainer();
    await container.initialize();

    // 2. Verificar que el PDF existe
    const pdfPath = path.join(__dirname, '../src/pdf/Planty_Educative.pdf');

    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF no encontrado en: ${pdfPath}`);
    }

    const stats = fs.statSync(pdfPath);
    console.log(`📄 PDF encontrado: ${pdfPath}`);
    console.log(`📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB\n`);

    // 3. Verificar si ya existe un documento procesado
    const existingDocs = await container.getVectorRepository().getCount();
    console.log(`📦 Chunks existentes en ChromaDB: ${existingDocs}\n`);

    // 4. Crear directorio uploads si no existe
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 5. Copiar PDF a uploads con nombre único
    const timestamp = Date.now();
    const uploadedFilename = `planty-educative-${timestamp}.pdf`;
    const uploadedPath = path.join(uploadsDir, uploadedFilename);

    fs.copyFileSync(pdfPath, uploadedPath);
    console.log(`📤 PDF copiado a uploads: ${uploadedFilename}\n`);

    // 6. Subir documento
    console.log('⏳ Subiendo documento...');
    const uploadDTO: UploadDocumentDTO = {
      filename: uploadedFilename,
      originalName: 'Planty_Educative.pdf',
      filePath: uploadedPath,
      fileSize: stats.size,
      mimetype: 'application/pdf'
    };

    // Simular upload
    const document = await (container as any).documentRepository.create({
      filename: uploadDTO.filename,
      originalName: uploadDTO.originalName,
      filePath: uploadDTO.filePath,
      fileSize: uploadDTO.fileSize,
      mimetype: uploadDTO.mimetype
    });

    console.log(`✅ Documento creado: ${document.id}\n`);

    // 7. Procesar documento con configuración optimizada para plantas
    console.log('🚀 Procesando documento...');
    console.log('📐 Configuración:');
    console.log('   - Chunk size: 800 caracteres (óptimo para información de plantas)');
    console.log('   - Overlap: 150 caracteres (mantiene contexto entre chunks)');
    console.log('   - Estrategia: Respetar párrafos y secciones\n');

    const processDTO = {
      documentId: document.id,
      chunkSize: 800,        // Más pequeño para información específica
      chunkOverlap: 150      // Buen balance
    };

    const processedDoc = await (container as any).processDocumentUseCase.execute(processDTO);

    console.log('\n✅ Procesamiento completado!');
    console.log(`📊 Estadísticas:`);
    console.log(`   - Total chunks: ${processedDoc.totalChunks}`);
    console.log(`   - Tamaño del texto: ${processedDoc.metadata?.textLength || 'N/A'} caracteres`);
    console.log(`   - Procesado en: ${processedDoc.processedAt}\n`);

    // 8. Verificar almacenamiento en ChromaDB
    const finalCount = await container.getVectorRepository().getCount();
    console.log(`💾 Chunks almacenados en ChromaDB: ${finalCount}`);
    console.log(`✨ Incremento: +${finalCount - existingDocs} chunks\n`);

    // 9. Hacer una prueba de búsqueda
    console.log('🔍 Probando búsqueda semántica...');
    const testQuery = 'cómo cuidar tomates';
    console.log(`   Query: "${testQuery}"\n`);

    const embeddingService = (container as any).embeddingService;
    const queryEmbedding = await embeddingService.generateEmbedding(testQuery);
    const results = await container.getVectorRepository().searchSimilar(queryEmbedding, 3);

    console.log(`📋 Top 3 resultados:`);
    results.forEach((result, idx) => {
      console.log(`\n${idx + 1}. Score: ${result.score.toFixed(4)}`);
      console.log(`   Contenido: ${result.chunk.content.substring(0, 150)}...`);
    });

    console.log('\n🎉 Todo listo! El PDF de Planty está procesado y disponible para RAG.\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
