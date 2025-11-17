# Reporte de Arquitectura - Planty API Gateway

**Fecha:** Noviembre 14, 2024
**Enfoque:** Clean Architecture + DDD + Dependency Injection

---

## 1. VISIÓN GENERAL

### Microservicios del Proyecto

- **api-gateway** (Puerto 3000) - Enrutador centralizado
- **api-users** (Puerto 3001) - Gestión de usuarios
- **authentication** (Puerto 3002) - Autenticación JWT
- **api-chatbot** (Puerto 3003) - Chat inteligente con RAG

### Tecnologías
- Express.js + TypeScript
- MongoDB (usuarios), ChromaDB (vectores)
- Ollama (LLM + embeddings)

---

## 2. ESTRUCTURA CARPETAS - API-CHATBOT

```
api-chatbot/src/
├── app.ts
├── config/
│   └── environment.ts
├── domain/
│   ├── entities/
│   │   ├── Document.ts
│   │   ├── ChatMessage.ts
│   │   └── TextChunk.ts
│   └── repositories/
│       ├── DocumentRepository.ts
│       ├── ChatRepository.ts
│       └── VectorRepository.ts
├── application/
│   ├── use-cases/
│   │   ├── UploadDocumentUseCase.ts
│   │   ├── ProcessDocumentUseCase.ts
│   │   ├── GetDocumentsUseCase.ts
│   │   ├── DeleteDocumentUseCase.ts
│   │   ├── SendMessageUseCase.ts
│   │   └── GetChatHistoryUseCase.ts
│   └── dtos/
│       ├── DocumentDTOs.ts
│       └── ChatDTOs.ts
├── infrastructure/
│   ├── container/
│   │   └── DependencyContainer.ts
│   ├── database/
│   │   └── ChromaVectorRepository.ts
│   ├── repositories/
│   │   ├── InMemoryDocumentRepository.ts
│   │   └── InMemoryChatRepository.ts
│   └── services/
│       ├── PDFService.ts
│       ├── TextSplitterService.ts
│       ├── OllamaEmbeddingService.ts
│       └── OllamaChatService.ts
└── presentation/
    ├── controllers/
    │   ├── DocumentController.ts
    │   └── ChatController.ts
    └── routes/
        ├── DocumentRoutes.ts
        └── ChatRoutes.ts
```

---

## 3. PATRONES DE ARQUITECTURA

### Clean Architecture (4 Capas)

```
PRESENTATION (Controllers)
    ↓ Depende de
APPLICATION (Use Cases)
    ↓ Depende de
DOMAIN (Entities)
    ↓ Depende de
INFRASTRUCTURE (Services, Repos)
```

**Ventajas:**
- Independencia de frameworks
- Testable
- Flexible para cambios

### Domain-Driven Design (DDD)

Entidades con identidad:
- `Document` - Estado: uploaded, processing, processed, failed
- `ChatMessage` - Mensaje de conversación
- `TextChunk` - Fragmento de PDF procesado

Cada entidad:
- Constructor privado (solo factory methods)
- Encapsula reglas de negocio
- Métodos para cambios de estado


---

## 4. DEPENDENCY CONTAINER

Ubicación: `src/infrastructure/container/DependencyContainer.ts`

Estructura:
```typescript
export class DependencyContainer {
  // 1. Repositories
  private documentRepository: InMemoryDocumentRepository;
  private chatRepository: InMemoryChatRepository;
  private vectorRepository: ChromaVectorRepository;

  // 2. Services
  private pdfService: PDFService;
  private textSplitterService: TextSplitterService;
  private embeddingService: OllamaEmbeddingService;
  private chatService: OllamaChatService;

  // 3. Use Cases
  private uploadDocumentUseCase: UploadDocumentUseCase;
  private processDocumentUseCase: ProcessDocumentUseCase;
  private getDocumentsUseCase: GetDocumentsUseCase;
  private deleteDocumentUseCase: DeleteDocumentUseCase;
  private sendMessageUseCase: SendMessageUseCase;
  private getChatHistoryUseCase: GetChatHistoryUseCase;

  // 4. Controllers
  private documentController: DocumentController;
  private chatController: ChatController;

  constructor() {
    // Inicialización ordenada de todas las dependencias
  }

  // Métodos públicos
  async initialize(): Promise<void>
  getDocumentRoutes(): Router
  getChatRoutes(): Router
  getSystemInfo(): object
  async checkServices(): Promise<object>
}
```

