# 🌱 Sistema de Generación de Datos para Clustering

Sistema completo de generación de **100,000 usuarios** y sus **huertos realistas** para entrenamiento de modelos de machine learning (clustering y recomendaciones).

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#-resumen-ejecutivo)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Guía Rápida de Uso](#-guía-rápida-de-uso)
4. [Características de los Datos](#-características-de-los-datos)
5. [Documentación Detallada](#-documentación-detallada)

---

## 🎯 Resumen Ejecutivo

### ¿Qué hace este sistema?

1. **Genera 100,000 usuarios realistas** con:
   - Datos coherentes (fechas, preferencias, experiencia)
   - Distribución realista de perfiles
   - Anomalías intencionales (5%) para clustering
   - Historial de actividad de 11 meses (enero-noviembre 2025)

2. **Genera huertos automáticamente** para cada usuario:
   - Usa el **Algoritmo Genético** para diseños óptimos
   - Simula comportamiento según nivel de experiencia
   - Modifica diseños del AG según habilidad del usuario
   - Genera layouts manuales cuando corresponde
   - Crea 0-3 huertos por usuario según perfil

### ¿Para qué sirve?

✅ Entrenar modelos de **clustering** de usuarios
✅ Entrenar sistemas de **recomendación** de plantas
✅ Analizar patrones de comportamiento
✅ Detectar anomalías y usuarios atípicos
✅ Simular datos reales para pruebas de ML

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     FLUJO DE GENERACIÓN                      │
└─────────────────────────────────────────────────────────────┘

1️⃣  POST /api/users/seed
    ↓
    api-users (puerto 3001)
    ├── Genera 100,000 usuarios en lotes de 1,000
    ├── Datos coherentes con faker.js
    ├── Distribución realista de perfiles
    ├── Anomalías intencionales (5%)
    └── Guarda en MongoDB (users_db)

    Resultado: 100,000 usuarios guardados
    Tiempo: ~7-10 minutos

2️⃣  POST /orchards/seed
    ↓
    api-orchard (puerto 3004)
    ├── Obtiene usuarios en lotes de 100 → api-users
    ├── Para cada usuario:
    │   ├── Decide si crear huertos (según perfil)
    │   ├── Determina cantidad (0-3)
    │   ├── Para cada huerto:
    │   │   ├── Genera dimensiones coherentes
    │   │   ├── ¿Usar AG?
    │   │   │   ├── SÍ → Llama api-ag (puerto 3005)
    │   │   │   │   ├── Recibe top 3 diseños
    │   │   │   │   ├── Elige 1 aleatoriamente
    │   │   │   │   └── ¿Modificar? → Según experiencia
    │   │   │   └── NO → Crea layout manual
    │   │   ├── Determina estado (activo/abandonado)
    │   │   └── Guarda en MongoDB (orchard_db)
    │   └── Actualiza count_orchards del usuario
    └── Siguiente lote

    Resultado: ~70,000 huertos generados
    Tiempo: ~20-30 horas (con llamadas al AG)

┌─────────────────────────────────────────────────────────────┐
│                    SERVICIOS REQUERIDOS                      │
└─────────────────────────────────────────────────────────────┘

✅ MongoDB        (localhost:27017)  - Base de datos
✅ api-users      (localhost:3001)   - Gestión de usuarios
✅ api-orchard    (localhost:3004)   - Gestión de huertos
✅ api-ag         (localhost:3005)   - Algoritmo Genético
```

---

## 🚀 Guía Rápida de Uso

### Prerequisitos

```bash
# Verificar que los servicios estén corriendo
curl http://localhost:3001/health   # api-users
curl http://localhost:3004/orchards/health  # api-orchard
curl http://localhost:3005/v1/health  # api-ag
```

### Paso 1: Generar Usuarios (7-10 minutos)

```bash
# Generar 100,000 usuarios
curl -X POST "http://localhost:3001/api/users/seed"

# O para pruebas rápidas (100 usuarios en 30 segundos)
curl -X POST "http://localhost:3001/api/users/seed?total=100&batchSize=50"
```

**Esperar a que termine antes de continuar** ⏳

### Paso 2: Generar Huertos (20-30 horas)

```bash
# Generar huertos para todos los usuarios
curl -X POST "http://localhost:3004/orchards/seed"

# O para pruebas rápidas
curl -X POST "http://localhost:3004/orchards/seed?batchSize=10"
```

### Verificar Resultados

```bash
# Ver cantidad de usuarios creados
curl "http://localhost:3001/api/users?limit=10"

# Ver huertos de un usuario específico
curl "http://localhost:3004/orchards/user/USER_ID"

# Verificar en MongoDB
mongosh
> use users_db
> db.users.countDocuments()
> use orchard_db
> db.orchards.countDocuments()
```

---

## 📊 Características de los Datos

### Usuarios (100,000)

| Característica | Valor |
|----------------|-------|
| **Nivel 1 (Principiantes)** | 50,000 (50%) |
| **Nivel 2 (Intermedios)** | 35,000 (35%) |
| **Nivel 3 (Avanzados)** | 15,000 (15%) |
| **Verificados** | 80,000 (80%) |
| **Con preferencias definidas** | 90,000 (90%) |
| **Con plantas favoritas** | ~75,000 (75%) |
| **Usuarios anómalos** | 5,000 (5%) |

**Rango de fechas:** Enero 1 - Noviembre 30, 2025
**Picos de registro:** Enero, Marzo-Abril, Septiembre

### Huertos (~120,000)

| Característica | Valor |
|----------------|-------|
| **⚠️ Requisito** | Solo usuarios verificados (is_verified: true) |
| **Usuarios con huertos** | ~56,000 de 80,000 verificados (~70%) |
| **Huertos por usuario** | 1-3 (promedio: 2.1) |
| **Total huertos** | ~120,000 |
| **Generados con AG** | ~60,000 (50%) |
| **Generados manualmente** | ~60,000 (50%) |
| **Huertos activos** | ~94,000 (78%) |
| **Huertos abandonados** | ~26,000 (22%) |

**Dimensiones:**
- Nivel 1: 2-6 m²
- Nivel 2: 4-12 m²
- Nivel 3: 6-20 m²

**Plantas por huerto:**
- Nivel 1: 1-3 plantas
- Nivel 2: 2-6 plantas
- Nivel 3: 3-10+ plantas

### Anomalías Incluidas (para Clustering)

1. **Usuario nivel 3 con comportamiento novato** (~1,250 casos)
   - Alto nivel pero sin actividad
   - Sin plantas favoritas

2. **Cuenta antigua sin verificar** (~1,250 casos)
   - Registrada hace 10+ meses
   - Sin actividad

3. **Preferencias contradictorias** (~1,250 casos)
   - Nivel 1 con todas las categorías
   - 20+ plantas favoritas

4. **Actividad errática** (~1,250 casos)
   - Burst de 50+ logins recientes
   - Comportamiento irregular

---

## 📚 Documentación Detallada

### Para Usuarios

📖 [**SEED_USERS_GUIDE.md**](api-users/SEED_USERS_GUIDE.md)
- Endpoint completo con ejemplos
- Parámetros disponibles
- Distribuciones estadísticas
- Características de datos generados
- Solución de problemas

### Para Huertos

📖 [**SEED_ORCHARDS_GUIDE.md**](api-orchard/SEED_ORCHARDS_GUIDE.md)
- Endpoint completo con ejemplos
- Lógica de generación detallada
- Integración con AG
- Flujo de ejecución
- Tiempos estimados
- Solución de problemas

---

## ⚙️ Configuración Avanzada

### Variables de Entorno

#### api-users (.env)
```env
PORT=3001
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=password123
MONGO_DB_NAME=users_db
```

#### api-orchard (.env)
```env
PORT=3004
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=password123
MONGO_DATABASE=orchard_db
```

#### api-ag (.env)
```env
PORT=3005
AG_POPULATION_SIZE=40
AG_MAX_GENERATIONS=150
AG_EXECUTION_TIMEOUT_MS=30000
```

---

## 📈 Métricas de Rendimiento

### Tiempos Estimados

| Operación | 100 usuarios | 1,000 usuarios | 10,000 usuarios | 100,000 usuarios |
|-----------|--------------|----------------|-----------------|------------------|
| **Seed Users** | 30s | 30s | 5min | 7-10min |
| **Seed Orchards** | 2min | 15min | 2-3h | 20-30h |
| **Total** | 2.5min | 15.5min | 2-3h | 20-30h |

### Uso de Recursos

**RAM:**
- api-users: ~200-500 MB
- api-orchard: ~300-700 MB
- api-ag: ~500 MB - 1 GB

**Disco (MongoDB):**
- 100 usuarios: ~50 KB
- 1,000 usuarios: ~500 KB
- 10,000 usuarios: ~5 MB
- 100,000 usuarios: ~50-70 MB
- Huertos: ~100-150 MB adicionales

**CPU:**
- Picos durante generación
- AG usa ~80-100% durante diseño

---

## 🔧 Solución de Problemas Comunes

### Error: "Cannot connect to MongoDB"
```bash
# Verificar MongoDB
mongosh
# Si falla, iniciar MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
net start MongoDB  # Windows
```

### Error: "Timeout calling AG service"
```bash
# El AG tarda hasta 30 segundos por diseño
# Si falla, el sistema crea layout manual automáticamente
# Verificar que api-ag esté corriendo:
curl http://localhost:3005/v1/health
```

### El proceso es muy lento
```bash
# Reducir batchSize
curl -X POST "http://localhost:3004/orchards/seed?batchSize=20"

# O generar menos usuarios primero
curl -X POST "http://localhost:3001/api/users/seed?total=1000"
```

### Errores de memoria
```bash
# Aumentar memoria de Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

---

## 🎓 Casos de Uso para Machine Learning

### 1. Clustering de Usuarios

```python
import pandas as pd
from sklearn.cluster import KMeans

# Cargar datos
users = pd.read_json('users_export.json')

# Features para clustering
features = [
    'experience_level',
    'count_orchards',
    'days_since_registration',
    'activity_frequency',
    'preferred_categories_count',
    'favorite_plants_count',
    'is_verified'
]

# K-Means
kmeans = KMeans(n_clusters=5)
users['cluster'] = kmeans.fit_predict(users[features])
```

### 2. Sistema de Recomendación

```python
# Usar favorite_plants y preferred_plant_category
# para entrenar sistema de recomendación colaborativo

from surprise import SVD, Dataset

# Preparar datos
data = Dataset.load_from_df(
    user_plant_ratings[['userId', 'plantId', 'rating']],
    reader
)

# Entrenar
algo = SVD()
algo.fit(data.build_full_trainset())
```

### 3. Detección de Anomalías

```python
from sklearn.ensemble import IsolationForest

# El 5% de usuarios anómalos sirven como ground truth
# para validar el modelo de detección

iso_forest = IsolationForest(contamination=0.05)
predictions = iso_forest.fit_predict(user_features)
```

---

## 🤝 Contribuciones

Para reportar bugs o sugerir mejoras:
1. Crear issue en repositorio
2. Describir el problema con logs
3. Incluir pasos para reproducir

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles

---

## 👥 Autores

- **Equipo de Desarrollo** - Sistema de Generación de Datos
- **Vega Script** - Arquitectura de Microservicios

---

## 🎉 ¡Listo para usar!

Sigue la [Guía Rápida](#-guía-rápida-de-uso) y tendrás 100,000 usuarios con huertos realistas en unas horas.

**¡Feliz clustering! 🌱📊**
