import { Plant } from './Plant';
import { Position } from '../value-objects/Position';

/**
 * PlantInstance - Representa UNA planta individual en UNA posición específica
 *
 * IMPORTANTE: Esta clase ya NO usa 'quantity'. Cada instancia = 1 planta.
 * Si necesitas 3 tomates, creas 3 PlantInstance separados con posiciones diferentes.
 *
 * Esto garantiza compatibilidad 100% con api-orchard que maneja plantas individuales.
 */
export interface PlantInstanceProps {
  plant: Plant;
  position: Position;
  width?: number;   // Ancho que ocupa (en metros), default: calculado de plant.size
  height?: number;  // Alto que ocupa (en metros), default: calculado de plant.size
  rotation?: number; // Rotación en grados (0, 90, 180, 270), default: 0
  plantedAt?: Date;
  status?: 'pending' | 'planted' | 'growing' | 'harvest_ready' | 'harvested';
}

export class PlantInstance {
  public readonly plant: Plant;
  public readonly position: Position;
  public readonly width: number;
  public readonly height: number;
  public readonly rotation: number;
  public readonly plantedAt?: Date;
  public readonly status: 'pending' | 'planted' | 'growing' | 'harvest_ready' | 'harvested';

  constructor(props: PlantInstanceProps) {
    this.plant = props.plant;
    this.position = props.position;

    // Calcular dimensiones basadas en el tamaño real de la planta
    // Si plant.size = 2.0 m², entonces width = height = sqrt(2.0) ≈ 1.41m
    const calculatedDimension = Math.sqrt(props.plant.size);
    this.width = props.width ?? calculatedDimension;
    this.height = props.height ?? calculatedDimension;

    // Validar rotación
    this.rotation = props.rotation ?? 0;
    if (![0, 90, 180, 270].includes(this.rotation)) {
      throw new Error('Rotation must be 0, 90, 180, or 270 degrees');
    }

    this.plantedAt = props.plantedAt;
    this.status = props.status || 'pending';
  }

  /**
   * Área total que ocupa esta planta individual
   */
  get totalArea(): number {
    return this.width * this.height;
  }

  /**
   * Agua semanal que necesita esta planta individual
   */
  get totalWeeklyWater(): number {
    return this.plant.weeklyWatering;
  }

  /**
   * Costo estimado de esta planta individual
   */
  get totalCost(): number {
    return this.plant.estimatedCost();
  }

  /**
   * Obtiene el bounding box de esta planta
   */
  getBoundingBox(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Verifica si esta planta se solapa con otra
   */
  overlaps(other: PlantInstance): boolean {
    const box1 = this.getBoundingBox();
    const box2 = other.getBoundingBox();

    return !(
      box1.x + box1.width <= box2.x ||
      box2.x + box2.width <= box1.x ||
      box1.y + box1.height <= box2.y ||
      box2.y + box2.height <= box1.y
    );
  }

  /**
   * Calcula la distancia entre esta planta y otra
   */
  distanceTo(other: PlantInstance): number {
    return this.position.distanceTo(other.position);
  }

  /**
   * Serializa a formato compatible con api-orchard
   */
  toJSON() {
    return {
      plantId: this.plant.id,  // ✅ Compatible con api-orchard
      position: this.position.toJSON(),
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      status: this.status,
      plantedAt: this.plantedAt
    };
  }
}
