import { IHashService } from '../../domain/interfaces/IHashService';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { AuthResult } from '../../domain/entities/Auth';
import { AuthValidators } from '../validators/AuthValidators';

export class LoginUseCase {
  constructor(
    private hashService: IHashService,
    private tokenService: ITokenService,
    private userService: IUserService
  ) {}

  async execute(email: string, password: string): Promise<AuthResult> {
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
    // [5] VALIDACIONES ADICIONALES DE CUENTA
    // ============================================
    // Aquí podrías agregar validaciones adicionales como:
    // - Verificar si la cuenta está activa
    // - Verificar si la cuenta está bloqueada
    // - Verificar si requiere verificación de email
    // Ejemplo:
    // if (user.status === 'disabled') {
    //   throw new Error('Tu cuenta ha sido deshabilitada. Contacta al soporte');
    // }
    // if (!user.emailVerified) {
    //   throw new Error('Debes verificar tu email antes de iniciar sesión');
    // }

    // ============================================
    // [6] GENERAR TOKEN JWT
    // ============================================
    const token = this.tokenService.generate({
      userId: user.id,
      email: user.email
    });

    // ============================================
    // [7] RETORNAR RESULTADO
    // ============================================
    return {
      token,
      user: {
        ...user,
        password: undefined // Nunca retornar la contraseña
      }
    };
  }
}