**Ventajas:**
- Todas las dependencias en un lugar
- Fácil de mockear para tests
- Fácil cambiar implementaciones

---

## 5. RUTAS Y CONTROLADORES

### DocumentRoutes

```typescript
export class DocumentRoutes {
  static create(documentController: DocumentController): Router {
    const router = Router();

    router.post('/upload', upload.single('file'), 
      (req, res) => documentController.upload(req, res));
    
    router.post('/:id/process', 
      (req, res) => documentController.process(req, res));
    
    router.get('/', 
      (req, res) => documentController.list(req, res));
    
    router.delete('/:id', 
      (req, res) => documentController.delete(req, res));
    
    router.get('/health', 
      (req, res) => documentController.health(req, res));
    
    router.delete('/cleanup', 
      (req, res) => documentController.cleanup(req, res));

    return router;
  }
}
```

**Configuración Multer:**
- Storage: Disco en ./uploads
- Validación: Solo PDFs
- Límite: 50MB por defecto
- Nombre único: timestamp + random suffix

### ChatRoutes

```typescript
export class ChatRoutes {
  static create(chatController: ChatController): Router {
    const router = Router();

    router.post('/message', 
      (req, res) => chatController.sendMessage(req, res));
    
    router.get('/history/:sessionId', 
      (req, res) => chatController.getHistory(req, res));
    
    router.get('/health', 
      (req, res) => chatController.health(req, res));

    return router;
  }
}
```

### Enrutamiento en app.ts

```typescript
private setupRoutes(): void {
  // Health checks
  this.app.get('/chat/health', ...);
  this.app.get('/chat/info', ...);
  
  // Rutas de documentos
  this.app.use('/chat/documents', 
    this.container.getDocumentRoutes());
  
  // Rutas de chat
  this.app.use('/chat', 
    this.container.getChatRoutes());
}
```

---

## 6. CONTROLADORES

### DocumentController

Métodos:
- `upload(req, res)` - POST /upload
- `process(req, res)` - POST /:id/process
- `list(req, res)` - GET /
- `delete(req, res)` - DELETE /:id
- `health(req, res)` - GET /health
- `cleanup(req, res)` - DELETE /cleanup

Patrón:
1. Validar entrada
2. Ejecutar use case
3. Manejo de errores
4. Retornar JSON

### ChatController

Métodos:
- `sendMessage(req, res)` - POST /message
- `getHistory(req, res)` - GET /history/:sessionId
- `health(req, res)` - GET /health

Validaciones:
- message: string no vacío
- sessionId: string requerido

---

## 7. CASOS DE USO

### UploadDocumentUseCase

```
Entrada: file (PDF), metadata (opcional)
├─ Validar: es PDF, tamaño < 50MB
├─ Verificar: no exista otro con el mismo nombre
├─ Crear Document entity
├─ Guardar en repositorio
└─ Retornar DocumentInfoDTO
```

### ProcessDocumentUseCase

```
Entrada: documentId, chunkSize (default 1000), chunkOverlap (default 200)
├─ Buscar documento
├─ Marcar estado PROCESSING
├─ Extraer texto del PDF
├─ Dividir en chunks (1000 caracteres, 200 overlap)
├─ Generar embeddings (50 en paralelo)
├─ Guardar en ChromaDB (500 chunks por lote)
├─ Marcar estado PROCESSED
└─ Retornar DocumentInfoDTO
```

Características:
- Procesamiento PARALELO de embeddings
- Lotes para eficiencia de memoria
- Logs de progreso
- Manejo de fallos con rollback

### SendMessageUseCase (RAG)

```
Entrada: message, includeContext (true), maxContextChunks (5)
├─ Validar mensaje no esté vacío
├─ Generar embedding del query
├─ Buscar top-5 chunks similares en ChromaDB
├─ Construir contexto: [Fragmento 1]...
├─ Generar respuesta con LLM
│  ├─ System Prompt: Personalidad Planty
│  ├─ User Prompt: Contexto + Pregunta
│  └─ Opciones: temp=0.8, top_p=0.9
└─ Retornar respuesta
```

