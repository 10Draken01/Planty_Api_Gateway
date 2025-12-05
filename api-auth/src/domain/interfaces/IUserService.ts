export interface IUserService {
  findByEmail(email: string): Promise<any>;
  create(name: string, email: string, hashedPassword: string, isVerified: boolean): Promise<any>;
  verifyUser(email: string): Promise<any>;
}
