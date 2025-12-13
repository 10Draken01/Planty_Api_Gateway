import { ITokenService } from '../../domain/interfaces/ITokenService';
import { AuthPayload } from '../../domain/entities/Auth';

/**
 * Use Case: Validar un token JWT
 *
 * Este caso de uso se utiliza para verificar si un token JWT es válido
 * y no ha expirado. Es especialmente útil para que otros microservicios
 * puedan validar tokens sin necesidad de compartir el JWT_SECRET.
 */
export class ValidateTokenUseCase {
  constructor(private tokenService: ITokenService) {}

  /**
   * Ejecuta la validación del token
   * @param token - El token JWT a validar
   * @returns El payload del token si es válido, null si es inválido
   * @throws Error si el token no se proporciona
   */
  execute(token: string): AuthPayload | null {
    if (!token || token.trim() === '') {
      throw new Error('Token no proporcionado');
    }

    // Verificar el token usando el servicio JWT
    const payload = this.tokenService.verify(token);

    return payload;
  }
}
