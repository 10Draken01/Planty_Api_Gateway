export class Dimensions {
  constructor(
    public readonly width: number,
    public readonly height: number
  ) {
    if (width <= 0 || height <= 0) {
      throw new Error('Dimensions must be positive');
    }
  }

  get totalArea(): number {
    return this.width * this.height;
  }

  toJSON() {
    return {
      width: this.width,
      height: this.height,
      totalArea: this.totalArea,
    };
  }
}
