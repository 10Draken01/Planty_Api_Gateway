import { Router } from 'express';
import { userServiceProxy, authServiceProxy, chatbotServiceProxy } from '../services/proxy';

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
router.use('/chatbot', chatbotServiceProxy);

export default router;