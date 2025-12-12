import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  usersServiceUrl: string;
  firebaseServiceAccountPath: string;
  logLevel: string;
}

const config: EnvironmentConfig = {
  port: parseInt(process.env.PORT || '3005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  usersServiceUrl: process.env.USERS_SERVICE_URL || 'http://localhost:3001',
  firebaseServiceAccountPath:
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, '../../config/firebase-service-account.json'),
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;
