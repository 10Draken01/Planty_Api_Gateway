import { createProxyMiddleware } from 'http-proxy-middleware';

export const userServiceProxy = createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/users': '/api' },
});

export const authServiceProxy = createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  logLevel: 'debug',

  onProxyReq: (proxyReq, req) => {
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
});

/**
 * Proxy para rutas protegidas del chatbot
 * Se usa para /chatbot/chat/message que requiere autenticación
 */
export const protectedChatbotProxy = createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/chat/message': '/chat/message' },
  logLevel: 'debug',

  onProxyReq: (proxyReq, req) => {
    // Pasar información del usuario autenticado al microservicio
    const user = (req as any).user;
    if (user) {
      proxyReq.setHeader('X-User-Id', user.userId);
      proxyReq.setHeader('X-User-Email', user.email);
    }

    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
});

/**
 * Proxy para el servicio de Orchards
 * Redirige todas las peticiones a /orchards al microservicio api-orchard
 */
export const orchardServiceProxy = createProxyMiddleware({
  target: process.env.ORCHARD_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/orchards': '/orchards' },
  logLevel: 'debug',

  onProxyReq: (proxyReq, req) => {
    // Pasar información del usuario autenticado al microservicio (si existe)
    const user = (req as any).user;
    if (user) {
      proxyReq.setHeader('X-User-Id', user.userId);
      proxyReq.setHeader('X-User-Email', user.email);
    }

    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
});

/**
 * Proxy para el servicio de Algoritmo Genético (PlantGen)
 * Redirige todas las peticiones a /algorithm-gen al microservicio de Python
 */
export const algorithmGenServiceProxy = createProxyMiddleware({
  target: process.env.ALGORITHM_GEN_SERVICE_URL || 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: { '^/api/algorithm-gen': '/algorithm_gen' },
  logLevel: 'debug',

  onProxyReq: (proxyReq, req) => {
    // Pasar información del usuario autenticado al microservicio (si existe)
    const user = (req as any).user;
    if (user) {
      proxyReq.setHeader('X-User-Id', user.userId);
      proxyReq.setHeader('X-User-Email', user.email);
    }

    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
});

/**
 * Proxy para el servicio de Plants
 * Redirige todas las peticiones a /plants al microservicio api-plants
 */
export const plantServiceProxy = createProxyMiddleware({
  target: process.env.PLANT_SERVICE_URL || 'http://localhost:3006',
  changeOrigin: true,
  pathRewrite: { '^/api/plants': '/plants' },
  logLevel: 'debug',

  onProxyReq: (proxyReq, req) => {
    // Pasar información del usuario autenticado al microservicio (si existe)
    const user = (req as any).user;
    if (user) {
      proxyReq.setHeader('X-User-Id', user.userId);
      proxyReq.setHeader('X-User-Email', user.email);
    }

    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
});
