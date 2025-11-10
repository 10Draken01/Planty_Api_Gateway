# 🚀 Guía de Inicio Rápido - Chatbot API

## Paso 1: Instalar Prerrequisitos

### 1.1 Instalar Ollama

**Windows:**
```powershell
# Descargar desde https://ollama.com/download/windows
# O usar winget
winget install Ollama.Ollama
```

**Linux/macOS:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 1.2 Descargar Modelos de Ollama

```bash
# Modelo para embeddings (vectorización de texto)
ollama pull nomic-embed-text

# Modelo para chat/respuestas
ollama pull llama3.2
```

Verifica que los modelos estén instalados:
```bash
ollama list
```

### 1.3 Instalar ChromaDB

```bash
# Instalar con pip
pip install chromadb

# Verificar instalación
python -c "import chromadb; print('ChromaDB instalado correctamente')"
```

## Paso 2: Configurar el Proyecto

### 2.1 Instalar Dependencias

```bash
cd api-chatbot
npm install
```

### 2.2 Crear Archivo .env

```bash
cp .env.example .env
```

Contenido del `.env`:
```env
PORT=3003
NODE_ENV=development
CORS_ORIGIN=*

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3.2

CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_COLLECTION_NAME=plantas_suchiapa

CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_FILE_SIZE_MB=50
```

## Paso 3: Iniciar Servicios

### 3.1 Iniciar ChromaDB (Terminal 1)

```bash
chroma run --host localhost --port 8000
```

Deberías ver:
```
Running Chroma on http://localhost:8000
```

### 3.2 Verificar Ollama (Terminal 2)

```bash
# Verificar que Ollama esté corriendo
curl http://localhost:11434/api/tags

# Si no está corriendo, iniciarlo
ollama serve
```

### 3.3 Iniciar API Chatbot (Terminal 3)

```bash
cd api-chatbot
npm run dev
```

Deberías ver:
```
╔════════════════════════════════════════════════════════╗
║     🤖 CHATBOT API - Plantas de Suchiapa             ║
╚════════════════════════════════════════════════════════╝

✓ Servidor corriendo en puerto 3003
✓ Entorno: development

🔍 Verificando servicios externos...
  - ChromaDB: ✓
  - Ollama Embedding (nomic-embed-text): ✓
  - Ollama Chat (llama3.2): ✓
```

## Paso 4: Probar el Servicio

### 4.1 Health Check

```bash
curl http://localhost:3003/health
```

### 4.2 Subir un PDF de Prueba

Crea un archivo de texto llamado `test.pdf` (o usa un PDF real):

```bash
curl -X POST http://localhost:3003/api/documents/upload \
  -F "file=@plantas-test.pdf" \
  -F 'metadata={"description":"Plantas de prueba"}'
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "id": "doc_1234567890_abc123",
    "filename": "file-1234567890.pdf",
    "status": "uploaded"
  }
}
```

### 4.3 Procesar el PDF

**IMPORTANTE**: Copia el `id` de la respuesta anterior.

```bash
curl -X POST http://localhost:3003/api/documents/doc_1234567890_abc123/process \
  -H "Content-Type: application/json" \
  -d '{"chunkSize": 1000, "chunkOverlap": 200}'
```

Este proceso puede tardar varios minutos dependiendo del tamaño del PDF.

Respuesta:
```json
{
  "success": true,
  "message": "Documento procesado exitosamente",
  "data": {
    "status": "processed",
    "totalChunks": 45
  }
}
```

### 4.4 Hacer una Pregunta

```bash
curl -X POST http://localhost:3003/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Qué plantas medicinales hay en Suchiapa?",
    "includeContext": true,
    "maxContextChunks": 5
  }'
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "¿Qué plantas medicinales hay en Suchiapa?",
    "response": "Basándome en el documento, en Suchiapa se encuentran...",
    "sources": [
      {
        "content": "Las plantas medicinales incluyen...",
        "score": 0.89
      }
    ]
  }
}
```

## Paso 5: Integración con API Gateway

### 5.1 Iniciar el API Gateway (Terminal 4)

```bash
cd ../api-gateway
npm run dev
```

### 5.2 Acceder al Chatbot a través del Gateway

```bash
# A través del gateway (puerto 3000)
curl -X POST http://localhost:3000/api/chatbot/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola"}'
```

## 🎯 Flujo Completo de Ejemplo

```bash
# 1. Subir PDF
RESPONSE=$(curl -s -X POST http://localhost:3003/api/documents/upload \
  -F "file=@plantas-suchiapa.pdf")

# 2. Extraer el ID del documento
DOC_ID=$(echo $RESPONSE | jq -r '.data.id')
echo "Document ID: $DOC_ID"

# 3. Procesar el documento
curl -X POST http://localhost:3003/api/documents/$DOC_ID/process \
  -H "Content-Type: application/json"

# 4. Esperar a que termine el procesamiento (verificar status)
curl http://localhost:3003/api/documents | jq

# 5. Hacer preguntas
curl -X POST http://localhost:3003/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuáles son las plantas medicinales más comunes?"
  }' | jq
```

## 🐛 Solución de Problemas Comunes

### Problema: "ChromaDB no está disponible"

```bash
# Verificar que ChromaDB esté corriendo
curl http://localhost:8000/api/v1/heartbeat

# Si no está corriendo, iniciarlo
chroma run --host localhost --port 8000
```

### Problema: "Ollama no está disponible"

```bash
# Verificar que Ollama esté corriendo
curl http://localhost:11434/api/tags

# Si no está corriendo, iniciarlo
ollama serve

# Verificar modelos instalados
ollama list
```

### Problema: "Error al procesar PDF"

- Verifica que el PDF contenga texto extraíble (no solo imágenes)
- Reduce el tamaño del PDF si es muy grande
- Intenta con un PDF más simple primero

### Problema: "Puerto 3003 ya está en uso"

```bash
# Windows
netstat -ano | findstr :3003
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3003 | xargs kill -9
```

## 📊 Monitoreo

### Ver información del sistema

```bash
curl http://localhost:3003/api/info | jq
```

### Ver documentos procesados

```bash
curl http://localhost:3003/api/documents | jq
```

### Ver historial de chat

```bash
# Usa el sessionId de una respuesta anterior
curl http://localhost:3003/api/chat/history/550e8400-e29b-41d4-a716-446655440000 | jq
```

## 🎉 ¡Listo!

Ahora tienes el chatbot funcionando. Puedes:

1. Subir más PDFs con información sobre plantas
2. Hacer preguntas sobre el contenido
3. Integrar con tu frontend
4. Personalizar los modelos y parámetros

## 📚 Siguiente Paso

Lee el [README.md](README.md) completo para más detalles sobre:
- Arquitectura del sistema
- API completa
- Configuración avanzada
- Testing
- Despliegue en producción
