export interface MetricsData {
  CEE: number;    // Compatibilidad Entre Especies
  PSRNT: number;  // Satisfacción de Rendimiento Nutricional/Terapéutico
  EH: number;     // Eficiencia Hídrica
  UE: number;     // Utilización de Espacio
}

export class Metrics {
  public readonly CEE: number;
  public readonly PSRNT: number;
  public readonly EH: number;
  public readonly UE: number;
  public readonly fitness: number;

  constructor(data: MetricsData, weights: { CEE: number; PSRNT: number; EH: number; UE: number }) {
    // Validar rango [0, 1]
    this.CEE = this.validateMetric(data.CEE, 'CEE');
    this.PSRNT = this.validateMetric(data.PSRNT, 'PSRNT');
    this.EH = this.validateMetric(data.EH, 'EH');
    this.UE = this.validateMetric(data.UE, 'UE');

    // Calcular fitness ponderado
    this.fitness = this.calculateFitness(weights);
  }

  private validateMetric(value: number, name: string): number {
    if (value < 0 || value > 1) {
      throw new Error(`${name} must be between 0 and 1, got ${value}`);
    }
    return value;
  }

  private calculateFitness(weights: { CEE: number; PSRNT: number; EH: number; UE: number }): number {
    return (
      weights.CEE * this.CEE +
      weights.PSRNT * this.PSRNT +
      weights.EH * this.EH +
      weights.UE * this.UE
    );
  }

  toJSON() {
    return {
      CEE: parseFloat(this.CEE.toFixed(4)),
      PSRNT: parseFloat(this.PSRNT.toFixed(4)),
      EH: parseFloat(this.EH.toFixed(4)),
      UE: parseFloat(this.UE.toFixed(4)),
      fitness: parseFloat(this.fitness.toFixed(4)),
    };
  }
}
