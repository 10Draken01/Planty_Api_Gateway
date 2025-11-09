import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/presentation/routes/AuthRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/auth/health', (req, res) => {
  res.json({ status: 'OK', service: 'Authentication Service' });
});

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Authentication Service running on port ${PORT}`);
});
