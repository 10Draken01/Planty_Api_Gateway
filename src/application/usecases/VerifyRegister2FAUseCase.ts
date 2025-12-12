import { IOTPService } from '../../domain/interfaces/IOTPService';
import { IEmailService } from '../../domain/interfaces/IEmailService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { AuthResult } from '../../domain/entities/Auth';

/**
 * Caso de Uso: Verificar OTP de Registro
 * Valida el código OTP enviado por email y activa la cuenta del usuario
 */

export class VerifyRegister2FAUseCase {
  constructor(
    private otpService: IOTPService,
    private userService: IUserService,
    private tokenService: ITokenService,
    private emailService: IEmailService
  ) {}

  async execute(email: string, otp: string): Promise<AuthResult> {
    // [1] Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // [2] Buscar OTP almacenado
    const storedOTP = await this.otpService.findByEmail(normalizedEmail, 'register');

    if (!storedOTP) {
      throw new Error('Código de verificación no encontrado o expirado');
    }

    // [3] Verificar si el OTP es válido
    if (!storedOTP.isValid()) {
      if (storedOTP.isExpired()) {
        await this.otpService.delete(normalizedEmail, 'register');
        throw new Error('El código de verificación ha expirado');
      }
      if (storedOTP.hasExceededAttempts()) {
        await this.otpService.delete(normalizedEmail, 'register');
        throw new Error('Has excedido el número máximo de intentos');
      }
      if (storedOTP.isUsed) {
        throw new Error('Este código ya ha sido utilizado');
      }
    }

    // [4] Comparar OTP
    const isValid = await this.otpService.compare(otp, storedOTP.otpHash);

    if (!isValid) {
      // Incrementar intentos
      storedOTP.incrementAttempts();
      await this.otpService.store(storedOTP);

      const remaining = 5 - storedOTP.attempts;
      throw new Error(
        `Código incorrecto. Te quedan ${remaining} intento(s)`
      );
    }

    // [5] Marcar OTP como usado
    storedOTP.markAsUsed();
    await this.otpService.store(storedOTP);

    // [6] Actualizar usuario: is_verified = true
    await this.userService.verifyUser(normalizedEmail);

    // [7] Obtener datos del usuario actualizado
    const user = await this.userService.findByEmail(normalizedEmail);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // [8] Generar JWT
    const token = this.tokenService.generate({
      userId: user.id,
      email: user.email,
    });

    // [9] Enviar email de bienvenida (async, no bloquear)
    this.emailService.sendWelcomeEmail(user.email, user.name).catch(err => {
      console.error('Error sending welcome email:', err);
    });

    // [10] Eliminar OTP
    await this.otpService.delete(normalizedEmail, 'register');

    // [11] Retornar token y usuario
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
