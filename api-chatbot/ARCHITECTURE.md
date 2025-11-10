# 🏛️ Documentación de Arquitectura - Chatbot Microservice

## Visión General

El microservicio de chatbot implementa un sistema RAG (Retrieval-Augmented Generation) para responder preguntas sobre plantas de Suchiapa basándose en documentos PDF procesados.

## Principios Arquitectónicos

### Clean Architecture

El proyecto sigue los principios de Clean Architecture con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                          │
│  Controllers, Routes, HTTP Handlers                      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              APPLICATION LAYER                           │
│  Use Cases, Business Logic, DTOs                        │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                DOMAIN LAYER                              │
│  Entities, Repository Interfaces, Business Rules        │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│             INFRASTRUCTURE LAYER                         │
│  Repositories, External Services, Database              │
└─────────────────────────────────────────────────────────┘
```

## Capas del Sistema

### 1. Domain Layer (Dominio)

**Responsabilidad**: Contiene la lógica de negocio pura, independiente de frameworks.

**Componentes**:

#### Entidades
- **Document**: Representa un documento PDF con su metadata y estado
  - Estados: `uploaded`, `processing`, `processed`, `failed`
  - Métodos de negocio: `markAsProcessing()`, `markAsProcessed()`, etc.

- **TextChunk**: Fragmento de texto extraído de un documento
  - Contiene el contenido y su embedding vectorial
  - Metadata sobre posición y contexto

- **ChatMessage**: Mensaje en una conversación
  - Roles: `user`, `assistant`, `system`
  - Incluye metadata como fuentes y relevancia

#### Repositorios (Interfaces)
- **DocumentRepository**: CRUD de documentos
- **VectorRepository**: Operaciones con base de datos vectorial
- **ChatRepository**: Gestión de mensajes y sesiones

### 2. Application Layer (Aplicación)

**Responsabilidad**: Orquesta casos de uso del negocio.

#### Use Cases

**Gestión de Documentos**:
- `UploadDocumentUseCase`: Sube y valida PDFs
- `ProcessDocumentUseCase`: Extrae texto, genera embeddings, almacena
- `GetDocumentsUseCase`: Lista documentos
- `DeleteDocumentUseCase`: Elimina documento y sus chunks

**Gestión de Chat**:
- `SendMessageUseCase`: Procesa pregunta con RAG y genera respuesta
- `GetChatHistoryUseCase`: Recupera historial de conversación

#### DTOs
- `SendMessageDTO`, `ChatResponseDTO`
- `UploadDocumentDTO`, `DocumentInfoDTO`

### 3. Infrastructure Layer (Infraestructura)

**Responsabilidad**: Implementa detalles técnicos y conexiones externas.

#### Servicios Externos

**OllamaEmbeddingService**:
```typescript
interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>
}
```
- Genera vectores de embeddings usando Ollama
- Modelo: `nomic-embed-text` (768 dimensiones)

**OllamaChatService**:
```typescript
interface IChatService {
  generateResponse(
    query: string,
    context: string,
    history?: Message[]
  ): Promise<string>
}
```
- Genera respuestas conversacionales
- Modelo: `llama3.2`
- Incluye prompt engineering para contexto específico

**PDFService**:
```typescript
interface IPDFService {
  extractText(filePath: string): Promise<string>
}
```
- Extrae texto de PDFs usando `pdf-parse`
- Limpia y normaliza el texto extraído

**TextSplitterService**:
```typescript
interface ITextSplitter {
  splitText(
    text: string,
    chunkSize: number,
    overlap: number
  ): string[]
}
```
- Divide texto en chunks con overlap
- Busca puntos de ruptura naturales (párrafos, oraciones)

#### Repositorios

**ChromaVectorRepository**:
- Implementa operaciones con ChromaDB
- Almacena embeddings y metadatos
- Búsqueda por similitud vectorial

**InMemoryDocumentRepository**:
- Almacenamiento en memoria de documentos
- Para producción, migrar a MongoDB/PostgreSQL

**InMemoryChatRepository**:
- Almacenamiento en memoria de mensajes
- Para producción, migrar a MongoDB/Redis

#### Dependency Injection

**DependencyContainer**:
- Ensambla todas las dependencias del sistema
- Patrón Service Locator
- Inicializa servicios externos (ChromaDB)

### 4. Presentation Layer (Presentación)

**Responsabilidad**: Expone la API REST y maneja HTTP.

#### Controllers

**DocumentController**:
- `upload()`: Maneja multipart/form-data
- `process()`: Inicia procesamiento asíncrono
- `list()`: Lista documentos
- `delete()`: Elimina documento

**ChatController**:
- `sendMessage()`: Procesa mensaje con RAG
- `getHistory()`: Recupera conversación

#### Routes

**DocumentRoutes**:
- Configura Multer para uploads
- Valida tipos de archivo (solo PDF)
- Limita tamaño de archivo

**ChatRoutes**:
- Endpoints de chat
- Rate limiting más restrictivo

## Flujo de Datos

### Procesamiento de Documentos

```
1. Upload PDF
   └─> UploadDocumentUseCase
       └─> Validar archivo
       └─> Crear entidad Document
       └─> Guardar en DocumentRepository
       └─> Retornar metadata

