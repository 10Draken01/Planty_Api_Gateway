import axios from 'axios';
import { faker } from '@faker-js/faker';
import { OrchardRepository } from '@domain/repositories/OrchardRepository';
import { Orchard } from '@domain/entities/Orchard';
import { PlantInLayout } from '@domain/entities/PlantInLayout';
import { Dimensions } from '@domain/value-objects/Dimensions';
import { Position } from '@domain/value-objects/Position';

interface UserDTO {
  id: string;
  name: string;
  email: string;
  experience_level: 1 | 2 | 3;
  count_orchards: number;
  is_verified: boolean;
  preferred_plant_category?: ('aromatic' | 'medicinal' | 'vegetable' | 'ornamental')[];
  favorite_plants?: number[];
  createdAt: string;
}

interface AGSolutionPlant {
  id: number;
  name: string;
  position: { x: number; y: number };
  area: number;
}

interface AGSolution {
  layout: {
    dimensions: { width: number; height: number };
    plants: AGSolutionPlant[];
  };
}

interface SeedProgress {
  totalUsers: number;
  processedUsers: number;
  orchardsCreated: number;
  currentBatch: number;
  errors: number;
  message: string;
}

interface SeedOrchardsOptions {
  batchSize?: number;
  usersServiceUrl?: string;
  agServiceUrl?: string;
  onProgress?: (progress: SeedProgress) => void;
}

interface SeedOrchardsResult {
  success: boolean;
  totalUsersProcessed: number;
  totalOrchardsCreated: number;
  executionTimeMs: number;
  errors: Array<{ userId: string; error: string }>;
}

export class SeedOrchardsUseCase {
  constructor(private orchardRepository: OrchardRepository) {}

