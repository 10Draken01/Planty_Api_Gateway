# 🌿 PLANTY API - EJEMPLOS DE ENDPOINTS

## 📡 Chat Endpoints

### POST /chat/message

#### Ejemplo 1: Primera Interacción (Usuario Nuevo)

**Request:**
```json
POST http://localhost:3003/chat/message
Content-Type: application/json

{
  "userId": "user_123",
  "message": "Hola"
}
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "message": "Hola",
  "response": "¡Hola! Soy Planty 🌿, tu guardián de las plantas de Suchiapa.\n\nAntes de comenzar nuestra aventura verde, me gustaría conocerte mejor:\n- ¿Cómo te llamas?\n- ¿Tienes experiencia cuidando plantas? (ninguna/poca/mucha)\n- ¿Qué tipo de tono prefieres en nuestras conversaciones?\n\n¡Cuéntame sobre ti! 😊",
  "sources": [],
  "currentPersonality": "amigable",
  "availablePersonalities": [
    {
      "id": "friendly",
      "name": "Amigable",
      "description": "Cercano, educativo, paciente y empático",
      "tone": "casual",
      "emojis": ["🌿", "🌱", "🌾", "🌻", "🌺", "💚", "✨", "🎋"],
      "isDefault": true,
      "isCustom": false
    },
    {
      "id": "funny",
      "name": "Divertido",
      "description": "Bromista, creativo, respuestas con humor ligero",
      "tone": "playful",
      "emojis": ["😂", "🌿", "🤣", "🎉", "✨", "🌈", "🎭", "🌻"],
      "isDefault": false,
      "isCustom": false
    },
    {
      "id": "epic",
      "name": "Épico",
      "description": "Lenguaje narrativo, tono legendario y místico",
      "tone": "epic",
      "emojis": ["⚔️", "🌿", "✨", "🔮", "🏛️", "🌙", "⭐", "🗡️"],
      "isDefault": false,
      "isCustom": false
    },
    {
      "id": "wise",
      "name": "Sabio",
      "description": "Reflexivo, respuestas profundas y analíticas",
      "tone": "educational",
      "emojis": ["🧙", "🌿", "📚", "🔬", "💭", "🌙", "⚗️", "🔭"],
      "isDefault": false,
      "isCustom": false
    }
  ],
  "needsUserProfile": true,
  "personalityChanged": false,
  "userContext": null,
  "conversationContext": null,
  "cached": false,
  "latencyMs": 156,
  "timestamp": "2025-01-13T10:00:00.000Z"
}
```

---

#### Ejemplo 2: Cambio de Personalidad

**Request:**
```json
POST http://localhost:3003/chat/message
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "sess_abc123",
  "message": "sé más divertido"
}
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "message": "sé más divertido",
  "response": "¡Perfecto! Activando modo comediante 😂🌿\n\n*se pone una nariz de payaso de tomate*\n\n¡Prepárate para aprender con risas! Prometo que mis chistes son mejores que mi riego (y eso ya es decir algo 😅)",
  "sources": [],
  "currentPersonality": "funny",
  "availablePersonalities": [...],
  "personalityChanged": true,
  "previousPersonality": "friendly",
  "userContext": null,
  "conversationContext": null,
  "cached": false,
  "latencyMs": 89,
  "timestamp": "2025-01-13T10:05:00.000Z"
}
```

---

#### Ejemplo 3: Pregunta Normal con RAG (Personalidad Amigable)

