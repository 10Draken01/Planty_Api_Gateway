import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../config/logger';

export function errorHandlerMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled error', {
    message: error.message,
    stack: error.stack,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message,
  });
}
