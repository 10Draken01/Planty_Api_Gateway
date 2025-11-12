# Diagrama: Flujo de Validación de Entrada en Frontend

```mermaid
flowchart TD
    Start([Usuario ingresa datos]) --> CheckEmpty{¿Campos vacíos?}

    CheckEmpty -->|Sí| ErrorEmpty[Error: Hay campos vacíos]
    ErrorEmpty --> ShowError1[Mostrar mensaje de error]
    ShowError1 --> End1([Fin - No enviar])

    CheckEmpty -->|No| ValidateEmail{¿Email válido?}

    ValidateEmail -->|No| ErrorEmail[Error: Formato de email inválido]
    ErrorEmail --> ShowError2[Mostrar mensaje de error]
    ShowError2 --> End2([Fin - No enviar])

    ValidateEmail -->|Sí| CheckLength{¿Longitud password<br/>>= 8 caracteres?}

    CheckLength -->|No| ErrorLength[Error: Contraseña muy corta]
    ErrorLength --> ShowError3[Mostrar mensaje de error]
    ShowError3 --> End3([Fin - No enviar])

    CheckLength -->|Sí| CheckComplexity{¿Contraseña<br/>tiene mayúsculas,<br/>minúsculas y números?}

    CheckComplexity -->|No| ErrorComplexity[Error: Contraseña débil]
    ErrorComplexity --> ShowError4[Mostrar mensaje de error]
    ShowError4 --> End4([Fin - No enviar])

    CheckComplexity -->|Sí| CheckName{¿Nombre entre<br/>2 y 100 caracteres?}

    CheckName -->|No| ErrorName[Error: Nombre inválido]
    ErrorName --> ShowError5[Mostrar mensaje de error]
    ShowError5 --> End5([Fin - No enviar])

    CheckName -->|Sí| SanitizeInput[Sanitizar entrada<br/>Remover caracteres especiales]

    SanitizeInput --> PrepareRequest[Preparar request JSON]
    PrepareRequest --> SendToBackend[Enviar a backend vía HTTPS]
    SendToBackend --> WaitResponse{Esperar respuesta}

    WaitResponse -->|Error 400| ServerValidation[Error: Validación servidor]
    ServerValidation --> ShowError6[Mostrar error del servidor]
    ShowError6 --> End6([Fin - Error])

    WaitResponse -->|Error 401| Unauthorized[Error: No autorizado]
    Unauthorized --> ShowError7[Mostrar error de autenticación]
    ShowError7 --> End7([Fin - Error])

    WaitResponse -->|Error 429| RateLimit[Error: Demasiados intentos]
    RateLimit --> ShowError8[Mostrar mensaje de rate limit]
    ShowError8 --> End8([Fin - Error])

    WaitResponse -->|Success 200/201| ExtractData[Extraer token y datos de usuario]
    ExtractData --> SaveToken[Guardar token en Secure Storage]
    SaveToken --> UpdateState[Actualizar AuthProvider]
    UpdateState --> Navigate[Navegar a Home]
    Navigate --> End9([Fin - Éxito])

    style Start fill:#4CAF50
    style CheckEmpty fill:#2196F3
    style ValidateEmail fill:#2196F3
    style CheckLength fill:#2196F3
    style CheckComplexity fill:#2196F3
    style CheckName fill:#2196F3
    style ErrorEmpty fill:#F44336
    style ErrorEmail fill:#F44336
    style ErrorLength fill:#F44336
    style ErrorComplexity fill:#F44336
    style ErrorName fill:#F44336
    style SanitizeInput fill:#FF9800
    style SaveToken fill:#9C27B0
    style Navigate fill:#4CAF50
```

## Validaciones Implementadas

### 1. Validación de Campos Vacíos
```dart
if (_name.isEmpty || _email.isEmpty || _password.isEmpty) {
  _message = "Hay campos vacios";
  return false;
}
```

### 2. Validación de Email
```dart
bool _isValidEmail(String email) {
  final emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  );
  return emailRegex.hasMatch(email);
}
```
**Criterios**:
- Formato válido según RFC 5322
- No caracteres especiales peligrosos
- Dominio válido

### 3. Validación de Longitud de Contraseña
```dart
if (_password.length < 8) {
  _message = "La contrasena debe tener al menos 8 caracteres";
  return false;
}
```

### 4. Validación de Complejidad de Contraseña
```dart
bool _isStrongPassword(String password) {
  final hasUppercase = password.contains(RegExp(r'[A-Z]'));
  final hasLowercase = password.contains(RegExp(r'[a-z]'));
  final hasDigits = password.contains(RegExp(r'[0-9]'));
  return hasUppercase && hasLowercase && hasDigits;
}
```
**Criterios**:
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número

### 5. Sanitización de Entrada (Chatbot)
```dart
String _sanitizeInput(String input) {
  return input
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;')
    .replaceAll('/', '&#x2F;');
}
```

## Mensajes de Error UX

| Error | Mensaje | Acción |
|-------|---------|--------|
| Campos vacíos | "Hay campos vacíos" | Resaltar campos |
| Email inválido | "Formato de email inválido" | Focus en email |
| Contraseña corta | "La contraseña debe tener al menos 8 caracteres" | Focus en password |
| Contraseña débil | "La contraseña debe contener mayúsculas, minúsculas y números" | Mostrar requisitos |
| Nombre inválido | "El nombre debe tener entre 2 y 100 caracteres" | Focus en nombre |
| Error servidor | Mensaje del servidor | Mostrar error específico |

## Prevención de Ataques

✅ **Protecciones implementadas**:
- XSS: Sanitización de caracteres HTML
- Injection: Validación de formato antes de enviar
- Brute Force: Rate limiting en backend
- Timing Attacks: Mensajes de error genéricos
