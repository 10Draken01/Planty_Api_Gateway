/**
 * Entidad de Dominio: Orchard (Huerto) - Aggregate Root
 * Representa un huerto con su layout de plantas posicionadas
 *
 * CAMBIOS PRINCIPALES:
 * - Eliminado: plants_id: string[]
 * - Agregado: plants: PlantInLayout[] (con posiciones)
 * - Agregado: dimensions: Dimensions (Value Object)
 * - Agregado: Validaciones de colisiones y límites
 */

import { v4 as uuidv4 } from 'uuid';
import { PlantInLayout, PlantInLayoutProps } from './PlantInLayout';
import { Position } from '../value-objects/Position';
import { Dimensions } from '../value-objects/Dimensions';

export interface OrchardProps {
  _id: string;
  userId: string;
  name: string;
  description: string;
  dimensions: Dimensions;
  plants: PlantInLayout[];  // ✅ NUEVO: Array de plantas con posiciones
  state: boolean;
  createAt: Date;
  updateAt: Date;
  timeOfLife: number;
  streakOfDays: number;
}

export class Orchard {
  private constructor(private props: OrchardProps) {}

  /**
   * Factory method para crear una nueva instancia de Orchard
   */
  static create(
    data: Omit<OrchardProps, '_id' | 'createAt' | 'updateAt' | 'timeOfLife' | 'streakOfDays' | 'plants'> & {
      plants?: PlantInLayout[];
    }
  ): Orchard {
    // Validaciones de negocio
    if (!data.userId || data.userId.trim().length === 0) {
      throw new Error('El ID del usuario es requerido');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error('El nombre del huerto es requerido');
    }

    if (!data.dimensions) {
      throw new Error('Las dimensiones del huerto son requeridas');
    }

    const now = new Date();

    return new Orchard({
      _id: uuidv4(),
      userId: data.userId.trim(),
      name: data.name.trim(),
      description: data.description.trim(),
      dimensions: data.dimensions,
      plants: data.plants || [],
      state: data.state !== undefined ? data.state : true,
      createAt: now,
      updateAt: now,
      timeOfLife: 0,
      streakOfDays: 0
    });
  }

  /**
   * Factory method para reconstruir desde persistencia
   */
  static fromPersistence(props: OrchardProps): Orchard {
    return new Orchard(props);
  }

  // ==================== GETTERS ====================

