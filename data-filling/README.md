# DB_fill - Generador Masivo de Datos PlantGen

Script para generar 100,000 usuarios y huertos de prueba para PlantGen.

## Instalación

```bash
npm install
```

## Uso Básico

### Generar 1000 usuarios de prueba (rápido)

```bash
npm run generate -- --count 1000 --concurrency 50
```

### Generar 100,000 usuarios completos

```bash
npm run generate -- --count 100000 --concurrency 200
```

## Flags Disponibles

- `--count <N>`: Número de usuarios a generar (default: 1000)
- `--concurrency <N>`: Requests paralelos (default: 50)
- `--batch-size <N>`: Tamaño de batch (default: 200)
- `--resume <file>`: Archivo de checkpoint para reanudar

## Ejemplo con Resume

```bash
# Primera ejecución
npm run generate -- --count 100000 --concurrency 200

# Si se interrumpe, reanudar desde checkpoint
npm run generate -- --count 100000 --resume checkpoint.json
```

## Flujo de Generación

1. Genera usuario con datos aleatorios (@faker-js/faker)
2. Hashea contraseña con bcrypt (salt rounds=12)
3. Crea usuario en MongoDB via POST /users
4. Llama al AG Service (POST /v1/generate) para generar huertos
5. Crea orchards via POST /orchards
6. Guarda checkpoint cada 500 usuarios

## Variables de Entorno

Crear archivo `.env`:

```bash
AG_SERVICE_URL=http://localhost:3005/v1
USERS_SERVICE_URL=http://localhost:3001/users
ORCHARDS_SERVICE_URL=http://localhost:3002/orchards
```

## Progreso

El script muestra barra de progreso en tiempo real:

```
Progress |████████████░░░░░░░░| 60% | 600/1000 users | ETA: 45s
```

## Checkpoints

Cada 500 usuarios se guarda `checkpoint.json`:

```json
{
  "completed": 500,
  "failed": 12,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Performance

- **Concurrency 50**: ~5-10 usuarios/segundo
- **Concurrency 200**: ~20-30 usuarios/segundo
- **100,000 usuarios**: ~2-3 horas con concurrencia 200

## Troubleshooting

### Error: ECONNREFUSED

Verificar que los servicios estén corriendo:

```bash
# AG Service
curl http://localhost:3005/v1/health

# Users Service
curl http://localhost:3001/health

# Orchards Service
curl http://localhost:3002/health
```

### Script muy lento

Aumentar concurrencia (máximo recomendado: 300):

```bash
npm run generate -- --count 10000 --concurrency 300
```

### Errores frecuentes

Revisar logs y reducir concurrencia:

```bash
npm run generate -- --count 1000 --concurrency 20
```
