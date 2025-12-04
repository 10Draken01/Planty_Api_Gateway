/**
 * Rutas de Plants
 * Define todos los endpoints HTTP para el manejo de plantas
 */

import { Router } from 'express';
import { PlantController } from '../controllers/PlantController';

export class PlantRoutes {
  static create(plantController: PlantController): Router {
    const router = Router();

    // Health check
    router.get('/health', (req, res) => plantController.health(req, res));

    // Obtener todas las plantas
    router.get('/', (req, res) => plantController.list(req, res));

    return router;
  }
}
