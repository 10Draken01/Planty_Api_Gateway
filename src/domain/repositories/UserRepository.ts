import { User } from '../entities/User.js';

export interface UserRepository {

  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;


  findById(id: string): Promise<User | null>;
  findAll(limit?: number, offset?: number): Promise<User[]>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<boolean>;


  countUsers(): Promise<number>;
  existsByEmail(email: string): Promise<boolean>;
  existsById(id: string): Promise<boolean>;

  // Método para verificar usuario (2FA)
  verifyUser(email: string): Promise<User | null>;

  // Método para obtener usuarios por rango de fechas (para ML)
  findByDateRange(startDate: Date, endDate: Date): Promise<User[]>;
}