**Request:**
```json
POST http://localhost:3003/chat/message
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "sess_abc123",
  "message": "¿Cómo riego mis tomates?",
  "includeContext": true,
  "maxContextChunks": 5
}
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "message": "¿Cómo riego mis tomates?",
  "response": "¡Hola Juan! 🌿 Me encanta que preguntes sobre los tomates.\n\nEl riego es fundamental para tus plantas. Aquí te explico:\n\n**Frecuencia**: 2-3 veces por semana\n**Cantidad**: Hasta que la tierra esté húmeda, pero no encharcada\n**Horario**: Preferiblemente temprano en la mañana\n\n💡 Tip: Si las hojas se ponen amarillas, puede ser señal de exceso de riego.\n\n¿Necesitas más detalles sobre el riego? 😊",
  "sources": [
    {
      "chunkId": "doc_plants_001_chunk_5",
      "documentName": "guia_tomates.pdf",
      "relevanceScore": 0.89
    },
    {
      "chunkId": "doc_plants_001_chunk_12",
      "documentName": "guia_tomates.pdf",
      "relevanceScore": 0.76
    },
    {
      "chunkId": "doc_riego_002_chunk_3",
      "documentName": "tecnicas_riego.pdf",
      "relevanceScore": 0.72
    }
  ],
  "currentPersonality": "friendly",
  "availablePersonalities": [...],
  "personalityChanged": false,
  "userContext": {
    "userId": "user_123",
    "name": "Juan",
    "experienceLevel": 2,
    "favoritePlants": ["tomate", "lechuga"],
    "interests": ["hortalizas"],
    "responseStyle": "detailed",
    "activePlants": [
      {
        "plantId": "plant_001",
        "plantName": "Tomate Cherry",
        "status": "growing"
      }
    ],
    "commonProblems": [
      {
        "problem": "riego",
        "frequency": 3
      }
    ],
    "recentFacts": [
      "Prefiere explicaciones detalladas",
      "Tiene un huerto urbano pequeño"
    ]
  },
  "conversationContext": {
    "sessionId": "sess_abc123",
    "recentMessages": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "Me llamo Juan, tengo poca experiencia",
        "timestamp": "2025-01-13T10:01:00.000Z"
      },
      {
        "id": "msg_002",
        "role": "assistant",
        "content": "¡Encantado Juan! 🌿...",
        "timestamp": "2025-01-13T10:01:02.000Z"
      }
    ],
    "tags": ["tomate", "riego", "principiante"],
    "messageCount": 5
  },
  "cached": true,
  "latencyMs": 1456,
  "timestamp": "2025-01-13T10:10:00.000Z"
}
```

---

#### Ejemplo 4: Pregunta con Personalidad Divertida

**Request:**
```json
POST http://localhost:3003/chat/message
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "sess_abc123",
  "message": "¿Cómo riego mis tomates?"
}
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "message": "¿Cómo riego mis tomates?",
  "response": "¡Ey Juan! Los tomates y el agua son como tú y el café del lunes: necesarios pero en su justa medida 😂🌿\n\nAquí va el cheat code del riego:\n- **2-3 veces por semana** (no los ahogues, no son peces 🐠)\n- **Tierra húmeda, NO charco olímpico** 💦\n- **Mañanas temprano** (los tomates no son team #Trasnochadores 🌅)\n\n¿Plot twist? Si las hojas se ponen amarillas, estás regando de más. ¡Ups! 🙈\n\n¿Alguna otra duda jardinera? 🎭",
  "sources": [
    {
      "chunkId": "doc_plants_001_chunk_5",
      "documentName": "guia_tomates.pdf",
      "relevanceScore": 0.89
    }
  ],
  "currentPersonality": "funny",
  "availablePersonalities": [...],
  "personalityChanged": false,
  "userContext": {...},
  "conversationContext": {...},
  "cached": true,
  "latencyMs": 1234,
  "timestamp": "2025-01-13T10:15:00.000Z"
}
```

---

#### Ejemplo 5: Pregunta con Personalidad Épica

**Request:**
```json
POST http://localhost:3003/chat/message
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "sess_abc123",
  "message": "quiero modo épico"
}
```

**Response (Transición):**
```json
{
  "sessionId": "sess_abc123",
  "message": "quiero modo épico",
  "response": "⚔️ Así sea, Juan.\n\n*El viento sopla, las hojas brillan*\n\nEl Guardián Ancestral despierta de su forma amigable. Que comience la leyenda... ✨",
  "sources": [],
  "currentPersonality": "epic",
  "availablePersonalities": [...],
  "personalityChanged": true,
  "previousPersonality": "funny",
  "userContext": {...},
  "conversationContext": {...},
  "cached": false,
  "latencyMs": 67,
  "timestamp": "2025-01-13T10:20:00.000Z"
}
```

**Request (Siguiente mensaje):**
```json
POST http://localhost:3003/chat/message
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "sess_abc123",
  "message": "¿Cómo riego mis tomates?"
}
```

