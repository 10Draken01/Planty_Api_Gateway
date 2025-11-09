import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ service: 'API Gateway', version: '1.0.0' });
});

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

export default app;