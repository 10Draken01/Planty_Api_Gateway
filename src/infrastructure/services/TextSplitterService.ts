/**
 * Servicio para dividir texto en chunks
 */

import { ITextSplitter } from '@application/use-cases/ProcessDocumentUseCase';

export class TextSplitterService implements ITextSplitter {
  /**
   * Divide el texto en chunks con overlap
   * @param text Texto completo a dividir
   * @param chunkSize Tamaño máximo de cada chunk
   * @param overlap Cantidad de caracteres que se solapan entre chunks
   */
  splitText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    if (!text || text.length === 0) {
      return [];
    }

    // Validar parámetros
    if (chunkSize <= 0) {
      throw new Error('El tamaño del chunk debe ser mayor a 0');
    }

    if (overlap < 0 || overlap >= chunkSize) {
      throw new Error('El overlap debe ser positivo y menor que el tamaño del chunk');
    }

    const chunks: string[] = [];
    let position = 0;
    const textLength = text.length;

    while (position < textLength) {
      // Calcular el final del chunk
      const end = Math.min(position + chunkSize, textLength);

      // Extraer el chunk
      const chunk = text.slice(position, end).trim();

      // Solo agregar si el chunk no está vacío
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Avanzar con overlap, pero siempre avanzar al menos (chunkSize - overlap)
      position += chunkSize - overlap;

      // Seguridad: si no estamos avanzando, forzar avance
      if (position <= chunks.length * (chunkSize - overlap)) {
        position = chunks.length * (chunkSize - overlap);
      }
    }

    return chunks;
  }

  /**
   * Intenta encontrar un punto de ruptura natural (espacio, punto, salto de línea)
   */
  private findNaturalBreakpoint(text: string, start: number, end: number): number {
    const segment = text.substring(start, end);
    const lastNewline = segment.lastIndexOf('\n');
    const lastPeriod = segment.lastIndexOf('. ');
    const lastSpace = segment.lastIndexOf(' ');

    // Priorizar salto de línea
    if (lastNewline > segment.length * 0.7) {
      return start + lastNewline + 1;
    }

    // Luego punto
    if (lastPeriod > segment.length * 0.7) {
      return start + lastPeriod + 2;
    }

    // Finalmente espacio
    if (lastSpace > segment.length * 0.7) {
      return start + lastSpace + 1;
    }

    // Si no hay buen punto de ruptura, usar el índice original
    return end;
  }

  /**
   * Divide por párrafos (alternativa más semántica)
   */
  splitByParagraphs(text: string, maxChunkSize: number = 1000): string[] {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();

      if (!trimmedParagraph) {
        continue;
      }

      // Si agregar el párrafo excede el tamaño, guardar el chunk actual
      if (currentChunk.length + trimmedParagraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedParagraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
      }
    }

    // Agregar el último chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Divide por oraciones
   */
  splitBySentences(text: string, maxChunkSize: number = 1000): string[] {
    // Regex para detectar finales de oración
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();

      if (!trimmedSentence) {
        continue;
      }

      if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