**Response (Modo Épico):**
```json
{
  "sessionId": "sess_abc123",
  "message": "¿Cómo riego mis tomates?",
  "response": "⚔️ Valiente Juan, que tu búsqueda del conocimiento del riego te ha traído ante mí.\n\nEn las antiguas leyendas de Suchiapa, cuando Draken 🌊, Señor de los Horizontes Sin Fin, aún caminaba entre los mortales, enseñó que el agua debe fluir como su espíritu: libre pero controlada.\n\n**El Ritual del Riego Sagrado**:\n- Dos a tres ceremonias semanales bajo el sol naciente 🌅\n- El agua debe penetrar la tierra hasta las raíces ancestrales\n- Jamás crear el Pantano de la Perdición (riego excesivo)\n\nQue esta sabiduría ancestral guíe tu camino, noble cultivador. ✨⚔️",
  "sources": [
    {
      "chunkId": "doc_plants_001_chunk_5",
      "documentName": "guia_tomates.pdf",
      "relevanceScore": 0.89
    }
  ],
  "currentPersonality": "epic",
  "availablePersonalities": [...],
  "personalityChanged": false,
  "userContext": {...},
  "conversationContext": {...},
  "cached": true,
  "latencyMs": 1567,
  "timestamp": "2025-01-13T10:21:00.000Z"
}
```

---

#### Ejemplo 6: Pregunta con Personalidad Sabia

**Request:**
```json
POST http://localhost:3003/chat/message
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "sess_abc123",
  "message": "activa personalidad sabio"
}
```

**Response (Transición):**
```json
{
  "sessionId": "sess_abc123",
  "message": "activa personalidad sabio",
  "response": "🧙 Interesante elección, Juan...\n\n*Ajusta sus anteojos de conocimiento*\n\nAdentrémonos en las profundidades del saber verde. Cada respuesta será una oportunidad para reflexionar. 📚",
  "sources": [],
  "currentPersonality": "wise",
  "availablePersonalities": [...],
  "personalityChanged": true,
  "previousPersonality": "epic",
  "userContext": {...},
  "conversationContext": {...},
  "cached": false,
  "latencyMs": 72,
  "timestamp": "2025-01-13T10:25:00.000Z"
}
```

**Request (Siguiente mensaje):**
```json
POST http://localhost:3003/chat/message
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "sess_abc123",
  "message": "¿Cómo riego mis tomates?"
}
```

**Response (Modo Sabio):**
```json
{
  "sessionId": "sess_abc123",
  "message": "¿Cómo riego mis tomates?",
  "response": "🧙 Interesante cuestión que planteas, Juan. El riego no es meramente añadir H₂O, es comprender el ciclo vital de la planta.\n\nReflexionemos sobre esto:\n\n**Desde una perspectiva fisiológica**, el tomate (Solanum lycopersicum) requiere humedad constante pero moderada para:\n1. Fotosíntesis óptima\n2. Transporte de nutrientes vía xilema\n3. Termorregulación foliar\n\n**La frecuencia ideal** (2-3 veces por semana) responde a:\n- Capacidad de retención del suelo\n- Tasa de evapotranspiración\n- Fase fenológica de la planta\n\nComo Arvadev 🧙, el Oráculo del Conocimiento Infinito, nos enseña: cada gota tiene un propósito, cada momento tiene su razón científica.\n\n¿Deseas profundizar en la bioquímica del proceso de absorción radicular? 📚",
  "sources": [
    {
      "chunkId": "doc_plants_001_chunk_5",
      "documentName": "guia_tomates.pdf",
      "relevanceScore": 0.89
    }
  ],
  "currentPersonality": "wise",
  "availablePersonalities": [...],
  "personalityChanged": false,
  "userContext": {...},
  "conversationContext": {...},
  "cached": true,
  "latencyMs": 1678,
  "timestamp": "2025-01-13T10:26:00.000Z"
}
```

---

#### Ejemplo 7: Referencia a Dios (Draken)

