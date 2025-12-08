# API Orchards - Ejemplos de Uso

## 🌐 URL Base
```
http://localhost:3004
```

---

## 📋 Endpoints Disponibles

### 1. Health Check

**GET** `/health`

**Descripción:** Verifica que el servidor esté funcionando.

**Request:**
```bash
curl http://localhost:3004/health
```

**Response:**
```json
{
  "status": "OK",
  "service": "Orchard API",
  "timestamp": "2025-12-08T02:30:00.000Z"
}
```

---

### 2. Información del Servicio

**GET** `/info`

**Descripción:** Obtiene información detallada del servicio.

**Request:**
```bash
curl http://localhost:3004/info
```

**Response:**
```json
{
  "name": "Orchard API",
  "version": "1.0.0",
  "description": "Gestión de Huertos con Layout de Plantas",
  "endpoints": {
    "health": "GET /health",
    "orchards": {
      "list": "GET /orchards",
      "create": "POST /orchards",
      "get": "GET /orchards/:id",
      "update": "PUT /orchards/:id",
      "delete": "DELETE /orchards/:id",
      "activate": "PATCH /orchards/:id/activate",
      "deactivate": "PATCH /orchards/:id/deactivate",
      "addPlant": "POST /orchards/:id/plants",
      "removePlant": "DELETE /orchards/:id/plants/:plantId"
    }
  }
}
```

---

### 3. Listar Huertos de un Usuario

**GET** `/orchards?userId={userId}`

**Descripción:** Obtiene todos los huertos de un usuario.

**Request:**
```bash
curl "http://localhost:3004/orchards?userId=1765161052428r2zejow7j"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orchards": [
      {
        "_id": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "1765161052428r2zejow7j",
        "name": "Mi Huerto Principal",
        "description": "Huerto de vegetales variados",
        "width": 5,
        "height": 3,
        "area": 15,
        "availableArea": 12.5,
        "plants": [
          {
            "id": "plant-uuid-1",
            "plantId": 5,
            "position": { "x": 0.5, "y": 0.5 },
            "width": 0.4,
            "height": 0.4,
            "rotation": 0,
            "status": "planned"
          }
        ],
        "state": "planned",
        "createAt": "2025-12-08T00:00:00.000Z",
        "updateAt": "2025-12-08T00:00:00.000Z",
        "timeOfLife": 0,
        "streakOfDays": 0,
        "countPlants": 1
      }
    ],
    "total": 1,
    "active": 1,
    "inactive": 0
  }
}
```

---

### 4. Crear Huerto

**POST** `/orchards`

**Descripción:** Crea un nuevo huerto con plantas posicionadas.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "1765161052428r2zejow7j",
  "name": "Huerto de Hierbas",
  "description": "Hierbas aromáticas y medicinales",
  "width": 3,
  "height": 2,
  "state": "planned",
  "plants": [
    {
      "plantId": 11,
      "position": { "x": 0.5, "y": 0.5 },
      "width": 0.4,
      "height": 0.4,
      "rotation": 0,
      "status": "planned"
    },
    {
      "plantId": 12,
      "position": { "x": 1.5, "y": 0.5 },
      "width": 0.3,
      "height": 0.3,
      "rotation": 0,
      "status": "planned"
    }
  ]
}
```

**cURL:**
```bash
curl -X POST http://localhost:3004/orchards \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "1765161052428r2zejow7j",
    "name": "Huerto de Hierbas",
    "description": "Hierbas aromáticas y medicinales",
    "width": 3,
    "height": 2,
    "state": "planned",
    "plants": [
      {
        "plantId": 11,
        "position": { "x": 0.5, "y": 0.5 },
        "width": 0.4,
        "height": 0.4,
        "rotation": 0,
        "status": "planned"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "1765161052428r2zejow7j",
    "name": "Huerto de Hierbas",
    "description": "Hierbas aromáticas y medicinales",
    "width": 3,
    "height": 2,
    "area": 6,
    "availableArea": 5.84,
    "plants": [
      {
        "id": "plant-uuid-1",
        "plantId": 11,
        "position": { "x": 0.5, "y": 0.5 },
        "width": 0.4,
        "height": 0.4,
        "rotation": 0,
        "status": "planned"
      }
    ],
    "state": "planned",
    "createAt": "2025-12-08T02:30:00.000Z",
    "updateAt": "2025-12-08T02:30:00.000Z",
    "timeOfLife": 0,
    "streakOfDays": 0,
    "countPlants": 1
  }
}
```

---

### 5. Obtener Huerto por ID

**GET** `/orchards/:id`

**Descripción:** Obtiene los detalles de un huerto específico.

**Request:**
```bash
curl http://localhost:3004/orchards/550e8400-e29b-41d4-a716-446655440001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "1765161052428r2zejow7j",
    "name": "Huerto de Hierbas",
    "description": "Hierbas aromáticas y medicinales",
    "width": 3,
    "height": 2,
    "area": 6,
    "availableArea": 5.84,
    "plants": [],
    "state": "planned",
    "createAt": "2025-12-08T02:30:00.000Z",
    "updateAt": "2025-12-08T02:30:00.000Z",
    "timeOfLife": 0,
    "streakOfDays": 0,
    "countPlants": 0
  }
}
```

---

### 6. Actualizar Huerto

**PUT** `/orchards/:id`

**Descripción:** Actualiza el nombre y descripción de un huerto.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Huerto de Hierbas Medicinales",
  "description": "Hierbas con propiedades curativas"
}
```