2. Process PDF
   └─> ProcessDocumentUseCase
       ├─> PDFService.extractText()
       ├─> TextSplitterService.splitText()
       ├─> Para cada chunk:
       │   ├─> OllamaEmbeddingService.generateEmbedding()
       │   └─> Crear TextChunk con embedding
       ├─> ChromaVectorRepository.addChunks()
       └─> Actualizar Document status
```

### Flujo RAG (Retrieval-Augmented Generation)

```
1. Usuario envía pregunta
   └─> SendMessageUseCase

2. Generar embedding del query
   └─> OllamaEmbeddingService.generateEmbedding(query)

3. Búsqueda semántica
   └─> ChromaVectorRepository.searchSimilar(embedding, topK=5)
   └─> Retorna chunks más relevantes con scores

4. Construir contexto
   └─> Concatenar contenido de chunks relevantes
   └─> Mantener track de fuentes

5. Recuperar historial de conversación
   └─> ChatRepository.findLastMessages(sessionId, 5)

6. Generar respuesta
   └─> OllamaChatService.generateResponse(
         query,
         context,
         history
       )

7. Guardar mensajes
   ├─> Guardar mensaje del usuario
   └─> Guardar respuesta del asistente

8. Retornar respuesta con fuentes
```

## Patrones de Diseño

### Repository Pattern
- Abstrae acceso a datos
- Permite cambiar implementación sin afectar lógica de negocio

### Use Case Pattern
- Cada operación es un caso de uso independiente
- Facilita testing y mantenimiento

### Dependency Injection
- Inversión de control
- Facilita testing con mocks

### Strategy Pattern
- Diferentes estrategias de text splitting
- Diferentes modelos de Ollama intercambiables

### Factory Pattern
- Creación de entidades (Document.create(), ChatMessage.create())

## Seguridad

### Validaciones
- Tipo de archivo (solo PDF)
- Tamaño máximo (configurable)
- Rate limiting por endpoint
- Sanitización de inputs

### Headers de Seguridad
- Helmet middleware
- CORS configurado
- Content-Type validation

### Rate Limiting
```typescript
General API: 100 req / 15 min
Chat API: 20 req / 15 min
```

## Escalabilidad

### Consideraciones Actuales

**Puntos de Mejora para Producción**:

1. **Persistencia**:
   - Migrar a MongoDB para documentos
   - Redis para sesiones de chat
   - PostgreSQL para metadatos relacionales

2. **Procesamiento Asíncrono**:
   - Queue system (Bull, RabbitMQ)
   - Workers separados para procesamiento de PDFs
   - Notificaciones de progreso (WebSockets)

3. **Caché**:
   - Redis para embeddings frecuentes
   - Caché de respuestas comunes

4. **Monitoreo**:
   - Prometheus metrics
   - Logging estructurado (Winston, Pino)
   - Health checks detallados

### Arquitectura Propuesta para Escala

```
┌──────────────┐
│  API Gateway │
└──────┬───────┘
       │
