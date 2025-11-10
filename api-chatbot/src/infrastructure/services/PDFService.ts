/**
 * Servicio para procesar archivos PDF
 */

import { IPDFService } from '@application/use-cases/ProcessDocumentUseCase';
import pdfParse from 'pdf-parse';
import * as fs from 'fs';

export class PDFService implements IPDFService {
  async extractText(filePath: string): Promise<string> {
    try {
      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`El archivo no existe: ${filePath}`);
      }

      // Leer el archivo PDF
      const dataBuffer = fs.readFileSync(filePath);

      // Parsear el PDF
      const data = await pdfParse(dataBuffer, {
        // Opciones de parsing
        max: 0, // Sin límite de páginas
        version: 'v2.0.550' // Versión del parser
      });

      // Extraer y limpiar el texto
      let text = data.text;

      // Normalizar espacios en blanco
      text = text.replace(/\s+/g, ' ');

      // Eliminar caracteres especiales problemáticos
      text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

      // Trim
      text = text.trim();

      return text;
    } catch (error) {
      console.error('Error extrayendo texto del PDF:', error);
      throw new Error(
        `Error al procesar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  /**
   * Obtiene metadata del PDF
   */
  async extractMetadata(filePath: string): Promise<{
    numPages: number;
    info?: Record<string, any>;
  }> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`El archivo no existe: ${filePath}`);
      }

      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      return {
        numPages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('Error extrayendo metadata del PDF:', error);
      throw new Error(
        `Error al extraer metadata: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }
}