  get id(): string {
    return this.props._id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get dimensions(): Dimensions {
    return this.props.dimensions;
  }

  get plants(): PlantInLayout[] {
    return [...this.props.plants];
  }

  get state(): boolean {
    return this.props.state;
  }

  get createAt(): Date {
    return this.props.createAt;
  }

  get updateAt(): Date {
    return this.props.updateAt;
  }

  get timeOfLife(): number {
    return this.props.timeOfLife;
  }

  get streakOfDays(): number {
    return this.props.streakOfDays;
  }

  get countPlants(): number {
    return this.props.plants.length;
  }

  get area(): number {
    return this.props.dimensions.area;
  }

  get availableArea(): number {
    return this.getAvailableArea();
  }

  // ==================== MÉTODOS DE NEGOCIO - GESTIÓN DE PLANTAS ====================

  /**
   * ✅ NUEVO: Agrega una planta al layout del huerto
   * Valida que no haya colisiones y esté dentro de los límites
   *
   * @throws Error si la planta está fuera de límites o hay colisión
   */
  addPlantToLayout(
    plantData: Omit<PlantInLayoutProps, 'id' | 'status' | 'plantedAt'>
  ): PlantInLayout {
    const newPlant = PlantInLayout.create(plantData);

    // Validar que esté dentro de los límites del huerto
    if (!this.isPlantWithinBounds(newPlant)) {
      const box = newPlant.getBoundingBox();
      throw new Error(
        `La planta está fuera de los límites del huerto. ` +
        `Posición: (${box.x}, ${box.y}), ` +
        `Tamaño: ${box.width}x${box.height}, ` +
        `Límites del huerto: ${this.dimensions.width}x${this.dimensions.height}`
      );
    }

    // Validar que no haya colisiones con otras plantas
    const collision = this.findCollision(newPlant);
    if (collision) {
      const collisionBox = collision.getBoundingBox();
      throw new Error(
        `La planta colisiona con otra planta existente (ID: ${collision.id}) ` +
        `en la posición (${collisionBox.x}, ${collisionBox.y})`
      );
    }

    // Agregar la planta al layout
    this.props.plants.push(newPlant);
    this.props.updateAt = new Date();

    return newPlant;
  }

  /**
   * ✅ NUEVO: Remueve una planta del layout
   */
  removePlantFromLayout(plantInstanceId: string): void {
    const index = this.props.plants.findIndex(p => p.id === plantInstanceId);

    if (index === -1) {
      throw new Error(`La planta con ID ${plantInstanceId} no existe en el huerto`);
    }

    this.props.plants.splice(index, 1);
    this.props.updateAt = new Date();
  }

  /**
   * ✅ NUEVO: Mueve una planta a una nueva posición
   * Valida que la nueva posición sea válida
   */
  movePlant(plantInstanceId: string, newPosition: Position): void {
    const plant = this.props.plants.find(p => p.id === plantInstanceId);

    if (!plant) {
      throw new Error(`La planta con ID ${plantInstanceId} no existe en el huerto`);
    }

    // Guardar la posición original por si necesitamos revertir
    const originalPosition = plant.position;

    // Mover temporalmente para validar
    plant.moveTo(newPosition);

    // Validar límites
    if (!this.isPlantWithinBounds(plant)) {
      // Revertir
      plant.moveTo(originalPosition);
      throw new Error('La nueva posición está fuera de los límites del huerto');
    }

    // Validar colisiones (excluyendo la planta que estamos moviendo)
    const collision = this.findCollision(plant, [plantInstanceId]);
    if (collision) {
      // Revertir
      plant.moveTo(originalPosition);
      throw new Error(
        `La nueva posición colisiona con otra planta (ID: ${collision.id})`
      );
    }

    // La posición ya fue actualizada, solo actualizamos el timestamp
    this.props.updateAt = new Date();
  }

  /**
   * ✅ NUEVO: Marca una planta como plantada
   */
  markPlantAsPlanted(plantInstanceId: string): void {
    const plant = this.props.plants.find(p => p.id === plantInstanceId);

    if (!plant) {
      throw new Error(`La planta con ID ${plantInstanceId} no existe en el huerto`);
    }

    plant.markAsPlanted();
    this.props.updateAt = new Date();
  }

  // ==================== MÉTODOS DE ACTUALIZACIÓN ====================

  /**
   * Actualiza la información básica del huerto
   */
  update(data: Partial<Pick<OrchardProps, 'name' | 'description'>>): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('El nombre del huerto no puede estar vacío');
      }
      this.props.name = data.name.trim();
    }

    if (data.description !== undefined) {
      this.props.description = data.description.trim();
    }

    this.props.updateAt = new Date();
  }

  /**
   * ✅ NUEVO: Actualiza las dimensiones del huerto
   * Solo permite cambiar si no hay plantas (para evitar inconsistencias)
   */
  updateDimensions(newDimensions: Dimensions): void {
    if (this.props.plants.length > 0) {
      throw new Error(
        'No se pueden cambiar las dimensiones del huerto mientras tenga plantas. ' +
        'Remueve todas las plantas primero.'
      );
    }

    this.props.dimensions = newDimensions;
    this.props.updateAt = new Date();
  }

  // ==================== MÉTODOS DE ESTADO ====================

  /**
   * Activa el huerto
   */
  activate(): void {
    this.props.state = true;
    this.props.updateAt = new Date();
  }

  /**
   * Desactiva el huerto
   */
  deactivate(): void {
    this.props.state = false;
    this.props.updateAt = new Date();
  }

  /**
   * Actualiza el tiempo de vida del huerto (en días)
   */
  updateTimeOfLife(): void {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.props.createAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.props.timeOfLife = diffDays;
    this.props.updateAt = new Date();
  }

  /**
   * Incrementa la racha de días
   */
  incrementStreak(): void {
    this.props.streakOfDays += 1;
    this.props.updateAt = new Date();
  }

  /**
   * Resetea la racha de días
   */
  resetStreak(): void {
    this.props.streakOfDays = 0;
    this.props.updateAt = new Date();
  }

  // ==================== MÉTODOS DE CONSULTA ====================

  /**
   * Verifica si el huerto está activo
   */
  isActive(): boolean {
    return this.props.state;
  }

  /**
   * Verifica si el huerto tiene plantas
   */
  hasPlants(): boolean {
    return this.props.plants.length > 0;
  }

  /**
   * ✅ NUEVO: Obtiene el área disponible (no ocupada por plantas)
   */
  getAvailableArea(): number {
    const usedArea = this.props.plants.reduce((sum, plant) => {
      return sum + plant.getArea();
    }, 0);

    return this.area - usedArea;
  }

  /**
   * ✅ NUEVO: Obtiene una planta por su ID de instancia
   */
  getPlantById(plantInstanceId: string): PlantInLayout | undefined {
    return this.props.plants.find(p => p.id === plantInstanceId);
  }

  /**
   * ✅ NUEVO: Obtiene todas las plantas por su plantId (puede haber varias instancias de la misma planta)
   */
  getPlantsByPlantId(plantId: number): PlantInLayout[] {
    return this.props.plants.filter(p => p.plantId === plantId);
  }

  // ==================== MÉTODOS PRIVADOS DE VALIDACIÓN ====================

  /**
   * Verifica si una planta está completamente dentro de los límites del huerto
   */
  private isPlantWithinBounds(plant: PlantInLayout): boolean {
    const box = plant.getBoundingBox();
    return this.dimensions.containsRect(box.x, box.y, box.width, box.height);
  }

  /**
   * Busca si hay colisión con alguna planta existente
   *
   * @param plant - La planta a verificar
   * @param excludeIds - IDs de plantas a excluir de la verificación
   * @returns La planta con la que colisiona, o null si no hay colisión
   */
  private findCollision(
    plant: PlantInLayout,
    excludeIds: string[] = []
  ): PlantInLayout | null {
    return (
      this.props.plants.find(existingPlant => {
        if (excludeIds.includes(existingPlant.id)) {
          return false;
        }
        return plant.overlaps(existingPlant);
      }) || null
    );
  }

  // ==================== SERIALIZACIÓN ====================

  /**
   * Convierte la entidad a un objeto plano para persistencia/API
   */
  toJSON() {
    return {
      _id: this.props._id,
      userId: this.props.userId,
      name: this.props.name,
      description: this.props.description,
      width: this.dimensions.width,
      height: this.dimensions.height,
      area: this.area,
      availableArea: this.getAvailableArea(),
      plants: this.props.plants.map(p => p.toJSON()),
      state: this.props.state,
      createAt: this.props.createAt,
      updateAt: this.props.updateAt,
      timeOfLife: this.props.timeOfLife,
      streakOfDays: this.props.streakOfDays,
      countPlants: this.countPlants
    };
  }
}
