# PlantGen Recommender - Documentación Técnica

## Resumen Ejecutivo

Microservicio de recomendaciones de huertos basado en **Clustering No Supervisado** que agrupa usuarios con perfiles similares para generar recomendaciones personalizadas mediante análisis de vecindad en clusters.

---

## Decisiones Técnicas Clave

### 1. Algoritmo de Clustering: K-Prototypes

**Justificación (4 frases):**

K-Prototypes extiende K-Means para manejar datos mixtos (numéricos + categóricos) sin necesidad de one-hot encoding completo que aumentaría drásticamente la dimensionalidad. La librería `kmodes` implementa la métrica de distancia mixta de Huang (1998) que combina distancia euclidiana para numéricos y disimilaridad simple para categóricos. Esto preserva la naturaleza categórica de variables como `objective` (alimenticio/medicinal) y `cluster_region` mientras optimiza sobre features numéricas como área, agua y mantenimiento. El método garantiza convergencia y permite encontrar k óptimo mediante validación interna con Silhouette score.

**Alternativa considerada:** MiniBatchKMeans (implementada como fallback para datasets >50k usuarios) sacrifica precisión por velocidad mediante entrenamiento incremental en mini-batches.

---

### 2. Features Engineering (25 features)

#### Features Numéricas (16)
- **Usuario base (5)**: `experience_level`, `count_orchards`, `has_tokenFCM`, `profile_image_present`, `account_age_days`
- **Agregadas de orchards (11)**: Promedios y sumas de área, agua, mantenimiento, plantas, tiempo de vida, racha, diversidad, y distribución de categorías (pct_vegetable, pct_medicinal, pct_ornamental, pct_aromatic)

#### Features Categóricas (2)
- `objective`: alimenticio, medicinal, sostenible, ornamental
- `cluster_region`: Ubicación geográfica discretizada en 10 regiones con KMeans sobre (lat, lon)

**Preprocesamiento:**
- **StandardScaler** sobre numéricos: Normaliza a media=0, std=1 para evitar dominio de features con rangos grandes
- **Rellenado de nulos**: Mediana para numéricos, "unknown" para categóricos
- **Codificación categórica**: Ordinal encoding para k-prototypes (más eficiente que one-hot)

---

### 3. Selección de k (Número de Clusters)

**Métodos implementados:**
1. **Silhouette score** (default): Mide cohesión intra-cluster vs separación inter-cluster. Rango [-1, 1], óptimo cercano a 1.
2. **Elbow method**: Detecta punto de inflexión en la curva de inercia (cost function).

**Búsqueda automática:** Evalúa k en rango [MIN_CLUSTERS=3, MAX_CLUSTERS=15] y selecciona el mejor según método configurado.

---

### 4. Pipeline de Entrenamiento

```python
# Flujo completo
1. Cargar usuarios y orchards desde MongoDB
2. Extraer 25 features por usuario (FeaturePipeline)
3. Fit StandardScaler + KMeans location discretizer
4. Encontrar k óptimo (silhouette o elbow)
5. Entrenar K-Prototypes con k óptimo
6. Asignar cluster_id a cada usuario
7. Guardar modelo serializado (joblib)
8. Guardar metadata de training en MongoDB
```

**Métricas guardadas:**
- Silhouette score
- Número de clusters
- Tamaño de cada cluster
- Timestamp y duración

---

### 5. Algoritmo de Recomendación

Para usuario target:

```python
1. Obtener cluster_id del usuario
2. Buscar orchards de otros usuarios del mismo cluster
3. Excluir orchards ya poseídos por el usuario
4. Calcular score combinado:
   score = similarity(user_profile, orchard_vector) * clusterAffinity + freshness_factor
5. Retornar top-N orchards con mayor score
```

**Factores del score:**
- **Similaridad de perfil**: Cosine similarity entre user features y orchard features
- **Afinidad de cluster**: Boost para orchards dentro del mismo cluster
- **Freshness**: Orchards recién creados reciben boost temporal

---

### 6. Scheduler - Jobs Periódicos

**APScheduler** con triggers Cron:

1. **Reentrenamiento mensual**: Día 1, 2:00 AM
   - Reentrenar modelo completo si cambios > 15% del dataset
   - Sino, asignación incremental de nuevos usuarios

2. **Recomendaciones semanales**: Lunes, 9:00 AM
   - Generar top-5 recomendaciones para cada usuario
   - Enviar notificación push a usuarios con `tokenFCM`

3. **Usuario nuevo registrado**: Webhook inmediato
   - Asignar cluster usando modelo existente
   - Enviar primera recomendación personalizada

---

### 7. Integración con Otros Microservicios

#### AG Service (localhost:3005)
```python
POST /v1/generate
Cuerpo: { userExperience, dimensions, waterLimit, objective, ... }
Respuesta: { solutions: [...] }
```

