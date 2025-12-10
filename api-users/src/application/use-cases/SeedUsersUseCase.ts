import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/entities/User';
import { faker } from '@faker-js/faker';

// Configurar faker en español
faker.locale = 'es';

interface SeedProgress {
  total: number;
  created: number;
  errors: number;
  currentBatch: number;
  message: string;
}

interface SeedUsersOptions {
  totalUsers?: number;
  batchSize?: number;
  clearExisting?: boolean;
  onProgress?: (progress: SeedProgress) => void;
}

interface SeedUsersResult {
  success: boolean;
  totalCreated: number;
  totalErrors: number;
  executionTimeMs: number;
  errors: Array<{ email: string; error: string }>;
}

export class SeedUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(options: SeedUsersOptions = {}): Promise<SeedUsersResult> {
    const startTime = Date.now();
    const {
      totalUsers = 100000,
      batchSize = 1000,
      clearExisting = false,
      onProgress
    } = options;

    let totalCreated = 0;
    let totalErrors = 0;
    const errors: Array<{ email: string; error: string }> = [];

    try {
      // Opción para limpiar usuarios existentes
      if (clearExisting) {
        // Esta opción requeriría implementar un método deleteAll en el repositorio
        // Por ahora, solo registramos un warning
        console.warn('⚠️ clearExisting está activado pero no implementado');
      }

      // Procesar en lotes
      const totalBatches = Math.ceil(totalUsers / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const usersInBatch = Math.min(batchSize, totalUsers - (batch * batchSize));
        const batchUsers: User[] = [];

        // Generar usuarios del lote actual
        for (let i = 0; i < usersInBatch; i++) {
          try {
            const user = this.generateRealisticUser(batch * batchSize + i);
            batchUsers.push(user);
          } catch (error) {
            totalErrors++;
            errors.push({
              email: 'unknown',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Guardar lote en base de datos
        for (const user of batchUsers) {
          try {
            // Verificar que el email no exista (idempotencia)
            const exists = await this.userRepository.existsByEmail(user.email);
            if (!exists) {
              await this.userRepository.save(user);
              totalCreated++;
            } else {
              // Usuario ya existe, incrementar contador pero no es error
              totalCreated++;
            }
          } catch (error) {
            totalErrors++;
            errors.push({
              email: user.email,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Reportar progreso
        if (onProgress) {
          onProgress({
            total: totalUsers,
            created: totalCreated,
            errors: totalErrors,
            currentBatch: batch + 1,
            message: `Lote ${batch + 1}/${totalBatches} completado (${totalCreated}/${totalUsers})`
          });
        }
      }

      const executionTimeMs = Date.now() - startTime;

      return {
        success: true,
        totalCreated,
        totalErrors,
        executionTimeMs,
        errors: errors.slice(0, 100) // Limitar a 100 primeros errores
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      throw new Error(
        `Error durante seed de usuarios: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Genera un usuario realista con datos coherentes
   * Considera: experiencia, preferencias, anomalías, distribución temporal
   */
  private generateRealisticUser(index: number): User {
    // ====================
    // 1. FECHA DE REGISTRO (enero - noviembre 2025)
    // ====================
    const registrationDate = this.generateRegistrationDateWithPeaks();

    // ====================
    // 2. NIVEL DE EXPERIENCIA
    // ====================
    // Distribución realista:
    // - 50% Principiantes (nivel 1)
    // - 35% Intermedios (nivel 2)
    // - 15% Avanzados (nivel 3)
    const experienceRoll = Math.random();
    let experience_level: 1 | 2 | 3;

    if (experienceRoll < 0.50) {
      experience_level = 1;
    } else if (experienceRoll < 0.85) {
      experience_level = 2;
    } else {
      experience_level = 3;
    }

    // ====================
    // 3. PREFERENCIAS DE PLANTAS
    // ====================
    // Distribución según experiencia:
    // - Nivel 1: 1-2 categorías (mayoría vegetable)
    // - Nivel 2: 2-3 categorías (diverso)
    // - Nivel 3: 2-4 categorías (muy diverso)
    const preferred_plant_category = this.generatePlantPreferences(experience_level);

    // ====================
    // 4. PLANTAS FAVORITAS
    // ====================
    // IDs de plantas (1-50 según el seeder de plantas)
    // Nivel 1: 0-5 favoritas
    // Nivel 2: 3-10 favoritas
    // Nivel 3: 5-15 favoritas
    const favorite_plants = this.generateFavoritePlants(experience_level);

    // ====================
    // 5. VERIFICACIÓN DE CUENTA
    // ====================
    // Distribución:
    // - 80% verificados
    // - 20% no verificados (cuentas nuevas/inactivas)
    const is_verified = Math.random() < 0.80;

    // ====================
    // 6. HISTORIAL DE USO
    // ====================
    // Simular actividad desde el registro hasta ahora
    const historyTimeUse_ids = this.generateUserActivityHistory(
      registrationDate,
      experience_level,
      is_verified
    );

    // ====================
    // 7. ANOMALÍAS (5% de usuarios)
    // ====================
    const isAnomalous = Math.random() < 0.05;
    if (isAnomalous) {
      return this.generateAnomalousUser(index, registrationDate);
    }

    // ====================
    // 8. GENERACIÓN DE DATOS PERSONALES
    // ====================
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = this.generateUniqueEmail(index, firstName, lastName);
    const password = this.generateSecurePassword();

    // Imagen de perfil (30% tienen imagen personalizada)
    const profile_image = Math.random() < 0.30
      ? `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
      : 'https://imgs.search.brave.com/4UEc9qL-ya5yCbrX6t3vwBJRKoFVHndy9k0d9DuWMJY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9oaXBz/LmhlYXJzdGFwcHMu/Y29tL2htZy1wcm9k/L2ltYWdlcy9zd2Vl/dC1wb3RhdG8tcGxh/bnQtcm95YWx0eS1m/cmVlLWltYWdlLTE3/NDI0MjMxMDIucGpw/ZWc_Y3JvcD0wLjY2/OHh3OjEuMDB4aDsw/LjAyMDR4dyww';

    // Token FCM (40% tienen notificaciones activadas)
    const tokenFCM = Math.random() < 0.40
      ? faker.string.alphanumeric(152) // Token simulado
      : undefined;

    return new User({
      id: `user_${index}_${Date.now()}_${faker.string.alphanumeric(6)}`,
      name: `${firstName} ${lastName}`,
      email,
      password,
      is_verified,
      count_orchards: 0, // Se actualizará cuando se creen huertos
      experience_level,
      profile_image,
      tokenFCM,
      createdAt: registrationDate,
      historyTimeUse_ids,
      preferred_plant_category,
      favorite_plants
    });
  }

  /**
   * Genera fecha de registro con picos realistas
   * Picos: enero (año nuevo), marzo-abril (primavera), septiembre (vuelta al cole)
   */
  private generateRegistrationDateWithPeaks(): Date {
    const year = 2025;

    // Distribución por mes con picos
    const monthWeights = [
      { month: 0, weight: 15 },  // Enero - PICO (año nuevo)
      { month: 1, weight: 8 },   // Febrero
      { month: 2, weight: 12 },  // Marzo - PICO (primavera)
      { month: 3, weight: 10 },  // Abril
      { month: 4, weight: 7 },   // Mayo
      { month: 5, weight: 6 },   // Junio
      { month: 6, weight: 5 },   // Julio
      { month: 7, weight: 6 },   // Agosto
      { month: 8, weight: 11 },  // Septiembre - PICO
      { month: 9, weight: 9 },   // Octubre
      { month: 10, weight: 11 }  // Noviembre
    ];

    const totalWeight = monthWeights.reduce((sum, m) => sum + m.weight, 0);
    const random = Math.random() * totalWeight;

    let accumulated = 0;
    let selectedMonth = 0;

    for (const { month, weight } of monthWeights) {
      accumulated += weight;
      if (random <= accumulated) {
        selectedMonth = month;
        break;
      }
    }

    // Día aleatorio del mes
    const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
    const day = faker.number.int({ min: 1, max: daysInMonth });

    // Hora aleatoria (pico entre 18:00 - 23:00)
    const hourRoll = Math.random();
    let hour: number;
    if (hourRoll < 0.4) {
      hour = faker.number.int({ min: 18, max: 23 }); // 40% en horario nocturno
    } else {
      hour = faker.number.int({ min: 0, max: 23 });
    }

    const minute = faker.number.int({ min: 0, max: 59 });
    const second = faker.number.int({ min: 0, max: 59 });

    return new Date(year, selectedMonth, day, hour, minute, second);
  }

  /**
   * Genera preferencias de plantas según nivel de experiencia
   */
  private generatePlantPreferences(
    level: 1 | 2 | 3
  ): ('aromatic' | 'medicinal' | 'vegetable' | 'ornamental')[] | undefined {
    const categories: ('aromatic' | 'medicinal' | 'vegetable' | 'ornamental')[] = [];

    // 10% no tienen preferencias definidas
    if (Math.random() < 0.10) {
      return undefined;
    }

    // Distribución base:
    // vegetable: 60% probabilidad
    // aromatic: 40% probabilidad
    // medicinal: 30% probabilidad
    // ornamental: 35% probabilidad

    if (level === 1) {
      // Principiantes: 1-2 categorías, sesgo hacia vegetable
      if (Math.random() < 0.75) categories.push('vegetable');
      if (Math.random() < 0.25) categories.push('aromatic');
      if (Math.random() < 0.15) categories.push('ornamental');
      if (Math.random() < 0.10) categories.push('medicinal');
    } else if (level === 2) {
      // Intermedios: 2-3 categorías, más balanceado
      if (Math.random() < 0.65) categories.push('vegetable');
      if (Math.random() < 0.45) categories.push('aromatic');
      if (Math.random() < 0.35) categories.push('medicinal');
      if (Math.random() < 0.40) categories.push('ornamental');
    } else {
      // Avanzados: 2-4 categorías, diverso
      if (Math.random() < 0.55) categories.push('vegetable');
      if (Math.random() < 0.55) categories.push('aromatic');
      if (Math.random() < 0.50) categories.push('medicinal');
      if (Math.random() < 0.50) categories.push('ornamental');
    }

    // Asegurar al menos 1 categoría
    if (categories.length === 0) {
      categories.push('vegetable');
    }

    return categories;
  }

  /**
   * Genera lista de plantas favoritas según experiencia
   */
  private generateFavoritePlants(level: 1 | 2 | 3): number[] {
    let min: number, max: number;

    if (level === 1) {
      min = 0;
      max = 5;
    } else if (level === 2) {
      min = 3;
      max = 10;
    } else {
      min = 5;
      max = 15;
    }

    const count = faker.number.int({ min, max });
    const favorites = new Set<number>();

    // IDs de plantas válidos: 1-50 (según seeder de plantas)
    while (favorites.size < count) {
      favorites.add(faker.number.int({ min: 1, max: 50 }));
    }

    return Array.from(favorites);
  }

  /**
   * Genera historial de actividad del usuario
   * Simula logins/actividad desde el registro
   */
  private generateUserActivityHistory(
    registrationDate: Date,
    level: 1 | 2 | 3,
    isVerified: boolean
  ): Date[] {
    const now = new Date('2025-11-30'); // Fin de noviembre 2025
    const daysSinceRegistration = Math.floor(
      (now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceRegistration <= 0) {
      return [registrationDate];
    }

    // Frecuencia de actividad según experiencia
    let activityFrequency: number;
    if (level === 1) {
      activityFrequency = isVerified ? 0.15 : 0.05; // 15% o 5% de días
    } else if (level === 2) {
      activityFrequency = isVerified ? 0.35 : 0.15; // 35% o 15%
    } else {
      activityFrequency = isVerified ? 0.60 : 0.30; // 60% o 30%
    }

    const history: Date[] = [registrationDate];

    for (let day = 1; day < daysSinceRegistration; day++) {
      if (Math.random() < activityFrequency) {
        const activityDate = new Date(registrationDate);
        activityDate.setDate(activityDate.getDate() + day);

        // Hora aleatoria de actividad
        activityDate.setHours(faker.number.int({ min: 6, max: 23 }));
        activityDate.setMinutes(faker.number.int({ min: 0, max: 59 }));

        history.push(activityDate);
      }
    }

    return history;
  }

  /**
   * Genera usuario anómalo para clustering
   * Tipos de anomalías:
   * 1. Nivel alto pero sin actividad (comportamiento de novato)
   * 2. Cuenta antigua sin verificar
   * 3. Preferencias contradictorias
   * 4. Actividad errática
   */
  private generateAnomalousUser(index: number, registrationDate: Date): User {
    const anomalyType = Math.floor(Math.random() * 4);

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = this.generateUniqueEmail(index, firstName, lastName);
    const password = this.generateSecurePassword();

    switch (anomalyType) {
      case 0:
        // ANOMALÍA 1: Nivel 3 pero comportamiento de novato
        return new User({
          id: `anomaly_${index}_${Date.now()}_${faker.string.alphanumeric(6)}`,
          name: `${firstName} ${lastName}`,
          email,
          password,
          is_verified: true,
          count_orchards: 0,
          experience_level: 3, // Alto nivel
          profile_image: 'https://imgs.search.brave.com/4UEc9qL-ya5yCbrX6t3vwBJRKoFVHndy9k0d9DuWMJY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9oaXBz/LmhlYXJzdGFwcHMu/Y29tL2htZy1wcm9k/L2ltYWdlcy9zd2Vl/dC1wb3RhdG8tcGxh/bnQtcm95YWx0eS1m/cmVlLWltYWdlLTE3/NDI0MjMxMDIucGpw/ZWc_Y3JvcD0wLjY2/OHh3OjEuMDB4aDsw/LjAyMDR4dyww',
          tokenFCM: undefined,
          createdAt: registrationDate,
          historyTimeUse_ids: [registrationDate], // Poca actividad
          preferred_plant_category: ['vegetable'], // Solo 1 preferencia
          favorite_plants: [] // Sin favoritos
        });

      case 1:
        // ANOMALÍA 2: Cuenta muy antigua sin verificar
        const oldDate = new Date('2025-01-05');
        return new User({
          id: `anomaly_${index}_${Date.now()}_${faker.string.alphanumeric(6)}`,
          name: `${firstName} ${lastName}`,
          email,
          password,
          is_verified: false, // NO verificado
          count_orchards: 0,
          experience_level: 1,
          profile_image: 'https://imgs.search.brave.com/4UEc9qL-ya5yCbrX6t3vwBJRKoFVHndy9k0d9DuWMJY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9oaXBz/LmhlYXJzdGFwcHMu/Y29tL2htZy1wcm9k/L2ltYWdlcy9zd2Vl/dC1wb3RhdG8tcGxh/bnQtcm95YWx0eS1m/cmVlLWltYWdlLTE3/NDI0MjMxMDIucGpw/ZWc_Y3JvcD0wLjY2/OHh3OjEuMDB4aDsw/LjAyMDR4dyww',
          tokenFCM: undefined,
          createdAt: oldDate,
          historyTimeUse_ids: [oldDate], // Sin actividad desde registro
          preferred_plant_category: undefined,
          favorite_plants: []
        });

      case 2:
        // ANOMALÍA 3: Preferencias contradictorias (todas las categorías pero nivel 1)
        return new User({
          id: `anomaly_${index}_${Date.now()}_${faker.string.alphanumeric(6)}`,
          name: `${firstName} ${lastName}`,
          email,
          password,
          is_verified: true,
          count_orchards: 0,
          experience_level: 1, // Principiante
          profile_image: 'https://imgs.search.brave.com/4UEc9qL-ya5yCbrX6t3vwBJRKoFVHndy9k0d9DuWMJY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9oaXBz/LmhlYXJzdGFwcHMu/Y29tL2htZy1wcm9k/L2ltYWdlcy9zd2Vl/dC1wb3RhdG8tcGxh/bnQtcm95YWx0eS1m/cmVlLWltYWdlLTE3/NDI0MjMxMDIucGpw/ZWc_Y3JvcD0wLjY2/OHh3OjEuMDB4aDsw/LjAyMDR4dyww',
          tokenFCM: faker.string.alphanumeric(152),
          createdAt: registrationDate,
          historyTimeUse_ids: this.generateUserActivityHistory(registrationDate, 3, true),
          preferred_plant_category: ['aromatic', 'medicinal', 'vegetable', 'ornamental'], // TODAS
          favorite_plants: Array.from({ length: 20 }, () => faker.number.int({ min: 1, max: 50 })) // Muchas favoritas
        });

      default:
        // ANOMALÍA 4: Actividad errática (mucha actividad repentina)
        const burstHistory: Date[] = [registrationDate];
        const now = new Date('2025-11-30');

        // Generar burst de actividad en últimos 7 días
        for (let i = 0; i < 50; i++) {
          const burstDate = new Date(now);
          burstDate.setDate(burstDate.getDate() - faker.number.int({ min: 0, max: 7 }));
          burstDate.setHours(faker.number.int({ min: 0, max: 23 }));
          burstHistory.push(burstDate);
        }

        return new User({
          id: `anomaly_${index}_${Date.now()}_${faker.string.alphanumeric(6)}`,
          name: `${firstName} ${lastName}`,
          email,
          password,
          is_verified: true,
          count_orchards: 0,
          experience_level: 2,
          profile_image: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
          tokenFCM: faker.string.alphanumeric(152),
          createdAt: registrationDate,
          historyTimeUse_ids: burstHistory,
          preferred_plant_category: this.generatePlantPreferences(2),
          favorite_plants: this.generateFavoritePlants(2)
        });
    }
  }

  /**
   * Genera email único y coherente
   */
  private generateUniqueEmail(index: number, firstName: string, lastName: string): string {
    const providers = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'];
    const provider = providers[Math.floor(Math.random() * providers.length)];

    const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Patrones variados
    const patterns = [
      `${cleanFirst}.${cleanLast}${index}`,
      `${cleanFirst}${cleanLast}${index}`,
      `${cleanFirst}_${cleanLast}${index}`,
      `${cleanFirst}${index}`,
      `${cleanLast}${cleanFirst}${index}`
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return `${pattern}@${provider}`;
  }

  /**
   * Genera contraseña segura
   */
  private generateSecurePassword(): string {
    // Generar hash simulado (en producción debería hashearse con bcrypt)
    // Por simplicidad, usamos una contraseña simple que cumple validación (min 6 chars)
    return `Pass${faker.string.alphanumeric(8)}!${faker.number.int({ min: 10, max: 99 })}`;
  }
}
