# 📋 Guía de Uso: Endpoint de Generación de Usuarios

## 🎯 Propósito

Este endpoint genera **100,000 usuarios realistas** con datos coherentes para entrenamiento de modelos de clustering y recomendaciones.

---

## 🚀 Endpoint

```
POST http://localhost:3001/api/users/seed
```

---

## 📊 Parámetros (Query String)

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `total` | number | `100000` | Total de usuarios a generar (1 - 200,000) |
| `batchSize` | number | `1000` | Tamaño de lote para procesamiento (1 - 5,000) |
| `clearExisting` | boolean | `false` | Limpiar usuarios existentes (⚠️ no implementado) |

---

## 📝 Ejemplos de Uso

### 1. Generar 100,000 usuarios (configuración por defecto)

```bash
curl -X POST "http://localhost:3001/api/users/seed"
```

### 2. Generar 10,000 usuarios con lotes de 500

```bash
curl -X POST "http://localhost:3001/api/users/seed?total=10000&batchSize=500"
```

### 3. Generar 1,000 usuarios (prueba rápida)

```bash
curl -X POST "http://localhost:3001/api/users/seed?total=1000&batchSize=100"
```

---

## ✅ Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Seed completado exitosamente",
  "status": 200,
  "data": {
    "totalCreated": 100000,
    "totalErrors": 0,
    "executionTimeMs": 450000,
    "executionTimeMinutes": 7.5,
    "averageTimePerUser": 4.5,
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
  "message": "El total debe estar entre 1 y 200,000",
  "status": 400
}
```

### Error del servidor (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Error durante el seed de usuarios",
  "error": "Detalle del error...",
  "status": 500
}
```

---

## 📈 Características de los Datos Generados

### 1. **Distribución de Niveles de Experiencia**
- **Nivel 1 (Principiantes):** 50%
- **Nivel 2 (Intermedios):** 35%
- **Nivel 3 (Avanzados):** 15%

### 2. **Fechas de Registro (Enero - Noviembre 2025)**
- **Picos de registros:**
  - Enero (año nuevo)
  - Marzo-Abril (primavera)
  - Septiembre (vuelta al cole)
- Distribución realista por mes con variación de horas

### 3. **Verificación de Cuenta**
- **80%** usuarios verificados
- **20%** usuarios no verificados

### 4. **Preferencias de Plantas**
- **Vegetable:** 60-75% de probabilidad
- **Aromatic:** 25-55%
- **Medicinal:** 10-50%
- **Ornamental:** 15-50%
- Distribución varía según nivel de experiencia

### 5. **Plantas Favoritas**
- **Nivel 1:** 0-5 plantas favoritas
- **Nivel 2:** 3-10 plantas favoritas
- **Nivel 3:** 5-15 plantas favoritas

### 6. **Historial de Actividad**
- Generado desde fecha de registro hasta noviembre 2025
- Frecuencia según experiencia y verificación:
  - Nivel 1 verificado: 15% de días activos
  - Nivel 2 verificado: 35% de días activos
  - Nivel 3 verificado: 60% de días activos

### 7. **Anomalías Realistas (5% de usuarios)**

Tipos de anomalías para clustering:

1. **Nivel 3 con comportamiento de novato**
   - Alto nivel de experiencia pero poca actividad
   - Sin favoritos ni preferencias definidas

2. **Cuenta antigua sin verificar**
   - Registrada en enero 2025
   - Sin actividad desde registro
   - No verificada

3. **Preferencias contradictorias**
   - Nivel 1 pero con todas las categorías de preferencias
   - Muchas plantas favoritas (20+)
   - Alta actividad

4. **Actividad errática**
   - Burst de 50+ logins en últimos 7 días
   - Comportamiento inusual

---

## 🔍 Ejemplo de Usuario Generado

```json
{
  "id": "user_12345_1735603200000_a7b8c9",
  "name": "María González",
  "email": "maria.gonzalez12345@gmail.com",
  "password": "PassAbC12!45",
  "is_verified": true,
  "count_orchards": 0,
  "experience_level": 2,
  "profile_image": "https://i.pravatar.cc/150?img=42",
  "tokenFCM": "eR9tY2uI...152chars",
  "createdAt": "2025-03-15T19:23:45.000Z",
  "historyTimeUse_ids": [
    "2025-03-15T19:23:45.000Z",
    "2025-03-17T14:30:12.000Z",
    "2025-03-20T08:45:33.000Z"
  ],
  "preferred_plant_category": ["vegetable", "aromatic"],
  "favorite_plants": [5, 12, 23, 34, 41]
}
```

---

## ⏱️ Tiempos de Ejecución Estimados

| Total Usuarios | Tiempo Estimado |
|----------------|-----------------|
| 1,000 | ~30 segundos |
| 10,000 | ~5 minutos |
| 100,000 | ~7-10 minutos |

**Nota:** Los tiempos varían según la capacidad del servidor y la conexión a MongoDB.

---

## 🔐 Idempotencia

El script es **idempotente**:
- Verifica si el email ya existe antes de crear
- No genera duplicados en ejecuciones múltiples
- Seguro para ejecutar varias veces

---

## 💡 Recomendaciones

1. **Primera ejecución:** Usar valores por defecto
   ```bash
   curl -X POST "http://localhost:3001/api/users/seed"
   ```

2. **Pruebas:** Generar pocos usuarios primero
   ```bash
   curl -X POST "http://localhost:3001/api/users/seed?total=100"
   ```

3. **Monitoreo:** Revisar logs de consola para ver progreso en tiempo real

4. **Base de datos:** Asegurar que MongoDB tenga suficiente espacio (~500 MB para 100k usuarios)

---

## 🐛 Solución de Problemas

### El endpoint tarda mucho
- Reducir `batchSize` a 500
- Verificar conexión a MongoDB
- Monitorear uso de CPU/RAM

### Errores de email duplicado
- Normal si se ejecuta múltiples veces
- El sistema los detecta y continúa

### Timeout
- Aumentar timeout del cliente HTTP
- Proceso continúa en servidor aunque cliente se desconecte

---

## 📞 Soporte

Para reportar problemas o consultas, contactar al equipo de desarrollo.
