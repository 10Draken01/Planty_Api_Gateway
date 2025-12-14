# 🌱 Guía de Uso: Endpoint de Generación de Huertos

## 🎯 Propósito

Este endpoint genera **huertos realistas** para todos los usuarios existentes en el sistema, utilizando el **Algoritmo Genético (AG)** y simulando comportamiento humano según nivel de experiencia.

---

## 🚀 Endpoint

```
POST http://localhost:3004/orchards/seed
```

---

## 📊 Parámetros (Query String)

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `batchSize` | number | `100` | Usuarios a procesar por lote (1 - 1,000) |
| `usersServiceUrl` | string | `http://localhost:3001/api/users` | URL del servicio de usuarios |
| `agServiceUrl` | string | `http://localhost:3005/v1` | URL del algoritmo genético |

---

## 📝 Ejemplos de Uso

### 1. Generar huertos para todos los usuarios (configuración por defecto)

```bash
curl -X POST "http://localhost:3004/orchards/seed"
```

### 2. Procesar en lotes de 50 usuarios

```bash
curl -X POST "http://localhost:3004/orchards/seed?batchSize=50"
```

### 3. Configurar URLs personalizadas de servicios

```bash
curl -X POST "http://localhost:3004/orchards/seed?usersServiceUrl=http://192.168.1.10:3001/api/users&agServiceUrl=http://192.168.1.10:3005/v1"
```

---

