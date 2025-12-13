/**
 * MIDDLEWARE - LOGGING
 *
 * Registra todas las peticiones HTTP que llegan al API Gateway.
 * Muestra el timestamp, método HTTP, ruta y código de estado.
 */

import { Request, Response, NextFunction } from 'express';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Capturar cuando la respuesta termina
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;

    // Emoji según el código de estado
    let emoji = '';
    if (status >= 500) emoji = 'L';
    else if (status >= 400) emoji = ' ';
    else if (status >= 300) emoji = '=';

    console.log(`${emoji} [${timestamp}] ${method} ${url} - ${status} (${duration}ms)`);
  });

  next();
};