┌──────▼────────────────────────────────────┐
│         Load Balancer (nginx)             │
└──────┬────────────────────────────────────┘
       │
   ┌───┴───┬────────┬────────┐
   │       │        │        │
┌──▼──┐ ┌──▼──┐ ┌──▼──┐  ┌──▼──┐
│Chat │ │Chat │ │Chat │  │Chat │
│ API │ │ API │ │ API │  │ API │
└──┬──┘ └──┬──┘ └──┬──┘  └──┬──┘
   │       │        │        │
   └───┬───┴────────┴────────┘
       │
   ┌───▼─────────────────────────┐
   │                              │
┌──▼──────┐  ┌──────────┐  ┌────▼──────┐
│MongoDB  │  │ChromaDB  │  │  Redis    │
│(Docs)   │  │(Vectors) │  │  (Cache)  │
└─────────┘  └──────────┘  └───────────┘
```

## Testing

### Niveles de Testing

1. **Unit Tests**: Entidades y Use Cases
2. **Integration Tests**: Repositorios y Servicios
3. **E2E Tests**: Flujos completos de API

### Test Coverage Objetivo
- Domain: 100%
- Application: 90%
- Infrastructure: 70%
- Presentation: 80%

## Métricas y KPIs

### Performance
- Tiempo de procesamiento de PDF
- Latencia de búsqueda vectorial
- Tiempo de respuesta del chat

### Negocio
- Documentos procesados
- Consultas por día
- Tasa de éxito de respuestas
- Satisfacción del usuario

## Diagramas

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    Express App                           │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐       │
│  │ Document  │  │   Chat    │  │  Middleware  │       │
│  │ Routes    │  │  Routes   │  │  (CORS, etc) │       │
│  └─────┬─────┘  └─────┬─────┘  └──────────────┘       │
└────────┼──────────────┼──────────────────────────────────┘
         │              │
    ┌────▼─────┐   ┌────▼─────┐
    │ Document │   │   Chat   │
    │Controller│   │Controller│
    └────┬─────┘   └────┬─────┘
         │              │
    ┌────▼──────────────▼─────┐
    │     Use Cases           │
    │  ┌─────────────────┐    │
    │  │ Upload Document │    │
    │  │ Process Doc     │    │
    │  │ Send Message    │    │
    │  └─────────────────┘    │
    └────┬────────────────┬───┘
         │                │
    ┌────▼────┐      ┌────▼────┐
    │Document │      │  Chat   │
    │  Repo   │      │  Repo   │
    └────┬────┘      └─────────┘
         │
    ┌────▼────────────────────┐
    │   External Services     │
    │  ┌──────────────────┐   │
    │  │ Ollama          │   │
    │  │ ChromaDB        │   │
    │  │ PDF Parser      │   │
    │  └──────────────────┘   │
    └─────────────────────────┘
```

### Diagrama de Secuencia - Chat

```
User -> API: POST /chat/message
API -> UseCase: execute(message)
UseCase -> EmbeddingService: generateEmbedding(message)
EmbeddingService -> Ollama: embed(text)
Ollama --> EmbeddingService: embedding[]
EmbeddingService --> UseCase: embedding[]
UseCase -> VectorRepo: searchSimilar(embedding)
VectorRepo -> ChromaDB: query(embedding)
ChromaDB --> VectorRepo: chunks[]
VectorRepo --> UseCase: searchResults[]
UseCase -> ChatService: generateResponse(query, context)
ChatService -> Ollama: chat(prompt)
Ollama --> ChatService: response
ChatService --> UseCase: response
UseCase -> ChatRepo: save(messages)
UseCase --> API: ChatResponseDTO
API --> User: JSON response
```

## Conclusión

Esta arquitectura proporciona:

✅ **Mantenibilidad**: Código organizado y testeabl
✅ **Escalabilidad**: Fácil de escalar horizontalmente
✅ **Flexibilidad**: Fácil cambiar implementaciones
✅ **Testabilidad**: Capas desacopladas
✅ **Extensibilidad**: Fácil agregar nuevas features

Para más información, consulta:
- [README.md](README.md) - Documentación general
- [QUICK_START.md](QUICK_START.md) - Guía de inicio rápido
