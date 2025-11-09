import { IHashService } from '../../domain/interfaces/IHashService';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { AuthResult } from '../../domain/entities/Auth';

export class LoginUseCase {
  constructor(
    private hashService: IHashService,
    private tokenService: ITokenService,
    private userService: IUserService
  ) {}

  async execute(email: string, password: string): Promise<AuthResult> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isValid = await this.hashService.compare(password, user.password);

    if (!isValid) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.tokenService.generate({
      userId: user.id,
      email: user.email
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }
}
