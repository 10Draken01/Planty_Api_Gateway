# Diagrama: Flujo de Almacenamiento Seguro de Credenciales

```mermaid
sequenceDiagram
    participant App as Flutter App
    participant FSS as FlutterSecureStorage
    participant KS as KeyStore/Keychain
    participant AES as AES-256 Encryption

    Note over App,AES: Proceso de Login Exitoso

    App->>App: Usuario inicia sesión
    App->>App: Recibe JWT Token del backend

    Note over App,KS: Almacenamiento Seguro

    App->>FSS: write('auth_token', token)
    FSS->>AES: Encriptar datos con AES-256
    AES->>KS: Guardar en KeyStore (Android)<br/>o Keychain (iOS)
    KS-->>AES: Confirmación
    AES-->>FSS: Datos encriptados guardados
    FSS-->>App: Token almacenado de forma segura

    Note over App,KS: Lectura de Credenciales

    App->>FSS: read('auth_token')
    FSS->>KS: Solicitar datos encriptados
    KS-->>FSS: Datos encriptados
    FSS->>AES: Desencriptar con AES-256
    AES-->>FSS: Token desencriptado
    FSS-->>App: Token JWT

    Note over App,KS: Eliminación de Credenciales (Logout)

    App->>FSS: delete('auth_token')
    FSS->>KS: Eliminar datos
    KS-->>FSS: Confirmación
    FSS-->>App: Token eliminado
```

## Características de Seguridad

### Encriptación
- **Algoritmo**: AES-256 (Advanced Encryption Standard)
- **Modo**: CBC (Cipher Block Chaining)
- **Automático**: Flutter Secure Storage maneja la encriptación/desencriptación

### Almacenamiento Nativo

**Android (KeyStore)**:
- Hardware-backed encryption (si está disponible)
- Protegido por credenciales de desbloqueo del dispositivo
- No exportable mediante backup

**iOS (Keychain)**:
- Secure Enclave (A7+ chips)
- Protección mediante biometría o PIN
- Aislamiento en sandbox de la app

### Datos Almacenados
- ✅ Token JWT de autenticación
- ✅ Datos de sesión del usuario (JSON encriptado)
- ✅ Preferencias sensibles
- ❌ Contraseñas (nunca se almacenan)
