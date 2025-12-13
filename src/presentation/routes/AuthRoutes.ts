import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { RegisterUseCase } from '../../application/usecases/RegisterUseCase';
import { LoginUseCase } from '../../application/usecases/LoginUseCase';
import { ValidateTokenUseCase } from '../../application/usecases/ValidateTokenUseCase';
import { VerifyRegister2FAUseCase } from '../../application/usecases/VerifyRegister2FAUseCase';
import { VerifyLogin2FAUseCase } from '../../application/usecases/VerifyLogin2FAUseCase';
import { ResendOTPUseCase } from '../../application/usecases/ResendOTPUseCase';
import { BcryptService } from '../../infrastructure/services/BcryptService';
import { JwtService } from '../../infrastructure/services/JwtService';
import { UserHttpService } from '../../infrastructure/http/UserHttpService';
import { OTPService } from '../../infrastructure/services/OTPService';
import { EmailService } from '../../infrastructure/services/EmailService';
import { RateLimitMiddleware } from '../middlewares/RateLimitMiddleware';

const hashService = new BcryptService();
const tokenService = new JwtService();
const userService = new UserHttpService();
const otpService = new OTPService();
const emailService = new EmailService();

const registerUseCase = new RegisterUseCase(hashService, tokenService, userService, otpService, emailService);
const loginUseCase = new LoginUseCase(hashService, tokenService, userService, otpService, emailService);
const validateTokenUseCase = new ValidateTokenUseCase(tokenService);
const verifyRegister2FAUseCase = new VerifyRegister2FAUseCase(otpService, userService, tokenService, emailService);
const verifyLogin2FAUseCase = new VerifyLogin2FAUseCase(otpService, userService, tokenService);
const resendOTPUseCase = new ResendOTPUseCase(otpService, emailService, userService);

const authController = new AuthController(
  registerUseCase,
  loginUseCase,
  validateTokenUseCase,
  verifyRegister2FAUseCase,
  verifyLogin2FAUseCase,
  resendOTPUseCase
);

const router = Router();

// Iniciar tarea de limpieza periódica del rate limiter
// RateLimitMiddleware.startCleanupTask(); // DESACTIVADO TEMPORALMENTE PARA PRUEBAS

// Rutas SIN protección de rate limiting (para pruebas)
// IMPORTANTE: Descomentar los middlewares de rate limiting en producción
router.post('/register', authController.register); // Sin rate limit
router.post('/login', authController.login); // Sin rate limit
router.post('/validate', authController.validateToken);

// Nuevas rutas para 2FA
router.post('/verify-register-2fa', authController.verifyRegister2FA);
router.post('/verify-login-2fa', authController.verifyLogin2FA);
router.post('/resend-otp', authController.resendOTP);

// Rutas CON protección de rate limiting (descomentar para producción)
// router.post('/register', RateLimitMiddleware.byIP(), authController.register);
// router.post('/login', RateLimitMiddleware.combined(), authController.login);

export default router;
