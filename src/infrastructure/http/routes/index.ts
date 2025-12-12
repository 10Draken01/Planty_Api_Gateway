import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';
import { GenerateController } from '../controllers/GenerateController';

export function createRoutes(
  healthController: HealthController,
  generateController: GenerateController
): Router {
  const router = Router();

  // Health check
  router.get('/health', (req, res) => healthController.handle(req, res));

  // Generate garden
  router.post('/generate', (req, res) => generateController.handle(req, res));

  return router;
}
