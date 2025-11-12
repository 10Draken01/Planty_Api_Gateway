# Diagrama: Arquitectura de Criptografía en Planty

```mermaid
graph TB
    subgraph "Frontend - Flutter"
        Input[Entrada de Usuario<br/>Email + Password]
        FSS[Flutter Secure Storage<br/>AES-256]
        HTTPS[HTTPS Client<br/>TLS 1.3]
    end

    subgraph "API Gateway"
        GW[Express Gateway]
        RateLimiter[Rate Limiter<br/>Prevención de Fuerza Bruta]
    end

    subgraph "Authentication Service"
        AuthCtrl[Auth Controller]
        BcryptSvc[Bcrypt Service<br/>Salt Rounds: 10]
        JWTSvc[JWT Service<br/>HS256 Algorithm]
    end

    subgraph "Users Service"
        UserRepo[User Repository]
        Sanitizer[Input Sanitizer<br/>NoSQL Injection Prevention]
    end

    subgraph "Base de Datos"
        MongoDB[(MongoDB<br/>Passwords Hashed)]
    end

    subgraph "Algoritmos Criptográficos"
        Bcrypt[Bcrypt<br/>Adaptive Hashing<br/>Salt + Cost Factor]
        HS256[HMAC-SHA256<br/>JWT Signing<br/>Secret Key]
        AES[AES-256<br/>Secure Storage<br/>Mobile Devices]
    end

    Input -->|Plain Text| HTTPS
    HTTPS -->|Encrypted TLS| GW
    GW --> RateLimiter
    RateLimiter --> AuthCtrl

    AuthCtrl -->|Register: Plain Password| BcryptSvc
    BcryptSvc -->|Uses| Bcrypt
    BcryptSvc -->|Hashed Password| UserRepo

    AuthCtrl -->|Login: Verify| BcryptSvc
    BcryptSvc -->|Compare Hash| Bcrypt
    BcryptSvc -->|Valid| JWTSvc

    JWTSvc -->|Uses| HS256
    JWTSvc -->|Signed Token| AuthCtrl
    AuthCtrl -->|JWT Token| HTTPS

    HTTPS -->|Token| FSS
    FSS -->|Uses| AES

    UserRepo --> Sanitizer
    Sanitizer -->|Sanitized Data| MongoDB

    style Bcrypt fill:#4CAF50
    style HS256 fill:#2196F3
    style AES fill:#FF9800
    style MongoDB fill:#E91E63
```

## Primitivas Criptográficas Utilizadas

### 1. Bcrypt (Hashing de Contraseñas)
```typescript
// Configuración
Salt Rounds: 10
Algoritmo: Blowfish-based
Tiempo de hash: ~100-200ms
```

**Ventajas**:
- Adaptativo (incrementa dificultad con el tiempo)
- Salt automático único por contraseña
- Resistente a rainbow tables
- Resistente a ataques GPU

### 2. HMAC-SHA256 (Firma JWT)
```typescript
// Configuración
Algoritmo: HS256
Secret: Almacenado en variable de entorno
Expiración: 24 horas
Payload: { userId, email, iat, exp }
```

**Ventajas**:
- Firma criptográfica verificable
- Previene manipulación de tokens
- Estándar de la industria (RFC 7519)

### 3. AES-256 (Almacenamiento Móvil)
```dart
// Configuración Flutter Secure Storage
Algoritmo: AES-256-CBC (Android)
Algoritmo: AES-256-GCM (iOS)
Key Storage: KeyStore/Keychain
```

**Ventajas**:
- Encriptación simétrica de alto nivel
- Protección hardware-backed
- No exportable mediante backup

## Políticas de Seguridad

❌ **Prohibido**:
- Algoritmos criptográficos personalizados
- MD5, SHA1 para passwords
- Almacenamiento de contraseñas en texto plano
- Secrets en código fuente

✅ **Requerido**:
- Usar librerías estándar y auditadas
- Rotación de secrets periódica
- Validación de entrada antes de hashing
- Logs sin datos sensibles
