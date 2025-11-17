/**
 * Interfaz del Repositorio de Orchards
 * Define el contrato para la persistencia de huertos
 */

import { Orchard } from '../entities/Orchard';

export interface OrchardRepository {
  /**
   * Guarda un nuevo huerto en el sistema
   */
  save(orchard: Orchard): Promise<Orchard>;

  /**
   * Busca un huerto por su ID
   */
  findById(id: string): Promise<Orchard | null>;

  /**
   * Busca un huerto por su nombre
   */
  findByName(name: string): Promise<Orchard | null>;

  /**
   * Obtiene todos los huertos
   */
  findAll(): Promise<Orchard[]>;

  /**
   * Obtiene todos los huertos activos
   */
  findActive(): Promise<Orchard[]>;

  /**
   * Obtiene todos los huertos inactivos
   */
  findInactive(): Promise<Orchard[]>;

  /**
   * Actualiza un huerto existente
   */
  update(orchard: Orchard): Promise<Orchard>;

  /**
   * Elimina un huerto por su ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Verifica si existe un huerto con el nombre dado
   */
  exists(name: string): Promise<boolean>;

  /**
   * Cuenta el total de huertos
   */
  count(): Promise<number>;

  /**
   * Cuenta los huertos activos
   */
  countActive(): Promise<number>;
}
