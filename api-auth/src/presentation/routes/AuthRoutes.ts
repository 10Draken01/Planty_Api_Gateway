import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { RegisterUseCase } from '../../application/usecases/RegisterUseCase';
import { LoginUseCase } from '../../application/usecases/LoginUseCase';
import { ValidateTokenUseCase } from '../../application/usecases/ValidateTokenUseCase';
import { BcryptService } from '../../infrastructure/services/BcryptService';
import { JwtService } from '../../infrastructure/services/JwtService';
import { UserHttpService } from '../../infrastructure/http/UserHttpService';
import { RateLimitMiddleware } from '../middlewares/RateLimitMiddleware';

const hashService = new BcryptService();
const tokenService = new JwtService();
const userService = new UserHttpService();

const registerUseCase = new RegisterUseCase(hashService, tokenService, userService);
const loginUseCase = new LoginUseCase(hashService, tokenService, userService);
const validateTokenUseCase = new ValidateTokenUseCase(tokenService);

const authController = new AuthController(registerUseCase, loginUseCase, validateTokenUseCase);

const router = Router();

// Iniciar tarea de limpieza periódica del rate limiter
// RateLimitMiddleware.startCleanupTask(); // DESACTIVADO TEMPORALMENTE PARA PRUEBAS

// Rutas SIN protección de rate limiting (para pruebas)
// IMPORTANTE: Descomentar los middlewares de rate limiting en producción
router.post('/register', authController.register); // Sin rate limit
router.post('/login', authController.login); // Sin rate limit
router.post('/validate', authController.validateToken);

// Rutas CON protección de rate limiting (descomentar para producción)
// router.post('/register', RateLimitMiddleware.byIP(), authController.register);
// router.post('/login', RateLimitMiddleware.combined(), authController.login);

export default router;
