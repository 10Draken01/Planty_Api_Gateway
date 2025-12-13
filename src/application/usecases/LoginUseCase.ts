import { IHashService } from '../../domain/interfaces/IHashService';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { IOTPService } from '../../domain/interfaces/IOTPService';
import { IEmailService } from '../../domain/interfaces/IEmailService';
import { AuthResult } from '../../domain/entities/Auth';
import { Login2FARequiredDTO } from '../dtos/AuthDTOs';
import { AuthValidators } from '../validators/AuthValidators';
import { OTP } from '../../domain/entities/OTP';
import crypto from 'crypto';

export class LoginUseCase {
  constructor(
    private hashService: IHashService,
    private tokenService: ITokenService,
    private userService: IUserService,
    private otpService: IOTPService,
    private emailService: IEmailService
  ) {}

  async execute(email: string, password: string): Promise<Login2FARequiredDTO> {
    // ============================================
    // [1] VALIDACIÓN DE DATOS
    // ============================================
    const validation = AuthValidators.validateLogin(email, password);

    if (!validation.isValid) {
      // No revelar detalles específicos en el login por seguridad
      throw new Error('Credenciales inválidas');
    }

    // ============================================
    // [2] NORMALIZAR EMAIL
    // ============================================
    const normalizedEmail = AuthValidators.normalizeEmail(email);

    // ============================================
    // [3] BUSCAR USUARIO
    // ============================================
    const user = await this.userService.findByEmail(normalizedEmail);

    if (!user) {
      // Mensaje genérico para no revelar si el usuario existe o no
      throw new Error('Credenciales inválidas');
    }

    // ============================================
    // [4] VERIFICAR CONTRASEÑA
    // ============================================
    const isValid = await this.hashService.compare(password, user.password);

    if (!isValid) {
      // Mensaje genérico para no revelar cuál campo es incorrecto
      throw new Error('Credenciales inválidas');
    }

    // ============================================
    // [5] VERIFICAR QUE LA CUENTA ESTÉ VERIFICADA
    // ============================================
    if (!user.is_verified) {
      throw new Error('Tu cuenta no ha sido verificada. Por favor, verifica tu email.');
    }

    // ============================================
    // [6] GENERAR SESSION ID ÚNICO
    // ============================================
    const sessionId = crypto.randomUUID();

    // ============================================
    // [7] GENERAR OTP (código de 6 dígitos)
    // ============================================
    const otpCode = this.otpService.generate();
    const otpHash = await this.otpService.hash(otpCode);

    // ============================================
    // [8] CREAR Y ALMACENAR ENTIDAD OTP
    // ============================================
    const otp = OTP.create({
      email: normalizedEmail,
      otpHash,
      purpose: 'login',
      sessionId,
    });
    await this.otpService.store(otp);

    // ============================================
    // [9] ENVIAR EMAIL CON OTP
    // ============================================
    try {
      await this.emailService.sendOTP(normalizedEmail, otpCode, 'login');
    } catch (error) {
      // Si falla el envío, eliminar el OTP
      await this.otpService.delete(normalizedEmail, 'login');
      console.error('Error sending OTP email:', error);
      throw new Error('No se pudo enviar el correo de verificación. Intenta de nuevo.');
    }

    // ============================================
    // [10] RETORNAR RESPUESTA (SIN TOKEN)
    // ============================================
    return {
      require2FA: true,
      sessionId,
      message: 'Código de verificación enviado a tu email',
      expiresIn: 300, // 5 minutos
    };
  }
}
