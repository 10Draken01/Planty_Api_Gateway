// Repositories
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository';
import { MongoConversationRepository } from '../../infrastructure/repositories/MongoConversationRepository';
import { MongoUserMemoryRepository } from '../../infrastructure/repositories/MongoUserMemoryRepository';

// Use Cases
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { GetUserByIdUseCase } from '../../application/use-cases/GetUserByIdUseCase';
import { GetUserByEmailUseCase } from '../../application/use-cases/GetUserByEmailUseCase';
import { UpdateUserByIdUseCase } from '../../application/use-cases/UpdateUserByIdUseCase';
import { DeleteUserByIdUseCase } from '../../application/use-cases/DeleteUserByIdUseCase';
import { UpdateTokenFCMUseCase } from '../../application/use-cases/UpdateTokenFCMUseCase';
import { VerifyUserUseCase } from '../../application/use-cases/VerifyUserUseCase';
import { UpdateExperienceLevelUseCase } from '../../application/use-cases/UpdateExperienceLevelUseCase';
import { SeedUsersUseCase } from '../../application/use-cases/SeedUsersUseCase';
import { ListUsersUseCase } from '../../application/use-cases/ListUsersUseCase';
import { GetUsersByDateRangeUseCase } from '../../application/use-cases/GetUsersByDateRangeUseCase';

// Services
import { MemoryService } from '../../application/services/MemoryService';

// Controllers
import { UserController } from '../../presentation/controllers/UserController';
import { MemoryController } from '../../presentation/controllers/MemoryController';
import { SeedController } from '../../presentation/controllers/SeedController';

// Routes
import { UserRoutes } from '../../presentation/routes/UserRoutes';
import { MemoryRoutes } from '../../presentation/routes/MemoryRoutes';
import { DatabaseConnection } from '../database/DatabaseConnection';
import { Router } from 'express';
export class DependencyContainer {
  // Repositories
  private userRepository: MongoUserRepository;
  private conversationRepository: MongoConversationRepository;
  private userMemoryRepository: MongoUserMemoryRepository;

  // Use Cases
  private createUserUseCase: CreateUserUseCase
  private getUserByIdUseCase: GetUserByIdUseCase
  private getUserByEmailUseCase: GetUserByEmailUseCase
  private updateUserByIdUseCase: UpdateUserByIdUseCase
  private deleteUserByIdUseCase: DeleteUserByIdUseCase
  private updateTokenFCMUseCase: UpdateTokenFCMUseCase
  private verifyUserUseCase: VerifyUserUseCase
  private updateExperienceLevelUseCase: UpdateExperienceLevelUseCase
  private seedUsersUseCase: SeedUsersUseCase
  private listUsersUseCase: ListUsersUseCase
  private getUsersByDateRangeUseCase: GetUsersByDateRangeUseCase

  // Services
  private memoryService: MemoryService;


  constructor(
    mongoRootUser: string,
    mongoRootPassword: string,
    mongoDbName: string
  ) {
    // Repositories
    this.initDatabaseConnection(
      mongoRootUser, 
      mongoRootPassword,
      mongoDbName
    );

    this.userRepository = new MongoUserRepository();
    this.conversationRepository = new MongoConversationRepository();
    this.userMemoryRepository = new MongoUserMemoryRepository();

    // Services
    this.memoryService = new MemoryService(
      this.conversationRepository,
      this.userMemoryRepository,
      this.userRepository
    );

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

    this.updateTokenFCMUseCase = new UpdateTokenFCMUseCase(
      this.userRepository
    );

    this.verifyUserUseCase = new VerifyUserUseCase(
      this.userRepository
    );

    this.updateExperienceLevelUseCase = new UpdateExperienceLevelUseCase(
      this.userRepository
    );

    this.seedUsersUseCase = new SeedUsersUseCase(
      this.userRepository
    );

    this.listUsersUseCase = new ListUsersUseCase(
      this.userRepository
    );

    this.getUsersByDateRangeUseCase = new GetUsersByDateRangeUseCase(
      this.userRepository
    );

  }
  private async initDatabaseConnection(
    mongoRootUser: string,
    mongoRootPassword: string,
    mongoDbName: string
  ): Promise<void> {
    await DatabaseConnection.connect(mongoRootUser, mongoRootPassword, mongoDbName); 
  }
  
  createUserRoutes(): UserRoutes {

    // Controller con todos los casos de uso
    const userController = new UserController(
      this.createUserUseCase,
      this.getUserByIdUseCase,
      this.getUserByEmailUseCase,
      this.updateUserByIdUseCase,
      this.deleteUserByIdUseCase,
      this.updateTokenFCMUseCase,
      this.verifyUserUseCase,
      this.updateExperienceLevelUseCase,
      this.listUsersUseCase,
      this.getUsersByDateRangeUseCase
    );

    // Seed controller
    const seedController = new SeedController(this.seedUsersUseCase);

    // Routes
    return new UserRoutes(userController, seedController);
  }

  createMemoryRoutes(): Router {
    // Controller con el servicio de memoria
    const memoryController = new MemoryController(this.memoryService);

    // Routes
    return MemoryRoutes.create(memoryController);
  }
}