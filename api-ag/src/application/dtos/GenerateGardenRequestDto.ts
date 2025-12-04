import Joi from 'joi';

export interface GenerateGardenRequestDto {
  userId?: string;
  desiredPlants?: string[]; // Lista de plantas deseadas por el usuario
  maxPlantSpecies?: 3 | 5; // NUEVO: Máximo de especies simultáneas (3 o 5)
  dimensions?: {
    width: number;
    height: number;
  };
  waterLimit?: number;
  userExperience?: 1 | 2 | 3;
  season?: 'auto' | 'spring' | 'summer' | 'autumn' | 'winter';
  location?: {
    lat: number;
    lon: number;
  };
  categoryDistribution?: {
    vegetable?: number;
    medicinal?: number;
    ornamental?: number;
    aromatic?: number;
  };
  budget?: number;
  objective?: 'alimenticio' | 'medicinal' | 'sostenible' | 'ornamental';
  maintenanceMinutes?: number;
}

export const generateGardenRequestSchema = Joi.object({
  userId: Joi.string().optional(),
  desiredPlants: Joi.array().items(Joi.string()).optional(),
  maxPlantSpecies: Joi.number().valid(3, 5).optional(), // NUEVO
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
