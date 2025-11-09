import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');

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