---

## 8. DTOs

### DocumentDTOs

```typescript
interface UploadDocumentDTO {
  file: Express.Multer.File;
  metadata?: Record<string, any>;
}

interface ProcessDocumentDTO {
  documentId: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

interface DocumentInfoDTO {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadedAt: Date;
  processedAt?: Date;
  status: string;
  totalChunks?: number;
  metadata?: Record<string, any>;
}
```

### ChatDTOs

```typescript
interface SendMessageDTO {
  message: string;
  includeContext?: boolean;
  maxContextChunks?: number;
}

interface ChatMessageDTO {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: { sources?, relevanceScore?, tokensUsed? };
}
```


---

## 9. ENTIDADES DE DOMINIO

### Document Entity

```typescript
enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed'
}

class Document {
  private constructor(private props: DocumentProps) {}

  // Factory methods
  static create(props: Omit<...>): Document
  static fromPersistence(props: DocumentProps): Document

  // Getters
  get id(): string
  get filename(): string
  get status(): DocumentStatus
  get totalChunks(): number | undefined

  // Métodos de negocio
  markAsProcessing(): void
  markAsProcessed(totalChunks: number): void
  markAsFailed(): void
  updateMetadata(metadata: Record<string, any>): void
  isProcessed(): boolean
}
```

### ChatMessage Entity

```typescript
enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

class ChatMessage {
  static create(
    sessionId: string,
    role: MessageRole,
    content: string,
    metadata?: object
  ): ChatMessage

  // Getters
  get id(): string
  get sessionId(): string
  get role(): MessageRole
  get content(): string
  get timestamp(): Date

  // Métodos
  addMetadata(metadata: object): void
}
```

### TextChunk Entity

```typescript
class TextChunk {
  static create(
    documentId: string,
    content: string,
    chunkIndex: number,
    metadata?: object
  ): TextChunk

  get id(): string
  get documentId(): string
  get content(): string
  get embedding(): number[] | undefined

  setEmbedding(embedding: number[]): void
  hasEmbedding(): boolean
  updateMetadata(metadata: object): void
}
```

---

## 10. REPOSITORIOS

### DocumentRepository (Interfaz)

```typescript
interface DocumentRepository {
  save(document: Document): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findByFilename(filename: string): Promise<Document | null>;
  findAll(): Promise<Document[]>;
  findProcessed(): Promise<Document[]>;
  update(document: Document): Promise<Document>;
  delete(id: string): Promise<boolean>;
  exists(filename: string): Promise<boolean>;
}
```

### InMemoryDocumentRepository

```typescript
class InMemoryDocumentRepository implements DocumentRepository {
  private documents: Map<string, Document> = new Map();

  async save(document: Document): Promise<Document> {
    this.documents.set(document.id, document);
    return document;
  }

  async findById(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }
  
  // ... más métodos
}
```

Estado: En memoria (se pierden al reiniciar)

### VectorRepository (Interfaz)

```typescript
interface SearchResult {
  chunk: TextChunk;
  score: number;
  distance: number;
}

interface VectorRepository {
  initialize(): Promise<void>;
  addChunks(chunks: TextChunk[]): Promise<void>;
  searchSimilar(queryEmbedding: number[], topK?: number): Promise<SearchResult[]>;
  deleteByDocumentId(documentId: string): Promise<void>;
  getCount(): Promise<number>;
  clear(): Promise<void>;
  collectionExists(): Promise<boolean>;
  createCollection(): Promise<void>;
  getCollectionInfo(): Promise<{
    name: string;
    count: number;
    metadata?: Record<string, any>;
  }>;
}
```

### ChromaVectorRepository

```typescript
class ChromaVectorRepository implements VectorRepository {
  private client: ChromaClient;
  private collection: Collection;

  async initialize(): Promise<void>
  async addChunks(chunks: TextChunk[]): Promise<void>
  async searchSimilar(queryEmbedding: number[], topK: number = 5): Promise<SearchResult[]>
  // ... más métodos
}
```

Tecnología: ChromaDB (base de datos vectorial open-source)

---

## 11. SERVICIOS DE INFRAESTRUCTURA

### OllamaChatService

