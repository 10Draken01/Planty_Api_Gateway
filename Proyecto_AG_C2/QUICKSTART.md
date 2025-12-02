# 🚀 Guía Rápida de Inicio - PlantGen API

Esta guía te ayudará a poner en marcha PlantGen API en menos de 5 minutos.

---

## Paso 1: Iniciar MongoDB con Docker

```bash
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=TuPassword123! \
  mongo:latest
```

Verifica que está corriendo:
```bash
docker ps
```

---

## Paso 2: Instalar dependencias de Python

```bash
cd PlantGen-API
pip install -r requirements.txt
```

---

## Paso 3: Cargar datos a MongoDB

```bash
python scripts/load_data_to_mongodb.py
```

Deberías ver:
```
✓ Se insertaron 50 plantas en colección 'Plants'
✓ Se insertaron 1275 pares en colección 'Matriz'
```

---

## Paso 4: Iniciar la API

```bash
python main.py
```

La API estará disponible en: **http://localhost:3005**

---

## Paso 5: Probar la API

### Opción A: Usar el navegador

Abre **http://localhost:3005/docs** para ver la documentación interactiva Swagger.

### Opción B: Usar curl

**Health Check:**
```bash
curl http://localhost:3005/api/v1/health
```

**Generar Huerto:**
```bash
curl -X POST "http://localhost:3005/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "alimenticio",
    "area": 2.0,
    "max_water": 150.0,
    "budget": 400.0,
    "maintenance_time": 90
  }'
```

### Opción C: Usar Python requests

```python
import requests

# Health check
response = requests.get("http://localhost:3005/api/v1/health")
print(response.json())

# Generar huerto
payload = {
    "objective": "alimenticio",
    "area": 2.0,
    "max_water": 150.0,
    "budget": 400.0,
    "maintenance_time": 90
}

response = requests.post(
    "http://localhost:3005/api/v1/generate",
    json=payload
)

result = response.json()
print(f"Fitness de la mejor solución: {result['solutions'][0]['fitness']}")
print(f"Plantas en el huerto: {result['solutions'][0]['total_plants']}")
```

---

## 📊 Ejemplos de Peticiones

### Huerto Alimenticio (predeterminado)
```json
{
  "objective": "alimenticio",
  "area": 2.0,
  "max_water": 150.0,
  "budget": 400.0
}
```

### Huerto Medicinal
```json
{
  "objective": "medicinal",
  "area": 3.0,
  "max_water": 180.0,
  "budget": 600.0
}
```

### Huerto Sostenible (prioriza eficiencia hídrica)
```json
{
  "objective": "sostenible",
  "area": 2.5,
  "max_water": 100.0,
  "budget": 500.0
}
```

### Huerto Ornamental
```json
{
  "objective": "ornamental",
  "area": 1.5,
  "max_water": 120.0,
  "budget": 300.0
}
```

---

## 🛠️ Troubleshooting

### Error: "MongoDB no disponible"

**Solución:** Verifica que MongoDB esté corriendo:
```bash
docker ps
```

Si no está, inícialo de nuevo:
```bash
docker start mongodb
```

### Error: "No se encontraron plantas en la base de datos"

**Solución:** Ejecuta el script de carga de datos:
```bash
python scripts/load_data_to_mongodb.py
```

### Error: "ModuleNotFoundError"

**Solución:** Asegúrate de estar en el directorio correcto y tener el entorno virtual activado:
```bash
cd PlantGen-API
pip install -r requirements.txt
```

---

## 🐳 Usando Docker (Alternativa)

### Construir y ejecutar con Docker

```bash
# 1. Construir imagen
docker build -t plantgen-api .

# 2. Ejecutar contenedor
docker run -d -p 3005:3005 --name plantgen-api --env-file .env plantgen-api
```

### Ver logs
```bash
docker logs -f plantgen-api
```

---

## 📈 Métricas del Algoritmo Genético

El endpoint `/generate` retorna las siguientes métricas para cada solución:

- **fitness**: Puntaje global de aptitud (0-1)
- **cee**: Compatibilidad Entre Especies (0-1)
- **psntpa**: Satisfacción Nutricional/Terapéutica (0-1)
- **wce**: Eficiencia Hídrica (0-1)
- **ue**: Utilización de Espacio (0-1)

**Interpretación:**
- Valores cercanos a **1.0** son óptimos
- Valores cercanos a **0.0** necesitan mejora

---

## 🎯 Próximos Pasos

1. Explora la documentación completa en [README.md](README.md)
2. Prueba diferentes objetivos y restricciones
3. Analiza las métricas de las soluciones generadas
4. Revisa el calendario de siembra en la respuesta

---

¡Listo! Ahora tienes PlantGen API funcionando. 🌱✨
