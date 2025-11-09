import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';



export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  experience_level?: number; 
  profile_image?: string; 
  historyTimeUse_ids?: string[]; 
}

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(request: CreateUserRequest): Promise<User> {
    
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }
      console.log(request);

    // Validar nivel de experiencia si se proporciona
    if (request.experience_level && (request.experience_level < 1 || request.experience_level > 4)) {
      throw new Error('El nivel de experiencia debe estar entre 1 y 4');
    }

   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new Error('Formato de email inválido');
    }

    // Validar que el nombre no esté vacío
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('El nombre es requerido');
    }

    // Validar longitud mínima de contraseña
    if (request.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

   

    const user = new User({
      name: request.name.trim(),
      email: request.email.toLowerCase(),
      password: request.password,
      experience_level: request.experience_level || 1,
      profile_image: request.profile_image,
      historyTimeUse_ids: request.historyTimeUse_ids || []
    });


    return await this.userRepository.save(user);
  }
}