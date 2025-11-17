# Diagramas de Arquitectura - Planty API Gateway

## 1. FLUJO DE DEPENDENCIAS (Clean Architecture)

PRESENTATION (HTTP)
    ↑
APPLICATION (Lógica)
    ↑
DOMAIN (Lógica Pura)
    ↑
INFRASTRUCTURE (Implementaciones)

REGLA: Las capas superiores dependen de las inferiores.
Las capas inferiores NUNCA dependen de las superiores.

## 2. FLUJO DE PROCESAMIENTO DE DOCUMENTOS

Paso 1: Cliente POST /documents/upload
        → Multer valida PDF, guarda en ./uploads
        → DocumentController.upload()
        → UploadDocumentUseCase crea Document entity
        → Guarda en InMemoryDocumentRepository
        → Response: { id, filename, status: 'uploaded' }

Paso 2: Cliente POST /documents/{id}/process
        → DocumentController.process()
        → ProcessDocumentUseCase:
          1. PDFService.extractText() → texto
          2. TextSplitterService.splitText() → chunks
          3. OllamaEmbeddingService (50 paralelo) → vectors
          4. ChromaVectorRepository.addChunks() (500/lote)
          5. Marca Document como PROCESSED
        → Response: { status: 'processed', totalChunks: N }

## 3. FLUJO DE CHAT (RAG)

Cliente: POST /chat/message { message: "pregunta" }
    ↓
ChatController.sendMessage()
    ↓
SendMessageUseCase:
  Step 1 (RETRIEVAL):
    - OllamaEmbeddingService: query → embedding
    - ChromaVectorRepository.searchSimilar() → top-5 chunks

  Step 2 (AUGMENTATION):
    - Construye contexto con fragmentos relevantes

  Step 3 (GENERATION):
    - OllamaChatService con LLM:
      * System Prompt: personalidad Planty
      * User Prompt: contexto + query
      * Genera respuesta
    ↓
Response: { success: true, response: "..." }

## 4. ESTRUCTURA DE DEPENDENCIAS

DependencyContainer
  ├─ Repositories
  │  ├─ InMemoryDocumentRepository
  │  ├─ InMemoryChatRepository
  │  └─ ChromaVectorRepository
  ├─ Services
  │  ├─ PDFService
  │  ├─ TextSplitterService
  │  ├─ OllamaEmbeddingService
  │  └─ OllamaChatService
  ├─ Use Cases
  │  ├─ UploadDocumentUseCase
  │  ├─ ProcessDocumentUseCase
  │  ├─ SendMessageUseCase
  │  └─ más...
  ├─ Controllers
  │  ├─ DocumentController
  │  └─ ChatController
  └─ Routes
     ├─ DocumentRoutes
     └─ ChatRoutes

## 5. MICROSERVICIOS (Docker)

Client/Frontend
    ↓
API Gateway (3000)
    ├─ api-users (3001) → MongoDB
    ├─ authentication (3002)
    └─ api-chatbot (3003) → ChromaDB → Ollama

## 6. FLUJO DE ESTADO DE DOCUMENTO

UPLOADED → PROCESSING → PROCESSED
               ↓
            FAILED (en caso de error)

## 7. ENDPOINTS PRINCIPALES

Health Checks:
- GET /chat/health
- GET /chat/info

Documentos:
- POST /chat/documents/upload
- POST /chat/documents/{id}/process
- GET /chat/documents
- DELETE /chat/documents/{id}

Chat:
- POST /chat/message
- GET /chat/history/{sessionId}

