import axios from 'axios';
import { IUserService } from '../../domain/interfaces/IUserService';

export class UserHttpService implements IUserService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.USERS_SERVICE_URL || 'http://localhost:3001/api';
  }

  async findByEmail(email: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/email/${email}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.log('status code:', error.response?.status);
      throw error;
    }
  }

  async create(name: string, email: string, hashedPassword: string, isVerified: boolean): Promise<any> {
    const response = await axios.post(`${this.baseURL}/create`, {
      name,
      email,
      password: hashedPassword,
      is_verified: isVerified
    });
    return response.data;
  }

  async verifyUser(email: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseURL}/verify`, {
        email
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Usuario no encontrado');
      }
      throw error;
    }
  }
}
