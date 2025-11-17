/**
 * Rutas de Orchards
 * Define todos los endpoints HTTP para el manejo de huertos
 */

import { Router } from 'express';
import { OrchardController } from '../controllers/OrchardController';

export class OrchardRoutes {
  static create(orchardController: OrchardController): Router {
    const router = Router();

    // Health check
    router.get('/health', (req, res) => orchardController.health(req, res));

    // CRUD básico
    router.post('/', (req, res) => orchardController.create(req, res));
    router.get('/', (req, res) => orchardController.list(req, res));
    router.get('/:id', (req, res) => orchardController.getById(req, res));
    router.put('/:id', (req, res) => orchardController.update(req, res));
    router.delete('/:id', (req, res) => orchardController.delete(req, res));

    // Activar/Desactivar
    router.patch('/:id/activate', (req, res) => orchardController.activate(req, res));
    router.patch('/:id/deactivate', (req, res) => orchardController.deactivate(req, res));

    // Gestión de plantas
    router.post('/:id/plants', (req, res) => orchardController.addPlant(req, res));
    router.delete('/:id/plants/:plantId', (req, res) => orchardController.removePlant(req, res));

    return router;
  }
}