```typescript
class OllamaChatService implements IChatService {
  private ollama: Ollama;
  private model: string;  // 'llama3.2'

  async generateResponse(query: string, context: string): Promise<string>
  async generateResponseStream(query: string, context: string, onChunk: ...): Promise<void>
  async checkModelAvailability(): Promise<boolean>
  getModelInfo(): { baseUrl, model }

  private buildSystemPrompt(): string
  private buildUserPrompt(query: string, context: string): string
}
```

**System Prompt:** Define personalidad Planty 🌿 (entusiasta, amigable, ama plantas)

### OllamaEmbeddingService

```typescript
class OllamaEmbeddingService implements IEmbeddingService {
  private ollama: Ollama;
  private model: string;  // 'nomic-embed-text'

  async generateEmbedding(text: string): Promise<number[]>
  async checkModelAvailability(): Promise<boolean>
  getModelInfo(): { baseUrl, model }
}
```

Modelo: nomic-embed-text (384 dimensiones, rápido)

### PDFService

```typescript
class PDFService implements IPDFService {
  async extractText(filePath: string): Promise<string>
}
```

Librería: pdf-parse

### TextSplitterService

```typescript
class TextSplitterService implements ITextSplitter {
  splitText(
    text: string,
    chunkSize: number,
    overlap: number
  ): string[]
}
```

Divide manteniendo coherencia, con solapamiento.

---

## 12. CONFIGURACIÓN

### environment.ts

```typescript
export const config = {
  // Servidor
  port: 3003,
  nodeEnv: 'development' | 'production',
  corsOrigin: '*',

  // Ollama
  ollama: {
    baseUrl: 'http://localhost:11434',
    embeddingModel: 'nomic-embed-text',
    chatModel: 'llama3.2'
  },

  // ChromaDB
  chroma: {
    host: 'localhost',
    port: 8000,
    collectionName: 'plantas_suchiapa'
  },

  // PDF Processing
  pdf: {
    chunkSize: 1000,
    chunkOverlap: 200,
    maxFileSizeMB: 50
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,   // 15 minutos
    maxRequests: 100,
    chatMaxRequests: 20
  },

  // JWT
  jwt: {
    secret: 'your-secret-key'
  }
};
```

**Variables de Entorno:**
- PORT, NODE_ENV, CORS_ORIGIN
- OLLAMA_BASE_URL, OLLAMA_EMBEDDING_MODEL, OLLAMA_CHAT_MODEL
- CHROMA_HOST, CHROMA_PORT, CHROMA_COLLECTION_NAME
- CHUNK_SIZE, CHUNK_OVERLAP, MAX_FILE_SIZE_MB
- RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, CHAT_RATE_LIMIT_MAX


---

## 13. FLUJOS COMPLETOS

### Flujo: Subir y Procesar Documento

```
1. POST /chat/documents/upload
   ├─ Envía: archivo PDF + metadata
   ├─ Multer: Guarda en ./uploads
   └─ Response: { id, filename, status: 'uploaded' }

2. POST /chat/documents/{id}/process
   ├─ DocumentController.process()
   ├─ ProcessDocumentUseCase.execute()
   │  ├─ PDFService: Extrae texto
   │  ├─ TextSplitterService: Divide en chunks
   │  ├─ OllamaEmbeddingService: Genera embeddings (50 paralelo)
   │  ├─ ChromaVectorRepository: Inserta en ChromaDB (500 lotes)
   │  └─ Marca documento PROCESSED
   └─ Response: { id, status: 'processed', totalChunks: N }

3. GET /chat/documents
   └─ Response: { documents: [...], total: N }
```

### Flujo: Chat con RAG

```
1. POST /chat/message
   Body: {
     "message": "¿Cómo cuidar orquídeas?",
     "includeContext": true,
     "maxContextChunks": 5
   }

2. ChatController.sendMessage()
   ├─ SendMessageUseCase.execute()
   │  ├─ OllamaEmbeddingService: Query → Embedding
   │  ├─ ChromaVectorRepository.searchSimilar()
   │  │  └─ Top-5 chunks más similares
   │  ├─ Construye contexto:
   │  │  [Fragmento 1]: "Orquídeas necesitan..."
   │  │  [Fragmento 2]: "Luz indirecta..."
   │  ├─ OllamaChatService.generateResponse()
   │  │  ├─ System Prompt: Personalidad
   │  │  ├─ User Prompt: Contexto + Query
   │  │  └─ LLM genera respuesta
   │  └─ Retorna respuesta
   └─ Response: { success: true, response: "¡Excelente pregunta! 🌺..." }
```

