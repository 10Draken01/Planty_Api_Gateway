// Extender los tipos de Express para incluir user en Request
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export {};