export class Position {
  constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    if (x < 0 || y < 0) {
      throw new Error('Position coordinates must be non-negative');
    }
  }

  distanceTo(other: Position): number {
    return Math.sqrt(
      Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
    );
  }

  toJSON() {
    return {
      x: this.x,
      y: this.y,
    };
  }
}
