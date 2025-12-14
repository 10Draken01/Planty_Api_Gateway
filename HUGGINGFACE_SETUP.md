# 🤗 Guía de Configuración: Hugging Face Inference API

Esta guía te muestra cómo configurar **Hugging Face Inference API** como proveedor de embeddings **100% GRATUITO** para el sistema Planty.

## 📋 Tabla de Contenido

- [¿Por qué usar Hugging Face?](#por-qué-usar-hugging-face)
- [Paso 1: Obtener API Key](#paso-1-obtener-api-key)
- [Paso 2: Configurar .env](#paso-2-configurar-env)
- [Paso 3: Seleccionar Modelo](#paso-3-seleccionar-modelo)
- [Paso 4: Procesar PDF](#paso-4-procesar-pdf)
- [Troubleshooting](#troubleshooting)

---

## 🎯 ¿Por qué usar Hugging Face?

### ✅ Ventajas

- **100% GRATIS**: 1000 requests/hora en el tier gratuito
- **Sin tarjeta de crédito**: Solo necesitas una cuenta
- **Múltiples modelos**: Acceso a cientos de modelos de embeddings
- **Buen rendimiento**: Modelos optimizados y rápidos
- **Sin instalación local**: API en la nube

### ⚖️ Comparación con otras opciones

| Proveedor | Costo | Límite | Instalación |
|-----------|-------|--------|-------------|
| **Hugging Face** | GRATIS | 1000 req/hora | No requiere |
| **Jina AI** | GRATIS | 8000 req/día | No requiere |
| **Ollama** | GRATIS | Ilimitado | Requiere (local) |
| **OpenAI** | PAGO | Según créditos | No requiere |

### 📊 ¿Cuándo usar Hugging Face?

- ✅ Cuando NO quieres instalar Ollama localmente
- ✅ Cuando necesitas más de 1000 requests/hora
- ✅ Cuando quieres probar diferentes modelos fácilmente
- ❌ Cuando necesitas procesamiento ULTRA rápido (usa Ollama local)
- ❌ Cuando necesitas más de 1000 requests/hora (usa Jina AI)

---

## 🔑 Paso 1: Obtener API Key

### 1.1 Crear cuenta en Hugging Face

1. Ve a [https://huggingface.co/join](https://huggingface.co/join)
2. Regístrate con tu email (GRATIS, sin tarjeta)
3. Verifica tu email

### 1.2 Generar API Token

1. Ve a [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click en **"New token"**
3. Configura:
   - **Name**: `planty-embeddings` (o cualquier nombre)
   - **Type**: `Read` (suficiente para Inference API)
4. Click en **"Generate"**
5. **¡COPIA EL TOKEN!** (no podrás verlo de nuevo)

**Ejemplo de token:**
```
hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ⚙️ Paso 2: Configurar .env

Abre tu archivo `api-chatbot/.env` y configura:

```bash
# =============================================================================
# EMBEDDING PROVIDER - Usar Hugging Face
# =============================================================================
EMBEDDING_PROVIDER=huggingface

# =============================================================================
# HUGGING FACE - Configuración
# =============================================================================
# Pega aquí tu API token
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Modelo de embeddings (ver opciones abajo)
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

---

## 🎨 Paso 3: Seleccionar Modelo

### 📦 Modelos Recomendados

#### 1. **sentence-transformers/all-MiniLM-L6-v2** (Recomendado para empezar)
```bash
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```
- **Dimensiones**: 384
- **Velocidad**: ⚡⚡⚡ MUY RÁPIDO
- **Calidad**: ⭐⭐⭐ BUENA
- **Uso**: Ideal para búsquedas generales y RAG básico
- **Tamaño**: 80 MB

#### 2. **sentence-transformers/all-mpnet-base-v2** (Mejor calidad)
```bash
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
```
- **Dimensiones**: 768
- **Velocidad**: ⚡⚡ RÁPIDO
- **Calidad**: ⭐⭐⭐⭐ EXCELENTE
- **Uso**: Mejor para contextos complejos y precisión
- **Tamaño**: 420 MB

#### 3. **BAAI/bge-small-en-v1.5** (Balanceado)
```bash
HUGGINGFACE_EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
```
- **Dimensiones**: 384
- **Velocidad**: ⚡⚡⚡ RÁPIDO
- **Calidad**: ⭐⭐⭐⭐ MUY BUENA
- **Uso**: Excelente para retrieval semántico
- **Tamaño**: 134 MB

### ⚠️ IMPORTANTE: Dimensiones de ChromaDB

Cuando cambias de modelo con **diferentes dimensiones**, debes:

1. **Eliminar la colección actual** (si ya procesaste un PDF):
```bash
npm run reset-chromadb
```

2. **Procesar nuevamente el PDF** con el nuevo modelo:
```bash
npm run init-pdf
```

**Ejemplos:**
- Si cambias de `nomic-embed-text` (768 dims) → `all-MiniLM-L6-v2` (384 dims) ❌ ERROR
- Debes resetear ChromaDB primero ✅

---

## 🚀 Paso 4: Procesar PDF

### 4.1 Reiniciar el servicio

```bash
# Detener el servicio actual (Ctrl+C)

# Iniciar nuevamente
cd api-chatbot
npm run dev
```

Deberías ver:
```
✓ Hugging Face Embedding service inicializado (GRATIS - 1000 req/hora)
```

### 4.2 Resetear ChromaDB (si es necesario)

Si ya procesaste un PDF con otro modelo:

```bash
npm run reset-chromadb
```

### 4.3 Procesar el PDF

```bash
npm run init-pdf
```

**Tiempo estimado** para `Planty_Educative.pdf` (4.9 MB):
- Con `all-MiniLM-L6-v2`: ~2-3 minutos (genera ~937 chunks)
- Con `all-mpnet-base-v2`: ~3-4 minutos

### 4.4 Verificar que funcionó

Deberías ver:
```
✅ PDF procesado exitosamente
   📊 Total de chunks generados: 937
   💾 Almacenados en ChromaDB: colección 'plantas_suchiapa'
```

---

## 🔧 Troubleshooting

### Error: "API Key inválido"

**Causa**: Token incorrecto o mal copiado

**Solución**:
1. Verifica que copiaste el token completo (empieza con `hf_`)
2. No debe tener espacios al inicio/final
3. Genera un nuevo token si es necesario

### Error: "Model is loading"

**Causa**: El modelo se está cargando en Hugging Face

**Solución**:
- Espera 30-60 segundos
- Vuelve a ejecutar `npm run init-pdf`
- Los modelos populares se cargan más rápido

### Error: "Rate limit exceeded"

**Causa**: Superaste 1000 requests/hora

**Solución**:
1. Espera 1 hora para que se resetee
2. Cambia a otro proveedor temporalmente:
   ```bash
   EMBEDDING_PROVIDER=ollama  # Sin límites
   ```
3. O usa Jina AI (8000 req/día)

### Error: "Dimension mismatch"

**Causa**: Cambiaste de modelo con diferentes dimensiones

**Solución**:
```bash
npm run reset-chromadb
npm run init-pdf
```

### Embeddings muy lentos

**Causa**: Modelo muy grande o servidor ocupado

**Solución**:
- Usa modelo más pequeño (`all-MiniLM-L6-v2` en vez de `all-mpnet-base-v2`)
- Aumenta el `CHUNK_SIZE` en `.env` para generar menos chunks:
  ```bash
  CHUNK_SIZE=1500  # En lugar de 1000
  ```

---

## 📚 Recursos Adicionales

- **Hugging Face Models**: [https://huggingface.co/models?pipeline_tag=sentence-similarity](https://huggingface.co/models?pipeline_tag=sentence-similarity)
- **Sentence Transformers**: [https://www.sbert.net/](https://www.sbert.net/)
- **Comparación de modelos**: [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

---

## 💡 Tips & Mejores Prácticas

1. **Para desarrollo local**: Usa `all-MiniLM-L6-v2` (rápido)
2. **Para producción**: Usa `all-mpnet-base-v2` (mejor calidad)
3. **Para PDFs grandes**: Aumenta `CHUNK_SIZE` a 1500-2000
4. **Para ahorrar requests**: Usa cache (Ollama lo hace automáticamente)
5. **Para máxima precisión**: Usa 768 dimensiones (`all-mpnet-base-v2`)

---

## 🎉 ¡Listo!

Ahora tu sistema Planty está usando **Hugging Face Inference API** para generar embeddings de forma gratuita.

Para verificar que todo funciona, prueba el chatbot:
```bash
curl -X POST http://localhost:3003/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cómo cuidar tomates?",
    "sessionId": "test123",
    "userId": "user1"
  }'
```
