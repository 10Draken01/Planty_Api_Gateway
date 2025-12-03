/**
 * Entidad de Dominio: Orchard (Huerto)
 * Representa un huerto con sus propiedades y reglas de negocio
 */

import { v4 as uuidv4 } from 'uuid';

export interface OrchardProps {
  _id: string;
  userId: string;
  name: string;
  description: string;
  plants_id: string[];
  width: number;
  height: number;
  state: boolean;
  createAt: Date;
  updateAt: Date;
  timeOfLife: number;
  streakOfDays: number;
  countPlants: number;
}

export class Orchard {
  private constructor(private props: OrchardProps) {}

  /**
   * Factory method para crear una nueva instancia de Orchard
   */
  static create(data: Omit<OrchardProps, '_id' | 'createAt' | 'updateAt' | 'timeOfLife' | 'streakOfDays' | 'countPlants'>): Orchard {
    // Validaciones de negocio
    if (!data.userId || data.userId.trim().length === 0) {
      throw new Error('El ID del usuario es requerido');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error('El nombre del huerto es requerido');
    }

    if (data.width <= 0 || data.height <= 0) {
      throw new Error('Las dimensiones del huerto deben ser mayores a 0');
    }

    const now = new Date();

    return new Orchard({
      _id: uuidv4(),
      userId: data.userId.trim(),
      name: data.name.trim(),
      description: data.description.trim(),
      plants_id: data.plants_id || [],
      width: data.width,
      height: data.height,
      state: data.state !== undefined ? data.state : true,
      createAt: now,
      updateAt: now,
      timeOfLife: 0,
      streakOfDays: 0,
      countPlants: data.plants_id?.length || 0
    });
  }

  /**
   * Factory method para reconstruir desde persistencia
   */
  static fromPersistence(props: OrchardProps): Orchard {
    return new Orchard(props);
  }

  // Getters
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

  get plants_id(): string[] {
    return [...this.props.plants_id];
  }

  get width(): number {
    return this.props.width;
  }

  get height(): number {
    return this.props.height;
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
    return this.props.countPlants;
  }

  get area(): number {
    return this.props.width * this.props.height;
  }

  // Métodos de negocio

  /**
   * Actualiza la información básica del huerto
   */
  update(data: Partial<Pick<OrchardProps, 'name' | 'description' | 'width' | 'height'>>): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('El nombre del huerto no puede estar vacío');
      }
      this.props.name = data.name.trim();
    }

    if (data.description !== undefined) {
      this.props.description = data.description.trim();
    }

    if (data.width !== undefined) {
      if (data.width <= 0) {
        throw new Error('El ancho debe ser mayor a 0');
      }
      this.props.width = data.width;
    }

    if (data.height !== undefined) {
      if (data.height <= 0) {
        throw new Error('El alto debe ser mayor a 0');
      }
      this.props.height = data.height;
    }

    this.props.updateAt = new Date();
  }

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
   * Agrega una planta al huerto
   */
  addPlant(plantId: string): void {
    if (!plantId || plantId.trim().length === 0) {
      throw new Error('El ID de la planta es requerido');
    }

    if (this.props.plants_id.includes(plantId)) {
      throw new Error('La planta ya existe en el huerto');
    }

    this.props.plants_id.push(plantId);
    this.props.countPlants = this.props.plants_id.length;
    this.props.updateAt = new Date();
  }

  /**
   * Remueve una planta del huerto
   */
  removePlant(plantId: string): void {
    const index = this.props.plants_id.indexOf(plantId);

    if (index === -1) {
      throw new Error('La planta no existe en el huerto');
    }

    this.props.plants_id.splice(index, 1);
    this.props.countPlants = this.props.plants_id.length;
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
    return this.props.countPlants > 0;
  }

  /**
   * Convierte la entidad a un objeto plano para persistencia
   */
  toJSON(): OrchardProps {
    return {
      _id: this.props._id,
      userId: this.props.userId,
      name: this.props.name,
      description: this.props.description,
      plants_id: [...this.props.plants_id],
      width: this.props.width,
      height: this.props.height,
      state: this.props.state,
      createAt: this.props.createAt,
      updateAt: this.props.updateAt,
      timeOfLife: this.props.timeOfLife,
      streakOfDays: this.props.streakOfDays,
      countPlants: this.props.countPlants
    };
  }
}
