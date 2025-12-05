import { OTP } from '../entities/OTP';

/**
 * Interfaz para el servicio de OTP
 * Define el contrato para gestión de códigos de verificación
 */

export interface IOTPService {
  /**
   * Genera un OTP numérico de 6 dígitos
   * @returns string OTP en texto plano
   */
  generate(): string;

  /**
   * Hashea un OTP usando bcrypt
   * @param otp OTP en texto plano
   * @returns Promise<string> Hash del OTP
   */
  hash(otp: string): Promise<string>;

  /**
   * Compara un OTP en texto plano con su hash
   * @param otp OTP en texto plano
   * @param otpHash Hash almacenado
   * @returns Promise<boolean> true si coinciden
   */
  compare(otp: string, otpHash: string): Promise<boolean>;

  /**
   * Almacena un OTP en memoria/cache
   * @param otp Entidad OTP
   * @returns Promise<void>
   */
  store(otp: OTP): Promise<void>;

  /**
   * Recupera un OTP por email y propósito
   * @param email Email del usuario
   * @param purpose Propósito del OTP
   * @returns Promise<OTP | null>
   */
  findByEmail(email: string, purpose: 'register' | 'login'): Promise<OTP | null>;

  /**
   * Recupera un OTP por sessionId (para login 2FA)
   * @param sessionId ID de sesión
   * @returns Promise<OTP | null>
   */
  findBySessionId(sessionId: string): Promise<OTP | null>;

  /**
   * Elimina un OTP
   * @param email Email del usuario
   * @param purpose Propósito del OTP
   * @returns Promise<void>
   */
  delete(email: string, purpose: 'register' | 'login'): Promise<void>;

  /**
   * Elimina OTPs expirados (limpieza)
   * @returns Promise<number> Cantidad de OTPs eliminados
   */
  cleanExpired(): Promise<number>;
}
