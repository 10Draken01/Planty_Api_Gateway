/**
 * Rutas de Documentos
 */

import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Configurar multer para subida de archivos
const uploadsDir = path.join(process.cwd(), 'uploads');

// Asegurar que el directorio existe
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024 // 50MB por defecto
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

export class DocumentRoutes {
  static create(documentController: DocumentController): Router {
    const router = Router();

    // POST /documents/upload - Subir documento
    router.post('/upload', upload.single('file'), (req, res) =>
      documentController.upload(req, res)
    );

    // POST /documents/:id/process - Procesar documento
    router.post('/:id/process', (req, res) => documentController.process(req, res));

    // GET /documents - Listar documentos
    router.get('/', (req, res) => documentController.list(req, res));

    // DELETE /documents/:id - Eliminar documento
    router.delete('/:id', (req, res) => documentController.delete(req, res));

    // GET /documents/health - Health check
    router.get('/health', (req, res) => documentController.health(req, res));

    return router;
  }
}
