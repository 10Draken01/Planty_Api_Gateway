import { Router } from 'express';
import { userServiceProxy, authServiceProxy } from '../services/proxy';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'API Gateway',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authServiceProxy);
router.use('/users', userServiceProxy);

export default router;