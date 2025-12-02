# Dockerfile para PlantGen API Microservice
# Imagen base ligera de Python 3.11
FROM python:3.11-slim

# Metadata
LABEL maintainer="Leonardo Favio Najera Morales"
LABEL description="PlantGen API - Sistema de Optimización de Huertos Urbanos con AG"
LABEL version="1.0.0"

# Establecer directorio de trabajo
WORKDIR /app

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Copiar archivos de dependencias
COPY requirements.txt .

# Instalar dependencias
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copiar código fuente
COPY . .

# Crear usuario no-root para seguridad
RUN useradd -m -u 1000 plantgen && \
    chown -R plantgen:plantgen /app

# Cambiar a usuario no-root
USER plantgen

# Exponer puerto 3005
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:3005/api/v1/health')" || exit 1

# Comando para ejecutar la aplicación
CMD ["python", "main.py"]
