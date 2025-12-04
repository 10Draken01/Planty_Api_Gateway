import Joi from 'joi';

export interface GenerateGardenRequestDto {
  userId?: string;
  desiredPlantIds?: number[]; // MEJORADO: IDs de plantas deseadas (se consultan en BD)
  maxPlantSpecies?: 3 | 5; // Máximo de especies simultáneas (default: 5)
  dimensions?: {
    width: number;  // Ancho en metros
    height: number; // Alto en metros
  };
  waterLimit?: number; // Litros de agua disponibles por semana
  userExperience?: 1 | 2 | 3; // 1=Principiante, 2=Intermedio, 3=Avanzado
  season?: 'auto' | 'spring' | 'summer' | 'autumn' | 'winter';
  location?: {
    lat: number;  // Latitud
    lon: number;  // Longitud
  };
  categoryDistribution?: {
    vegetable?: number;   // Porcentaje deseado (0-100)
    medicinal?: number;   // Porcentaje deseado (0-100)
    ornamental?: number;  // Porcentaje deseado (0-100)
    aromatic?: number;    // Porcentaje deseado (0-100)
  };
  budget?: number; // Presupuesto en MXN
  objective?: 'alimenticio' | 'medicinal' | 'sostenible' | 'ornamental';
  maintenanceMinutes?: number; // Minutos disponibles por semana para mantenimiento
}

export const generateGardenRequestSchema = Joi.object({
  userId: Joi.string().optional(),
  desiredPlantIds: Joi.array().items(Joi.number().integer().positive()).optional(), // MEJORADO
  maxPlantSpecies: Joi.number().valid(3, 5).optional(),
  dimensions: Joi.object({
    width: Joi.number().min(0.5).max(10),
    height: Joi.number().min(0.5).max(10),
  }).optional(),
  waterLimit: Joi.number().min(0).optional(),
  userExperience: Joi.number().valid(1, 2, 3).optional(),
  season: Joi.string().valid('auto', 'spring', 'summer', 'autumn', 'winter').optional(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90),
    lon: Joi.number().min(-180).max(180),
  }).optional(),
  categoryDistribution: Joi.object({
    vegetable: Joi.number().min(0).max(100).optional(),
    medicinal: Joi.number().min(0).max(100).optional(),
    ornamental: Joi.number().min(0).max(100).optional(),
    aromatic: Joi.number().min(0).max(100).optional(),
  }).optional(),
  budget: Joi.number().min(0).optional(),
  objective: Joi.string().valid('alimenticio', 'medicinal', 'sostenible', 'ornamental').optional(),
  maintenanceMinutes: Joi.number().min(0).optional(),
});
