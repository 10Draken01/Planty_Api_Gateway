import { IOTPService } from '../../domain/interfaces/IOTPService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { AuthResult } from '../../domain/entities/Auth';

/**
 * Caso de Uso: Verificar OTP de Login
 * Valida el código OTP enviado por email y completa el inicio de sesión
 */

export class VerifyLogin2FAUseCase {
  constructor(
    private otpService: IOTPService,
    private userService: IUserService,
    private tokenService: ITokenService
  ) {}

  async execute(sessionId: string, otp: string): Promise<AuthResult> {
    // [1] Buscar OTP por sessionId
    const storedOTP = await this.otpService.findBySessionId(sessionId);

    if (!storedOTP) {
      throw new Error('Sesión no encontrada o expirada');
    }

    // [2] Verificar si el OTP es válido
    if (!storedOTP.isValid()) {
      if (storedOTP.isExpired()) {
        await this.otpService.delete(storedOTP.email, 'login');
        throw new Error('La sesión ha expirado');
      }
      if (storedOTP.hasExceededAttempts()) {
        await this.otpService.delete(storedOTP.email, 'login');
        throw new Error('Has excedido el número máximo de intentos');
      }
      if (storedOTP.isUsed) {
        throw new Error('Este código ya ha sido utilizado');
      }
    }

    // [3] Comparar OTP
    const isValid = await this.otpService.compare(otp, storedOTP.otpHash);

    if (!isValid) {
      storedOTP.incrementAttempts();
      await this.otpService.store(storedOTP);

      const remaining = 5 - storedOTP.attempts;
      throw new Error(
        `Código incorrecto. Te quedan ${remaining} intento(s)`
      );
    }

    // [4] Marcar OTP como usado
    storedOTP.markAsUsed();
    await this.otpService.store(storedOTP);

    // [5] Obtener datos del usuario
    const user = await this.userService.findByEmail(storedOTP.email);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // [6] Verificar que la cuenta esté verificada
    if (!user.is_verified) {
      throw new Error('La cuenta no ha sido verificada');
    }

    // [7] Generar JWT
    const token = this.tokenService.generate({
      userId: user.id,
      email: user.email,
    });

    // [8] Eliminar OTP
    await this.otpService.delete(storedOTP.email, 'login');

    // [9] Retornar token y usuario
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
