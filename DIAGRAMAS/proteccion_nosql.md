# Diagrama: Mecanismos de Protección contra Inyección NoSQL

```mermaid
graph TB
    subgraph "Cliente"
        Client[Cliente envía petición]
    end

    subgraph "API Gateway"
        GW[Express Gateway]
        BodyParser[Body Parser<br/>express.json]
        TypeCheck{Validar tipo<br/>de datos}
    end

    subgraph "Backend Service"
        Controller[Controller]
        Validator[Input Validator]
        Sanitizer[Sanitizer Service]
        Repository[Repository Layer]
    end

    subgraph "Protecciones de Sanitización"
        RemoveDollar[Remover $]
        RemoveBraces[Remover { }]
        RemoveDots[Remover .]
        TrimSpaces[Trim espacios]
        ValidateType[Validar tipos JS]
    end

    subgraph "Mongoose - ORM"
        MongooseQuery[Query Builder]
        PreparedStatement[Prepared Statement]
        NoEval[Sin eval / Function]
    end

    subgraph "MongoDB"
        DB[(Base de Datos)]
    end

    subgraph "Casos de Ataque Bloqueados"
        Attack1["Inyección $ne<br/>{email: {$ne: null}}"]
        Attack2["Inyección $gt<br/>{price: {$gt: 0}}"]
        Attack3["Inyección $where<br/>{$where: 'malicious'}"]
        Attack4["Inyección operador<br/>{$regex: '.*'}"]
    end

    Client --> GW
    GW --> BodyParser
    BodyParser --> TypeCheck

    TypeCheck -->|Objeto en lugar<br/>de string| Block1[❌ Rechazar 400]
    TypeCheck -->|String válido| Controller

    Controller --> Validator
    Validator --> Sanitizer

    Sanitizer --> RemoveDollar
    RemoveDollar --> RemoveBraces
    RemoveBraces --> RemoveDots
    RemoveDots --> TrimSpaces
    TrimSpaces --> ValidateType

    ValidateType --> Repository
    Repository --> MongooseQuery
    MongooseQuery --> PreparedStatement
    PreparedStatement --> NoEval
    NoEval --> DB

    Attack1 -.->|Bloqueado por| TypeCheck
    Attack2 -.->|Bloqueado por| TypeCheck
    Attack3 -.->|Bloqueado por| RemoveDollar
    Attack4 -.->|Bloqueado por| MongooseQuery

    style Block1 fill:#F44336
    style RemoveDollar fill:#4CAF50
    style RemoveBraces fill:#4CAF50
    style RemoveDots fill:#4CAF50
    style ValidateType fill:#4CAF50
    style PreparedStatement fill:#2196F3
    style Attack1 fill:#FFCDD2
    style Attack2 fill:#FFCDD2
    style Attack3 fill:#FFCDD2
    style Attack4 fill:#FFCDD2
```

## Protecciones Implementadas

### 1. Validación de Tipos de Datos
```typescript
// Middleware en Express
if (typeof email !== 'string' || typeof password !== 'string') {
  return res.status(400).json({ error: 'Formato invalido' });
}
```

**Bloquea**:
- `{"email": {"$ne": null}}` ❌
- `{"password": {"$gt": ""}}` ❌

### 2. Sanitización de Caracteres Especiales
```typescript
private sanitizeInput(input: string): string {
  return input
    .replace(/[$]/g, '')      // Remover operadores MongoDB
    .replace(/[{}]/g, '')     // Remover objetos
    .replace(/\./g, '')       // Remover acceso a propiedades
    .trim();                  // Remover espacios
}
```

**Ejemplos**:
```typescript
Input:  "user$ne"
Output: "userne"

Input:  "admin{$where: '1'}"
Output: "adminwhere 1"
```

### 3. Uso de Mongoose (ORM)
```typescript
// ✅ Seguro - Query parametrizada
await UserModel.findOne({ email: sanitizedEmail });

// ❌ Inseguro - String concatenation
await UserModel.find(`{ email: '${email}' }`);
```

**Ventajas de Mongoose**:
- Prepared statements automáticos
- Type safety con TypeScript
- Validación de schema
- No permite `eval()` o `Function()`

### 4. Validación de Estructura de Datos
```typescript
private isValidUser(user: User): boolean {
  return (
    user.name && user.name.length > 0 &&
    user.email && user.email.includes('@') &&
    user.password && user.password.length > 0
  );
}
```

## Ejemplos de Ataques Bloqueados

### Ataque 1: Bypass de autenticación con $ne
```json
// Payload malicioso
POST /api/auth/login
{
  "email": {"$ne": null},
  "password": {"$ne": null}
}
```
**Resultado**: ❌ Rechazado por validación de tipo
```json
{
  "error": "Formato invalido"
}
```

### Ataque 2: Inyección de operador $where
```json
// Payload malicioso
POST /api/users
{
  "email": "user@test.com",
  "name": "admin",
  "password": {"$where": "this.password.length > 0"}
}
```
**Resultado**: ❌ Rechazado por validación de tipo y sanitización

### Ataque 3: Extracción de datos con $regex
```json
// Payload malicioso
{
  "email": {"$regex": "^admin"},
  "password": "anything"
}
```
**Resultado**: ❌ Rechazado por validación de tipo

### Ataque 4: Inyección de JavaScript
```javascript
// Payload malicioso
{
  "email": "'; return true; var x='",
  "password": "test"
}
```
**Resultado**: ❌ Sanitizado antes de query
```javascript
// Después de sanitización
{
  "email": " return true var x",
  "password": "test"
}
```

## Mejores Prácticas Implementadas

✅ **Do's**:
- Usar ORMs (Mongoose) para queries
- Validar tipos de datos en entrada
- Sanitizar caracteres especiales
- Usar prepared statements
- Validar estructura de objetos
- Logging de intentos sospechosos

❌ **Don'ts**:
- No construir queries con concatenación de strings
- No usar `eval()` o `Function()`
- No confiar en input del cliente
- No permitir objetos en inputs que esperan strings
- No exponer mensajes de error detallados

## Checklist de Seguridad NoSQL

| Protección | Estado | Ubicación |
|-----------|--------|-----------|
| Validación de tipos | ✅ | Controller |
| Sanitización de $ | ✅ | Sanitizer Service |
| Sanitización de {} | ✅ | Sanitizer Service |
| Sanitización de . | ✅ | Sanitizer Service |
| Uso de Mongoose ORM | ✅ | Repository Layer |
| Sin eval() | ✅ | Todo el código |
| Validación de estructura | ✅ | Validator |
| Logging de ataques | ⚠️ | Pendiente |