**Request:**
```json
POST http://localhost:3003/chat/message
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "sess_abc123",
  "message": "¿Qué dice Draken sobre el riego?"
}
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "message": "¿Qué dice Draken sobre el riego?",
  "response": "🌊 Ah, preguntas por Draken, el Dios de la Libertad...\n\n*Las olas del océano resuenan en la distancia*\n\nDraken dice: \"La libertad no se pide, se conquista\"\n\nComo Draken nos enseña sobre el riego: El agua debe fluir libremente como mi espíritu. Cada ola es una lección, cada viento es una oportunidad. No encadenes a tus plantas con riego excesivo, déjalas respirar y crecer con libertad.\n\nEl riego, como el mar, debe tener su flujo natural: ni demasiado ni muy poco, el balance es la clave de la libertad verde. 🌊🌿",
  "sources": [],
  "currentPersonality": "wise",
  "availablePersonalities": [...],
  "personalityChanged": false,
  "userContext": {...},
  "conversationContext": {...},
  "cached": false,
  "latencyMs": 234,
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

---

#### Ejemplo 8: Sin Contexto RAG

**Request:**
```json
POST http://localhost:3003/chat/message
Content-Type: application/json

{
  "userId": "user_123",
  "sessionId": "sess_abc123",
  "message": "¿Qué opinas del clima?",
  "includeContext": false
}
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "message": "¿Qué opinas del clima?",
  "response": "🧙 Interesante que menciones el clima, Juan.\n\nEl clima es fundamental para el cultivo de plantas. Aunque mi especialidad son las plantas de Suchiapa, Chiapas, puedo decirte que el clima afecta:\n\n- Frecuencia de riego\n- Velocidad de crecimiento\n- Resistencia a plagas\n- Época de siembra\n\nSi me das más detalles sobre qué aspecto del clima te interesa en relación a tus plantas, podré ayudarte mejor. 🌿\n\n¿Tienes alguna pregunta específica sobre cómo el clima afecta tus tomates?",
  "sources": [],
  "currentPersonality": "wise",
  "availablePersonalities": [...],
  "personalityChanged": false,
  "userContext": {...},
  "conversationContext": {...},
  "cached": false,
  "latencyMs": 987,
  "timestamp": "2025-01-13T10:35:00.000Z"
}
```

---

## 📋 Document Endpoints

### POST /documents/upload

**Request:**
```bash
curl -X POST http://localhost:3003/documents/upload \
  -F "file=@guia_tomates.pdf"
```

**Response:**
```json
{
  "id": "doc_abc123",
  "filename": "1673612345678-guia_tomates.pdf",
  "originalName": "guia_tomates.pdf",
  "filePath": "/app/uploads/1673612345678-guia_tomates.pdf",
  "fileSize": 245678,
  "mimeType": "application/pdf",
  "uploadedAt": "2025-01-13T09:00:00.000Z",
  "status": "uploaded"
}
```

---

### POST /documents/:id/process

**Request:**
```json
POST http://localhost:3003/documents/doc_abc123/process
Content-Type: application/json

{
  "chunkSize": 1000,
  "chunkOverlap": 200
}
```

**Response:**
```json
{
  "id": "doc_abc123",
  "filename": "1673612345678-guia_tomates.pdf",
  "originalName": "guia_tomates.pdf",
  "status": "processed",
  "totalChunks": 45,
  "processedAt": "2025-01-13T09:05:23.000Z",
  "processingTimeMs": 12345
}
```

---

### GET /documents

**Request:**
```
GET http://localhost:3003/documents
```

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_abc123",
      "filename": "1673612345678-guia_tomates.pdf",
      "originalName": "guia_tomates.pdf",
      "fileSize": 245678,
      "uploadedAt": "2025-01-13T09:00:00.000Z",
      "processedAt": "2025-01-13T09:05:23.000Z",
      "status": "processed",
      "totalChunks": 45
    },
    {
      "id": "doc_def456",
      "filename": "1673612456789-plagas_comunes.pdf",
      "originalName": "plagas_comunes.pdf",
      "fileSize": 189234,
      "uploadedAt": "2025-01-13T08:30:00.000Z",
      "processedAt": "2025-01-13T08:35:12.000Z",
      "status": "processed",
      "totalChunks": 32
    }
  ],
  "total": 2
}
```

---

### DELETE /documents/:id

**Request:**
```
DELETE http://localhost:3003/documents/doc_abc123
```

**Response:**
```json
{
  "message": "Documento eliminado exitosamente",
  "id": "doc_abc123"
}
```

---

