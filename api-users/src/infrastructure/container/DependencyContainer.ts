// Repositories
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository';

// Use Cases
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { GetUserByIdUseCase } from '../../application/use-cases/GetUserByIdUseCase';
import { GetUserByEmailUseCase } from '../../application/use-cases/GetUserByEmailUseCase';
import { UpdateUserByIdUseCase } from '../../application/use-cases/UpdateUserByIdUseCase';
import { DeleteUserByIdUseCase } from '../../application/use-cases/DeleteUserByIdUseCase'; 

// Controllers
import { UserController } from '../../presentation/controllers/UserController';

// Routes
import { UserRoutes } from '../../presentation/routes/UserRoutes';
import { DatabaseConnection } from '../database/DatabaseConnection';
export class DependencyContainer {
  private userRepository: MongoUserRepository;

  private createUserUseCase: CreateUserUseCase
  private getUserByIdUseCase: GetUserByIdUseCase
  private getUserByEmailUseCase: GetUserByEmailUseCase
  private updateUserByIdUseCase: UpdateUserByIdUseCase
  private deleteUserByIdUseCase: DeleteUserByIdUseCase


  constructor(
    mongoRootUser: string,
    mongoRootPassword: string
  ) {
    // Repositories
    this.initDatabaseConnection(
      mongoRootUser, 
      mongoRootPassword
    );

    this.userRepository = new MongoUserRepository();
    
    // Use Cases
    this.createUserUseCase = new CreateUserUseCase(
      this.userRepository
    );

    this.getUserByIdUseCase = new GetUserByIdUseCase(
      this.userRepository
    );

    this.getUserByEmailUseCase = new GetUserByEmailUseCase(
      this.userRepository
    );

    this.updateUserByIdUseCase = new UpdateUserByIdUseCase(
      this.userRepository
    );

    this.deleteUserByIdUseCase = new DeleteUserByIdUseCase(
      this.userRepository
    );

  }
  private async initDatabaseConnection(
    mongoRootUser: string,
    mongoRootPassword: string
  ): Promise<void> {
    await DatabaseConnection.connect(mongoRootUser, mongoRootPassword); 
  }
  
  createUserRoutes(): UserRoutes {

    // Controller con todos los casos de uso
    const userController = new UserController(
      this.createUserUseCase,
      this.getUserByIdUseCase,
      this.getUserByEmailUseCase,
      this.updateUserByIdUseCase,
      this.deleteUserByIdUseCase
    );
    
    // Routes
    return new UserRoutes(userController);
  }
}