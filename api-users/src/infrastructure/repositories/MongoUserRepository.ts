import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/entities/User';
import { UserModel, UserDocument } from '../database/models/UserModel';

export class MongoUserRepository implements UserRepository {
  
  async save(user: User): Promise<User> {
    const userDocument = new UserModel({
      _id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      experience_level: user.experience_level,
      profile_image: user.profile_image,
      historyTimeUse_ids: user.historyTimeUse_ids
    });
    const savedDocument = await userDocument.save();  
    return this.toDomainEntity(savedDocument);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userDocument = await UserModel.findOne({ email: email.toLowerCase() });
    if (!userDocument) return null;
    
    return this.toDomainEntity(userDocument);
  }

  async findById(id: string): Promise<User | null> {
    const userDocument = await UserModel.findOne({ _id: id });
    if (!userDocument) return null;
    
    return this.toDomainEntity(userDocument);
  }

  async findAll(limit: number = 10, offset: number = 0): Promise<User[]> {
    const userDocuments = await UserModel
      .find()
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    return userDocuments.map(doc => this.toDomainEntity(doc));
  }

  async update(user: User): Promise<User> {
    const updateData = {
      name: user.name,
      email: user.email,
      password: user.password,
      experience_level: user.experience_level,
      profile_image: user.profile_image,
      historyTimeUse_ids: user.historyTimeUse_ids
    };

    const updatedDocument = await UserModel.findOneAndUpdate(
      { _id: user.id },
      updateData,
      { new: true }
    );

    if (!updatedDocument) {
      throw new Error(`User with id ${user.id} not found`);
    }

    return this.toDomainEntity(updatedDocument);
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async findByExperienceLevel(level: number): Promise<User[]> {
    const userDocuments = await UserModel.find({ experience_level: level });
    return userDocuments.map(doc => this.toDomainEntity(doc));
  }

  async findUsersWithOrchards(): Promise<User[]> {
    const userDocuments = await UserModel.find({ count_orchards: { $gt: 0 } });
    return userDocuments.map(doc => this.toDomainEntity(doc));
  }

  async findUsersByOrchardCount(minCount: number): Promise<User[]> {
    const userDocuments = await UserModel.find({ count_orchards: { $gte: minCount } });
    return userDocuments.map(doc => this.toDomainEntity(doc));
  }

  async countUsers(): Promise<number> {
    return await UserModel.countDocuments();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return user !== null;
  }

  async existsById(id: string): Promise<boolean> {
    const user = await UserModel.findOne({ _id: id });
    return user !== null;
  }

  private toDomainEntity(userDocument: UserDocument): User {
    return new User({
      id: userDocument._id,
      name: userDocument.name,
      email: userDocument.email,
      password: userDocument.password,
      experience_level: userDocument.experience_level,
      profile_image: userDocument.profile_image,
      createdAt: userDocument.createdAt,
      historyTimeUse_ids: userDocument.historyTimeUse_ids
    });
  }
}