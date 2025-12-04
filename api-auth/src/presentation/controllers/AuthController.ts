import { Request, Response } from 'express';
import { RegisterUseCase } from '../../application/usecases/RegisterUseCase';
import { LoginUseCase } from '../../application/usecases/LoginUseCase';
import { ValidateTokenUseCase } from '../../application/usecases/ValidateTokenUseCase';

export class AuthController {
  constructor(
    private registerUseCase: RegisterUseCase,
    private loginUseCase: LoginUseCase,
    private validateTokenUseCase: ValidateTokenUseCase
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const result = await this.registerUseCase.execute(name, email, password);
      res.setHeader('Authorization', `Bearer ${result.token}`);
      res.status(201).json({...result, token: undefined });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const result = await this.loginUseCase.execute(email, password);
      res.setHeader('Authorization', `Bearer ${result.token}`);
      res.status(200).json({...result, token: undefined });
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
}
