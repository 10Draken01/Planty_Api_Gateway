import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export interface DateRangeParams {
  startDate: Date;
  endDate: Date;
}

export class GetUsersByDateRangeUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(params: DateRangeParams): Promise<User[]> {
    const { startDate, endDate } = params;

    // Validar que startDate sea anterior a endDate
    if (startDate >= endDate) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    // Validar que las fechas no sean futuras
    const now = new Date();
    if (startDate > now || endDate > now) {
      throw new Error('Las fechas no pueden ser futuras');
    }

    // Obtener usuarios por rango de fechas desde el repositorio
    const users = await this.userRepository.findByDateRange(startDate, endDate);

    return users;
  }
}
