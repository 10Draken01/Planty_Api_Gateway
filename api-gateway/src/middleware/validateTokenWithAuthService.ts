import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para validar tokens JWT usando el microservicio de autenticación
 *
 * Este middleware sigue el principio de separación de responsabilidades:
 * - El Gateway NO conoce el JWT_SECRET
 * - La validación la hace el microservicio de autenticación
 * - Se evita duplicación de lógica de validación
 *
 * Flujo:
 * 1. Extrae el token del header Authorization
 * 2. Llama al endpoint /auth/validate del microservicio de autenticación
 * 3. Si es válido, adjunta la información del usuario a req.user
 * 4. Si es inválido, retorna 401 Unauthorized
 */
export const validateTokenWithAuthService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Token no proporcionado',
        message: 'Se requiere autenticación. Incluya el token en el header: Authorization: Bearer <token>'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Obtener la URL del servicio de autenticación desde variables de entorno
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';

    // Llamar al endpoint de validación del microservicio de autenticación
    const response = await axios.post(
      `${authServiceUrl}/auth/validate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000, // Timeout de 5 segundos
      }
    );

    // Si la respuesta indica que el token es válido
    if (response.data.valid && response.data.user) {
      // Adjuntar información del usuario al request
      (req as any).user = response.data.user;

      // Continuar con el siguiente middleware o handler
      next();
    } else {
      res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido o ha expirado'
      });
      return;
    }
  } catch (error: any) {
    // Manejar diferentes tipos de errores

    if (axios.isAxiosError(error)) {
      // Error de la petición HTTP al servicio de autenticación

      if (error.response) {
        // El servicio respondió con un error (401, 400, etc.)
        res.status(error.response.status).json({
          error: 'Token inválido',
          message: error.response.data?.error || 'Autenticación fallida'
        });
        return;
      } else if (error.code === 'ECONNREFUSED') {
        // El servicio de autenticación no está disponible
        console.error('Error: Servicio de autenticación no disponible');
        res.status(503).json({
          error: 'Servicio no disponible',
          message: 'El servicio de autenticación no está disponible. Intente nuevamente más tarde.'
        });
        return;
      } else if (error.code === 'ETIMEDOUT') {
        // Timeout al conectar con el servicio
        console.error('Error: Timeout al validar token');
        res.status(504).json({
          error: 'Timeout',
          message: 'El servicio de autenticación tardó demasiado en responder'
        });
        return;
      }
    }

    // Error genérico
    console.error('Error validando token:', error.message);
    res.status(401).json({
      error: 'No autorizado',
      message: 'Error al validar el token de autenticación'
    });
    return;
  }
};
