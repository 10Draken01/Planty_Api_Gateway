/**
 * Middleware de Rate Limiting para prevenir ataques de fuerza bruta
 * Limita el número de intentos de login por IP y por email
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blocked: boolean;
  blockUntil?: Date;
}

export class RateLimitMiddleware {
  // Almacenamiento en memoria de intentos (en producción usar Redis)
  private static ipAttempts = new Map<string, RateLimitEntry>();
  private static emailAttempts = new Map<string, RateLimitEntry>();

  // Configuración
  private static readonly MAX_ATTEMPTS = 5; // Máximo de intentos
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutos
  private static readonly BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutos de bloqueo

  /**
   * Obtener IP del cliente
   */
  private static getClientIP(req: Request): string {
    // Obtener IP de headers en caso de estar detrás de un proxy
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  /**
   * Limpiar entradas expiradas
   */
  private static cleanExpired(storage: Map<string, RateLimitEntry>): void {
    const now = new Date();

    for (const [key, entry] of storage.entries()) {
      // Limpiar si el bloqueo expiró
      if (entry.blocked && entry.blockUntil && entry.blockUntil < now) {
        storage.delete(key);
        continue;
      }

      // Limpiar si la ventana de tiempo expiró
      const timeSinceFirst = now.getTime() - entry.firstAttempt.getTime();
      if (timeSinceFirst > this.WINDOW_MS) {
        storage.delete(key);
      }
    }
  }

  /**
   * Verificar y actualizar intentos
   */
  private static checkAttempt(
    key: string,
    storage: Map<string, RateLimitEntry>
  ): { allowed: boolean; remaining: number; resetTime?: Date } {
    this.cleanExpired(storage);

    const now = new Date();
    let entry = storage.get(key);

    if (!entry) {
      // Primera vez
      entry = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false
      };
      storage.set(key, entry);
      return { allowed: true, remaining: this.MAX_ATTEMPTS - 1 };
    }

    // Verificar si está bloqueado
    if (entry.blocked && entry.blockUntil) {
      if (entry.blockUntil > now) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.blockUntil
        };
      } else {
        // El bloqueo expiró, resetear
        storage.delete(key);
        return this.checkAttempt(key, storage);
      }
    }

    // Verificar si la ventana de tiempo expiró
    const timeSinceFirst = now.getTime() - entry.firstAttempt.getTime();
    if (timeSinceFirst > this.WINDOW_MS) {
      // Resetear contador
      storage.delete(key);
      return this.checkAttempt(key, storage);
    }

    // Incrementar contador
    entry.count++;
    entry.lastAttempt = now;

    // Verificar si excedió el límite
    if (entry.count > this.MAX_ATTEMPTS) {
      entry.blocked = true;
      entry.blockUntil = new Date(now.getTime() + this.BLOCK_DURATION_MS);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockUntil
      };
    }

    return {
      allowed: true,
      remaining: this.MAX_ATTEMPTS - entry.count
    };
  }

  /**
   * Middleware para rate limiting por IP
   */
  static byIP() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIP(req);
      const result = this.checkAttempt(ip, this.ipAttempts);

      if (!result.allowed) {
        const minutesRemaining = result.resetTime
          ? Math.ceil((result.resetTime.getTime() - Date.now()) / (60 * 1000))
          : 30;

        res.status(429).json({
          error: 'Demasiados intentos desde esta IP',
          message: `Has excedido el límite de intentos. Intenta de nuevo en ${minutesRemaining} minutos`,
          retryAfter: minutesRemaining * 60 // en segundos
        });
        return;
      }

      // Agregar headers de rate limit
      res.setHeader('X-RateLimit-Limit', this.MAX_ATTEMPTS.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());

      next();
    };
  }

  /**
   * Middleware para rate limiting por email
   */
  static byEmail() {
    return (req: Request, res: Response, next: NextFunction) => {
      const email = req.body.email;

      if (!email) {
        next();
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const result = this.checkAttempt(normalizedEmail, this.emailAttempts);

      if (!result.allowed) {
        const minutesRemaining = result.resetTime
          ? Math.ceil((result.resetTime.getTime() - Date.now()) / (60 * 1000))
          : 30;

        res.status(429).json({
          error: 'Demasiados intentos para este email',
          message: `Has excedido el límite de intentos para este email. Intenta de nuevo en ${minutesRemaining} minutos`,
          retryAfter: minutesRemaining * 60 // en segundos
        });
        return;
      }

      next();
    };
  }

  /**
   * Middleware combinado (IP + Email)
   */
  static combined() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Primero verificar por IP
      const ip = this.getClientIP(req);
      const ipResult = this.checkAttempt(ip, this.ipAttempts);

      if (!ipResult.allowed) {
        const minutesRemaining = ipResult.resetTime
          ? Math.ceil((ipResult.resetTime.getTime() - Date.now()) / (60 * 1000))
          : 30;

        res.status(429).json({
          error: 'Demasiados intentos desde esta IP',
          message: `Has excedido el límite de intentos. Intenta de nuevo en ${minutesRemaining} minutos`,
          retryAfter: minutesRemaining * 60
        });
        return;
      }

      // Luego verificar por email si está presente
      const email = req.body.email;
      if (email) {
        const normalizedEmail = email.toLowerCase().trim();
        const emailResult = this.checkAttempt(normalizedEmail, this.emailAttempts);

        if (!emailResult.allowed) {
          const minutesRemaining = emailResult.resetTime
            ? Math.ceil((emailResult.resetTime.getTime() - Date.now()) / (60 * 1000))
            : 30;

          res.status(429).json({
            error: 'Demasiados intentos para este email',
            message: `Has excedido el límite de intentos para este email. Intenta de nuevo en ${minutesRemaining} minutos`,
            retryAfter: minutesRemaining * 60
          });
          return;
        }
      }

      // Agregar headers
      res.setHeader('X-RateLimit-Limit', this.MAX_ATTEMPTS.toString());
      res.setHeader('X-RateLimit-Remaining', ipResult.remaining.toString());

      next();
    };
  }

  /**
   * Limpiar intentos para un email (usar después de login exitoso)
   */
  static clearEmail(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    this.emailAttempts.delete(normalizedEmail);
  }

  /**
   * Limpiar intentos para una IP (usar después de login exitoso)
   */
  static clearIP(ip: string): void {
    this.ipAttempts.delete(ip);
  }

  /**
   * Tarea de limpieza periódica (ejecutar cada 5 minutos)
   */
  static startCleanupTask(): void {
    setInterval(() => {
      this.cleanExpired(this.ipAttempts);
      this.cleanExpired(this.emailAttempts);
      console.log('[RateLimit] Limpieza periódica ejecutada');
    }, 5 * 60 * 1000); // Cada 5 minutos
  }
}
