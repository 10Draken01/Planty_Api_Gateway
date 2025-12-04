export interface IUserService {
  findByEmail(email: string): Promise<any>;
  create(name: string, email: string, hashedPassword: string): Promise<any>;
}
