# 🤖 API Chatbot - Plantas de Suchiapa

Microservicio de chatbot inteligente con RAG (Retrieval-Augmented Generation) para consultas sobre plantas de Suchiapa, Chiapas, México.

## 📋 Características

- ✅ **Procesamiento de PDFs**: Carga y procesa documentos PDF con información sobre plantas
- ✅ **Embeddings con Ollama**: Genera embeddings de texto usando modelos locales
- ✅ **Base de Datos Vectorial**: Almacena embeddings en ChromaDB para búsqueda semántica
- ✅ **Chat Inteligente**: Responde preguntas basadas en el contenido de los PDFs
- ✅ **Arquitectura Limpia**: Clean Architecture con separación de capas
- ✅ **API REST**: Endpoints bien documentados
- ✅ **TypeScript**: Código type-safe

## 🏗️ Arquitectura

```
api-chatbot/
├── src/
│   ├── domain/              # Capa de Dominio
│   │   ├── entities/        # Entidades del negocio
│   │   └── repositories/    # Interfaces de repositorios
│   ├── application/         # Capa de Aplicación
│   │   ├── use-cases/       # Casos de uso
│   │   └── dtos/            # Data Transfer Objects
│   ├── infrastructure/      # Capa de Infraestructura
│   │   ├── database/        # ChromaDB
│   │   ├── repositories/    # Implementaciones
│   │   ├── services/        # Servicios externos (Ollama, PDF)
│   │   └── container/       # Dependency Injection
│   ├── presentation/        # Capa de Presentación
│   │   ├── controllers/     # Controladores
│   │   └── routes/          # Rutas
│   ├── config/              # Configuración
│   └── app.ts               # Punto de entrada
├── uploads/                 # Archivos PDF subidos
└── package.json
```

## 🚀 Instalación

### Prerrequisitos

1. **Node.js** >= 20.0.0
2. **Ollama** instalado y corriendo
3. **ChromaDB** instalado y corriendo

### Instalar Ollama

```bash
# Windows / Linux / macOS
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelos necesarios
ollama pull nomic-embed-text
ollama pull llama3.2
```

### Instalar ChromaDB

```bash
pip install chromadb

# Iniciar ChromaDB
chroma run --host localhost --port 8000
```

### Instalar dependencias del proyecto

```bash
cd api-chatbot
npm install
```

## ⚙️ Configuración

Crea un archivo `.env` basado en `.env.example`:

```env
# Server Configuration
PORT=3003
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3.2

# ChromaDB Configuration
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_COLLECTION_NAME=plantas_suchiapa

# PDF Processing Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_FILE_SIZE_MB=50

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15
RATE_LIMIT_MAX_REQUESTS=100
CHAT_RATE_LIMIT_MAX=20
```

## 🎯 Uso

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Health Check

```http
GET /health
```

**Respuesta:**
```json
{
  "success": true,
  "service": "chatbot-api",
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### System Info

```http
GET /api/info
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "embeddingModel": {
      "baseUrl": "http://localhost:11434",
      "model": "nomic-embed-text"
    },
    "chatModel": {
      "baseUrl": "http://localhost:11434",
      "model": "llama3.2"
    },
    "documentsCount": 5,
    "chatMessagesCount": 120,
    "services": {
      "chromadb": true,
      "ollamaEmbedding": true,
      "ollamaChat": true
    }
  }
}
```

### Subir Documento

```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: [archivo PDF]
metadata: {"description": "Plantas medicinales"}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Documento subido exitosamente",
  "data": {
    "id": "doc_1234567890_abc123",
    "filename": "plantas-suchiapa.pdf",
    "originalName": "plantas-suchiapa.pdf",
    "fileSize": 2048576,
    "uploadedAt": "2025-01-15T10:30:00.000Z",
    "status": "uploaded"
  }
}
```

### Procesar Documento

```http
POST /api/documents/:id/process
Content-Type: application/json

{
  "chunkSize": 1000,
  "chunkOverlap": 200
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Documento procesado exitosamente",
  "data": {
    "id": "doc_1234567890_abc123",
    "status": "processed",
    "totalChunks": 45,
    "processedAt": "2025-01-15T10:35:00.000Z"
  }
}
```

### Listar Documentos

```http
GET /api/documents
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_1234567890_abc123",
        "filename": "plantas-suchiapa.pdf",
        "status": "processed",
        "totalChunks": 45,
        "uploadedAt": "2025-01-15T10:30:00.000Z",
        "processedAt": "2025-01-15T10:35:00.000Z"
      }
    ],
    "total": 1
  }
}
```

### Eliminar Documento

```http
DELETE /api/documents/:id
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Documento eliminado exitosamente"
}
```

### Enviar Mensaje al Chat

```http
POST /api/chat/message
Content-Type: application/json