## ✅ Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Seed de huertos completado exitosamente",
  "status": 200,
  "data": {
    "totalUsersProcessed": 100000,
    "totalOrchardsCreated": 95420,
    "executionTimeMs": 7200000,
    "executionTimeMinutes": 120.0,
    "averageTimePerUser": 72.0,
    "errors": []
  }
}
```

---

## ❌ Respuestas de Error

### Error de validación (400 Bad Request)

```json
{
  "success": false,
  "message": "El batchSize debe estar entre 1 y 1,000",
  "status": 400
}
```

### Error de comunicación con servicios (500)

```json
{
  "success": false,
  "message": "Error durante el seed de huertos",
  "error": "Cannot connect to users service at http://localhost:3001",
  "status": 500
}
```

---

## 🎲 Lógica de Generación de Huertos

### 1. **Decisión: ¿El usuario tendrá huertos?**

**⚠️ REGLA CRÍTICA:** Solo usuarios con `is_verified: true` pueden tener huertos.
- `is_verified: true` = Registro exitoso con verificación
- `is_verified: false` = Usuario no completó registro → **0 huertos**

**Probabilidad según perfil (solo usuarios verificados):**

| Tipo de Usuario | Probabilidad |
|-----------------|--------------|
| No verificado | **0%** ❌ (sin acceso) |
| Verificado - Nivel 1 | 50% |
| Verificado - Nivel 2 | 75% |
| Verificado - Nivel 3 | 90% |

### 2. **Cantidad de huertos (1-3 por usuario)**

**Usuarios nuevos (< 30 días):**
- 1 huerto: 100% (garantizado)

**Nivel 1 (Principiantes):**
- 1 huerto: 50%
- 2 huertos: 35%
- 3 huertos: 15%

**Nivel 2 (Intermedios):**
- 1 huerto: 25%
- 2 huertos: 40%
- 3 huertos: 35%

**Nivel 3 (Avanzados):**
- 1 huerto: 15%
- 2 huertos: 25%
- 3 huertos: 60%

**Promedio esperado:** ~2.1 huertos por usuario verificado con huertos

### 3. **Dimensiones del huerto**

**Según experiencia:**

| Nivel | Área (m²) | Dimensiones Típicas |
|-------|-----------|---------------------|
| 1 | 2-6 m² | 2x3, 1.5x4, 2x2.5 |
| 2 | 4-12 m² | 3x4, 2.5x5, 3x3 |
| 3 | 6-20 m² | 4x5, 3x6, 5x4 |

### 4. **Uso del Algoritmo Genético**

**Probabilidad de usar AG:**

| Nivel | Probabilidad de usar AG |
|-------|-------------------------|
| 1 | 20% (mayoría crea manual) |
| 2 | 50% (mitad usa AG) |
| 3 | 80% (mayoría usa AG) |

### 5. **Modificación de soluciones del AG**

Los usuarios menos experimentados tienden a modificar las soluciones del AG:

**Probabilidad de modificar:**
- **Nivel 1:** 80% modifica (2-60% de plantas)
- **Nivel 2:** 50% modifica (1-30% de plantas)
- **Nivel 3:** 20% modifica (0-15% de plantas)

**Tipos de modificaciones:**
- **40%:** Mover plantas (puede crear superposiciones)
- **30%:** Eliminar plantas
- **20%:** Agregar nuevas plantas
- **10%:** Cambiar rotación

### 6. **Layouts manuales (sin AG)**

Para usuarios que no usan AG:

**Cantidad de plantas:**
- **Nivel 1:** 1 - 30% del área
- **Nivel 2:** 2 - 50% del área
- **Nivel 3:** 3 - 70% del área

**Características:**
- Usa plantas favoritas del usuario si existen
- Posiciones aleatorias (pueden tener superposiciones)
- Tamaños variados (0.4 - 1.8 m²)

### 7. **Estado del huerto**

**Probabilidad de estar activo:**

| Categoría | Activo |
|-----------|--------|
| Usuario registrado hace < 60 días | 95% |
| Verificado - Nivel 1 | 60% |
| Verificado - Nivel 2 | 75% |
| Verificado - Nivel 3 | 85% |

**Nota:** Todos los usuarios con huertos están verificados (`is_verified: true`).

### 8. **Fechas coherentes**

- Huerto creado entre 0-90% del tiempo desde registro del usuario
- Fechas de creación realistas
- Huertos más antiguos para usuarios más antiguos

---

## 🧬 Integración con Algoritmo Genético

### Request al AG

```json
{
  "userId": "user_123...",
  "desiredPlantIds": [1, 5, 12, 23],
  "maxPlantSpecies": 5,
  "dimensions": {
    "width": 4.5,
    "height": 3.2
  },
  "waterLimit": 45,
  "userExperience": 2,
  "objective": "alimenticio",
  "categoryDistribution": {
    "vegetable": 50,
    "aromatic": 30,
    "medicinal": 10,
    "ornamental": 10
  }
}
```

### Response del AG

El sistema selecciona **una de las 3 mejores soluciones** aleatoriamente y convierte las plantas del AG al formato de PlantInLayout.

---

## 📊 Ejemplo de Huerto Generado

```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user_12345...",
  "name": "Mi Huerto",
  "description": "Huerto familiar de María",
  "width": 4.5,
  "height": 3.2,
  "area": 14.4,
  "availableArea": 8.3,
  "state": true,
  "plants": [
    {
      "id": "plant-instance-uuid-1",
      "plantId": 5,
      "position": { "x": 0.5, "y": 1.2 },
      "width": 1.0,
      "height": 1.0,
      "rotation": 0,
      "status": "planted"
    },
    {
      "id": "plant-instance-uuid-2",
      "plantId": 12,
      "position": { "x": 2.3, "y": 0.8 },
      "width": 1.2,
      "height": 1.2,
      "rotation": 90,
      "status": "planted"
    }
  ],
  "createAt": "2025-04-10T14:30:00.000Z",
  "updateAt": "2025-04-10T14:30:00.000Z",
  "timeOfLife": 0,
  "streakOfDays": 0,
  "countPlants": 2
}
```

---

## 🔄 Flujo de Ejecución

```
1. Obtener lote de usuarios (100) → api-users
   ↓
2. Para cada usuario:
   ├── ¿Está verificado? (is_verified)
   │   ↓ NO → Siguiente usuario (sin huertos)
   │   ↓ SÍ
   ├── ¿Debe tener huertos? → Evaluar probabilidad según nivel
   │   ↓ NO → Siguiente usuario
   │   ↓ SÍ
   ├── ¿Cuántos huertos? → 0-3
   │   ↓
   ├── Para cada huerto:
   │   ├── Generar dimensiones coherentes
   │   ├── ¿Usar AG? → Evaluar probabilidad
   │   │   ↓ SÍ
   │   │   ├── Llamar AG → api-ag
   │   │   ├── Recibir top 3 soluciones
   │   │   ├── Elegir 1 aleatoriamente
   │   │   └── ¿Modificar? → Aplicar cambios según experiencia
   │   │   ↓ NO
   │   │   └── Crear layout manual
   │   │
   │   ├── Determinar estado (activo/abandonado)
   │   ├── Generar fechas coherentes
   │   └── Guardar en MongoDB
   ↓
3. Siguiente lote
   ↓
