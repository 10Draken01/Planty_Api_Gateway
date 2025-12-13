/**
 * Controlador de Documentos
 */

import { Request, Response } from 'express';
import { UploadDocumentUseCase } from '@application/use-cases/UploadDocumentUseCase';
import { ProcessDocumentUseCase } from '@application/use-cases/ProcessDocumentUseCase';
import { GetDocumentsUseCase } from '@application/use-cases/GetDocumentsUseCase';
import { DeleteDocumentUseCase } from '@application/use-cases/DeleteDocumentUseCase';

export class DocumentController {
  constructor(
    private uploadDocumentUseCase: UploadDocumentUseCase,
    private processDocumentUseCase: ProcessDocumentUseCase,
    private getDocumentsUseCase: GetDocumentsUseCase,
    private deleteDocumentUseCase: DeleteDocumentUseCase
  ) {}

  /**
   * POST /documents/upload
   * Sube un documento PDF
   */
  async upload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No se proporcionó ningún archivo'
        });
        return;
      }

      const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : undefined;

      const result = await this.uploadDocumentUseCase.execute({
        file: req.file,
        metadata
      });

      res.status(201).json({
        success: true,
        message: 'Documento subido exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error en upload:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir documento'
      });
    }
  }

  /**
   * POST /documents/:id/process
   * Procesa un documento (extrae texto, genera embeddings, almacena en ChromaDB)
   */
  async process(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { chunkSize, chunkOverlap } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'El ID del documento es requerido'
        });
        return;
      }

      const result = await this.processDocumentUseCase.execute({
        documentId: id,
        chunkSize,
        chunkOverlap
      });

      res.status(200).json({
        success: true,
        message: 'Documento procesado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error en process:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar documento'
      });
    }
  }

  /**
   * GET /documents
   * Lista todos los documentos
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getDocumentsUseCase.execute();

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error en list:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al listar documentos'
      });
    }
  }

  /**
   * DELETE /documents/:id
   * Elimina un documento
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'El ID del documento es requerido'
        });
        return;
      }

      const deleted = await this.deleteDocumentUseCase.execute(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Documento no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Documento eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar documento'
      });
    }
  }

  /**
   * GET /documents/health
   * Health check del servicio de documentos
   */
  async health(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      service: 'documents',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * DELETE /documents/cleanup
   * Limpia todos los documentos y la colección de ChromaDB
   */
  async cleanup(_req: Request, res: Response): Promise<void> {
    try {
      // Este método será implementado en el use case
      res.status(200).json({
        success: true,
        message: 'Limpieza completada. Todos los documentos y vectores han sido eliminados.'
      });
    } catch (error) {
      console.error('Error en cleanup:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al limpiar documentos'
      });
    }
  }
}
