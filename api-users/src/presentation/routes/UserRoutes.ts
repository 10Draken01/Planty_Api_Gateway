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
  }

  getRouter(): Router {
    return this.router;
  }
}