{
  "sessionId": "optional-session-id",
  "message": "¿Qué plantas medicinales hay en Suchiapa?",
  "includeContext": true,
  "maxContextChunks": 5
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "¿Qué plantas medicinales hay en Suchiapa?",
    "response": "En Suchiapa, Chiapas, existen diversas plantas medicinales...",
    "sources": [
      {
        "content": "Las plantas medicinales de Suchiapa incluyen...",
        "score": 0.89,
        "metadata": {
          "chunkIndex": 12
        }
      }
    ],
    "timestamp": "2025-01-15T10:40:00.000Z"
  }
}
```

### Obtener Historial de Chat

```http
GET /api/chat/history/:sessionId
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "messages": [
      {
        "role": "user",
        "content": "¿Qué plantas medicinales hay?",
        "timestamp": "2025-01-15T10:40:00.000Z"
      },
      {
        "role": "assistant",
        "content": "En Suchiapa existen...",
        "timestamp": "2025-01-15T10:40:05.000Z"
      }
    ]
  }
}
```

## 🔄 Flujo de Trabajo Completo

1. **Subir PDF**: `POST /api/documents/upload`
2. **Procesar PDF**: `POST /api/documents/:id/process`
3. **Hacer preguntas**: `POST /api/chat/message`

### Ejemplo con cURL

```bash
# 1. Subir documento
curl -X POST http://localhost:3003/api/documents/upload \
  -F "file=@plantas-suchiapa.pdf"

# 2. Procesar documento (usar el ID de la respuesta anterior)
curl -X POST http://localhost:3003/api/documents/doc_123/process \
  -H "Content-Type: application/json"

# 3. Hacer pregunta
curl -X POST http://localhost:3003/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Qué plantas medicinales hay en Suchiapa?"
  }'
```

## 🧪 Testing

```bash
npm test
```

## 🔗 Integración con API Gateway

El servicio está integrado con el API Gateway en el puerto 3000:

```
API Gateway (3000) → /api/chatbot/* → Chatbot Service (3003)
```

### Endpoints a través del Gateway:

- `GET http://localhost:3000/api/chatbot/documents`
- `POST http://localhost:3000/api/chatbot/documents/upload`
- `POST http://localhost:3000/api/chatbot/chat/message`

## 📊 Arquitectura del Sistema RAG

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API GATEWAY (3000)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CHATBOT MICROSERVICE (3003)                     │
│                                                              │
│  1. Recibe pregunta del usuario                             │
│  2. Genera embedding con Ollama                             │
│  3. Busca chunks similares en ChromaDB                      │
│  4. Construye contexto con chunks relevantes               │
│  5. Genera respuesta con Ollama + contexto                 │
│  6. Retorna respuesta + fuentes                             │
└──┬──────────────────┬──────────────────┬───────────────────┘
   │                  │                  │
   ▼                  ▼                  ▼
┌─────────┐    ┌──────────┐      ┌─────────────┐
│ Ollama  │    │ChromaDB  │      │  In-Memory  │
│ (11434) │    │  (8000)  │      │    Store    │
└─────────┘    └──────────┘      └─────────────┘
```

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js 20+
- **Lenguaje**: TypeScript 5.3
- **Framework**: Express.js 4.18
- **LLM**: Ollama (nomic-embed-text, llama3.2)
- **Vector DB**: ChromaDB 1.8
- **PDF Parser**: pdf-parse 1.1
- **Seguridad**: Helmet, CORS, Rate Limiting

## 📝 Notas de Desarrollo

### Chunk Size y Overlap

- **CHUNK_SIZE**: Tamaño máximo de cada fragmento de texto (default: 1000)
- **CHUNK_OVERLAP**: Caracteres que se solapan entre chunks (default: 200)

Ajusta estos valores según el tipo de contenido:
- Textos técnicos: chunks más pequeños (500-800)
- Textos narrativos: chunks más grandes (1000-1500)

### Modelos de Ollama

Puedes cambiar los modelos editando el `.env`:

```env
# Modelos alternativos de embedding
OLLAMA_EMBEDDING_MODEL=mxbai-embed-large
OLLAMA_EMBEDDING_MODEL=all-minilm

# Modelos alternativos de chat
OLLAMA_CHAT_MODEL=llama3.1
OLLAMA_CHAT_MODEL=mistral
OLLAMA_CHAT_MODEL=mixtral
```

### Persistencia

Actualmente los repositorios de documentos y chat usan almacenamiento en memoria. Para producción, considera migrar a:

- **MongoDB**: Para documentos y chat
- **PostgreSQL**: Para metadatos y búsquedas relacionales
- **Redis**: Para caché y sesiones

## 🐛 Troubleshooting

### ChromaDB no conecta

```bash
# Verifica que ChromaDB esté corriendo
curl http://localhost:8000/api/v1/heartbeat

# Reinicia ChromaDB
chroma run --host localhost --port 8000
```

### Ollama no responde

```bash
# Verifica que Ollama esté corriendo
curl http://localhost:11434/api/tags

# Lista modelos instalados
ollama list

# Descarga modelo si falta
ollama pull nomic-embed-text
ollama pull llama3.2
```

### Error al procesar PDF

- Verifica que el PDF no esté corrupto
- Asegúrate de que el PDF contenga texto (no solo imágenes)
- Reduce el tamaño del PDF si es muy grande

## 📄 Licencia

MIT

## 👥 Autor

Proyecto desarrollado siguiendo Clean Architecture y mejores prácticas de TypeScript.
