import { Individual } from '../entities/Individual';
import { OrchardCalendar } from '../entities/Orchard';

export interface Location {
  latitude: number;
  longitude: number;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Hemisphere = 'north' | 'south';

/**
 * Servicio para generar calendarios de siembra y mantenimiento.
 */
export class CalendarGeneratorService {
  /**
   * Genera un calendario completo de siembra y mantenimiento.
   */
  generateCalendar(individual: Individual, location: Location): OrchardCalendar {
    const hemisphere = this.determineHemisphere(location.latitude);
    const season = this.detectCurrentSeason(location.latitude);

    // Agrupar plantas por especie para generar un schedule más ordenado
    const plantsBySpecies = new Map<string, typeof individual.plants>();
    individual.plants.forEach(plantInstance => {
      const species = plantInstance.plant.species;
      if (!plantsBySpecies.has(species)) {
        plantsBySpecies.set(species, []);
      }
      plantsBySpecies.get(species)!.push(plantInstance);
    });

    const plantingSchedule: any[] = [];
    let weekOffset = 0;

    // Generar schedule por especie
    plantsBySpecies.forEach((instances) => {
      const plant = instances[0].plant;

      // Una entrada por especie con el conteo de plantas
      plantingSchedule.push({
        plantId: plant.id,
        plant: plant.species,
        count: instances.length, // Cantidad de plantas de esta especie
        plantingWeek: 1 + weekOffset,
        harvestWeek: 1 + weekOffset + Math.ceil(plant.harvestDays / 7),
        daysToHarvest: plant.harvestDays,
        notes: this.generatePlantingNotes(plant.species, season),
        positions: instances.map(inst => ({
          x: inst.position.x,
          y: inst.position.y
        }))
      });

      weekOffset++;
    });

    const monthlyTasks = this.generateMonthlyTasks(individual, season);

    return {
      season: this.seasonToSpanish(season),
      hemisphere,
      plantingSchedule,
      monthlyTasks,
    };
  }

  /**
   * Determina el hemisferio basado en la latitud.
   */
  private determineHemisphere(latitude: number): Hemisphere {
    return latitude >= 0 ? 'north' : 'south';
  }

  /**
   * Detecta la estación actual basada en fecha y latitud.
   */
  private detectCurrentSeason(latitude: number): Season {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const hemisphere = this.determineHemisphere(latitude);

    if (hemisphere === 'north') {
      if (month >= 3 && month <= 5) return 'spring';
      if (month >= 6 && month <= 8) return 'summer';
      if (month >= 9 && month <= 11) return 'autumn';
      return 'winter';
    } else {
      // Hemisferio sur: estaciones invertidas
      if (month >= 3 && month <= 5) return 'autumn';
      if (month >= 6 && month <= 8) return 'winter';
      if (month >= 9 && month <= 11) return 'spring';
      return 'summer';
    }
  }

  /**
   * Genera notas de plantación específicas.
   */
  private generatePlantingNotes(species: string, season: Season): string {
    const seasonalNotes: Record<Season, string> = {
      spring: 'Temporada ideal para siembra. Mantener humedad constante.',
      summer: 'Aumentar frecuencia de riego. Proteger del sol directo intenso.',
      autumn: 'Reducir riego gradualmente. Preparar para temporada fría.',
      winter: 'Proteger de heladas. Riego moderado.',
    };

    const baseNote = seasonalNotes[season];

    // Notas específicas por tipo de planta
    const aromatic = ['Cilantro', 'Albahaca', 'Hierbabuena', 'Orégano'];
    if (aromatic.includes(species)) {
      return `${baseNote} Podar regularmente para promover crecimiento.`;
    }

    return baseNote;
  }

  /**
   * Genera tareas mensuales de mantenimiento.
   */
  private generateMonthlyTasks(_individual: Individual, _season: Season): OrchardCalendar['monthlyTasks'] {
    const now = new Date();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const tasks: OrchardCalendar['monthlyTasks'] = [];

    // Generar tareas para los próximos 3 meses
    for (let i = 0; i < 3; i++) {
      const monthIndex = (now.getMonth() + i) % 12;
      const month = monthNames[monthIndex];

      // Semana 1: Preparación
      tasks.push({
        month,
        week: 1,
        tasks: i === 0
          ? ['Preparar sustrato', 'Verificar drenaje', 'Siembra inicial']
          : ['Revisión general de plantas', 'Fertilización orgánica'],
      });

      // Semana 2: Mantenimiento
      tasks.push({
        month,
        week: 2,
        tasks: ['Riego regular', 'Control de plagas', 'Poda de mantenimiento'],
      });

      // Semana 3: Monitoreo
      tasks.push({
        month,
        week: 3,
        tasks: ['Monitoreo de crecimiento', 'Ajustar riego según clima', 'Eliminar maleza'],
      });

      // Semana 4: Cosecha/Preparación
      tasks.push({
        month,
        week: 4,
        tasks: ['Cosechar plantas listas', 'Preparar espacio para nuevas plantas', 'Registro de observaciones'],
      });
    }

    return tasks;
  }

  /**
   * Traduce estación a español.
   */
  private seasonToSpanish(season: Season): string {
    const translations: Record<Season, string> = {
      spring: 'Primavera',
      summer: 'Verano',
      autumn: 'Otoño',
      winter: 'Invierno',
    };
    return translations[season];
  }
}
