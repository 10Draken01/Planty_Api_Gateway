/**
 * Interfaz del Repositorio de Plants
 * Define el contrato para la persistencia de plantas
 */

import { Plant } from '../entities/Plant';

export interface PlantRepository {
  /**
   * Obtiene todas las plantas
   */
  findAll(): Promise<Plant[]>;

  /**
   * Busca una planta por su ID
   */
  findById(id: number): Promise<Plant | null>;

  /**
   * Busca plantas por tipo (aromatic, medicinal, vegetable)
   */
  findByType(type: string): Promise<Plant[]>;

  /**
   * Busca plantas por nombre de especie
   */
  findBySpecies(species: string): Promise<Plant | null>;

  /**
   * Cuenta el total de plantas
   */
  count(): Promise<number>;
}