4. Retornar estadísticas finales
```

---

## ⏱️ Tiempos de Ejecución Estimados

| Total Usuarios | Huertos Aprox. | Tiempo Estimado |
|----------------|----------------|-----------------|
| 1,000 | ~700 | ~15-20 minutos |
| 10,000 | ~7,000 | ~2-3 horas |
| 100,000 | ~70,000 | ~20-30 horas |

**Factores que afectan el tiempo:**
- Porcentaje de usuarios que usan AG (llamadas HTTP)
- Timeout del AG (30 segundos por huerto)
- Latencia de red entre microservicios
- Capacidad de procesamiento del AG

---

## 🚨 Consideraciones Importantes

### 1. **Dependencias de Servicios**

Asegurar que estén ejecutándose:
- ✅ **api-users** (puerto 3001) - Para obtener usuarios
- ✅ **api-ag** (puerto 3005) - Para generar diseños
- ✅ **api-orchard** (puerto 3004) - Para guardar huertos
- ✅ **MongoDB** - Base de datos

### 2. **Orden de Ejecución**

⚠️ **IMPORTANTE:** Ejecutar en este orden:

```bash
# 1. Primero generar usuarios
curl -X POST "http://localhost:3001/api/users/seed"

# 2. Esperar a que termine

# 3. Luego generar huertos
curl -X POST "http://localhost:3004/orchards/seed"
```

### 3. **Timeouts**

El AG tiene timeout de **30 segundos** por diseño:
- Si el AG falla, el sistema crea un layout manual automáticamente
- No interrumpe el proceso completo

### 4. **Pausas entre Lotes**

El sistema hace una pausa de **500ms** entre lotes para no saturar:
- El API Gateway
- El servicio de AG
- MongoDB

---

## 💡 Recomendaciones

### Para Desarrollo/Pruebas

```bash
# Generar pocos usuarios primero
curl -X POST "http://localhost:3001/api/users/seed?total=100"

# Luego generar huertos
curl -X POST "http://localhost:3004/orchards/seed?batchSize=10"
```

### Para Producción

```bash
# Generar usuarios completos
curl -X POST "http://localhost:3001/api/users/seed"

# Esperar ~10 minutos

# Generar huertos (puede tardar horas)
curl -X POST "http://localhost:3004/orchards/seed"
```

### Monitoreo

Revisar logs en consola de **api-orchard**:
```
🌱 Iniciando seed de huertos...
📦 Procesando lote 1 con 100 usuarios
  🏡 Creando 2 huerto(s) para maria.gonzalez@gmail.com
    🧬 Usando AG para generar huerto "Mi Huerto"
    ✅ Huerto "Mi Huerto" creado con 5 plantas
📊 Progreso: 100 usuarios procesados - 145 huertos creados
```

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to users service"
- Verificar que api-users esté ejecutándose en puerto 3001
- Probar: `curl http://localhost:3001/api/users`

### Error: "Cannot connect to AG service"
- Verificar que api-ag esté ejecutándose en puerto 3005
- Probar: `curl http://localhost:3005/v1/health`

### El proceso es muy lento
- Reducir `batchSize` a 20-30
- Verificar que el AG no esté sobrecargado
- Revisar logs para ver dónde se atasca

### Muchos huertos sin plantas
- Normal: algunos usuarios crean huertos vacíos
- Revisar distribución de niveles de experiencia

### MongoDB se queda sin espacio
- Calcular ~1-2 GB para 100k usuarios + huertos
- Limpiar colecciones antes de re-ejecutar

---

## 📞 Soporte

Para reportar problemas o consultas, contactar al equipo de desarrollo.

---

## 🎓 Notas para Clustering

Los datos generados son ideales para clustering porque incluyen:

✅ **Variabilidad natural:**
- Diferentes niveles de experiencia
- Diferentes tamaños de huertos
- Diferentes cantidades de plantas

✅ **Anomalías intencionales:**
- Nivel 3 con comportamiento de nivel 1
- Huertos abandonados
- Modificaciones excesivas a soluciones del AG
- Layouts incompatibles

✅ **Patrones coherentes:**
- Correlación entre experiencia y complejidad
- Fechas realistas
- Preferencias consistentes

✅ **Datos temporales:**
- 11 meses de registros (enero-noviembre 2025)
- Actividad variable en el tiempo
- Huertos creados en fechas coherentes
