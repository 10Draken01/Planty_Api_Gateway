import { IHashService } from '../../domain/interfaces/IHashService';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { AuthResult } from '../../domain/entities/Auth';
import { AuthValidators } from '../validators/AuthValidators';

export class RegisterUseCase {
  constructor(
    private hashService: IHashService,
    private tokenService: ITokenService,
    private userService: IUserService
  ) {}

  async execute(name: string, email: string, password: string): Promise<AuthResult> {
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
    // [5] CREAR USUARIO
    // ============================================
    const res = await this.userService.create(
      sanitizedName,
      normalizedEmail,
      hashedPassword
    );

    // ============================================
    // [6] GENERAR TOKEN JWT
    // ============================================
    const token = this.tokenService.generate({
      userId: res.data.id,
      email: res.data.email
    });

    // ============================================
    // [7] RETORNAR RESULTADO
    // ============================================
    return {
      token,
      user: {
        ...res.data,
        password: undefined // Nunca retornar la contraseña
      }
    };
  }
}
