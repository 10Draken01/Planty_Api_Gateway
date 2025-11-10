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