---

## 14. CÓMO REPLICAR EN NUEVO MICROSERVICIO

### Paso 1: Estructura de Carpetas

```
nuevo-servicio/
├── src/
│   ├── app.ts
│   ├── config/environment.ts
│   ├── domain/
│   │   ├── entities/
│   │   └── repositories/
│   ├── application/
│   │   ├── use-cases/
│   │   └── dtos/
│   ├── infrastructure/
│   │   ├── container/
│   │   ├── services/
│   │   └── repositories/
│   └── presentation/
│       ├── controllers/
│       └── routes/
├── package.json
├── tsconfig.json
└── .env
```

### Paso 2: package.json

```json
{
  "name": "nuevo-servicio",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev -r tsconfig-paths/register src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^8.0.0",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0",
    "tsconfig-paths": "^4.2.0"
  }
}
```

### Paso 3: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "baseUrl": "./",
    "paths": {
      "@domain/*": ["src/domain/*"],
      "@application/*": ["src/application/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@presentation/*": ["src/presentation/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Paso 4: app.ts

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateEnvironment } from './config/environment';
import { DependencyContainer } from './infrastructure/container/DependencyContainer';

class App {
  private app: Application;
  private container: DependencyContainer;

  constructor() {
    this.app = express();
    this.container = new DependencyContainer();
  }

  async initialize(): Promise<void> {
    validateEnvironment();
    this.setupMiddlewares();
    await this.container.initialize();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    this.app.use(cors({ origin: config.corsOrigin }));
    this.app.use(helmet());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ success: true, status: 'healthy' });
    });
    
    this.app.use('/api/resource', 
      this.container.getResourceRoutes());
  }

  private setupErrorHandling(): void {
    this.app.use((err: Error, _req, res, _next) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    });
  }

  start(): void {
    this.app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  }
}

async function main() {
  const app = new App();
  await app.initialize();
  app.start();
}

main();
```


### Paso 5: Crear Entidad (domain/entities/Resource.ts)

```typescript
export interface ResourceProps {
  id: string;
  name: string;
  createdAt: Date;
}

export class Resource {
  private constructor(private props: ResourceProps) {}

  static create(props: Omit<ResourceProps, 'id' | 'createdAt'>): Resource {
    return new Resource({
      ...props,
      id: `res_${Date.now()}`,
      createdAt: new Date()
    });
  }

  static fromPersistence(props: ResourceProps): Resource {
    return new Resource(props);
  }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get createdAt(): Date { return this.props.createdAt; }

  toJSON(): ResourceProps {
    return { ...this.props };
  }
}
```

### Paso 6: Interfaz Repositorio (domain/repositories/ResourceRepository.ts)

```typescript
import { Resource } from '../entities/Resource';

export interface ResourceRepository {
  save(resource: Resource): Promise<Resource>;
  findById(id: string): Promise<Resource | null>;
  findAll(): Promise<Resource[]>;
  update(resource: Resource): Promise<Resource>;
  delete(id: string): Promise<boolean>;
}
```

### Paso 7: Implementar Repositorio (infrastructure/repositories/InMemoryResourceRepository.ts)

```typescript
import { Resource } from '@domain/entities/Resource';
import { ResourceRepository } from '@domain/repositories/ResourceRepository';

export class InMemoryResourceRepository implements ResourceRepository {
  private resources: Map<string, Resource> = new Map();

  async save(resource: Resource): Promise<Resource> {
    this.resources.set(resource.id, resource);
    return resource;
  }

  async findById(id: string): Promise<Resource | null> {
    return this.resources.get(id) || null;
  }

