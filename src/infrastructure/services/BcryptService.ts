import bcrypt from 'bcryptjs';
import { IHashService } from '../../domain/interfaces/IHashService';

export class BcryptService implements IHashService {
  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, 10);
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    return bcrypt.compare(value, hashedValue);
  }
}
