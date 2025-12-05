/**
 * Rutas de Orchards (ACTUALIZADO)
 * Define todos los endpoints HTTP para el manejo de huertos
 *
 * NUEVOS ENDPOINTS:
 * - POST   /orchards/:id/plants/layout - Agregar planta con posición
 * - PATCH  /orchards/:id/plants/layout/:plantInstanceId/move - Mover planta
 * - DELETE /orchards/:id/plants/layout/:plantInstanceId - Remover planta
 */

import { Router } from 'express';
import { OrchardController } from '../controllers/OrchardController';

export class OrchardRoutes {
  static create(orchardController: OrchardController): Router {
    const router = Router();

    // ==================== HEALTH CHECK ====================
    router.get('/health', (req, res) => orchardController.health(req, res));

    // ==================== CRUD BÁSICO ====================
    router.post('/', (req, res) => orchardController.create(req, res));
    router.get('/', (req, res) => orchardController.list(req, res));
    router.get('/user/:userId', (req, res) => orchardController.getByUserId(req, res));
    router.get('/:id', (req, res) => orchardController.getById(req, res));
    router.put('/:id', (req, res) => orchardController.update(req, res));
    router.delete('/:id', (req, res) => orchardController.delete(req, res));

    // ==================== ACTIVAR/DESACTIVAR ====================
    router.patch('/:id/activate', (req, res) => orchardController.activate(req, res));
    router.patch('/:id/deactivate', (req, res) => orchardController.deactivate(req, res));

    // ==================== ✅ GESTIÓN DE LAYOUT (NUEVO) ====================

    /**
     * POST /orchards/:id/plants/layout
     * Agregar una planta con posición al layout del huerto
     *
     * Body: {
     *   plantId: number,      // ID de la planta en la BD
     *   x: number,            // Posición X
     *   y: number,            // Posición Y
     *   width?: number,       // Ancho (default: 1)
     *   height?: number,      // Alto (default: 1)
     *   rotation?: number     // Rotación 0, 90, 180, 270 (default: 0)
     * }
     *
     * Response 201: {
     *   success: true,
     *   message: "Planta agregada exitosamente al layout del huerto",
     *   data: {
     *     id: "plant-instance-uuid",
     *     plantId: 42,
     *     position: { x: 2, y: 3 },
     *     width: 1,
     *     height: 1,
     *     rotation: 0,
     *     status: "planned"
     *   }
     * }
     *
     * Response 409: { success: false, error: "La planta colisiona..." }
     * Response 404: { success: false, error: "Huerto no encontrado" }
     */
    router.post(
      '/:id/plants/layout',
      (req, res) => orchardController.addPlantToLayout(req, res)
    );

    /**
     * PATCH /orchards/:id/plants/layout/:plantInstanceId/move
     * Mover una planta a una nueva posición
     *
     * Body: {
     *   newX: number,
     *   newY: number
     * }
     *
     * Response 200: {
     *   success: true,
     *   message: "Planta movida exitosamente",
     *   data: {
     *     plantInstanceId: "uuid",
     *     newPosition: { x: 5, y: 7 }
     *   }
     * }
     *
     * Response 409: { success: false, error: "La nueva posición colisiona..." }
     * Response 404: { success: false, error: "Planta no encontrada..." }
     */
    router.patch(
      '/:id/plants/layout/:plantInstanceId/move',
      (req, res) => orchardController.movePlantInLayout(req, res)
    );

    /**
     * DELETE /orchards/:id/plants/layout/:plantInstanceId
     * Remover una planta del layout
     *
     * Response 200: {
     *   success: true,
     *   message: "Planta removida exitosamente del layout",
     *   data: {
     *     plantInstanceId: "uuid",
     *     countPlants: 5
     *   }
     * }
     *
     * Response 404: { success: false, error: "Planta no encontrada..." }
     */
    router.delete(
      '/:id/plants/layout/:plantInstanceId',
      (req, res) => orchardController.removePlantFromLayout(req, res)
    );

    return router;
  }
}
