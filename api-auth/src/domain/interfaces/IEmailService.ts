/**
 * Interfaz para el servicio de correo electrónico
 * Define el contrato para envío de emails
 */

export interface IEmailService {
  /**
   * Envía un OTP por correo electrónico
   * @param to Dirección de correo del destinatario
   * @param otp Código OTP de 6 dígitos
   * @param purpose Propósito del OTP ('register' o 'login')
   * @returns Promise<void>
   */
  sendOTP(to: string, otp: string, purpose: 'register' | 'login'): Promise<void>;

  /**
   * Envía un correo de bienvenida al usuario
   * @param to Dirección de correo del destinatario
   * @param name Nombre del usuario
   * @returns Promise<void>
   */
  sendWelcomeEmail(to: string, name: string): Promise<void>;
}
