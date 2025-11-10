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

    const res = await this.userService.create(name, email, hashedPassword);

    const token = this.tokenService.generate({
      userId: res.data.id,
      email: res.data.email
    });

    return {
      token,
      user: {
        ...res.data,
        password: undefined
      }
    };
  }
}
