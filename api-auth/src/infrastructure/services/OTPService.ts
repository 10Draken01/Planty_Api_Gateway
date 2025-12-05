import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OTP } from '../../domain/entities/OTP';
import { IOTPService } from '../../domain/interfaces/IOTPService';

/**
 * Servicio de OTP (One-Time Password)
 * Gestiona la generación, almacenamiento y validación de códigos OTP
 *
 * IMPORTANTE: Los OTPs se almacenan en memoria (Map)
 * Para producción, considerar usar Redis o una base de datos
 */

export class OTPService implements IOTPService {
  // Almacenamiento en memoria
  // Key format: `${email}:${purpose}` o `session:${sessionId}`
  private otpStore: Map<string, OTP> = new Map();

  // Intervalo de limpieza de OTPs expirados (cada 5 minutos)
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Iniciar limpieza automática de OTPs expirados
    this.cleanupInterval = setInterval(() => {
      this.cleanExpired();
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Genera un OTP numérico de 6 dígitos
   */
  generate(): string {
    // Generar número aleatorio de 6 dígitos (100000-999999)
    const otp = crypto.randomInt(100000, 1000000).toString();
    return otp;
  }

  /**
   * Hashea un OTP usando bcrypt
   */
  async hash(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  /**
   * Compara un OTP en texto plano con su hash
   */
  async compare(otp: string, otpHash: string): Promise<boolean> {
    return bcrypt.compare(otp, otpHash);
  }

  /**
   * Almacena un OTP en memoria
   */
  async store(otp: OTP): Promise<void> {
    const key = this.getKey(otp.email, otp.purpose);
    this.otpStore.set(key, otp);

    // Si tiene sessionId, también almacenar con esa clave
    if (otp.sessionId) {
      const sessionKey = `session:${otp.sessionId}`;
      this.otpStore.set(sessionKey, otp);
    }

    console.log(`✓ OTP stored for ${otp.email} (${otp.purpose})`);
  }

  /**
   * Recupera un OTP por email y propósito
   */
  async findByEmail(email: string, purpose: 'register' | 'login'): Promise<OTP | null> {
    const key = this.getKey(email, purpose);
    return this.otpStore.get(key) || null;
  }

  /**
   * Recupera un OTP por sessionId
   */
  async findBySessionId(sessionId: string): Promise<OTP | null> {
    const key = `session:${sessionId}`;
    return this.otpStore.get(key) || null;
  }

  /**
   * Elimina un OTP
   */
  async delete(email: string, purpose: 'register' | 'login'): Promise<void> {
    const key = this.getKey(email, purpose);
    const otp = this.otpStore.get(key);

    this.otpStore.delete(key);

    // Si tenía sessionId, también eliminar esa entrada
    if (otp?.sessionId) {
      const sessionKey = `session:${otp.sessionId}`;
      this.otpStore.delete(sessionKey);
    }

    console.log(`✓ OTP deleted for ${email} (${purpose})`);
  }

  /**
   * Elimina OTPs expirados
   */
  async cleanExpired(): Promise<number> {
    let count = 0;
    const now = new Date();

    for (const [key, otp] of this.otpStore.entries()) {
      if (otp.isExpired()) {
        this.otpStore.delete(key);
        count++;
      }
    }

    if (count > 0) {
      console.log(`✓ Cleaned ${count} expired OTPs`);
    }

    return count;
  }

  /**
   * Genera la clave para el Map
   */
  private getKey(email: string, purpose: 'register' | 'login'): string {
    return `${email.toLowerCase()}:${purpose}`;
  }

  /**
   * Detiene el intervalo de limpieza (para testing o shutdown)
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Obtiene estadísticas del almacenamiento (para debugging)
   */
  getStats(): {
    total: number;
    byPurpose: { register: number; login: number };
    expired: number;
  } {
    let registerCount = 0;
    let loginCount = 0;
    let expiredCount = 0;

    for (const [key, otp] of this.otpStore.entries()) {
      // No contar las entradas de sesión (son duplicadas)
      if (key.startsWith('session:')) continue;

      if (otp.purpose === 'register') registerCount++;
      if (otp.purpose === 'login') loginCount++;
      if (otp.isExpired()) expiredCount++;
    }

    return {
      total: this.otpStore.size,
      byPurpose: { register: registerCount, login: loginCount },
      expired: expiredCount,
    };
  }
}
