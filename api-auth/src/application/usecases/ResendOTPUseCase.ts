import { IOTPService } from '../../domain/interfaces/IOTPService';
import { IEmailService } from '../../domain/interfaces/IEmailService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { OTP } from '../../domain/entities/OTP';

/**
 * Caso de Uso: Reenviar OTP
 * Genera y envía un nuevo código OTP al usuario
 */

export class ResendOTPUseCase {
  constructor(
    private otpService: IOTPService,
    private emailService: IEmailService,
    private userService: IUserService
  ) {}

  async execute(
    email: string,
    purpose: 'register' | 'login'
  ): Promise<{ message: string; expiresIn: number }> {
    // [1] Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // [2] Verificar que el usuario existe
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // [3] Si es registro, verificar que no esté ya verificado
    if (purpose === 'register' && user.is_verified) {
      throw new Error('La cuenta ya está verificada');
    }

    // [4] Si es login, verificar que esté verificado
    if (purpose === 'login' && !user.is_verified) {
      throw new Error('Debes verificar tu cuenta primero');
    }

    // [5] Verificar si hay un OTP existente
    const existingOTP = await this.otpService.findByEmail(normalizedEmail, purpose);

    // Si existe y aún es válido, verificar rate limiting
    if (existingOTP && !existingOTP.isExpired()) {
      const remainingMs = existingOTP.getRemainingTimeMs();
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

      // No permitir reenvío si quedan más de 2 minutos
      if (remainingMinutes > 2) {
        throw new Error(
          `Puedes solicitar un nuevo código en ${remainingMinutes} minuto(s)`
        );
      }
    }

    // [6] Generar nuevo OTP
    const otpCode = this.otpService.generate();
    const otpHash = await this.otpService.hash(otpCode);

    // [7] Crear entidad OTP
    const otp = OTP.create({
      email: normalizedEmail,
      otpHash,
      purpose,
    });

    // [8] Almacenar OTP (reemplaza el anterior)
    await this.otpService.store(otp);

    // [9] Enviar email
    await this.emailService.sendOTP(normalizedEmail, otpCode, purpose);

    // [10] Retornar confirmación
    return {
      message: 'Código de verificación enviado',
      expiresIn: 300, // 5 minutos en segundos
    };
  }
}
