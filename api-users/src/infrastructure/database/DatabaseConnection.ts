import mongoose from 'mongoose';

export class DatabaseConnection {

  static async connect(mongoRootUser: string, mongoRootPassword: string): Promise<void> {
    try {
      const mongoUri = `mongodb://${mongoRootUser}:${mongoRootPassword}@localhost:27017/?authSource=admin`;
      await mongoose.connect(mongoUri);
      console.log('✅ MongoDB conectado');
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      process.exit(1);
    }
  }
}