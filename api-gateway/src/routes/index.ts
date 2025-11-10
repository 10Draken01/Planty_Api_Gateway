import { Router } from 'express';
import { userServiceProxy, authServiceProxy, protectedChatbotProxy } from '../services/proxy';
import { validateTokenWithAuthService } from '../middleware/validateTokenWithAuthService';

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

// Ruta protegida específica para /chatbot/chat/message
// Esta debe ir ANTES de la ruta general del chatbot para que tome prioridad
router.use('/chat/message', validateTokenWithAuthService, protectedChatbotProxy);

export default router;