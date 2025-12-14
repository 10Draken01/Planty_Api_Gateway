/**
 * Value Object: Dimensions
 * Representa las dimensiones inmutables de un espacio rectangular
 */

import { Position } from './Position';

export class Dimensions {
  constructor(
    public readonly width: number,
    public readonly height: number
  ) {
    if (width <= 0 || height <= 0) {
      throw new Error('Las dimensiones deben ser mayores a 0');
    }
  }

  /**
   * Calcula el área total
   */
  get area(): number {
    return this.width * this.height;
  }

  /**
   * Verifica si una posición está dentro de los límites
   */
  contains(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.x <= this.width &&
      position.y >= 0 &&
      position.y <= this.height
    );
  }

  /**
   * Verifica si un rectángulo está completamente dentro de los límites
   */
  containsRect(x: number, y: number, rectWidth: number, rectHeight: number): boolean {
    return (
      x >= 0 &&
      y >= 0 &&
      x + rectWidth <= this.width &&
      y + rectHeight <= this.height
    );
  }

  /**
   * Compara si dos dimensiones son iguales
   */
  equals(other: Dimensions): boolean {
    return this.width === other.width && this.height === other.height;
  }

  /**
   * Serializa a JSON
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      area: this.area
    };
  }

  /**
   * Crea una instancia desde JSON
   */
  static fromJSON(data: { width: number; height: number }): Dimensions {
    return new Dimensions(data.width, data.height);
  }
}