**cURL:**
```bash
curl -X PUT http://localhost:3004/orchards/550e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Huerto de Hierbas Medicinales",
    "description": "Hierbas con propiedades curativas"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "1765161052428r2zejow7j",
    "name": "Huerto de Hierbas Medicinales",
    "description": "Hierbas con propiedades curativas",
    "width": 3,
    "height": 2,
    "area": 6,
    "availableArea": 6,
    "plants": [],
    "state": "planned",
    "createAt": "2025-12-08T02:30:00.000Z",
    "updateAt": "2025-12-08T02:35:00.000Z",
    "timeOfLife": 0,
    "streakOfDays": 0,
    "countPlants": 0
  }
}
```

---

### 7. Agregar Planta al Layout

**POST** `/orchards/:id/plants`

**Descripción:** Agrega una nueva planta al layout del huerto con validaciones de colisión.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "plantId": 13,
  "x": 1.2,
  "y": 0.8,
  "width": 0.5,
  "height": 0.5,
  "rotation": 0
}
```

**cURL:**
```bash
curl -X POST http://localhost:3004/orchards/550e8400-e29b-41d4-a716-446655440001/plants \
  -H "Content-Type: application/json" \
  -d '{
    "plantId": 13,
    "x": 1.2,
    "y": 0.8,
    "width": 0.5,
    "height": 0.5,
    "rotation": 0
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plant": {
      "id": "plant-uuid-2",
      "plantId": 13,
      "position": { "x": 1.2, "y": 0.8 },
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "status": "planned"
    },
    "orchard": {
      "_id": "550e8400-e29b-41d4-a716-446655440001",
      "userId": "1765161052428r2zejow7j",
      "name": "Huerto de Hierbas Medicinales",
      "description": "Hierbas con propiedades curativas",
      "width": 3,
      "height": 2,
      "area": 6,
      "availableArea": 5.75,
      "plants": [
        {
          "id": "plant-uuid-2",
          "plantId": 13,
          "position": { "x": 1.2, "y": 0.8 },
          "width": 0.5,
          "height": 0.5,
          "rotation": 0,
          "status": "planned"
        }
      ],
      "state": "planned",
      "createAt": "2025-12-08T02:30:00.000Z",
      "updateAt": "2025-12-08T02:40:00.000Z",
      "timeOfLife": 0,
      "streakOfDays": 0,
      "countPlants": 1
    }
  }
}
```

---

### 8. Eliminar Planta del Layout

**DELETE** `/orchards/:id/plants/:plantId`

**Descripción:** Elimina una planta específica del layout del huerto.

**Request:**
```bash
curl -X DELETE http://localhost:3004/orchards/550e8400-e29b-41d4-a716-446655440001/plants/plant-uuid-2
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "1765161052428r2zejow7j",
    "name": "Huerto de Hierbas Medicinales",
    "description": "Hierbas con propiedades curativas",
    "width": 3,
    "height": 2,
    "area": 6,
    "availableArea": 6,
    "plants": [],
    "state": "planned",
    "createAt": "2025-12-08T02:30:00.000Z",
    "updateAt": "2025-12-08T02:45:00.000Z",
    "timeOfLife": 0,
    "streakOfDays": 0,
    "countPlants": 0
  }
}
```

---

### 9. Eliminar Huerto

**DELETE** `/orchards/:id`

**Descripción:** Elimina un huerto completamente.

**Request:**
```bash
curl -X DELETE http://localhost:3004/orchards/550e8400-e29b-41d4-a716-446655440001
```

**Response:**
```json
{
  "success": true,
  "message": "Huerto eliminado correctamente"
}
```

---

## ⚠️ Errores Comunes

### 1. Límite de Huertos Alcanzado
```json
{
  "success": false,
  "error": "Has alcanzado el límite de 3 huertos. Elimina uno existente para crear uno nuevo."
}
```

### 2. Nombre Duplicado
```json
{
  "success": false,
  "error": "Ya existe un huerto con el nombre \"Huerto de Hierbas\" para este usuario"
}
```

### 3. Colisión de Plantas
```json
{
  "success": false,
  "error": "La planta colisiona con otra planta existente en la posición (1.2, 0.8)"
}
```

### 4. Planta Fuera de Límites
```json
{
  "success": false,
  "error": "La planta se sale de los límites del huerto"
}
```

### 5. Huerto No Encontrado
```json
{
  "success": false,
  "error": "Huerto con ID 550e8400-e29b-41d4-a716-446655440999 no encontrado"
}
```

---

## 📝 Notas Importantes

1. **Máximo de Huertos:** Cada usuario puede tener máximo 3 huertos activos.

2. **Validación de Colisiones:** Al agregar plantas, el sistema verifica automáticamente que no se superpongan con plantas existentes.

3. **Dimensiones:** Las dimensiones (`width` y `height`) se manejan en metros. Por ejemplo, un huerto de 3x2 significa 3 metros de ancho por 2 metros de alto.

4. **Posiciones:** Las posiciones de las plantas (`x`, `y`) son coordenadas dentro del huerto, empezando desde (0, 0) en la esquina superior izquierda.

5. **Estados de Plantas:**
   - `planned`: Planeada pero no plantada
   - `planted`: Recién plantada
   - `growing`: En crecimiento
   - `harvested`: Cosechada

6. **ID de Plantas:** `plantId` se refiere al ID de la planta en el catálogo general (api-plants), mientras que `id` es el identificador único de esa instancia en el layout del huerto.

---

## 🔧 Ejemplo Completo: Crear Huerto con Múltiples Plantas

```bash
curl -X POST http://localhost:3004/orchards \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "name": "Huerto Completo",
    "description": "Mezcla de vegetales y hierbas",
    "width": 5,
    "height": 4,
    "state": "planned",
    "plants": [
      {
        "plantId": 8,
        "position": { "x": 0.5, "y": 0.5 },
        "width": 0.5,
        "height": 0.5,
        "rotation": 0,
        "status": "planned"
      },
      {
        "plantId": 11,
        "position": { "x": 2.0, "y": 0.5 },
        "width": 0.4,
        "height": 0.4,
        "rotation": 0,
        "status": "planned"
      },
      {
        "plantId": 13,
        "position": { "x": 3.5, "y": 0.5 },
        "width": 0.5,
        "height": 0.5,
        "rotation": 0,
        "status": "planned"
      },
      {
        "plantId": 4,
        "position": { "x": 0.5, "y": 2.0 },
        "width": 0.45,
        "height": 0.45,
        "rotation": 0,
        "status": "planned"
      }
    ]
  }'
```

Este comando creará un huerto de 5x4 metros con 4 plantas diferentes posicionadas estratégicamente sin colisiones.
