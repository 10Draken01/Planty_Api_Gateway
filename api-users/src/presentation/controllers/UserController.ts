import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { GetUserByIdUseCase } from'../../application/use-cases/GetUserByIdUseCase';
import { GetUserByEmailUseCase } from '../../application/use-cases/GetUserByEmailUseCase';
import { UpdateUserByIdUseCase } from '../../application/use-cases/UpdateUserByIdUseCase';
import { DeleteUserByIdUseCase } from '../../application/use-cases/DeleteUserByIdUseCase';


export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getUserByIdUseCase: GetUserByIdUseCase,
    private getUserByEmailUseCase: GetUserByEmailUseCase,
    private updateUserByIdUseCase: UpdateUserByIdUseCase,
    private deleteUserByIdUseCase: DeleteUserByIdUseCase
  ) {}

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { 
        name, 
        email, 
        password, 
        experience_level, 
        profile_image, 
        historyTimeUse_ids 
      } = req.body;

      // Validar campos requeridos
      if (!name || !email || !password) {
        res.status(400).json({ 
          message: 'Name, email y password son obligatorios',
          status: 400 
        });
        return;
      }

      // Ejecutar caso de uso
      const user = await this.createUserUseCase.execute({
        name,
        email,
        password,
        experience_level,
        profile_image,
        historyTimeUse_ids
      });

      // Respuesta exitosa
      res.status(201).json({
        message: 'Usuario creado exitosamente',
        status: 201,
        data: user.toJSON() // No incluye la contraseña
      });

    } catch (error: any) {
      // Manejo de errores específicos
      if (error.message === 'El usuario ya existe') {
        res.status(409).json({ 
          message: error.message, 
          status: 409 
        });
        return;
      }

      if (error.message === 'El nivel de experiencia debe estar entre 1 y 4') {
        res.status(400).json({ 
          message: error.message, 
          status: 400 
        });
        return;
      }

      if (error.message === 'Formato de email inválido') {
        res.status(400).json({ 
          message: error.message, 
          status: 400 
        });
        return;
      }

      if (error.message === 'El nombre es requerido') {
        res.status(400).json({ 
          message: error.message, 
          status: 400 
        });
        return;
      }

      if (error.message === 'La contraseña debe tener al menos 6 caracteres') {
        res.status(400).json({ 
          message: error.message, 
          status: 400 
        });
        return;
      }

      // Error genérico del servidor
      res.status(500).json({ 
        message: 'Error en el servidor', 
        error: error.message, 
        status: 500 
      });
    }
  }



  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Ejecutar caso de uso
      const user = await this.getUserByIdUseCase.execute({ id });

      // Respuesta exitosa
      res.status(200).json({
        message: 'Usuario encontrado',
        status: 200,
        data: user.toJSON() // No incluye la contraseña
      });

    } catch (error: any) {
      // Manejo de errores específicos
      if (error.message === 'Usuario no encontrado') {
        res.status(404).json({
          message: error.message,
          status: 404
        });
        return;
      }

      if (error.message === 'El ID del usuario es requerido') {
        res.status(400).json({
          message: error.message,
          status: 400
        });
        return;
      }

      // Error genérico del servidor
      res.status(500).json({
        message: 'Error en el servidor',
        error: error.message,
        status: 500
      });
    }
  }

  /**
   * Obtiene un usuario por su email
   * Endpoint usado por el servicio de autenticación
   */
  async getUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;

      // Ejecutar caso de uso
      const user = await this.getUserByEmailUseCase.execute({ email });

      // Respuesta exitosa - INCLUYE la contraseña para validación de autenticación
      res.status(200).json({
        id: user.id,
        email: user.email,
        password: user.password, // Necesario para validar credenciales
        name: user.name
      });

    } catch (error: any) {
      // Manejo de errores específicos
      if (error.message === 'Usuario no encontrado') {
        res.status(404).json({
          message: error.message,
          status: 404
        });
        return;
      }

      if (error.message === 'El email es requerido') {
        res.status(400).json({
          message: error.message,
          status: 400
        });
        return;
      }

      // Error genérico del servidor
      res.status(500).json({
        message: 'Error en el servidor',
        error: error.message,
        status: 500
      });
    }
  }


  async updateUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        name, 
        email, 
        password, 
        experience_level, 
        profile_image 
      } = req.body;

      // Ejecutar caso de uso
      const user = await this.updateUserByIdUseCase.execute({
        id,
        name,
        email,
        password,
        experience_level,
        profile_image
      });

      // Respuesta exitosa
      res.status(200).json({
        message: 'Usuario actualizado exitosamente',
        status: 200,
        data: user.toJSON() // No incluye la contraseña
      });

    } catch (error: any) {
      // Manejo de errores específicos
      if (error.message === 'Usuario no encontrado') {
        res.status(404).json({
          message: error.message,
          status: 404
        });
        return;
      }

      if (error.message === 'El ID del usuario es requerido') {
        res.status(400).json({
          message: error.message,
          status: 400
        });
        return;
      }

      if (error.message === 'El email ya está en uso por otro usuario') {
        res.status(409).json({
          message: error.message,
          status: 409
        });
        return;
      }

      if (error.message === 'Formato de email inválido') {
        res.status(400).json({
          message: error.message,
          status: 400
        });
        return;
      }

      if (error.message === 'El nombre no puede estar vacío' || 
          error.message === 'El nombre debe tener al menos 2 caracteres') {
        res.status(400).json({
          message: error.message,
          status: 400
        });
        return;
      }

      if (error.message === 'La contraseña debe tener al menos 6 caracteres') {
        res.status(400).json({
          message: error.message,
          status: 400
        });
        return;
      }

      // Error genérico del servidor
      res.status(500).json({
        message: 'Error en el servidor',
        error: error.message,
        status: 500
      });
    }
  }


  async deleteUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Ejecutar caso de uso
      await this.deleteUserByIdUseCase.execute({ id });

      // Respuesta exitosa
      res.status(200).json({
        message: 'Usuario eliminado exitosamente',
        status: 200
      });

    } catch (error: any) {
      // Manejo de errores específicos
      if (error.message === 'Usuario no encontrado') {
        res.status(404).json({
          message: error.message,
          status: 404
        });
        return;
      }

      if (error.message === 'El ID del usuario es requerido') {
        res.status(400).json({
          message: error.message,
          status: 400
        });
        return;
      }

      if (error.message === 'Error al eliminar el usuario') {
        res.status(500).json({
          message: error.message,
          status: 500
        });
        return;
      }

      // Error genérico del servidor
      res.status(500).json({
        message: 'Error en el servidor',
        error: error.message,
        status: 500
      });
    }
  }
}




