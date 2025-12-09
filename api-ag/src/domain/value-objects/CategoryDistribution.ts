export interface CategoryDistributionData {
  vegetable?: number;
  medicinal?: number;
  ornamental?: number;
  aromatic?: number;
}

export class CategoryDistribution {
  public readonly vegetable: number;
  public readonly medicinal: number;
  public readonly ornamental: number;
  public readonly aromatic: number;

  constructor(data: CategoryDistributionData = {}) {
    // Valores por defecto: 0% para categorías no especificadas
    this.vegetable = data.vegetable ?? 0;
    this.medicinal = data.medicinal ?? 0;
    this.ornamental = data.ornamental ?? 0;
    this.aromatic = data.aromatic ?? 0;

    // Validar que sumen 100
    const total = this.vegetable + this.medicinal + this.ornamental + this.aromatic;
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Category distribution must sum to 100, got ${total}`);
    }
  }

  toJSON() {
    return {
      vegetable: this.vegetable,
      medicinal: this.medicinal,
      ornamental: this.ornamental,
      aromatic: this.aromatic,
    };
  }
}
