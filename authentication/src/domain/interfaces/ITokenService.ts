import { AuthPayload } from '../entities/Auth';

export interface ITokenService {
  generate(payload: AuthPayload): string;
  verify(token: string): AuthPayload | null;
}
