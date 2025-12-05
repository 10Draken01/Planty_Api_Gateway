import { Request, Response } from 'express';
import { RegisterUseCase } from '../../application/usecases/RegisterUseCase';
import { LoginUseCase } from '../../application/usecases/LoginUseCase';
import { ValidateTokenUseCase } from '../../application/usecases/ValidateTokenUseCase';
import { VerifyRegister2FAUseCase } from '../../application/usecases/VerifyRegister2FAUseCase';
import { VerifyLogin2FAUseCase } from '../../application/usecases/VerifyLogin2FAUseCase';
import { ResendOTPUseCase } from '../../application/usecases/ResendOTPUseCase';

export class AuthController {
  constructor(
    private registerUseCase: RegisterUseCase,
    private loginUseCase: LoginUseCase,
    private validateTokenUseCase: ValidateTokenUseCase,
    private verifyRegister2FAUseCase: VerifyRegister2FAUseCase,
    private verifyLogin2FAUseCase: VerifyLogin2FAUseCase,
    private resendOTPUseCase: ResendOTPUseCase
  ) {}

  /**
   * Registro de usuario (ahora con 2FA)
   * Ya NO retorna el token JWT directamente
   * Retorna requiresVerification: true
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const result = await this.registerUseCase.execute(name, email, password);
      // Ya NO se envía token en el header
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Login de usuario (ahora con 2FA)
   * Ya NO retorna el token JWT directamente
   * Retorna require2FA: true con sessionId
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const result = await this.loginUseCase.execute(email, password);
      // Ya NO se envía token en el header
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  /**
   * Valida un token JWT
   * Este endpoint es utilizado por el API Gateway y otros microservicios
   * para verificar la validez de un token sin compartir el JWT_SECRET
   */
  validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // El token puede venir en el header Authorization o en el body
      let token = req.headers.authorization?.replace('Bearer ', '');

      if (!token && req.body.token) {
        token = req.body.token;
      }

      if (!token) {
        res.status(400).json({
          valid: false,
          error: 'Token no proporcionado'
        });
        return;
      }

      const payload = this.validateTokenUseCase.execute(token);

      if (!payload) {
        res.status(401).json({
          valid: false,
          error: 'Token inválido o expirado'
        });
        return;
      }

      // Token válido - retornar información del usuario
      res.status(200).json({
        valid: true,
        user: {
          userId: payload.userId,
          email: payload.email
        }
      });
    } catch (error: any) {
      res.status(401).json({
        valid: false,
        error: error.message
      });
    }
  };

  /**
   * Verifica el OTP de registro y activa la cuenta
   * POST /auth/verify-register-2fa
   * Body: { email: string, otp: string }
   */
  verifyRegister2FA = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const result = await this.verifyRegister2FAUseCase.execute(email, otp);

      // AHORA SÍ se envía el token JWT en el header
      res.setHeader('Authorization', `Bearer ${result.token}`);
      res.status(200).json({ ...result, token: undefined });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Verifica el OTP de login y completa el inicio de sesión
   * POST /auth/verify-login-2fa
   * Body: { sessionId: string, otp: string }
   */
  verifyLogin2FA = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, otp } = req.body;

      if (!sessionId || !otp) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const result = await this.verifyLogin2FAUseCase.execute(sessionId, otp);

      // AHORA SÍ se envía el token JWT en el header
      res.setHeader('Authorization', `Bearer ${result.token}`);
      res.status(200).json({ ...result, token: undefined });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Reenvía un código OTP
   * POST /auth/resend-otp
   * Body: { email: string, purpose: 'register' | 'login' }
   */
  resendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, purpose } = req.body;

      if (!email || !purpose) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      if (purpose !== 'register' && purpose !== 'login') {
        res.status(400).json({ error: 'Propósito inválido' });
        return;
      }

      const result = await this.resendOTPUseCase.execute(email, purpose);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
