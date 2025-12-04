/**
 * Cromosoma mejorado para representación genética de huertos.
 *
 * REPRESENTACIÓN:
 * - Cada gen representa una celda del huerto (grid 2D)
 * - Gen = { plantId: number, quantity: number } | null
 * - null = celda vacía
 * - plantId = ID de la especie plantada
 * - quantity = número de plantas en esa celda
 */

export interface Gene {
  plantId: number;
  quantity: number;
}

export class Chromosome {
  public readonly genes: (Gene | null)[][];
  public readonly gridWidth: number;
  public readonly gridHeight: number;

  constructor(gridWidth: number, gridHeight: number, genes?: (Gene | null)[][]) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;

    if (genes) {
      this.genes = genes;
    } else {
      // Inicializar genoma vacío
      this.genes = Array.from({ length: gridHeight }, () =>
        Array.from({ length: gridWidth }, () => null)
      );
    }
  }

  /**
   * Obtiene un gen en posición específica
   */
  getGene(row: number, col: number): Gene | null {
    if (row < 0 || row >= this.gridHeight || col < 0 || col >= this.gridWidth) {
      return null;
    }
    return this.genes[row][col];
  }

  /**
   * Establece un gen en posición específica
   */
  setGene(row: number, col: number, gene: Gene | null): void {
    if (row >= 0 && row < this.gridHeight && col >= 0 && col < this.gridWidth) {
      this.genes[row][col] = gene;
    }
  }

  /**
   * Obtiene todas las especies únicas en el cromosoma
   */
  getUniqueSpecies(): Set<number> {
    const species = new Set<number>();
    for (let i = 0; i < this.gridHeight; i++) {
      for (let j = 0; j < this.gridWidth; j++) {
        const gene = this.genes[i][j];
        if (gene !== null) {
          species.add(gene.plantId);
        }
      }
    }
    return species;
  }

  /**
   * Cuenta celdas ocupadas
   */
  getOccupiedCells(): number {
    let count = 0;
    for (let i = 0; i < this.gridHeight; i++) {
      for (let j = 0; j < this.gridWidth; j++) {
        if (this.genes[i][j] !== null) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Clona el cromosoma
   */
  clone(): Chromosome {
    const genesClone = this.genes.map(row => row.map(gene => (gene ? { ...gene } : null)));
    return new Chromosome(this.gridWidth, this.gridHeight, genesClone);
  }

  /**
   * Obtiene vecinos de una celda (arriba, abajo, izq, der)
   */
  getNeighbors(row: number, col: number): Gene[] {
    const neighbors: Gene[] = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      const gene = this.getGene(nr, nc);
      if (gene !== null) {
        neighbors.push(gene);
      }
    }

    return neighbors;
  }

  toJSON() {
    return {
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      genes: this.genes,
    };
  }
}
