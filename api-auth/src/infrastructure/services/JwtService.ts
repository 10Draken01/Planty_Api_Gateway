import jwt from 'jsonwebtoken';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { AuthPayload } from '../../domain/entities/Auth';

export class JwtService implements ITokenService {
  private secret: string;
  private expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'secret';
    this.expiresIn = process.env.JWT_EXPIRATION || '24h';
  }

  generate(payload: AuthPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verify(token: string): AuthPayload | null {
    try {
      return jwt.verify(token, this.secret) as AuthPayload;
    } catch {
      return null;
    }
  }
}