  async findAll(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async update(resource: Resource): Promise<Resource> {
    if (!this.resources.has(resource.id)) {
      throw new Error('Not found');
    }
    this.resources.set(resource.id, resource);
    return resource;
  }

  async delete(id: string): Promise<boolean> {
    return this.resources.delete(id);
  }
}
```

### Paso 8: Use Case (application/use-cases/CreateResourceUseCase.ts)

```typescript
import { Resource } from '@domain/entities/Resource';
import { ResourceRepository } from '@domain/repositories/ResourceRepository';
import { CreateResourceDTO } from '../dtos/ResourceDTOs';

export class CreateResourceUseCase {
  constructor(private resourceRepository: ResourceRepository) {}

  async execute(dto: CreateResourceDTO): Promise<Resource> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    const resource = Resource.create({ name: dto.name });
    return await this.resourceRepository.save(resource);
  }
}
```

### Paso 9: Controlador (presentation/controllers/ResourceController.ts)

```typescript
import { Request, Response } from 'express';
import { CreateResourceUseCase } from '@application/use-cases/CreateResourceUseCase';

export class ResourceController {
  constructor(private createResourceUseCase: CreateResourceUseCase) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.createResourceUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error'
      });
    }
  }
}
```

### Paso 10: Rutas (presentation/routes/ResourceRoutes.ts)

```typescript
import { Router } from 'express';
import { ResourceController } from '../controllers/ResourceController';

export class ResourceRoutes {
  static create(controller: ResourceController): Router {
    const router = Router();

    router.post('/', (req, res) => controller.create(req, res));
    router.get('/:id', (req, res) => controller.get(req, res));
    router.get('/', (req, res) => controller.list(req, res));
    router.put('/:id', (req, res) => controller.update(req, res));
    router.delete('/:id', (req, res) => controller.delete(req, res));

    return router;
  }
}
```

### Paso 11: DependencyContainer (infrastructure/container/DependencyContainer.ts)

```typescript
import { Router } from 'express';
import { InMemoryResourceRepository } from '../repositories/InMemoryResourceRepository';
import { CreateResourceUseCase } from '@application/use-cases/CreateResourceUseCase';
import { ResourceController } from '@presentation/controllers/ResourceController';
import { ResourceRoutes } from '@presentation/routes/ResourceRoutes';

export class DependencyContainer {
  private resourceRepository: InMemoryResourceRepository;
  private createResourceUseCase: CreateResourceUseCase;
  private resourceController: ResourceController;

  constructor() {
    this.resourceRepository = new InMemoryResourceRepository();
    this.createResourceUseCase = new CreateResourceUseCase(
      this.resourceRepository
    );
    this.resourceController = new ResourceController(
      this.createResourceUseCase
    );
  }

  async initialize(): Promise<void> {
    // Inicializar conexiones externas si es necesario
  }

  getResourceRoutes(): Router {
    return ResourceRoutes.create(this.resourceController);
  }
}
```

### Paso 12: Configuración (config/environment.ts)

```typescript
import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimit: {
    windowMs: parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || '15', 10) * 60 * 1000,
    maxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  }
};

export function validateEnvironment(): void {
  console.log('✓ Configuration loaded');
  console.log(`  - Port: ${config.port}`);
  console.log(`  - Environment: ${config.nodeEnv}`);
}
```


---

## 15. RESUMEN DE DEPENDENCIAS

```
app.ts
  └─ DependencyContainer
      ├─ Repositories
      │   └─ Use Cases
      │       └─ Controllers
      │           └─ Routes
      │               └─ HTTP Responses
      │
      ├─ Services
      │   └─ Use Cases
      │
      └─ initialize()
          └─ Conexiones externas
```

---

## 16. PATRONES IMPLEMENTADOS

1. **Clean Architecture** - 4 capas independientes
2. **Domain-Driven Design** - Entidades con identidad
3. **Dependency Injection** - DependencyContainer centralizado
4. **Repository Pattern** - Abstracción de persistencia
5. **Use Case Pattern** - Encapsulación de lógica
6. **Factory Pattern** - Static factory methods en entidades
7. **Strategy Pattern** - Múltiples implementaciones de repos

---

## 17. BUENAS PRÁCTICAS

- Entidades nunca dependen de frameworks
- Repositorios son interfaces en domain, implementaciones en infrastructure
- Controladores son delgados, solo orquestan
- DTOs transforman datos entre capas
- Dependencias fluyen hacia adentro (hacia dominio)

---

## 18. VENTAJAS DE ESTA ARQUITECTURA

- **Testable:** Cada componente se testea independientemente
- **Escalable:** Agregar funcionalidades sin modificar código existente
- **Flexible:** Cambiar BD o servicios sin afectar dominio
- **Mantenible:** Código bien organizado y responsabilidades claras
- **Reutilizable:** Use cases se pueden usar desde diferentes interfaces

---

## 19. ENDPOINTS PRINCIPALES

### Health Checks
```
GET /chat/health
GET /chat/info
GET /chat/documents/health
```

### Documentos
```
POST /chat/documents/upload
  Body: multipart/form-data { file, metadata? }

