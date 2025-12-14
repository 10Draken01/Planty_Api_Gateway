/**
 * Value Object: Position
 * Representa una posición inmutable en un plano 2D
 */

export class Position {
  constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    if (x < 0 || y < 0) {
      throw new Error('Las coordenadas de posición deben ser no negativas');
    }
  }

  /**
   * Compara si dos posiciones son iguales
   */
  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  /**
   * Calcula la distancia euclidiana a otra posición
   */
  distanceTo(other: Position): number {
    return Math.sqrt(
      Math.pow(this.x - other.x, 2) +
      Math.pow(this.y - other.y, 2)
    );
  }

  /**
   * Serializa a JSON
   */
  toJSON() {
    return {
      x: this.x,
      y: this.y
    };
  }

  /**
   * Crea una instancia desde JSON
   */
  static fromJSON(data: { x: number; y: number }): Position {
    return new Position(data.x, data.y);
  }
}
