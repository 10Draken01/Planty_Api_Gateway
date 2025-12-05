/**
 * Entidad: PlantInLayout
 * Representa una planta colocada en el layout del huerto con su posición específica
 * Esta es una entidad dentro del agregado Orchard
 */

import { v4 as uuidv4 } from 'uuid';
import { Position } from '../value-objects/Position';

export interface PlantInLayoutProps {
  id: string;
  plantId: number;  // ID de la planta en la base de datos de plantas
  position: Position;
  width: number;
  height: number;
  rotation: number;  // Rotación en grados (0, 90, 180, 270)
  plantedAt?: Date;
  status: 'planned' | 'planted' | 'growing' | 'harvested';
}

export class PlantInLayout {
  private constructor(private props: PlantInLayoutProps) {}

  /**
   * Factory method para crear una nueva instancia
   */
  static create(
    data: Omit<PlantInLayoutProps, 'id' | 'status' | 'plantedAt'> & {
      width?: number;
      height?: number;
      rotation?: number;
      status?: 'planned' | 'planted' | 'growing' | 'harvested';
    }
  ): PlantInLayout {
    // Validaciones
    if (!data.plantId || data.plantId <= 0) {
      throw new Error('El ID de la planta es requerido y debe ser mayor a 0');
    }

    if (!data.position) {
      throw new Error('La posición es requerida');
    }

    const width = data.width ?? 1;
    const height = data.height ?? 1;
    const rotation = data.rotation ?? 0;

    if (width <= 0 || height <= 0) {
      throw new Error('El ancho y alto deben ser mayores a 0');
    }

    if (![0, 90, 180, 270].includes(rotation)) {
      throw new Error('La rotación debe ser 0, 90, 180 o 270 grados');
    }

    return new PlantInLayout({
      id: uuidv4(),
      plantId: data.plantId,
      position: data.position,
      width,
      height,
      rotation,
      status: data.status || 'planned',
      plantedAt: undefined
    });
  }

  /**
   * Factory method para reconstruir desde persistencia
   */
  static fromPersistence(props: PlantInLayoutProps): PlantInLayout {
    return new PlantInLayout(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get plantId(): number {
    return this.props.plantId;
  }

  get position(): Position {
    return this.props.position;
  }

  get width(): number {
    return this.props.width;
  }

  get height(): number {
    return this.props.height;
  }

  get rotation(): number {
    return this.props.rotation;
  }

  get status(): string {
    return this.props.status;
  }

  get plantedAt(): Date | undefined {
    return this.props.plantedAt;
  }

  // Métodos de negocio

  /**
   * Obtiene el rectángulo delimitador (bounding box) de la planta
   */
  getBoundingBox(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.props.position.x,
      y: this.props.position.y,
      width: this.props.width,
      height: this.props.height
    };
  }

  /**
   * Verifica si esta planta se solapa con otra
   */
  overlaps(other: PlantInLayout): boolean {
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
   * Mueve la planta a una nueva posición
   * Este método solo puede ser llamado desde el agregado Orchard
   */
  moveTo(newPosition: Position): void {
    this.props.position = newPosition;
  }

  /**
   * Marca la planta como plantada
   */
  markAsPlanted(): void {
    if (this.props.status === 'planted' || this.props.status === 'growing') {
      throw new Error('La planta ya está plantada');
    }

    this.props.status = 'planted';
    this.props.plantedAt = new Date();
  }

  /**
   * Marca la planta como en crecimiento
   */
  markAsGrowing(): void {
    if (this.props.status !== 'planted') {
      throw new Error('La planta debe estar plantada primero');
    }

    this.props.status = 'growing';
  }

  /**
   * Marca la planta como cosechada
   */
  markAsHarvested(): void {
    if (this.props.status !== 'growing') {
      throw new Error('La planta debe estar en crecimiento para ser cosechada');
    }

    this.props.status = 'harvested';
  }

  /**
   * Rota la planta 90 grados en sentido horario
   */
  rotate(): void {
    this.props.rotation = (this.props.rotation + 90) % 360;
    // Intercambiar width y height al rotar 90 o 270 grados
    if (this.props.rotation === 90 || this.props.rotation === 270) {
      const temp = this.props.width;
      this.props.width = this.props.height;
      this.props.height = temp;
    }
  }

  /**
   * Obtiene el área ocupada por la planta
   */
  getArea(): number {
    return this.props.width * this.props.height;
  }

  /**
   * Serializa a JSON para persistencia
   */
  toJSON(): any {
    return {
      id: this.props.id,
      plantId: this.props.plantId,
      position: this.props.position.toJSON(),
      width: this.props.width,
      height: this.props.height,
      rotation: this.props.rotation,
      status: this.props.status,
      plantedAt: this.props.plantedAt
    };
  }
}
