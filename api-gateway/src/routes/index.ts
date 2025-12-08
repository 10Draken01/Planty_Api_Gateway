import { Router } from 'express';
import { userServiceProxy, authServiceProxy, protectedChatbotProxy, orchardServiceProxy, algorithmGenServiceProxy, plantServiceProxy } from '../services/proxy';
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
router.use('/users', validateTokenWithAuthService, userServiceProxy);

// Ruta protegida específica para /chatbot/chat/message
// Esta debe ir ANTES de la ruta general del chatbot para que tome prioridad
router.use('/chat/message', validateTokenWithAuthService, protectedChatbotProxy);

// Ruta para el servicio de Orchards
// Puedes descomentar validateTokenWithAuthService si quieres que requiera autenticación
router.use('/orchards', validateTokenWithAuthService, orchardServiceProxy);
// router.use('/orchards', validateTokenWithAuthService, orchardServiceProxy); // Con autenticación

// Ruta para el servicio de Algoritmo Genético (PlantGen)
// Sin autenticación por defecto
router.use('/algorithm-gen', validateTokenWithAuthService, algorithmGenServiceProxy);
// router.use('/algorithm-gen', validateTokenWithAuthService, algorithmGenServiceProxy); // Con autenticación

// Ruta para el servicio de Plants (Catálogo de plantas)
// Con autenticación para acceder al catálogo de plantas
router.use('/plants', validateTokenWithAuthService, plantServiceProxy);

export default router;