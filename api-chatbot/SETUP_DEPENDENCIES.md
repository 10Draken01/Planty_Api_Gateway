# 📦 Guía de Instalación de Dependencias

Esta guía te ayudará a instalar todas las dependencias necesarias para ejecutar el microservicio de chatbot.

## Índice

1. [Node.js y npm](#1-nodejs-y-npm)
2. [Ollama](#2-ollama)
3. [ChromaDB](#3-chromadb)
4. [Dependencias del Proyecto](#4-dependencias-del-proyecto)
5. [Verificación](#5-verificación)

---

## 1. Node.js y npm

### Windows

**Opción 1: Instalador oficial**
```powershell
# Descargar desde https://nodejs.org/
# Instalar versión LTS (20.x o superior)
```

**Opción 2: Winget**
```powershell
winget install OpenJS.NodeJS.LTS
```

**Opción 3: Chocolatey**
```powershell
choco install nodejs-lts
```

### Linux (Ubuntu/Debian)

```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

### macOS

**Opción 1: Homebrew**
```bash
brew install node@20
```

**Opción 2: nvm (recomendado)**
```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node.js
nvm install 20
nvm use 20
```

---

## 2. Ollama

Ollama es un runtime local para modelos de lenguaje grandes (LLMs).

### Windows

```powershell
# Opción 1: Descargar instalador
# https://ollama.com/download/windows

# Opción 2: Winget
winget install Ollama.Ollama

# Verificar instalación
ollama --version
```

### Linux

```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# El servicio se inicia automáticamente
# Si no, iniciarlo manualmente:
ollama serve
```

### macOS

```bash
# Descargar desde https://ollama.com/download/mac
# O usar Homebrew
brew install ollama

# Iniciar servicio
ollama serve
```

### Descargar Modelos Necesarios

Una vez instalado Ollama, descarga los modelos:

```bash
# Modelo para embeddings (vectorización de texto)
# Tamaño: ~274 MB
ollama pull nomic-embed-text

# Modelo para generación de texto (chat)
# Tamaño: ~2 GB
ollama pull llama3.2

# Verificar modelos instalados
ollama list
```

**Salida esperada:**
```
NAME                     ID              SIZE    MODIFIED
nomic-embed-text:latest  0a109f422b47    274 MB  2 hours ago
llama3.2:latest          a80c4f17acd5    2.0 GB  2 hours ago
```

### Modelos Alternativos (Opcional)

Si tienes limitaciones de espacio o quieres probar otros modelos:

```bash
# Embeddings alternativos
ollama pull mxbai-embed-large      # 670 MB, mejor calidad
ollama pull all-minilm             # 46 MB, más rápido

# Chat alternativos
ollama pull llama3.1              # 4.7 GB, más potente
ollama pull mistral               # 4.1 GB, buen balance
ollama pull phi                   # 1.6 GB, más ligero
```

---

## 3. ChromaDB

ChromaDB es una base de datos vectorial para almacenar embeddings.

### Requisito: Python

ChromaDB requiere Python 3.8 o superior.

#### Windows

```powershell
# Descargar desde https://www.python.org/downloads/
# O usar Winget
winget install Python.Python.3.12

# Verificar
python --version
```

#### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip

# Verificar
python3 --version
pip3 --version
```

#### macOS

```bash
# Python ya viene instalado, pero actualiza pip
python3 -m pip install --upgrade pip
```

### Instalar ChromaDB

```bash
# Instalar ChromaDB
pip install chromadb

# O con pip3
pip3 install chromadb

# Verificar instalación
python -c "import chromadb; print('ChromaDB instalado correctamente')"
```

### Iniciar ChromaDB Server

```bash
# Iniciar el servidor
chroma run --host localhost --port 8000

# Deberías ver:
# Running Chroma on http://localhost:8000
```

**Mantén esta terminal abierta** mientras uses el chatbot.

### Alternativa: Docker (Opcional)

Si prefieres usar Docker:

```bash
# Descargar imagen
docker pull chromadb/chroma:latest

# Ejecutar contenedor
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  chromadb/chroma:latest

# Verificar
curl http://localhost:8000/api/v1/heartbeat
```

---

## 4. Dependencias del Proyecto

### Instalar paquetes npm

```bash
# Navegar al directorio del proyecto
cd api-chatbot

# Instalar dependencias
npm install

# Esto instalará:
# - express, cors, helmet (servidor)
# - ollama (cliente Ollama)
# - chromadb (cliente ChromaDB)
# - pdf-parse (procesamiento PDF)
# - multer (upload de archivos)
# - typescript, ts-node-dev (desarrollo)
# Y muchas más...
```

**Tiempo estimado:** 2-5 minutos

### Verificar Instalación

```bash
# Verificar que todos los paquetes se instalaron
npm list --depth=0

# Verificar TypeScript
npx tsc --version
```

---

## 5. Verificación

### Checklist Completo

Ejecuta estos comandos para verificar que todo está instalado:

```bash
# 1. Node.js
node --version
# Esperado: v20.x.x o superior

# 2. npm
npm --version
# Esperado: 10.x.x o superior

# 3. Python
python --version
# Esperado: Python 3.8.x o superior

# 4. Ollama
ollama --version
# Esperado: ollama version x.x.x

# 5. Modelos de Ollama
ollama list
# Esperado: Ver nomic-embed-text y llama3.2

# 6. ChromaDB
python -c "import chromadb; print('OK')"
# Esperado: OK

# 7. Dependencias del proyecto
cd api-chatbot && npm list --depth=0
# Esperado: Lista de paquetes sin errores
```

### Verificar Servicios Corriendo

```bash
# Terminal 1: ChromaDB debe estar corriendo
# chroma run --host localhost --port 8000

# Terminal 2: Verificar ChromaDB
curl http://localhost:8000/api/v1/heartbeat
# Esperado: {"nanosecond heartbeat": <timestamp>}

# Terminal 3: Verificar Ollama
curl http://localhost:11434/api/tags
# Esperado: JSON con lista de modelos
```

---

## 🚨 Solución de Problemas

### Problema: "ollama: command not found"

**Solución:**
```bash
# Windows: Reinicia la terminal después de instalar
# Linux/Mac: Agrega Ollama al PATH
export PATH=$PATH:/usr/local/bin
```

### Problema: "Cannot find module 'chromadb'"

**Solución:**
```bash
# Reinstalar ChromaDB
pip uninstall chromadb
pip install chromadb --upgrade
```

### Problema: "Python not found"

**Solución:**
```bash
# Windows: Asegúrate de marcar "Add Python to PATH" en el instalador
# Linux: sudo apt install python3
# Mac: brew install python@3.12
```

### Problema: Ollama no descarga modelos

**Solución:**
```bash
# Verificar espacio en disco (necesitas ~3 GB)
df -h

# Verificar conexión a internet
ping ollama.com

# Reintentar descarga
ollama pull nomic-embed-text
```

### Problema: Puerto 8000 ya en uso

**Solución:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9

# O usar otro puerto
chroma run --host localhost --port 8001
# Y actualizar .env: CHROMA_PORT=8001
```

---

## 📊 Requisitos del Sistema

### Mínimos

- **CPU**: Procesador de 2 núcleos
- **RAM**: 8 GB
- **Disco**: 10 GB libres
- **Sistema Operativo**: Windows 10/11, Ubuntu 20.04+, macOS 11+

### Recomendados

- **CPU**: Procesador de 4+ núcleos
- **RAM**: 16 GB
- **Disco**: 20 GB libres (SSD preferible)
- **GPU**: Opcional, mejora el rendimiento de Ollama

---

## 🎯 Orden de Instalación Recomendado

1. ✅ Instalar Node.js
2. ✅ Instalar Python
3. ✅ Instalar Ollama
4. ✅ Descargar modelos de Ollama
5. ✅ Instalar ChromaDB
6. ✅ Instalar dependencias npm del proyecto

---

## 📝 Resumen de Comandos

```bash
# 1. Ollama
ollama pull nomic-embed-text
ollama pull llama3.2
ollama list

# 2. ChromaDB
pip install chromadb
chroma run --host localhost --port 8000

# 3. Proyecto
cd api-chatbot
npm install
cp .env.example .env

# 4. Verificar todo
node --version && python --version && ollama --version
```

---

## ✅ Siguiente Paso

Una vez que todo esté instalado, continúa con:

📖 [QUICK_START.md](QUICK_START.md) - Guía para ejecutar el proyecto

---

¿Tienes problemas? Revisa la sección de Solución de Problemas o consulta la documentación oficial:

- Node.js: https://nodejs.org/
- Ollama: https://ollama.com/
- ChromaDB: https://docs.trychroma.com/
