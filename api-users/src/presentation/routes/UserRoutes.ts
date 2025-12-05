import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';

export class UserRoutes {
  private router: Router;

  constructor(private userController: UserController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    
    this.router.post('/create', (req, res) => this.userController.createUser(req, res));
    this.router.get('/email/:email', (req, res) => this.userController.getUserByEmail(req, res));

    this.router.get('/:id', (req, res) => this.userController.getUserById(req, res));
    this.router.put('/:id', (req, res) => this.userController.updateUserById(req, res));
    this.router.delete('/:id', (req, res) => this.userController.deleteUserById(req, res));

    // Endpoint para actualizar token FCM (usado por Notifications Service)
    this.router.patch('/:id/fcm-token', (req, res) => this.userController.updateTokenFCM(req, res));

    // Endpoint para verificar usuario (usado por Auth Service después de validar OTP 2FA)
    this.router.post('/verify', (req, res) => this.userController.verifyUser(req, res));
  }

  getRouter(): Router {
    return this.router;
  }
}