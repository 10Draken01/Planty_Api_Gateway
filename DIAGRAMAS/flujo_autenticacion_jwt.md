# Diagrama: Flujo de Autenticación con JWT

```mermaid
sequenceDiagram
    participant User as Usuario
    participant App as Flutter App
    participant GW as API Gateway
    participant Auth as Auth Service
    participant Users as Users Service
    participant DB as MongoDB
    participant Storage as Secure Storage

    Note over User,Storage: Proceso de Registro

    User->>App: Ingresa email, password, nombre
    App->>App: Validación frontend<br/>(formato, longitud)
    App->>GW: POST /api/auth/register<br/>{name, email, password}
    GW->>GW: Rate limiting (5 req/15min)
    GW->>Auth: Forward request
    Auth->>Auth: Validar campos requeridos
    Auth->>Auth: Hash password (Bcrypt)
    Auth->>Users: Crear usuario
    Users->>Users: Sanitizar datos
    Users->>DB: INSERT user
    DB-->>Users: User creado
    Users-->>Auth: User data
    Auth->>Auth: Generar JWT (HS256)
    Auth-->>GW: {token, user}<br/>Header: Authorization Bearer
    GW-->>App: 201 Created + JWT
    App->>Storage: Guardar token (AES-256)
    Storage-->>App: Token guardado
    App->>App: Actualizar estado (AuthProvider)
    App-->>User: Redirigir a Home

    Note over User,Storage: Proceso de Login

    User->>App: Ingresa email, password
    App->>GW: POST /api/auth/login<br/>{email, password}
    GW->>Auth: Forward request
    Auth->>Users: Buscar usuario por email
    Users->>DB: SELECT user WHERE email
    DB-->>Users: User data (con hash)
    Users-->>Auth: User data
    Auth->>Auth: Comparar password con hash<br/>(bcrypt.compare)

    alt Password válido
        Auth->>Auth: Generar JWT
        Auth-->>GW: {token, user}
        GW-->>App: 200 OK + JWT
        App->>Storage: Guardar token
        App-->>User: Redirigir a Home
    else Password inválido
        Auth-->>GW: 401 Unauthorized
        GW-->>App: Error: Credenciales inválidas
        App-->>User: Mostrar error
    end

    Note over User,Storage: Acceso a Recurso Protegido

    User->>App: Enviar mensaje al chatbot
    App->>Storage: Leer token
    Storage-->>App: JWT token
    App->>GW: POST /api/chat/message<br/>Header: Authorization Bearer {token}
    GW->>GW: Validar token middleware
    GW->>Auth: POST /auth/validate {token}
    Auth->>Auth: Verificar firma JWT
    Auth->>Auth: Verificar expiración

    alt Token válido y no expirado
        Auth-->>GW: {valid: true, user}
        GW->>GW: Agregar user a request
        GW->>ChatbotService: Forward request
        ChatbotService-->>GW: Response
        GW-->>App: 200 OK + data
        App-->>User: Mostrar respuesta
    else Token inválido o expirado
        Auth-->>GW: {valid: false}
        GW-->>App: 401 Unauthorized
        App->>Storage: Eliminar token
        App->>App: Limpiar estado
        App-->>User: Redirigir a Login
    end

    Note over User,Storage: Logout

    User->>App: Presiona botón Logout
    App->>Storage: Eliminar token
    Storage-->>App: Token eliminado
    App->>App: Limpiar AuthProvider
    App-->>User: Redirigir a Login
```

## Componentes del Sistema JWT

### Token JWT Estructura
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "iat": 1640000000,
    "exp": 1640086400
  },
  "signature": "HMAC-SHA256(base64(header).base64(payload), secret)"
}
```

### Validaciones Implementadas

**Frontend**:
- ✅ Formato de email válido
- ✅ Longitud mínima de contraseña (8 caracteres)
- ✅ Complejidad de contraseña (mayúsculas, minúsculas, números)

**Backend**:
- ✅ Campos requeridos presentes
- ✅ Sanitización de entrada
- ✅ Verificación de usuario existente
- ✅ Hash seguro de contraseña
- ✅ Firma criptográfica del token
- ✅ Expiración del token (24h)

### Estados de Autenticación

| Estado | Descripción | Acción |
|--------|-------------|--------|
| `unauthenticated` | Sin token válido | Mostrar login |
| `authenticated` | Token válido presente | Permitir acceso |
| `token_expired` | Token expirado | Renovar o logout |
| `token_invalid` | Token manipulado | Logout forzado |
