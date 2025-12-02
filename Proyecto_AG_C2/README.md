# PlantGen API 🌱

**Sistema Inteligente para Optimización de Huertos Urbanos mediante Algoritmos Genéticos**

Microservicio REST API basado en arquitectura limpia que genera configuraciones optimizadas de huertos urbanos para Suchiapas, Chiapas, México, utilizando algoritmos genéticos multi-objetivo.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Endpoints API](#-endpoints-api)
- [Algoritmo Genético](#-algoritmo-genético)
- [Docker](#-docker)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Contribuir](#-contribuir)

---

## ✨ Características

- **Algoritmo Genético Multi-Objetivo**: Optimiza simultáneamente 4 métricas:
  - CEE: Compatibilidad Entre Especies
  - PSNTPA: Porcentaje de Satisfacción Nutricional/Terapéutica
  - WCE: Eficiencia Hídrica (Water Consumption Efficiency)
  - UE: Utilización de Espacio

- **Base de Datos Regional**: 50 plantas adaptadas al clima tropical de Suchiapas, Chiapas
- **Matriz de Compatibilidad**: Basada en principios de agricultura asociativa
- **Arquitectura Limpia**: Separación de capas (Domain, Application, Infrastructure)
- **FastAPI**: Documentación automática con Swagger/OpenAPI
- **MongoDB**: Persistencia de datos con Motor (async)
- **Docker Ready**: Dockerfile optimizado para despliegue

---

## 🏗️ Arquitectura

El proyecto sigue **Clean Architecture** con **Domain-Driven Design (DDD)**:

```
PlantGen-API/
├── src/
│   ├── domain/              # Capa de Dominio
│   │   ├── entities/        # Entidades (Plant, GardenLayout, CompatibilityPair)
│   │   ├── value_objects/   # Value Objects (GardenObjective, GardenConstraints)
│   │   ├── repositories/    # Interfaces de repositorios
│   │   └── services/        # Servicios de dominio (GeneticAlgorithm)
│   ├── application/         # Capa de Aplicación
│   │   ├── dtos/           # Data Transfer Objects
│   │   └── use_cases/      # Casos de uso (GenerateGardenUseCase)
│   └── infrastructure/      # Capa de Infraestructura
│       ├── database/       # Repositorios MongoDB
│       └── api/            # Controladores FastAPI
├── scripts/                # Scripts de utilidad
├── data/                   # Archivos JSON de datos
├── main.py                 # Punto de entrada
├── Dockerfile
└── requirements.txt
```

---

## 🛠️ Tecnologías

- **Python 3.11**
- **FastAPI** 0.109.2 - Framework web moderno y rápido
- **Motor** 3.3.2 - Driver async de MongoDB
- **Pydantic** 2.6.1 - Validación de datos
- **Uvicorn** - Servidor ASGI
- **MongoDB** - Base de datos NoSQL
- **Docker** - Contenedorización

---

## 📦 Requisitos Previos

- Python 3.11+
- MongoDB 6.0+ (local o Docker)
- pip
- (Opcional) Docker para contenedorización

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
cd PlantGen-API
```

### 2. Crear entorno virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

---

## ⚙️ Configuración

### 1. Configurar variables de entorno

Copiar `.env.example` a `.env` y editar:

```bash
cp .env.example .env
```

Contenido del `.env`:

```env
# MongoDB Configuration
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=TuPassword123!
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DATABASE=Data_plants

# API Configuration
PORT=3005
```

### 2. Iniciar MongoDB

**Opción A: Docker**

```bash
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=TuPassword123! \
  mongo:latest
```

**Opción B: MongoDB local**

Asegúrate de tener MongoDB corriendo en `localhost:27017`

### 3. Cargar datos a MongoDB

```bash
python scripts/load_data_to_mongodb.py
```

Esto cargará:
- **Colección `Plants`**: 50 plantas con sus atributos
- **Colección `Matriz`**: Pares de compatibilidad entre especies

---

## 💻 Uso

### Ejecutar el servidor

```bash
python main.py
```

El servidor se iniciará en `http://localhost:3005`

### Acceder a la documentación

- **Swagger UI**: http://localhost:3005/docs
- **ReDoc**: http://localhost:3005/redoc

---

## 🌐 Endpoints API

### 1. Health Check

```http
GET /api/v1/health
```

**Respuesta:**

```json
{
  "status": "healthy",
  "service": "PlantGen API",
  "version": "1.0.0",
  "database": "connected",
  "plants_count": 50,
  "compatibility_pairs_count": 1275
}
```

### 2. Generar Huerto

```http
POST /api/v1/generate
```

**Body (JSON):**

```json
{
  "objective": "alimenticio",
  "area": 2.0,
  "max_water": 150.0,
  "budget": 400.0,
  "maintenance_time": 90,
  "population_size": 40,
  "max_generations": 150
}
```

**Parámetros:**

- `objective`: `"alimenticio"` | `"medicinal"` | `"sostenible"` | `"ornamental"`
- `area`: Área en m² (1.0 - 5.0)
- `max_water`: Agua máxima en L/semana (80 - 200)
- `budget`: Presupuesto en MXN (200 - 800)
- `maintenance_time`: Tiempo de mantenimiento en min/semana (≥ 30)
- `population_size`: Tamaño de población del AG (10 - 100)
- `max_generations`: Generaciones máximas (50 - 500)

**Respuesta (Top 3 configuraciones):**

```json
{
  "success": true,
  "message": "Se generaron 3 configuraciones de huerto exitosamente",
  "solutions": [
    {
      "rank": 1,
      "layout": [[1, 8, null], [11, 1, 8]],
      "width": 1.41,
      "height": 1.41,
      "fitness": 0.873,
      "cee": 0.850,
      "psntpa": 0.920,
      "wce": 0.780,
      "ue": 0.820,
      "plants": [
        {
          "id": 1,
          "species": "Cilantro",
          "scientific_name": "Coriandrum sativum",
          "type": ["aromatic", "medicinal", "vegetable"],
          "count": 2,
          "total_area": 0.30,
          "total_water": 22.0
        }
      ],
      "total_plants": 12,
      "total_water_weekly": 145.5,
      "total_area_used": 1.85,
      "total_cost": 380.0,
      "estimated_production_monthly": 10.5,
      "planting_calendar": [...]
    }
  ],
  "generations_executed": 87,
  "convergence_reason": "Sin mejora en 20 generaciones",
  "execution_time_seconds": 2.34,
  "parameters_used": {...}
}
```

---

## 🧬 Algoritmo Genético

### Parámetros (según documento LaTeX)

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| Población | 40 | Balance cómputo-exploración |
| Generaciones máximas | 150 | Suficiente para convergencia |
| Probabilidad de cruza | 0.85 | Alta reproducción |
| Tasa de mutación | 0.08 | 8% de genes mutan |
| Torneo k | 3 | Presión selectiva media |
| Individuos elite | 3 | Preserva mejores |
| Paciencia | 20 | Generaciones sin mejora |

### Fases del Algoritmo

1. **Inicialización**: Generación de 40 individuos aleatorios
2. **Selección por Torneo**: k=3
3. **Cruza de Dos Puntos**: Probabilidad 0.85
4. **Mutación por Intercambio**: Tasa 0.08
5. **Evaluación**: Cálculo de fitness multi-objetivo
6. **Reemplazo Generacional**: Elitismo (μ+λ)
7. **Criterios de Parada**:
   - Alcanzar 150 generaciones
   - Sin mejora en 20 generaciones
   - Varianza de fitness < 0.001

### Función de Fitness

```
Fitness(I) = w₁·CEE + w₂·PSNTPA + w₃·WCE + w₄·UE
```

**Pesos dinámicos según objetivo:**

| Objetivo | CEE | PSNTPA | WCE | UE |
|----------|-----|--------|-----|-----|
| Alimenticio | 0.20 | 0.50 | 0.20 | 0.10 |
| Medicinal | 0.25 | 0.45 | 0.15 | 0.15 |
| Sostenible | 0.25 | 0.20 | 0.40 | 0.15 |
| Ornamental | 0.20 | 0.40 | 0.15 | 0.25 |

---

## 🐳 Docker

### Construir imagen

```bash
docker build -t plantgen-api:1.0.0 .
```

### Ejecutar contenedor

```bash
docker run -d \
  -p 3005:3005 \
  --name plantgen-api \
  --env-file .env \
  plantgen-api:1.0.0
```

### Docker Compose (ejemplo)

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: TuPassword123!
    volumes:
      - mongo_data:/data/db

  plantgen-api:
    build: .
    ports:
      - "3005:3005"
    depends_on:
      - mongodb
    environment:
      MONGO_HOST: mongodb
      MONGO_PORT: 27017

volumes:
  mongo_data:
```

---

## 📁 Estructura del Proyecto

```
PlantGen-API/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Plant.py
│   │   │   ├── GardenLayout.py
│   │   │   └── CompatibilityPair.py
│   │   ├── value_objects/
│   │   │   ├── GardenObjective.py
│   │   │   └── GardenConstraints.py
│   │   ├── repositories/
│   │   │   ├── IPlantRepository.py
│   │   │   └── ICompatibilityRepository.py
│   │   └── services/
│   │       └── GeneticAlgorithm.py
│   ├── application/
│   │   ├── dtos/
│   │   │   ├── GenerateGardenRequest.py
│   │   │   └── GenerateGardenResponse.py
│   │   └── use_cases/
│   │       └── GenerateGardenUseCase.py
│   └── infrastructure/
│       ├── database/
│       │   ├── MongoConnection.py
│       │   ├── MongoPlantRepository.py
│       │   └── MongoCompatibilityRepository.py
│       └── api/
│           └── controllers.py
├── scripts/
│   └── load_data_to_mongodb.py
├── data/
│   ├── plants_with_id.json
│   └── matriz_compatibilities.json
├── main.py
├── requirements.txt
├── Dockerfile
├── .env.example
├── .gitignore
└── README.md
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto fue desarrollado como parte de un proyecto académico en la **Universidad Politécnica de Chiapas**.

---

## 👨‍💻 Autor

**Leonardo Favio Najera Morales**
Matrícula: 231230
Universidad Politécnica de Chiapas
Ingeniería en Tecnologías de la Información e Innovación Digital

---

## 🙏 Agradecimientos

- Universidad Politécnica de Chiapas
- Comunidad de Suchiapas, Chiapas
- FastAPI y MongoDB communities

---

## 📚 Referencias

- Documento técnico LaTeX: "PlantGen - Sistema Inteligente para Optimización de Huertos Urbanos"
- Algoritmos Genéticos Multi-Objetivo
- Agricultura Asociativa Chiapaneca
