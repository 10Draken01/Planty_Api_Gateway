import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../infrastructure/services/JwtService';

const jwtService = new JwtService();

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const payload = jwtService.verify(token);

    if (!payload) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'No autorizado' });
  }
};
