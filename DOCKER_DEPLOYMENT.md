# 🐳 Guía de Despliegue con Docker - Proyecto Planty

Esta guía te ayudará a construir las imágenes Docker de cada microservicio, subirlas a Docker Hub y desplegarlas usando Docker Compose.

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Estructura de Dockerfiles](#estructura-de-dockerfiles)
3. [Build de Imágenes](#build-de-imágenes)
4. [Push a Docker Hub](#push-a-docker-hub)
5. [Despliegue con Docker Compose](#despliegue-con-docker-compose)
6. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Requisitos Previos

### Software Instalado

- ✅ **Docker Desktop** (versión 20.10 o superior)
- ✅ **Cuenta en Docker Hub** (https://hub.docker.com)
- ✅ **Ollama** (debe estar corriendo en el host para el chatbot)

### Verificar Instalaciones

```bash
# Verificar Docker
docker --version
docker-compose --version

# Verificar que Docker está corriendo
docker ps

# Login en Docker Hub
docker login
# Username: draken101
# Password: [tu password de Docker Hub]
```

---

## 📁 Estructura de Dockerfiles

Cada microservicio tiene su propio Dockerfile optimizado:

```
Planty_Api_Gateway/
├── api-gateway/
│   ├── Dockerfile
│   └── .dockerignore
├── authentication/
│   ├── Dockerfile
│   └── .dockerignore
├── api-users/
│   ├── Dockerfile
│   └── .dockerignore
├── api-chatbot/
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
└── .env.example
```

### Características de los Dockerfiles

- ✅ **Multi-stage builds**: Reducen el tamaño de la imagen
- ✅ **Usuario no-root**: Mejora la seguridad
- ✅ **Health checks**: Monitorean el estado de los servicios
- ✅ **dumb-init**: Manejo correcto de señales
- ✅ **Optimización de layers**: Mejor uso de caché

---

## 🏗️ Build de Imágenes

### Opción 1: Build Individual (Recomendado)

#### 1. API Gateway

```bash
cd api-gateway

# Build de la imagen
docker build -t draken101/planty-api-gateway:latest .

# Verificar la imagen
docker images | grep planty-api-gateway
```

#### 2. Authentication Service

```bash
cd ../authentication

# Build de la imagen
docker build -t draken101/planty-authentication:latest .

# Verificar la imagen
docker images | grep planty-authentication
```

#### 3. Users Service

```bash
cd ../api-users

# Build de la imagen
docker build -t draken101/planty-api-users:latest .

# Verificar la imagen
docker images | grep planty-api-users
```

#### 4. Chatbot Service

```bash
cd ../api-chatbot

# Build de la imagen
docker build -t draken101/planty-api-chatbot:latest .

# Verificar la imagen
docker images | grep planty-api-chatbot
```

### Opción 2: Build Automatizado (Script)

Crea un archivo `build-all.sh` (Linux/Mac) o `build-all.bat` (Windows):

**build-all.sh:**
```bash
#!/bin/bash

echo "🏗️  Building Planty Docker Images..."

# API Gateway
echo "📦 Building API Gateway..."
cd api-gateway
docker build -t draken101/planty-api-gateway:latest .
cd ..

# Authentication
echo "📦 Building Authentication Service..."
cd authentication
docker build -t draken101/planty-authentication:latest .
cd ..

# Users Service
echo "📦 Building Users Service..."
cd api-users
docker build -t draken101/planty-api-users:latest .
cd ..

# Chatbot Service
echo "📦 Building Chatbot Service..."
cd api-chatbot
docker build -t draken101/planty-api-chatbot:latest .
cd ..

echo "✅ All images built successfully!"
docker images | grep planty
```

**build-all.bat (Windows):**
```batch
@echo off
echo Building Planty Docker Images...

echo Building API Gateway...
cd api-gateway
docker build -t draken101/planty-api-gateway:latest .
cd ..

echo Building Authentication Service...
cd authentication
docker build -t draken101/planty-authentication:latest .
cd ..

echo Building Users Service...
cd api-users
docker build -t draken101/planty-api-users:latest .
cd ..

echo Building Chatbot Service...
cd api-chatbot
docker build -t draken101/planty-api-chatbot:latest .
cd ..

echo All images built successfully!
docker images | findstr planty
```

Ejecutar:
```bash
# Linux/Mac
chmod +x build-all.sh
./build-all.sh

# Windows
build-all.bat
```

---

## 🚀 Push a Docker Hub

### Paso 1: Login en Docker Hub

```bash
docker login
# Username: draken101
# Password: [tu password]
```

### Paso 2: Push Individual

```bash
# API Gateway
docker push draken101/planty-api-gateway:latest

# Authentication Service
docker push draken101/planty-authentication:latest

# Users Service
docker push draken101/planty-api-users:latest

# Chatbot Service
docker push draken101/planty-api-chatbot:latest
```

### Paso 3: Push Automatizado (Script)

Crea un archivo `push-all.sh` (Linux/Mac) o `push-all.bat` (Windows):

**push-all.sh:**
```bash
#!/bin/bash

echo "🚀 Pushing Planty Docker Images to Docker Hub..."

# Login
docker login

# Push images
echo "📤 Pushing API Gateway..."
docker push draken101/planty-api-gateway:latest

echo "📤 Pushing Authentication Service..."
docker push draken101/planty-authentication:latest

echo "📤 Pushing Users Service..."
docker push draken101/planty-api-users:latest

echo "📤 Pushing Chatbot Service..."
docker push draken101/planty-api-chatbot:latest

echo "✅ All images pushed successfully!"
```

**push-all.bat (Windows):**
```batch
@echo off
echo Pushing Planty Docker Images to Docker Hub...

docker login

echo Pushing API Gateway...
docker push draken101/planty-api-gateway:latest

echo Pushing Authentication Service...
docker push draken101/planty-authentication:latest

echo Pushing Users Service...
docker push draken101/planty-api-users:latest

echo Pushing Chatbot Service...
docker push draken101/planty-api-chatbot:latest

echo All images pushed successfully!
```

Ejecutar:
```bash
# Linux/Mac
chmod +x push-all.sh
./push-all.sh

# Windows
push-all.bat
```

---

## 🎯 Despliegue con Docker Compose

### Paso 1: Configurar Variables de Entorno

```bash
# En la raíz del proyecto
cp .env.example .env
```

Editar `.env` con tus valores:
```env
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=password123
MONGO_DB_NAME=users_db

JWT_SECRET=planty-super-secret-jwt-key-2024-CAMBIA-ESTO-EN-PRODUCCION

CORS_ORIGIN=*

OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3.2

CHROMA_COLLECTION_NAME=plantas_suchiapa
```

### Paso 2: Descargar Modelos Ollama (IMPORTANTE)

Ollama debe estar corriendo en el **host** (no en Docker):

```bash
# Iniciar Ollama en el host
ollama serve

# En otra terminal, descargar modelos
ollama pull nomic-embed-text
ollama pull llama3.2

# Verificar
ollama list
```

### Paso 3: Iniciar Servicios

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api-gateway
docker-compose logs -f api-chatbot
```

### Paso 4: Verificar Estado

```bash
# Ver estado de contenedores
docker-compose ps

# Debería mostrar todos los servicios como "healthy"
```

Salida esperada:
```
NAME                      STATUS
planty-api-gateway        Up (healthy)
planty-authentication     Up (healthy)
planty-api-users          Up (healthy)
planty-api-chatbot        Up (healthy)
planty-mongodb            Up (healthy)
planty-chromadb           Up (healthy)
```

### Paso 5: Health Checks

```bash
# API Gateway
curl http://localhost:3000/health

# Users Service
curl http://localhost:3001/health

# Authentication Service
curl http://localhost:3002/health

# Chatbot Service
curl http://localhost:3003/health

# MongoDB
curl http://localhost:27017
# Esperado: "It looks like you are trying to access MongoDB over HTTP..."

# ChromaDB
curl http://localhost:8000/api/v1/heartbeat
```

### Paso 6: Inicializar PDF del Chatbot (Opcional)

```bash
# Entrar al contenedor del chatbot
docker exec -it planty-api-chatbot sh

# Ejecutar script de inicialización
npm run init-pdf

# Salir del contenedor
exit
```

---

## 🔄 Comandos Útiles de Docker Compose

### Gestión de Servicios

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Reiniciar todos los servicios
docker-compose restart

# Reiniciar un servicio específico
docker-compose restart api-gateway

# Detener y eliminar todo (incluyendo volúmenes)
docker-compose down -v

# Ver logs
docker-compose logs -f

# Ver logs de los últimos 100 líneas
docker-compose logs --tail=100 -f

# Reconstruir y reiniciar
docker-compose up -d --build

# Pull de imágenes actualizadas
docker-compose pull

# Escalar un servicio (ejemplo: 3 instancias de api-gateway)
docker-compose up -d --scale api-gateway=3
```

### Monitoreo

```bash
# Ver recursos usados
docker stats

# Ver procesos corriendo en un contenedor
docker top planty-api-gateway

# Inspeccionar un contenedor
docker inspect planty-api-gateway

# Ver redes
docker network ls
docker network inspect planty_planty-network

# Ver volúmenes
docker volume ls
docker volume inspect planty_mongodb-data
```

### Debugging

```bash
# Entrar a un contenedor
docker exec -it planty-api-gateway sh

# Ver logs de un contenedor
docker logs planty-api-gateway

# Seguir logs en tiempo real
docker logs -f planty-api-gateway

# Copiar archivo desde contenedor
docker cp planty-api-gateway:/app/.env ./gateway.env

# Copiar archivo a contenedor
docker cp local-file.txt planty-api-gateway:/app/
```

---

## 🔐 Configuración de Variables de Entorno

### Variables Obligatorias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `MONGO_ROOT_USER` | Usuario root de MongoDB | `admin` |
| `MONGO_ROOT_PASSWORD` | Contraseña de MongoDB | `password123` |
| `JWT_SECRET` | Secret para JWT (debe ser igual en todos los servicios) | `planty-secret-2024` |
| `OLLAMA_BASE_URL` | URL de Ollama en el host | `http://host.docker.internal:11434` |

### Variables Opcionales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | Origen permitido para CORS | `*` |
| `MONGO_DB_NAME` | Nombre de la base de datos | `users_db` |
| `OLLAMA_EMBEDDING_MODEL` | Modelo de embeddings | `nomic-embed-text` |
| `OLLAMA_CHAT_MODEL` | Modelo de chat | `llama3.2` |
| `CHUNK_SIZE` | Tamaño de chunks para RAG | `1000` |
| `CHUNK_OVERLAP` | Solapamiento de chunks | `200` |

---

## 📊 Arquitectura de Despliegue

```
                    ┌─────────────────┐
                    │   Ollama (Host) │
                    │   Port: 11434   │
                    └────────┬────────┘
                             │
         ┌───────────────────┴────────────────────┐
         │        Docker Network: planty-network  │
         │                                         │
┌────────┴─────────┐    ┌────────────────────┐   │
│   API Gateway    │    │    MongoDB         │   │
│   Port: 3000     │    │    Port: 27017     │   │
└────────┬─────────┘    └────────────────────┘   │
         │                                         │
    ┌────┴────┬────────────┬──────────────┐      │
    │         │            │              │       │
┌───▼──┐ ┌───▼──────┐ ┌──▼────────┐ ┌───▼──────┐│
│Users │ │   Auth   │ │ Chatbot   │ │ChromaDB  ││
│3001  │ │   3002   │ │   3003    │ │  8000    ││
└──────┘ └──────────┘ └─────┬─────┘ └──────────┘│
                             │                    │
                       ┌─────▼─────┐             │
                       │  Uploads  │             │
                       │  Volume   │             │
                       └───────────┘             │
         └──────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Problema: Imagen no se construye

**Solución:**
```bash
# Limpiar caché de Docker
docker builder prune -af

# Build sin caché
docker build --no-cache -t draken101/planty-api-gateway:latest .

# Verificar logs de build
docker build -t draken101/planty-api-gateway:latest . --progress=plain
```

### Problema: No se puede hacer push a Docker Hub

**Solución:**
```bash
# Re-login
docker logout
docker login

# Verificar nombre de usuario
docker info | grep Username

# Tag correcto de la imagen
docker tag planty-api-gateway:latest draken101/planty-api-gateway:latest
docker push draken101/planty-api-gateway:latest
```

### Problema: Servicio no inicia (unhealthy)

**Solución:**
```bash
# Ver logs del servicio
docker-compose logs api-gateway

# Verificar health check
docker inspect planty-api-gateway | grep -A 10 Health

# Reiniciar servicio específico
docker-compose restart api-gateway

# Entrar al contenedor y debuggear
docker exec -it planty-api-gateway sh
curl http://localhost:3000/health
```

### Problema: Chatbot no conecta a Ollama

**Solución:**
```bash
# Verificar que Ollama está corriendo en el host
curl http://localhost:11434/api/version

# Verificar conectividad desde el contenedor
docker exec -it planty-api-chatbot sh
wget -O- http://host.docker.internal:11434/api/version

# En Linux, puede ser necesario usar la IP del host
ip addr show docker0
# Usar la IP mostrada en lugar de host.docker.internal
```

### Problema: Error de permisos en contenedor

**Solución:**
```bash
# Verificar permisos de volúmenes
docker volume inspect planty_chatbot-uploads

# Recrear volúmenes
docker-compose down -v
docker-compose up -d

# Cambiar permisos dentro del contenedor
docker exec -it --user root planty-api-chatbot sh
chown -R nodejs:nodejs /app/uploads
```

### Problema: MongoDB no inicia

**Solución:**
```bash
# Ver logs
docker-compose logs mongodb

# Eliminar volumen y recrear
docker-compose down
docker volume rm planty_mongodb-data
docker-compose up -d mongodb

# Verificar conexión
docker exec -it planty-mongodb mongosh -u admin -p password123 --authenticationDatabase admin
```

### Problema: Servicios no se comunican entre sí

**Solución:**
```bash
# Verificar red
docker network inspect planty_planty-network

# Verificar DNS interno
docker exec -it planty-api-gateway sh
ping api-users
ping mongodb

# Recrear red
docker-compose down
docker network prune
docker-compose up -d
```

---

## 🔄 Actualización de Servicios

### Cuando hagas cambios en el código:

```bash
# 1. Build nueva imagen
cd api-gateway
docker build -t draken101/planty-api-gateway:latest .

# 2. Push a Docker Hub
docker push draken101/planty-api-gateway:latest

# 3. En el servidor de producción:
docker-compose pull api-gateway
docker-compose up -d api-gateway

# O todos los servicios:
docker-compose pull
docker-compose up -d
```

---

## 📝 Checklist de Despliegue

Antes de desplegar en producción:

- [ ] Docker Desktop instalado y corriendo
- [ ] Login en Docker Hub (`docker login`)
- [ ] Build de todas las imágenes exitoso
- [ ] Push a Docker Hub exitoso
- [ ] Archivo `.env` configurado correctamente
- [ ] `JWT_SECRET` cambiado del valor por defecto
- [ ] Ollama corriendo en el host con modelos descargados
- [ ] `ollama list` muestra `nomic-embed-text` y `llama3.2`
- [ ] `docker-compose up -d` ejecutado
- [ ] Todos los servicios en estado "healthy"
- [ ] Health checks pasando para todos los servicios
- [ ] PDF inicializado en el chatbot (opcional)
- [ ] Pruebas de registro, login y chat funcionando

---

## 🚀 Despliegue en Servidor Remoto

### SSH al servidor

```bash
ssh usuario@tu-servidor.com
```

### Instalar Docker (si no está instalado)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Clonar proyecto o copiar docker-compose.yml

```bash
mkdir planty && cd planty
# Copiar docker-compose.yml y .env al servidor
```

### Instalar Ollama en el servidor

```bash
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelos
ollama pull nomic-embed-text
ollama pull llama3.2

# Iniciar como servicio
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Iniciar servicios

```bash
docker-compose up -d
docker-compose ps
docker-compose logs -f
```

---

## 🎉 ¡Listo!

Tu aplicación Planty ahora está corriendo en contenedores Docker y lista para escalar.

**URLs de acceso:**
- API Gateway: http://localhost:3000
- Users Service: http://localhost:3001
- Authentication: http://localhost:3002
- Chatbot: http://localhost:3003
- MongoDB: mongodb://localhost:27017
- ChromaDB: http://localhost:8000

**Imágenes en Docker Hub:**
- https://hub.docker.com/r/draken101/planty-api-gateway
- https://hub.docker.com/r/draken101/planty-authentication
- https://hub.docker.com/r/draken101/planty-api-users
- https://hub.docker.com/r/draken101/planty-api-chatbot

---

## 📞 Soporte

Si tienes problemas con el despliegue, verifica:
1. Logs de Docker Compose: `docker-compose logs -f`
2. Estado de contenedores: `docker-compose ps`
3. Conectividad de red: `docker network inspect planty_planty-network`
4. Health checks: `curl http://localhost:3000/health`

**¡Happy Deploying! 🐳🚀**
