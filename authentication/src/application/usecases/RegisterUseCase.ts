import { IHashService } from '../../domain/interfaces/IHashService';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { AuthResult } from '../../domain/entities/Auth';

export class RegisterUseCase {
  constructor(
    private hashService: IHashService,
    private tokenService: ITokenService,
    private userService: IUserService
  ) {}

  async execute(name: string, email: string, password: string): Promise<AuthResult> {
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const hashedPassword = await this.hashService.hash(password);

    const user = await this.userService.create(name, email, hashedPassword);

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