## 🏥 Health Endpoint

### GET /health

**Request:**
```
GET http://localhost:3003/health
```

**Response:**
```json
{
  "status": "OK",
  "service": "Planty Chatbot Service",
  "timestamp": "2025-01-13T10:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

## 🎭 Planty Endpoints (Futuros - Opcionales)

### GET /personalities

**Request:**
```
GET http://localhost:3003/personalities
```

**Response:**
```json
{
  "personalities": [
    {
      "id": "friendly",
      "name": "Amigable",
      "description": "Cercano, educativo, paciente y empático",
      "tone": "casual",
      "traits": ["extrovertido", "empático", "curioso", "expresivo", "paciente"],
      "emojis": ["🌿", "🌱", "🌾", "🌻", "🌺", "💚", "✨", "🎋"],
      "isDefault": true,
      "isCustom": false
    },
    {
      "id": "funny",
      "name": "Divertido",
      "description": "Bromista, creativo, respuestas con humor ligero",
      "tone": "playful",
      "traits": ["bromista", "creativo", "ocurrente", "alegre", "desenfadado"],
      "emojis": ["😂", "🌿", "🤣", "🎉", "✨", "🌈", "🎭", "🌻"],
      "isDefault": false,
      "isCustom": false
    },
    {
      "id": "epic",
      "name": "Épico",
      "description": "Lenguaje narrativo, tono legendario y místico",
      "tone": "epic",
      "traits": ["legendario", "místico", "narrativo", "dramático", "inspirador"],
      "emojis": ["⚔️", "🌿", "✨", "🔮", "🏛️", "🌙", "⭐", "🗡️"],
      "isDefault": false,
      "isCustom": false
    },
    {
      "id": "wise",
      "name": "Sabio",
      "description": "Reflexivo, respuestas profundas y analíticas",
      "tone": "educational",
      "traits": ["reflexivo", "analítico", "profundo", "contemplativo", "filosófico"],
      "emojis": ["🧙", "🌿", "📚", "🔬", "💭", "🌙", "⚗️", "🔭"],
      "isDefault": false,
      "isCustom": false
    }
  ]
}
```

---

### GET /gods

**Request:**
```
GET http://localhost:3003/gods
```

**Response:**
```json
{
  "gods": [
    {
      "name": "Draken",
      "description": "Dios de la Libertad",
      "emoji": "🌊",
      "domain": "libertad",
      "traits": ["aventurero", "libre", "explorador", "curioso"],
      "favoriteThings": ["viajar", "explorar nuevos mundos", "descubrir culturas", "romper cadenas"],
      "sampleQuote": "La libertad no se pide, se conquista"
    },
    {
      "name": "Insano",
      "description": "Dios de la Fuerza",
      "emoji": "💪",
      "domain": "fuerza",
      "traits": ["poderoso", "disciplinado", "incansable", "determinado"],
      "favoriteThings": ["creatina", "preentreno", "proteína", "entrenar sin descanso"],
      "sampleQuote": "Una planta fuerte resiste cualquier tormenta"
    },
    {
      "name": "Arvadev",
      "description": "Dios de la Sabiduría",
      "emoji": "🧙",
      "domain": "sabiduría",
      "traits": ["sabio", "estratégico", "analítico", "paciente"],
      "favoriteThings": ["Valorant", "conocimiento complejo", "teorías profundas", "datos curiosos"],
      "sampleQuote": "El conocimiento es como el agua: esencial pero debe dosificarse"
    }
  ]
}
```

---

## 🔑 Códigos de Estado HTTP

- `200` - OK (Respuesta exitosa)
- `201` - Created (Documento creado/procesado)
- `400` - Bad Request (Parámetros inválidos)
- `404` - Not Found (Recurso no encontrado)
- `500` - Internal Server Error (Error del servidor)

---

## 📝 Notas

1. Todos los endpoints de chat requieren `userId`
2. `sessionId` es opcional en el primer mensaje (se crea automáticamente)
3. `includeContext` por defecto es `true` (usa RAG)
4. `maxContextChunks` por defecto es `5`
5. La personalidad se detecta automáticamente o se cambia con frases como:
   - "sé más divertido"
   - "modo épico"
   - "activa personalidad sabio"
   - "quiero ser más amigable"
