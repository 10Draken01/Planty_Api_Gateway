/**
 * MIDDLEWARE - CORS (Cross-Origin Resource Sharing)
 *
 * Configura CORS para permitir peticiones desde otros orígenes.
 * En desarrollo permite todos los orígenes (*).
 * En producción se debe configurar con los dominios específicos permitidos.
 */

import cors from 'cors';

export const corsMiddleware = cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
});