#### Notifications Service (localhost:3003)
```python
POST /notify/user/:id
Cuerpo: { title, body, data, imageUrl }
```

---

### 8. Migración de Esquema MongoDB

**Cambios aplicados:**

```python
# Antes
User: { orchards_id: string[] }
Orchard: { }

# Después
User: { cluster_id: int, max_orchards: 3 }
Orchard: { userId: string }
```

**Script de migración** (`migrations/migrate_schema.py`):
1. Backup de users → users_backup
2. Añadir userId a orchards basado en orchards_id de users
3. Eliminar orchards_id de users
4. Añadir max_orchards: 3
5. Crear índices optimizados

---

### 9. Generación Masiva de Datos (DB_fill)

**Node.js/TypeScript con @faker-js/faker:**

```typescript
Flujo por usuario:
1. Generar datos aleatorios (nombre, email, password)
2. Hashear password con bcrypt (salt rounds=12)
3. POST /users → crear usuario
4. Para cada orchard del usuario:
   a. Generar parámetros para AG Service
   b. POST /v1/generate → obtener layout óptimo
   c. POST /orchards → crear orchard con datos del AG
5. Guardar checkpoint cada 500 usuarios
```

**Performance:**
- Concurrencia 200: ~20-30 usuarios/segundo
- 100,000 usuarios: ~2-3 horas

**Distribuciones:**
- Experiencia: 30% nivel 1, 50% nivel 2, 20% nivel 3
- TokenFCM: 60% de usuarios
- Orchards: 30% sin huertos, 40% con 1, 20% con 2, 10% con 3

---

### 10. Seguridad

**Implementado:**
- Hashing de contraseñas: bcrypt con salt rounds=12
- JWT para endpoints admin (`POST /train`, `POST /notify/cluster`)
- Validación de inputs con Pydantic
- CORS configurado

**Pendiente (producción):**
- Rate limiting
- API keys para servicios externos
- Encriptación de datos sensibles en tránsito
- Rotación de tokens

---

### 11. Observabilidad

**Logging:**
- Winston con niveles: DEBUG, INFO, WARN, ERROR
- Logs estructurados en JSON
- Rotación de archivos

**Métricas:**
- Silhouette score por entrenamiento
- Tiempo de ejecución del AG
- Tamaño y distribución de clusters
- Tasa de éxito de recomendaciones

**Health checks:**
- `GET /` - Estado del servicio
- `GET /status` - Estado del modelo
- `GET /clusters` - Información de clusters

---

### 12. Testing

**Pytest con coverage:**

```bash
pytest tests/ -v --cov=app --cov-report=html
```

**Tests incluidos:**
- `test_feature_pipeline.py`: Extracción y transformación de features
- `test_clustering_service.py`: K-Prototypes y selección de k
- `test_recommendations.py`: Generación de recomendaciones
- `test_api_endpoints.py`: Endpoints FastAPI (mockeados)

---

### 13. Escalabilidad

**Horizontal:**
- Servicio stateless (modelo serializado en storage compartido)
- Múltiples replicas con load balancer
- MongoDB con replicación

**Vertical:**
- MiniBatchKMeans para datasets grandes
- Feature caching
- Lazy loading de orchards

**Optimizaciones:**
- Índices MongoDB: `cluster_id`, `userId`, `email`
- Cache de similarity scores
- Batch processing para jobs masivos

---

### 14. Limitaciones Conocidas

1. **Similitud simplificada**: Versión actual usa random score placeholder. Producción debe implementar embeddings reales.
2. **Coldstart**: Usuarios nuevos sin orchards tienen features por defecto (menos precisas).
3. **Diversidad de clusters**: K-Prototypes puede converger a mínimos locales. Múltiples inicializaciones mitigan esto.
4. **Actualización incremental**: Reentrenamiento mensual completo es costoso. Implementar clustering online para actualización continua.

---

### 15. Próximas Mejoras

1. **Embeddings profundos**: Usar autoencoders o transformers para features latentes
2. **Collaborative filtering**: Híbrido clustering + matrix factorization
3. **Online learning**: Actualización incremental del modelo sin reentrenamiento completo
4. **A/B testing**: Framework para evaluar calidad de recomendaciones
5. **Explicabilidad**: SHAP values para interpretar recomendaciones

---

## Referencias

- Huang, Z. (1998). "Extensions to the k-Means Algorithm for Clustering Large Data Sets with Categorical Values"
- Arthur, D. & Vassilvitskii, S. (2007). "k-means++: The Advantages of Careful Seeding"
- Rousseeuw, P. J. (1987). "Silhouettes: A graphical aid to the interpretation and validation of cluster analysis"

---

## Contacto Técnico

PlantGen Engineering Team - engineering@plantgen.com