POST /chat/documents/{id}/process
  Body: { chunkSize?, chunkOverlap? }

GET /chat/documents

DELETE /chat/documents/{id}

DELETE /chat/documents/cleanup
```

### Chat
```
POST /chat/message
  Body: { message, includeContext?, maxContextChunks? }
  Response: { success, response }

GET /chat/history/{sessionId}
```

---

## 20. COMPARACIÓN CON OTROS MICROSERVICIOS

### api-users (3001)
- Misma arquitectura Clean Architecture + DDD
- Base de datos: MongoDB
- Use Cases: CRUD de usuarios
- Patrón: Idéntico a api-chatbot

### authentication (3002)
- Misma arquitectura
- Use Cases: Login, Register, ValidateToken
- Servicios: BcryptService, JwtService
- Integración: HTTP client a api-users

### api-gateway (3000)
- Patrón: Middleware + Proxy
- Enrutamiento centralizado
- Validación JWT
- Rate limiting

---

## 21. ESTRUCTURA DEL PROYECTO COMPLETO

```
Planty_Api_Gateway/
├── api-chatbot/          (Puerto 3003 - Chat con RAG)
│   ├── src/
│   │   ├── app.ts
│   │   ├── config/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── package.json
│   ├── tsconfig.json
│   └── uploads/          (Archivos PDF)
│
├── api-users/            (Puerto 3001 - Gestión de usuarios)
│   └── src/ (estructura similar)
│
├── authentication/       (Puerto 3002 - Autenticación JWT)
│   └── src/ (estructura similar)
│
├── api-gateway/          (Puerto 3000 - Enrutador)
│   └── src/
│       ├── routes/
│       ├── middleware/
│       └── services/
│
├── docker-compose.yml    (Orquestación de servicios)
├── Docs/                 (Documentación)
└── .git/                 (Control de versión)
```

---

## 22. STACK TECNOLÓGICO

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Lenguaje:** TypeScript

### Bases de Datos
- **Relacional:** MongoDB (usuarios)
- **Vectorial:** ChromaDB (embeddings para RAG)

### IA/ML
- **LLM:** Ollama (local)
- **Modelos:** 
  - Chat: llama3.2
  - Embeddings: nomic-embed-text (384 dims)

### Procesamiento
- **PDFs:** pdf-parse
- **Archivos:** multer
- **Validación:** helmet, cors, express-rate-limit

---

## 23. AMBIENTE DE DESARROLLO

### Scripts en package.json

```bash
npm run dev          # Desarrollo con ts-node-dev
npm run build        # Compilar a JavaScript
npm run start        # Ejecutar versión compilada
npm run test         # Tests con Jest
npm run test:watch   # Tests en tiempo real
```

### Configuración LOCAL

```bash
# Terminal 1 - ChromaDB
docker run -p 8000:8000 ghcr.io/chroma-core/chroma:latest

# Terminal 2 - Ollama
ollama pull nomic-embed-text
ollama pull llama3.2
ollama serve

# Terminal 3 - api-chatbot
npm run dev
```

---

## 24. DOCKER COMPOSE

El archivo docker-compose.yml orquesta:
- MongoDB (27017)
- ChromaDB (8000)
- api-users (3001)
- authentication (3002)
- api-chatbot (3003)
- api-gateway (3000)

Healthchecks para cada servicio.

---

## CONCLUSIÓN

Esta arquitectura implementa:
1. Clean Architecture para independencia
2. DDD para capturar lógica de negocio
3. Dependency Injection para flexibilidad
4. Repository Pattern para abstracción
5. Use Cases para encapsulación

Ideal para microservicios escalables, testables y mantenibles.

