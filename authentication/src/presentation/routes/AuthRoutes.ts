import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { RegisterUseCase } from '../../application/usecases/RegisterUseCase';
import { LoginUseCase } from '../../application/usecases/LoginUseCase';
import { BcryptService } from '../../infrastructure/services/BcryptService';
import { JwtService } from '../../infrastructure/services/JwtService';
import { UserHttpService } from '../../infrastructure/http/UserHttpService';

const hashService = new BcryptService();
const tokenService = new JwtService();
const userService = new UserHttpService();

const registerUseCase = new RegisterUseCase(hashService, tokenService, userService);
const loginUseCase = new LoginUseCase(hashService, tokenService, userService);

const authController = new AuthController(registerUseCase, loginUseCase);

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

export default router;
