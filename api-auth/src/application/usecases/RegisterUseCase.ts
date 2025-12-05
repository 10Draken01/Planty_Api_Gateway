import { IHashService } from '../../domain/interfaces/IHashService';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { IOTPService } from '../../domain/interfaces/IOTPService';
import { IEmailService } from '../../domain/interfaces/IEmailService';
import { AuthResult } from '../../domain/entities/Auth';
import { RegisterPending2FADTO } from '../dtos/AuthDTOs';
import { AuthValidators } from '../validators/AuthValidators';
import { OTP } from '../../domain/entities/OTP';

export class RegisterUseCase {
  constructor(
    private hashService: IHashService,
    private tokenService: ITokenService,
    private userService: IUserService,
    private otpService: IOTPService,
    private emailService: IEmailService
  ) {}

  async execute(name: string, email: string, password: string): Promise<RegisterPending2FADTO> {
    // ============================================
    // [1] VALIDACIÓN COMPLETA DE DATOS
    // ============================================
    const validation = AuthValidators.validateRegistration({
      name,
      email,
      password
    });

    if (!validation.isValid) {
      throw new Error(`Errores de validación:\n- ${validation.errors.join('\n- ')}`);
    }

    // ============================================
    // [2] NORMALIZAR Y SANITIZAR DATOS
    // ============================================
    const normalizedEmail = AuthValidators.normalizeEmail(email);
    const sanitizedName = AuthValidators.sanitizeString(name);

    // ============================================
    // [3] VERIFICAR QUE EL EMAIL NO EXISTA (ÚNICO)
    // ============================================
    const existingUser = await this.userService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // ============================================
    // [4] HASHEAR CONTRASEÑA
    // ============================================
    const hashedPassword = await this.hashService.hash(password);

    // ============================================
    // [5] CREAR USUARIO (con is_verified = false)
    // ============================================
    const res = await this.userService.create(
      sanitizedName,
      normalizedEmail,
      hashedPassword,
      false  // is_verified = false (requiere verificación 2FA)
    );

    // ============================================
    // [6] GENERAR OTP (código de 6 dígitos)
    // ============================================
    const otpCode = this.otpService.generate();
    const otpHash = await this.otpService.hash(otpCode);

    // ============================================
    // [7] CREAR Y ALMACENAR ENTIDAD OTP
    // ============================================
    const otp = OTP.create({
      email: normalizedEmail,
      otpHash,
      purpose: 'register',
    });
    await this.otpService.store(otp);

    // ============================================
    // [8] ENVIAR EMAIL CON OTP
    // ============================================
    try {
      await this.emailService.sendOTP(normalizedEmail, otpCode, 'register');
    } catch (error) {
      // Si falla el envío de email, eliminar el OTP y el usuario
      await this.otpService.delete(normalizedEmail, 'register');
      console.error('Error sending OTP email:', error);
      throw new Error('No se pudo enviar el correo de verificación. Intenta de nuevo.');
    }

    // ============================================
    // [9] RETORNAR RESPUESTA (SIN TOKEN)
    // ============================================
    return {
      message: 'Registro exitoso. Verifica tu email para activar tu cuenta.',
      email: normalizedEmail,
      requiresVerification: true,
    };
  }
}
