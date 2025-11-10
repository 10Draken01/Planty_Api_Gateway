import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { RegisterUseCase } from '../../application/usecases/RegisterUseCase';
import { LoginUseCase } from '../../application/usecases/LoginUseCase';
import { ValidateTokenUseCase } from '../../application/usecases/ValidateTokenUseCase';
import { BcryptService } from '../../infrastructure/services/BcryptService';
import { JwtService } from '../../infrastructure/services/JwtService';
import { UserHttpService } from '../../infrastructure/http/UserHttpService';

const hashService = new BcryptService();
const tokenService = new JwtService();
const userService = new UserHttpService();

const registerUseCase = new RegisterUseCase(hashService, tokenService, userService);
const loginUseCase = new LoginUseCase(hashService, tokenService, userService);
const validateTokenUseCase = new ValidateTokenUseCase(tokenService);

const authController = new AuthController(registerUseCase, loginUseCase, validateTokenUseCase);

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/validate', authController.validateToken);

export default router;
