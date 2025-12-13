
import { DocumentRepository } from '@domain/repositories/DocumentRepository';
import { VectorRepository } from '@domain/repositories/VectorRepository';
import * as fs from 'fs';

export class DeleteDocumentUseCase {
  constructor(
    private documentRepository: DocumentRepository,
    private vectorRepository: VectorRepository
  ) {}

  async execute(documentId: string): Promise<boolean> {
  
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error(`Documento no encontrado: ${documentId}`);
    }

    
    try {
      console.log(`Eliminando chunks del documento ${documentId} de ChromaDB`);
      await this.vectorRepository.deleteByDocumentId(documentId);
    } catch (error) {
      console.error('Error eliminando chunks del vector store:', error);
      // Continuar con la eliminación aunque falle esto
    }

    // 3. Eliminar archivo físico
    try {
      if (fs.existsSync(document.filePath)) {
        console.log(`Eliminando archivo físico: ${document.filePath}`);
        fs.unlinkSync(document.filePath);
      }
    } catch (error) {
      console.error('Error eliminando archivo físico:', error);
      // Continuar con la eliminación del registro
    }

    // 4. Eliminar registro de la base de datos
    const deleted = await this.documentRepository.delete(documentId);

    console.log(`Documento ${documentId} eliminado exitosamente`);

    return deleted;
  }
}