  async execute(options: SeedOrchardsOptions = {}): Promise<SeedOrchardsResult> {
    const startTime = Date.now();
    const {
      batchSize = 100,
      usersServiceUrl = 'http://localhost:3001/api/users',
      agServiceUrl = 'http://localhost:3005/v1',
      onProgress
    } = options;

    let totalUsersProcessed = 0;
    let totalOrchardsCreated = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    try {
      console.log('🌱 Iniciando seed de huertos...');

      // Paso 1: Obtener usuarios en lotes
      let currentBatch = 0;
      let hasMoreUsers = true;

      while (hasMoreUsers) {
        try {
          // Obtener lote de usuarios
          const usersResponse = await axios.get(
            `${usersServiceUrl}?limit=${batchSize}&offset=${currentBatch * batchSize}`,
            { timeout: 10000 }
          );

          const users: UserDTO[] = usersResponse.data.data || usersResponse.data || [];

          if (users.length === 0) {
            hasMoreUsers = false;
            break;
          }

          console.log(`📦 Procesando lote ${currentBatch + 1} con ${users.length} usuarios`);

          // Procesar cada usuario del lote
          for (const user of users) {
            try {
              await this.processUser(user, agServiceUrl);
              totalUsersProcessed++;

              // Reportar progreso
              if (onProgress) {
                onProgress({
                  totalUsers: totalUsersProcessed,
                  processedUsers: totalUsersProcessed,
                  orchardsCreated: totalOrchardsCreated,
                  currentBatch: currentBatch + 1,
                  errors: errors.length,
                  message: `Usuario ${user.email} procesado`
                });
              }
            } catch (error) {
              errors.push({
                userId: user.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              console.error(`❌ Error procesando usuario ${user.email}:`, error);
            }
          }

          currentBatch++;

          // Pequeña pausa entre lotes para no saturar
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`❌ Error obteniendo lote ${currentBatch}:`, error);
          hasMoreUsers = false;
        }
      }

      // Contar huertos creados
      totalOrchardsCreated = await this.orchardRepository.count();

      const executionTimeMs = Date.now() - startTime;

      return {
        success: true,
        totalUsersProcessed,
        totalOrchardsCreated,
        executionTimeMs,
        errors: errors.slice(0, 100)
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      throw new Error(
        `Error durante seed de huertos: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Procesa un usuario individual para determinar si debe tener huertos
   */
  private async processUser(user: UserDTO, agServiceUrl: string): Promise<void> {
    // ====================
    // 1. DECIDIR SI CREAR HUERTOS
    // ====================
    const shouldCreateOrchards = this.shouldUserHaveOrchards(user);

    if (!shouldCreateOrchards) {
      console.log(`  ⏭️  Usuario ${user.email} no tendrá huertos`);
      return;
    }

    // ====================
    // 2. DECIDIR CUÁNTOS HUERTOS CREAR (0-3)
    // ====================
    const numberOfOrchards = this.determineNumberOfOrchards(user);

    if (numberOfOrchards === 0) {
      console.log(`  ⏭️  Usuario ${user.email} no tendrá huertos (probabilidad)`);
      return;
    }

    console.log(`  🏡 Creando ${numberOfOrchards} huerto(s) para ${user.email}`);

    // ====================
    // 3. CREAR HUERTOS
    // ====================
    for (let i = 0; i < numberOfOrchards; i++) {
      try {
        await this.createOrchardForUser(user, i + 1, agServiceUrl);
      } catch (error) {
        console.error(`    ❌ Error creando huerto ${i + 1}:`, error);
        // Continuar con el siguiente huerto
      }
    }
  }

  /**
   * Determina si un usuario debería tener huertos según su perfil
   * IMPORTANTE: Solo usuarios verificados pueden tener huertos (registro exitoso)
   */
  private shouldUserHaveOrchards(user: UserDTO): boolean {
    // ⚠️ CRÍTICO: Solo usuarios verificados pueden crear huertos
    // is_verified: true = registro exitoso con verificación
    if (!user.is_verified) {
      return false;
    }

    // Usuarios verificados: según experiencia
    const probabilityByExperience = {
      1: 0.50, // Principiantes: 50%
      2: 0.75, // Intermedios: 75%
      3: 0.90  // Avanzados: 90%
    };

    return Math.random() < probabilityByExperience[user.experience_level];
  }

  /**
   * Determina cuántos huertos crear para un usuario (0-3)
   */
  private determineNumberOfOrchards(user: UserDTO): number {
    const daysSinceRegistration = this.getDaysSinceRegistration(user.createdAt);

    // Usuarios nuevos (< 30 días): 1 huerto garantizado
    if (daysSinceRegistration < 30) {
      return 1;
    }

    // Según experiencia - Mayor probabilidad de múltiples huertos
    if (user.experience_level === 1) {
      const roll = Math.random();
      if (roll < 0.50) return 1;  // 50%
      if (roll < 0.85) return 2;  // 35%
      return 3;                    // 15%
    } else if (user.experience_level === 2) {
      const roll = Math.random();
      if (roll < 0.25) return 1;  // 25%
      if (roll < 0.65) return 2;  // 40%
      return 3;                    // 35%
    } else {
      // Nivel 3 - Mayoría tiene 3 huertos
      const roll = Math.random();
      if (roll < 0.15) return 1;  // 15%
      if (roll < 0.40) return 2;  // 25%
      return 3;                    // 60%
    }
  }

  /**
   * Crea un huerto para un usuario específico
   */
  private async createOrchardForUser(
    user: UserDTO,
    orchardNumber: number,
    agServiceUrl: string
  ): Promise<void> {
    // ====================
    // 1. GENERAR DIMENSIONES COHERENTES
    // ====================
    const dimensions = this.generateCoherentDimensions(user.experience_level);

    // ====================
    // 2. GENERAR NOMBRE DEL HUERTO
    // ====================
    const orchardName = this.generateOrchardName(user.name, orchardNumber);

    // ====================
    // 3. DECIDIR SI USAR EL AG O CREAR MANUAL
    // ====================
    const shouldUseAG = this.shouldUseAlgorithmGenerator(user.experience_level);

    let plants: PlantInLayout[] = [];

    if (shouldUseAG) {
      // ====================
      // 4A. USAR ALGORITMO GENÉTICO
      // ====================
      console.log(`    🧬 Usando AG para generar huerto "${orchardName}"`);

      try {
        const agSolution = await this.callAlgorithmGenerator(
          user,
          dimensions,
          agServiceUrl
        );

        // Convertir plantas del AG a PlantInLayout
        plants = this.convertAGSolutionToPlants(agSolution);

        // Modificar según experiencia (usuarios menos experimentados modifican más)
        const shouldModify = this.shouldModifyAGSolution(user.experience_level);

        if (shouldModify) {
          console.log(`    🔧 Modificando solución del AG (usuario nivel ${user.experience_level})`);
          plants = this.modifyAGSolution(plants, user.experience_level, dimensions);
        }
      } catch (error) {
        console.error(`    ⚠️  AG falló, creando huerto manual:`, error);
        plants = this.createManualLayout(user, dimensions);
      }
    } else {
      // ====================
      // 4B. CREAR LAYOUT MANUAL (sin AG)
      // ====================
      console.log(`    ✋ Creando huerto manual "${orchardName}"`);
      plants = this.createManualLayout(user, dimensions);
    }

    // ====================
    // 5. DECIDIR SI HUERTO ESTÁ ACTIVO O ABANDONADO
    // ====================
    const isActive = this.determineOrchardState(user);

    // ====================
    // 6. GENERAR FECHAS COHERENTES
    // ====================
    const createDate = this.generateOrchardCreationDate(user.createdAt);

    // ====================
    // 7. CREAR Y GUARDAR HUERTO
    // ====================
    const orchard = Orchard.create({
      userId: user.id,
      name: orchardName,
      description: this.generateOrchardDescription(user, orchardNumber),
      dimensions: new Dimensions(dimensions.width, dimensions.height),
      plants,
      state: isActive
    });

    // Hackear las fechas (bypass de entidad para seed)
    (orchard as any).props.createAt = createDate;
    (orchard as any).props.updateAt = createDate;

    await this.orchardRepository.save(orchard);

    console.log(`    ✅ Huerto "${orchardName}" creado con ${plants.length} plantas`);
  }

  /**
   * Genera dimensiones coherentes según experiencia
   */
  private generateCoherentDimensions(level: 1 | 2 | 3): { width: number; height: number } {
    let minArea: number, maxArea: number;

    if (level === 1) {
      minArea = 2;
      maxArea = 6; // 2-6 m²
    } else if (level === 2) {
      minArea = 4;
      maxArea = 12; // 4-12 m²
    } else {
      minArea = 6;
      maxArea = 20; // 6-20 m²
    }

    const area = faker.number.float({ min: minArea, max: maxArea, fractionDigits: 1 });

    // Generar width y height que cumplan el área
    const aspectRatio = faker.number.float({ min: 0.5, max: 2.0, fractionDigits: 1 });
    const width = Math.sqrt(area * aspectRatio);
    const height = area / width;

    return {
      width: Math.round(width * 10) / 10,
      height: Math.round(height * 10) / 10
    };
  }

  /**
   * Genera nombre del huerto
   */
  private generateOrchardName(userName: string, number: number): string {
    const prefixes = [
      'Mi Huerto',
      'Jardín',
      'Huerto',
      'El Vergel',
      'Mi Jardín',
      'Huerto Familiar',
      'El Huerto de'
    ];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    if (number === 1) {
      return Math.random() < 0.70 ? prefix : `${prefix} Principal`;
    }

    return `${prefix} ${number}`;
  }

  /**
   * Decide si usar el AG según nivel de experiencia
   */
  private shouldUseAlgorithmGenerator(level: 1 | 2 | 3): boolean {
    const probabilityByLevel = {
      1: 0.20, // Principiantes: 20% usan AG
      2: 0.50, // Intermedios: 50%
      3: 0.80  // Avanzados: 80%
    };

    return Math.random() < probabilityByLevel[level];
  }

  /**
   * Llama al algoritmo genético para generar diseño
   */
  private async callAlgorithmGenerator(
    user: UserDTO,
    dimensions: { width: number; height: number },
    agServiceUrl: string
  ): Promise<AGSolution> {
    const objective = this.determineObjective(user.preferred_plant_category);
    const waterLimit = faker.number.int({ min: 10, max: 100 });

    const requestData = {
      userId: user.id,
      desiredPlantIds: user.favorite_plants?.slice(0, 5) || [],
      maxPlantSpecies: user.experience_level === 1 ? 3 : 5,
      dimensions,
      waterLimit,
      userExperience: user.experience_level,
      objective,
      categoryDistribution: this.generateCategoryDistribution(user.preferred_plant_category)
    };

    const response = await axios.post(
      `${agServiceUrl}/generate`,
      requestData,
      { timeout: 35000 }
    );

    if (!response.data.success || !response.data.solutions || response.data.solutions.length === 0) {
      throw new Error('AG no devolvió soluciones válidas');
    }

    // Elegir una de las 3 mejores soluciones aleatoriamente
    const solutions = response.data.solutions;
    const selectedIndex = Math.floor(Math.random() * Math.min(3, solutions.length));

    return solutions[selectedIndex];
  }

  /**
   * Convierte solución del AG a PlantInLayout
   */
  private convertAGSolutionToPlants(solution: AGSolution): PlantInLayout[] {
    return solution.layout.plants.map(plant => {
      const size = Math.sqrt(plant.area);

      return PlantInLayout.create({
        plantId: plant.id,
        position: new Position(plant.position.x, plant.position.y),
        width: Math.round(size * 10) / 10,
        height: Math.round(size * 10) / 10,
        rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)] as 0 | 90 | 180 | 270,
        status: 'planted'
      });
    });
  }

  /**
   * Decide si modificar la solución del AG
   */
  private shouldModifyAGSolution(level: 1 | 2 | 3): boolean {
    const modificationProbability = {
      1: 0.80, // Principiantes: 80% modifican
      2: 0.50, // Intermedios: 50%
      3: 0.20  // Avanzados: 20%
    };

    return Math.random() < modificationProbability[level];
  }

  /**
   * Modifica la solución del AG para simular intervención del usuario
   */
  private modifyAGSolution(
    plants: PlantInLayout[],
    level: 1 | 2 | 3,
    dimensions: { width: number; height: number }
  ): PlantInLayout[] {
    const modified = [...plants];

    // Determinar cantidad de modificaciones según nivel
    let modificationsCount: number;
    if (level === 1) {
      modificationsCount = faker.number.int({ min: 2, max: Math.max(3, Math.floor(plants.length * 0.6)) });
    } else if (level === 2) {
      modificationsCount = faker.number.int({ min: 1, max: Math.max(2, Math.floor(plants.length * 0.3)) });
    } else {
      modificationsCount = faker.number.int({ min: 0, max: Math.max(1, Math.floor(plants.length * 0.15)) });
    }

    for (let i = 0; i < modificationsCount; i++) {
      const action = Math.random();

      if (action < 0.40 && modified.length > 0) {
        // 40%: Mover planta (puede crear superposición)
        const index = Math.floor(Math.random() * modified.length);
        const plant = modified[index];

        const newX = faker.number.float({ min: 0, max: Math.max(0.5, dimensions.width - plant.width), fractionDigits: 1 });
        const newY = faker.number.float({ min: 0, max: Math.max(0.5, dimensions.height - plant.height), fractionDigits: 1 });

        modified[index] = PlantInLayout.create({
          plantId: plant.plantId,
          position: new Position(newX, newY),
          width: plant.width,
          height: plant.height,
          rotation: plant.rotation as 0 | 90 | 180 | 270,
          status: plant.status as any
        });
      } else if (action < 0.70 && modified.length > 1) {
        // 30%: Eliminar planta
        const index = Math.floor(Math.random() * modified.length);
        modified.splice(index, 1);
      } else if (action < 0.90) {
        // 20%: Agregar planta aleatoria (puede no respetar compatibilidad)
        const plantId = faker.number.int({ min: 1, max: 50 });
        const size = faker.number.float({ min: 0.3, max: 1.5, fractionDigits: 1 });

        const x = faker.number.float({ min: 0, max: Math.max(0, dimensions.width - size), fractionDigits: 1 });
        const y = faker.number.float({ min: 0, max: Math.max(0, dimensions.height - size), fractionDigits: 1 });

        modified.push(PlantInLayout.create({
          plantId,
          position: new Position(x, y),
          width: size,
          height: size,
          rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)] as 0 | 90 | 180 | 270,
          status: 'planted'
        }));
      }
    }

    return modified;
  }

  /**
   * Crea un layout manual sin usar el AG
   */
  private createManualLayout(
    user: UserDTO,
    dimensions: { width: number; height: number }
  ): PlantInLayout[] {
    const plants: PlantInLayout[] = [];

    // Cantidad de plantas según experiencia y dimensiones
    const area = dimensions.width * dimensions.height;
    let targetPlants: number;

    if (user.experience_level === 1) {
      targetPlants = faker.number.int({ min: 1, max: Math.max(2, Math.floor(area * 0.3)) });
    } else if (user.experience_level === 2) {
      targetPlants = faker.number.int({ min: 2, max: Math.max(3, Math.floor(area * 0.5)) });
    } else {
      targetPlants = faker.number.int({ min: 3, max: Math.max(4, Math.floor(area * 0.7)) });
    }

    // Usar plantas favoritas si existen
    const availablePlants = user.favorite_plants && user.favorite_plants.length > 0
      ? user.favorite_plants
      : Array.from({ length: 10 }, () => faker.number.int({ min: 1, max: 50 }));

    for (let i = 0; i < targetPlants; i++) {
      const plantId = availablePlants[Math.floor(Math.random() * availablePlants.length)];
      const size = faker.number.float({ min: 0.4, max: 1.8, fractionDigits: 1 });

      // Posición aleatoria (puede haber superposiciones si experiencia baja)
      const x = faker.number.float({ min: 0, max: Math.max(0, dimensions.width - size), fractionDigits: 1 });
      const y = faker.number.float({ min: 0, max: Math.max(0, dimensions.height - size), fractionDigits: 1 });

      plants.push(PlantInLayout.create({
        plantId,
        position: new Position(x, y),
        width: size,
        height: size,
        rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)] as 0 | 90 | 180 | 270,
        status: 'planted'
      }));
    }

    return plants;
  }

  /**
   * Determina objetivo del AG según preferencias
   */
  private determineObjective(
    categories?: ('aromatic' | 'medicinal' | 'vegetable' | 'ornamental')[]
  ): 'alimenticio' | 'medicinal' | 'sostenible' | 'ornamental' {
    if (!categories || categories.length === 0) {
      return 'alimenticio'; // Default
    }

    if (categories.includes('vegetable')) return 'alimenticio';
    if (categories.includes('medicinal')) return 'medicinal';
    if (categories.includes('ornamental')) return 'ornamental';
    return 'sostenible';
  }

  /**
   * Genera distribución de categorías según preferencias
   */
  private generateCategoryDistribution(
    categories?: ('aromatic' | 'medicinal' | 'vegetable' | 'ornamental')[]
  ) {
    if (!categories || categories.length === 0) {
      return {
        vegetable: 70,
        aromatic: 15,
        medicinal: 10,
        ornamental: 5
      };
    }

    const total = 100;
    const perCategory = Math.floor(total / categories.length);

    const distribution: any = {
      vegetable: 0,
      aromatic: 0,
      medicinal: 0,
      ornamental: 0
    };

    categories.forEach(cat => {
      distribution[cat] = perCategory;
    });

    return distribution;
  }

  /**
   * Determina si el huerto está activo o abandonado
   */
  private determineOrchardState(user: UserDTO): boolean {
    const daysSinceRegistration = this.getDaysSinceRegistration(user.createdAt);

    // Usuarios recientes: 95% activos
    if (daysSinceRegistration < 60) {
      return Math.random() < 0.95;
    }

    // Usuarios verificados según experiencia
    const activityByLevel = {
      1: 0.60,
      2: 0.75,
      3: 0.85
    };

    return Math.random() < activityByLevel[user.experience_level];
  }

  /**
   * Genera fecha de creación del huerto coherente con registro del usuario
   */
  private generateOrchardCreationDate(userCreatedAt: string): Date {
    const userDate = new Date(userCreatedAt);
    const now = new Date('2025-11-30');

    const daysSinceRegistration = Math.floor(
      (now.getTime() - userDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceRegistration <= 0) {
      return userDate;
    }

    // Crear huerto entre 0-90% del tiempo desde registro
    const randomDays = faker.number.int({
      min: 0,
      max: Math.floor(daysSinceRegistration * 0.9)
    });

    const orchardDate = new Date(userDate);
    orchardDate.setDate(orchardDate.getDate() + randomDays);

    return orchardDate;
  }

  /**
   * Genera descripción del huerto
   */
  private generateOrchardDescription(user: UserDTO, number: number): string {
    const descriptions = [
      `Huerto familiar de ${user.name.split(' ')[0]}`,
      `Mi espacio verde`,
      `Jardín urbano`,
      `Huerto orgánico`,
      `Mi pequeño paraíso`,
      `Cultivos del hogar`,
      `Espacio de siembra`
    ];

    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  /**
   * Calcula días desde el registro
   */
  private getDaysSinceRegistration(createdAt: string): number {
    const userDate = new Date(createdAt);
    const now = new Date('2025-11-30');

    return Math.floor((now.getTime() - userDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}
