# 🚀 Guía de Configuración Local - Proyecto Planty

Esta guía te ayudará a configurar y ejecutar todo el proyecto Planty localmente en tu máquina.

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación de Dependencias](#instalación-de-dependencias)
3. [Configuración de Servicios](#configuración-de-servicios)
4. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
5. [Inicialización de Base de Datos](#inicialización-de-base-de-datos)
6. [Ejecución de Servicios](#ejecución-de-servicios)
7. [Verificación de Servicios](#verificación-de-servicios)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Requisitos Previos

### Software Instalado

- [x] **Docker Desktop** - ✅ YA INSTALADO
- [x] **Ollama** - ✅ YA INSTALADO
- [ ] **Node.js** (v20 o superior)
- [ ] **MongoDB** (o usar Docker)
- [ ] **Flutter SDK** (v3.9.0 o superior)
- [ ] **Git**

### Verificar Instalaciones

```bash
# Verificar Docker
docker --version
docker-compose --version

# Verificar Ollama
ollama --version

# Verificar Node.js
node --version
npm --version

# Verificar Flutter
flutter --version
flutter doctor

# Verificar Git
git --version
```

---

## 📦 Instalación de Dependencias

### 1. Ollama - Descargar Modelos

```bash
# Modelo de embeddings (requerido para RAG)
ollama pull nomic-embed-text

# Modelo de chat (requerido para respuestas)
ollama pull llama3.2

# Verificar modelos instalados
ollama list
```

**Salida esperada:**
```
NAME                     ID              SIZE      MODIFIED
llama3.2:latest          a80c4f17acd5    2.0 GB    X minutes ago
nomic-embed-text:latest  0a109f422b47    274 MB    X minutes ago
```

### 2. Node.js - Instalar Dependencias

```bash
# API Gateway
cd api-gateway
npm install

# Authentication Service
cd ../authentication
npm install

# Users Service
cd ../api-users
npm install

# Chatbot Service
cd ../api-chatbot
npm install
```

### 3. Flutter - Instalar Dependencias

```bash
cd Planty
flutter pub get
```

---

## 🔧 Configuración de Servicios

### 1. ChromaDB (Base de Datos Vectorial)

**Ubicación:** `api-chatbot/docker-compose.yml`

```bash
cd api-chatbot
docker-compose up -d
```

**Verificar que esté corriendo:**
```bash
docker ps
```

Deberías ver:
```
CONTAINER ID   IMAGE                                  STATUS    PORTS
xxxxxxxxxx     ghcr.io/chroma-core/chroma:latest     Up        0.0.0.0:8000->8000/tcp
```

**Verificar salud:**
```bash
curl http://localhost:8000/api/v1/heartbeat
```

### 2. MongoDB (Base de Datos de Usuarios)

**Opción A: Usar Docker (Recomendado)**

Crear archivo `docker-compose.yml` en la raíz del proyecto:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: planty-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: users_db
    volumes:
      - mongodb-data:/data/db
    networks:
      - planty-network

volumes:
  mongodb-data:
    driver: local

networks:
  planty-network:
    driver: bridge
```

Ejecutar:
```bash
docker-compose up -d mongodb
```

**Opción B: MongoDB Local**

Si prefieres instalar MongoDB localmente:
1. Descargar de: https://www.mongodb.com/try/download/community
2. Instalar y ejecutar como servicio
3. Crear base de datos `users_db`

### 3. Verificar que Ollama esté corriendo

```bash
# En Windows, Ollama debe estar ejecutándose
# Verificar con:
curl http://localhost:11434/api/version
```

Si no está corriendo:
- Abre Ollama Desktop o ejecuta `ollama serve` en una terminal

---

## 🔐 Configuración de Variables de Entorno

### 1. API Gateway

Crear archivo `.env` en `api-gateway/`:

```bash
cd api-gateway
cp .env.example .env
```

Editar `api-gateway/.env`:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=planty-super-secret-jwt-key-2024-change-in-production
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=15
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
CREATE_RATE_LIMIT_MAX=3

# URLs de microservicios
USERS_SERVICE_URL=http://localhost:3001
AUTH_SERVICE_URL=http://localhost:3002
```

### 2. Authentication Service

Crear archivo `.env` en `authentication/`:

```bash
cd authentication
cp .env.example .env
```

Editar `authentication/.env`:
```env
PORT=3002
NODE_ENV=development

# JWT (DEBE SER IGUAL AL API GATEWAY)
JWT_SECRET=planty-super-secret-jwt-key-2024-change-in-production
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=*

# Microservices
USERS_SERVICE_URL=http://localhost:3001/api
```

### 3. Users Service

Crear archivo `.env` en `api-users/`:

```bash
cd api-users
cp .env.example .env
```

Editar `api-users/.env`:
```env
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=password123
MONGO_DB_NAME=users_db

# URL de conexión MongoDB
# Si usas Docker:
MONGO_URI=mongodb://admin:password123@localhost:27017/users_db?authSource=admin
# Si usas MongoDB local sin autenticación:
# MONGO_URI=mongodb://localhost:27017/users_db

# JWT (DEBE SER IGUAL AL API GATEWAY)
JWT_SECRET=planty-super-secret-jwt-key-2024-change-in-production
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=*
```

### 4. Chatbot Service

Crear archivo `.env` en `api-chatbot/`:

```bash
cd api-chatbot
cp .env.example .env
```

Editar `api-chatbot/.env`:
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

# API Configuration
RATE_LIMIT_WINDOW_MS=15
RATE_LIMIT_MAX_REQUESTS=100
CHAT_RATE_LIMIT_MAX=20
```

### 5. Flutter App

Crear archivo `.env` en `Planty/`:

```bash
cd Planty
cp .env.example .env
```

Editar `Planty/.env`:
```env
API_URL=http://localhost:3000/api
ENCRYPTION_KEY=planty_encryption_key_32chars_2024_local_dev
```

**Nota:** Para emulador Android, usa `http://10.0.2.2:3000/api`

---

## 🗄️ Inicialización de Base de Datos

### 1. Verificar Conexión MongoDB

```bash
# Si usas Docker:
docker exec -it planty-mongodb mongosh -u admin -p password123 --authenticationDatabase admin

# Verificar base de datos
use users_db
show collections
```

### 2. Procesar PDF para Chatbot

El PDF educativo ya está en `api-chatbot/pdf/Planty_Educative.pdf`

Una vez que el servicio de chatbot esté corriendo, procesa el PDF:

```bash
# Opción A: Usar el endpoint directamente
curl -X POST http://localhost:3003/api/documents/upload \
  -F "file=@api-chatbot/pdf/Planty_Educative.pdf"

# Tomar nota del ID retornado, luego:
curl -X POST http://localhost:3003/api/documents/{document-id}/process
```

**Opción B: Usar Postman/Thunder Client**
1. POST `http://localhost:3003/api/documents/upload`
2. Body: form-data, key: `file`, value: seleccionar PDF
3. Copiar el `id` de la respuesta
4. POST `http://localhost:3003/api/documents/{id}/process`

---

## 🚀 Ejecución de Servicios

### Orden de Inicio Recomendado

#### 1. Servicios de Infraestructura

```bash
# ChromaDB (si no está corriendo)
cd api-chatbot
docker-compose up -d

# MongoDB (si usas Docker)
cd ..
docker-compose up -d mongodb

# Ollama (debe estar corriendo)
# En Windows, abrir Ollama Desktop o ejecutar:
ollama serve
```

#### 2. Microservicios Backend

**Terminal 1 - Users Service:**
```bash
cd api-users
npm run dev
```

**Terminal 2 - Authentication Service:**
```bash
cd authentication
npm run dev
```

**Terminal 3 - Chatbot Service:**
```bash
cd api-chatbot
npm run dev
```

**Terminal 4 - API Gateway:**
```bash
cd api-gateway
npm run dev
```

#### 3. Aplicación Flutter

**Terminal 5 - Flutter App:**
```bash
cd Planty

# Opción A: Ejecutar en emulador/dispositivo
flutter run

# Opción B: Modo debug con hot reload
flutter run --debug

# Opción C: Modo release
flutter run --release
```

---

## ✅ Verificación de Servicios

### 1. Verificar Health Checks

```bash
# ChromaDB
curl http://localhost:8000/api/v1/heartbeat

# MongoDB
curl http://localhost:27017
# Debería retornar: "It looks like you are trying to access MongoDB over HTTP..."

# Ollama
curl http://localhost:11434/api/version

# Users Service
curl http://localhost:3001/health

# Authentication Service
curl http://localhost:3002/health

# Chatbot Service
curl http://localhost:3003/health

# API Gateway
curl http://localhost:3000/health
```

### 2. Verificar Modelos Ollama

```bash
ollama list
```

Deberías ver:
- `llama3.2:latest`
- `nomic-embed-text:latest`

### 3. Verificar Colecciones ChromaDB

```bash
curl http://localhost:8000/api/v1/collections
```

Debería incluir la colección `plantas_suchiapa` después de procesar el PDF.

### 4. Probar Registro de Usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@planty.com",
    "password": "Test1234!",
    "name": "Usuario Test"
  }'
```

### 5. Probar Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@planty.com",
    "password": "Test1234!"
  }'
```

### 6. Probar Chatbot (con token)

```bash
# Primero obtén un token del login anterior
TOKEN="tu-token-jwt-aqui"

curl -X POST http://localhost:3000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "¿Qué plantas puedo cultivar en Suchiapa?"
  }'
```

---

## 🐛 Troubleshooting

### Problema: Ollama no responde

**Solución:**
```bash
# Verificar si está corriendo
ollama list

# Si no está corriendo, iniciar:
ollama serve

# O abrir Ollama Desktop en Windows
```

### Problema: ChromaDB no se conecta

**Solución:**
```bash
# Verificar logs
cd api-chatbot
docker-compose logs chromadb

# Reiniciar contenedor
docker-compose restart chromadb

# O recrear
docker-compose down
docker-compose up -d
```

### Problema: MongoDB Connection Refused

**Solución:**
```bash
# Verificar que MongoDB esté corriendo
docker ps | grep mongodb

# Ver logs
docker logs planty-mongodb

# Reiniciar
docker restart planty-mongodb

# Verificar conexión
docker exec -it planty-mongodb mongosh -u admin -p password123 --authenticationDatabase admin
```

### Problema: Puerto en uso

**Solución:**
```bash
# Windows: Verificar qué usa el puerto
netstat -ano | findstr :3000

# Matar proceso
taskkill /PID <PID> /F

# O cambiar puerto en .env
```

### Problema: Flutter no se conecta al backend

**Solución:**

Para **Android Emulator**, cambia en `Planty/.env`:
```env
API_URL=http://10.0.2.2:3000/api
```

Para **iOS Simulator** o **Dispositivo Físico en misma red**:
```env
API_URL=http://TU-IP-LOCAL:3000/api
```

Encontrar tu IP:
```bash
# Windows
ipconfig

# Buscar "IPv4 Address"
```

### Problema: Chatbot responde sin coherencia

**Solución:**
1. Verificar que el PDF se procesó correctamente:
```bash
curl http://localhost:3003/api/documents
```

2. Verificar que los modelos están descargados:
```bash
ollama list
```

3. Verificar configuración en `api-chatbot/.env`:
```env
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3.2
```

4. Reiniciar servicio de chatbot después de cambios

### Problema: Error de CORS en Flutter

**Solución:**

Verificar en cada servicio que `CORS_ORIGIN=*` en los archivos `.env`:
- `api-gateway/.env`
- `authentication/.env`
- `api-users/.env`
- `api-chatbot/.env`

Reiniciar todos los servicios después del cambio.

### Problema: JWT Token Inválido

**Solución:**

Verificar que `JWT_SECRET` sea IDÉNTICO en:
- `api-gateway/.env`
- `authentication/.env`
- `api-users/.env`

Ejemplo:
```env
JWT_SECRET=planty-super-secret-jwt-key-2024-change-in-production
```

Reiniciar todos los servicios después del cambio.

---

## 📝 Checklist Final

Antes de decir que todo está funcionando, verifica:

- [ ] Docker Desktop está corriendo
- [ ] ChromaDB contenedor está UP (`docker ps`)
- [ ] MongoDB contenedor está UP (`docker ps`)
- [ ] Ollama está corriendo (`ollama list`)
- [ ] Modelos descargados: `llama3.2` y `nomic-embed-text`
- [ ] Todos los `.env` creados y configurados
- [ ] `JWT_SECRET` es idéntico en todos los servicios
- [ ] Users Service corriendo en puerto 3001
- [ ] Authentication Service corriendo en puerto 3002
- [ ] Chatbot Service corriendo en puerto 3003
- [ ] API Gateway corriendo en puerto 3000
- [ ] PDF procesado en ChromaDB
- [ ] Puedes registrar un usuario
- [ ] Puedes hacer login
- [ ] Puedes enviar mensajes al chatbot
- [ ] Flutter app se conecta al backend
- [ ] Flutter app puede hacer login
- [ ] Flutter app puede chatear con Planty

---

## 🎯 Comandos Rápidos

### Start Todo

```bash
# Terminal 1: Infraestructura
cd api-chatbot && docker-compose up -d
cd .. && docker-compose up -d mongodb
ollama serve

# Terminal 2: Backend Services
cd api-users && npm run dev

# Terminal 3
cd authentication && npm run dev

# Terminal 4
cd api-chatbot && npm run dev

# Terminal 5
cd api-gateway && npm run dev

# Terminal 6: Flutter
cd Planty && flutter run
```

### Stop Todo

```bash
# Detener servicios Node.js: Ctrl+C en cada terminal

# Detener Docker
cd api-chatbot && docker-compose down
cd .. && docker-compose down

# Ollama puede seguir corriendo en background
```

### Reset Completo

```bash
# Borrar todas las bases de datos
docker-compose down -v
cd api-chatbot && docker-compose down -v

# Borrar node_modules y reinstalar
rm -rf api-gateway/node_modules
rm -rf authentication/node_modules
rm -rf api-users/node_modules
rm -rf api-chatbot/node_modules

npm install # en cada carpeta

# Borrar Flutter cache
cd Planty
flutter clean
flutter pub get
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de cada servicio
2. Verifica la sección [Troubleshooting](#troubleshooting)
3. Asegúrate de que todos los puertos estén libres
4. Verifica las variables de entorno
5. Reinicia los servicios uno por uno

---

## 🎉 ¡Listo!

Si todo está en verde ✅, tu ambiente local de Planty está completamente funcional.

Ahora puedes:
- Desarrollar nuevas features
- Probar el chatbot
- Hacer cambios en Flutter con hot reload
- Debuggear los microservicios

**¡Feliz desarrollo! 🌱🚀**
