# 🔐 Guía de Implementación 2FA - Sistema Completo

## ✅ Archivos Creados (Backend)

### 1. Domain Layer

#### Entidades
- ✅ **`src/domain/entities/OTP.ts`** - Entidad OTP con lógica de negocio
  - Validación de expiración (5 minutos)
  - Control de intentos (máximo 5)
  - Gestión de estado (usado/no usado)
  - Soporte para registro y login

#### Interfaces
- ✅ **`src/domain/interfaces/IEmailService.ts`** - Contrato para envío de emails
- ✅ **`src/domain/interfaces/IOTPService.ts`** - Contrato para gestión de OTPs

### 2. Application Layer

#### DTOs
- ✅ **`src/application/dtos/AuthDTOs.ts`** - ACTUALIZADO con DTOs 2FA:
  - `VerifyRegister2FADTO`
  - `VerifyLogin2FADTO`
  - `ResendOTPDTO`
  - `Login2FARequiredDTO`
  - `RegisterPending2FADTO`

### 3. Infrastructure Layer

#### Servicios
- ✅ **`src/infrastructure/services/EmailService.ts`** - Servicio de email con Nodemailer
  - Envío de OTP con template HTML profesional
  - Email de bienvenida
  - Configuración SMTP via env vars

- ✅ **`src/infrastructure/services/OTPService.ts`** - Gestión completa de OTPs
  - Generación de 6 dígitos aleatorios
  - Hashing con bcrypt (10 rounds)
  - Almacenamiento en memoria con limpieza automática
  - Búsqueda por email/sessionId
  - Estadísticas y debugging

### 4. Package.json
- ✅ **Actualizado** con dependencias:
  - `nodemailer@^6.9.7`
  - `@types/nodemailer@^6.4.14`

---

## 📋 Tareas Pendientes (Backend)

### Paso 1: Instalar Dependencias
```bash
cd api-auth
npm install
```

### Paso 2: Configurar Variables de Entorno

Agregar a `api-auth/.env`:

```env
# ============================================================================
# SMTP Configuration (para envío de emails)
# ============================================================================

# Gmail example:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password    # Usa "Contraseñas de aplicaciones" de Google
SMTP_FROM=Planty <noreply@planty.app>

# Otros proveedores populares:
# - SendGrid: smtp.sendgrid.net:587
# - Mailgun: smtp.mailgun.org:587
# - Outlook: smtp-mail.outlook.com:587
```

### Paso 3: Crear Casos de Uso 2FA

#### A) `src/application/usecases/VerifyRegister2FAUseCase.ts`

```typescript
import { IOTPService } from '../../domain/interfaces/IOTPService';
import { IEmailService } from '../../domain/interfaces/IEmailService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { AuthResult } from '../../domain/entities/Auth';

export class VerifyRegister2FAUseCase {
  constructor(
    private otpService: IOTPService,
    private userService: IUserService,
    private tokenService: ITokenService,
    private emailService: IEmailService
  ) {}

  async execute(email: string, otp: string): Promise<AuthResult> {
    // [1] Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // [2] Buscar OTP almacenado
    const storedOTP = await this.otpService.findByEmail(normalizedEmail, 'register');

    if (!storedOTP) {
      throw new Error('Código de verificación no encontrado o expirado');
    }

    // [3] Verificar si el OTP es válido
    if (!storedOTP.isValid()) {
      if (storedOTP.isExpired()) {
        throw new Error('El código de verificación ha expirado');
      }
      if (storedOTP.hasExceededAttempts()) {
        throw new Error('Has excedido el número máximo de intentos');
      }
      if (storedOTP.isUsed) {
        throw new Error('Este código ya ha sido utilizado');
      }
    }

    // [4] Comparar OTP
    const isValid = await this.otpService.compare(otp, storedOTP.otpHash);

    if (!isValid) {
      // Incrementar intentos
      storedOTP.incrementAttempts();
      await this.otpService.store(storedOTP);

      const remaining = 5 - storedOTP.attempts;
      throw new Error(
        `Código incorrecto. Te quedan ${remaining} intento(s)`
      );
    }

    // [5] Marcar OTP como usado
    storedOTP.markAsUsed();
    await this.otpService.store(storedOTP);

    // [6] Actualizar usuario: is_verified = true
    // IMPORTANTE: Necesitas implementar este método en UserService
    await this.userService.verifyUser(normalizedEmail);

    // [7] Obtener datos del usuario
    const user = await this.userService.findByEmail(normalizedEmail);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // [8] Generar JWT
    const token = this.tokenService.generate({
      userId: user.id,
      email: user.email,
    });

    // [9] Enviar email de bienvenida (async, no bloquear)
    this.emailService.sendWelcomeEmail(user.email, user.name).catch(err => {
      console.error('Error sending welcome email:', err);
    });

    // [10] Eliminar OTP
    await this.otpService.delete(normalizedEmail, 'register');

    // [11] Retornar token y usuario
    return {
      token,
      user: {
        ...user,
        password: undefined,
      },
    };
  }
}
```

#### B) `src/application/usecases/VerifyLogin2FAUseCase.ts`

```typescript
import { IOTPService } from '../../domain/interfaces/IOTPService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { ITokenService } from '../../domain/interfaces/ITokenService';
import { AuthResult } from '../../domain/entities/Auth';

export class VerifyLogin2FAUseCase {
  constructor(
    private otpService: IOTPService,
    private userService: IUserService,
    private tokenService: ITokenService
  ) {}

  async execute(sessionId: string, otp: string): Promise<AuthResult> {
    // [1] Buscar OTP por sessionId
    const storedOTP = await this.otpService.findBySessionId(sessionId);

    if (!storedOTP) {
      throw new Error('Sesión no encontrada o expirada');
    }

    // [2] Verificar si el OTP es válido
    if (!storedOTP.isValid()) {
      if (storedOTP.isExpired()) {
        throw new Error('La sesión ha expirado');
      }
      if (storedOTP.hasExceededAttempts()) {
        throw new Error('Has excedido el número máximo de intentos');
      }
      if (storedOTP.isUsed) {
        throw new Error('Este código ya ha sido utilizado');
      }
    }

    // [3] Comparar OTP
    const isValid = await this.otpService.compare(otp, storedOTP.otpHash);

    if (!isValid) {
      storedOTP.incrementAttempts();
      await this.otpService.store(storedOTP);

      const remaining = 5 - storedOTP.attempts;
      throw new Error(
        `Código incorrecto. Te quedan ${remaining} intento(s)`
      );
    }

    // [4] Marcar OTP como usado
    storedOTP.markAsUsed();
    await this.otpService.store(storedOTP);

    // [5] Obtener datos del usuario
    const user = await this.userService.findByEmail(storedOTP.email);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // [6] Verificar que la cuenta esté verificada
    if (!user.is_verified) {
      throw new Error('La cuenta no ha sido verificada');
    }

    // [7] Generar JWT
    const token = this.tokenService.generate({
      userId: user.id,
      email: user.email,
    });

    // [8] Eliminar OTP
    await this.otpService.delete(storedOTP.email, 'login');

    // [9] Retornar token y usuario
    return {
      token,
      user: {
        ...user,
        password: undefined,
      },
    };
  }
}
```

#### C) `src/application/usecases/ResendOTPUseCase.ts`

```typescript
import { IOTPService } from '../../domain/interfaces/IOTPService';
import { IEmailService } from '../../domain/interfaces/IEmailService';
import { IUserService } from '../../domain/interfaces/IUserService';
import { OTP } from '../../domain/entities/OTP';

export class ResendOTPUseCase {
  constructor(
    private otpService: IOTPService,
    private emailService: IEmailService,
    private userService: IUserService
  ) {}

  async execute(
    email: string,
    purpose: 'register' | 'login'
  ): Promise<{ message: string; expiresIn: number }> {
    // [1] Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // [2] Verificar que el usuario existe
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // [3] Si es login, verificar que no esté ya verificado
    if (purpose === 'register' && user.is_verified) {
      throw new Error('La cuenta ya está verificada');
    }

    // [4] Verificar si hay un OTP existente
    const existingOTP = await this.otpService.findByEmail(normalizedEmail, purpose);

    // Si existe y aún es válido, verificar rate limiting
    if (existingOTP && !existingOTP.isExpired()) {
      const remainingMs = existingOTP.getRemainingTimeMs();
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

      // No permitir reenvío si quedan más de 3 minutos
      if (remainingMinutes > 2) {
        throw new Error(
          `Puedes solicitar un nuevo código en ${remainingMinutes} minutos`
        );
      }
    }

    // [5] Generar nuevo OTP
    const otpCode = this.otpService.generate();
    const otpHash = await this.otpService.hash(otpCode);

    // [6] Crear entidad OTP
    const otp = OTP.create({
      email: normalizedEmail,
      otpHash,
      purpose,
    });

    // [7] Almacenar OTP (reemplaza el anterior)
    await this.otpService.store(otp);

    // [8] Enviar email
    await this.emailService.sendOTP(normalizedEmail, otpCode, purpose);

    // [9] Retornar confirmación
    return {
      message: 'Código de verificación enviado',
      expiresIn: 300, // 5 minutos en segundos
    };
  }
}
```

### Paso 4: Actualizar RegisterUseCase

Modificar `src/application/usecases/RegisterUseCase.ts`:

```typescript
export class RegisterUseCase {
  constructor(
    private hashService: IHashService,
    private tokenService: ITokenService,  // YA NO SE USA AQUÍ
    private userService: IUserService,
    private otpService: IOTPService,      // NUEVO
    private emailService: IEmailService   // NUEVO
  ) {}

  async execute(
    name: string,
    email: string,
    password: string
  ): Promise<RegisterPending2FADTO> {  // CAMBIAR tipo de retorno
    // ... validaciones existentes ...

    // [4] MODIFICAR: Crear usuario con is_verified = false
    const res = await this.userService.create(
      sanitizedName,
      normalizedEmail,
      hashedPassword,
      false  // is_verified = false
    );

    // [5] NUEVO: Generar OTP
    const otpCode = this.otpService.generate();
    const otpHash = await this.otpService.hash(otpCode);

    // [6] NUEVO: Crear y almacenar OTP
    const otp = OTP.create({
      email: normalizedEmail,
      otpHash,
      purpose: 'register',
    });
    await this.otpService.store(otp);

    // [7] NUEVO: Enviar email con OTP
    await this.emailService.sendOTP(normalizedEmail, otpCode, 'register');

    // [8] NUEVO: Retornar respuesta (SIN TOKEN)
    return {
      message: 'Registro exitoso. Verifica tu email para activar tu cuenta.',
      email: normalizedEmail,
      requiresVerification: true,
    };
  }
}
```

### Paso 5: Actualizar LoginUseCase

Modificar `src/application/usecases/LoginUseCase.ts`:

```typescript
import crypto from 'crypto';

export class LoginUseCase {
  constructor(
    private hashService: IHashService,
    private tokenService: ITokenService,   // YA NO SE USA AQUÍ
    private userService: IUserService,
    private otpService: IOTPService,       // NUEVO
    private emailService: IEmailService    // NUEVO
  ) {}

  async execute(
    email: string,
    password: string
  ): Promise<Login2FARequiredDTO> {  // CAMBIAR tipo de retorno
    // ... validaciones existentes hasta verificar contraseña ...

    // [5] NUEVO: Verificar si la cuenta está verificada
    if (!user.is_verified) {
      throw new Error(
        'Tu cuenta no ha sido verificada. Por favor, verifica tu email.'
      );
    }

    // [6] NUEVO: Generar sessionId único
    const sessionId = crypto.randomUUID();

    // [7] NUEVO: Generar OTP
    const otpCode = this.otpService.generate();
    const otpHash = await this.otpService.hash(otpCode);

    // [8] NUEVO: Crear y almacenar OTP
    const otp = OTP.create({
      email: normalizedEmail,
      otpHash,
      purpose: 'login',
      sessionId,
    });
    await this.otpService.store(otp);

    // [9] NUEVO: Enviar email con OTP
    await this.emailService.sendOTP(normalizedEmail, otpCode, 'login');

    // [10] NUEVO: Retornar respuesta (SIN TOKEN)
    return {
      require2FA: true,
      sessionId,
      message: 'Código de verificación enviado a tu email',
      expiresIn: 300, // 5 minutos
    };
  }
}
```

### Paso 6: Actualizar AuthController

Modificar `src/presentation/controllers/AuthController.ts`:

```typescript
export class AuthController {
  constructor(
    private registerUseCase: RegisterUseCase,
    private loginUseCase: LoginUseCase,
    private validateTokenUseCase: ValidateTokenUseCase,
    private verifyRegister2FAUseCase: VerifyRegister2FAUseCase,  // NUEVO
    private verifyLogin2FAUseCase: VerifyLogin2FAUseCase,        // NUEVO
    private resendOTPUseCase: ResendOTPUseCase                   // NUEVO
  ) {}

  // MODIFICAR método register
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const result = await this.registerUseCase.execute(name, email, password);

      // YA NO se envía token en el header
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // MODIFICAR método login
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const result = await this.loginUseCase.execute(email, password);

      // YA NO se envía token en el header
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  // NUEVO: Verificar OTP de registro
  verifyRegister2FA = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const result = await this.verifyRegister2FAUseCase.execute(email, otp);

      res.setHeader('Authorization', `Bearer ${result.token}`);
      res.status(200).json({ ...result, token: undefined });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // NUEVO: Verificar OTP de login
  verifyLogin2FA = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, otp } = req.body;

      if (!sessionId || !otp) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const result = await this.verifyLogin2FAUseCase.execute(sessionId, otp);

      res.setHeader('Authorization', `Bearer ${result.token}`);
      res.status(200).json({ ...result, token: undefined });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // NUEVO: Reenviar OTP
  resendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, purpose } = req.body;

      if (!email || !purpose) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      if (purpose !== 'register' && purpose !== 'login') {
        res.status(400).json({ error: 'Propósito inválido' });
        return;
      }

      const result = await this.resendOTPUseCase.execute(email, purpose);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // validateToken permanece igual
}
```

### Paso 7: Actualizar Rutas

Modificar `src/presentation/routes/AuthRoutes.ts`:

```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
// ... imports existentes ...
import { OTPService } from '../../infrastructure/services/OTPService';
import { EmailService } from '../../infrastructure/services/EmailService';
import { VerifyRegister2FAUseCase } from '../../application/usecases/VerifyRegister2FAUseCase';
import { VerifyLogin2FAUseCase } from '../../application/usecases/VerifyLogin2FAUseCase';
import { ResendOTPUseCase } from '../../application/usecases/ResendOTPUseCase';

// Servicios existentes
const hashService = new BcryptService();
const tokenService = new JwtService();
const userService = new UserHttpService();

// NUEVOS servicios
const otpService = new OTPService();
const emailService = new EmailService();

// Use cases existentes (MODIFICADOS)
const registerUseCase = new RegisterUseCase(
  hashService,
  tokenService,
  userService,
  otpService,      // NUEVO
  emailService     // NUEVO
);

const loginUseCase = new LoginUseCase(
  hashService,
  tokenService,
  userService,
  otpService,      // NUEVO
  emailService     // NUEVO
);

const validateTokenUseCase = new ValidateTokenUseCase(tokenService);

// NUEVOS use cases
const verifyRegister2FAUseCase = new VerifyRegister2FAUseCase(
  otpService,
  userService,
  tokenService,
  emailService
);

const verifyLogin2FAUseCase = new VerifyLogin2FAUseCase(
  otpService,
  userService,
  tokenService
);

const resendOTPUseCase = new ResendOTPUseCase(
  otpService,
  emailService,
  userService
);

// Controller (MODIFICADO)
const authController = new AuthController(
  registerUseCase,
  loginUseCase,
  validateTokenUseCase,
  verifyRegister2FAUseCase,
  verifyLogin2FAUseCase,
  resendOTPUseCase
);

const router = Router();

// Rutas existentes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/validate', authController.validateToken);

// NUEVAS rutas
router.post('/verify-register-2fa', authController.verifyRegister2FA);
router.post('/verify-login-2fa', authController.verifyLogin2FA);
router.post('/resend-otp', authController.resendOTP);

export default router;
```

### Paso 8: Actualizar User Entity (api-users)

Agregar campo `is_verified` al modelo de usuario en `api-users`:

#### A) `api-users/src/domain/entities/User.ts`

```typescript
export interface UserProps {
  id?: string;
  name: string;
  email: string;
  password: string;
  is_verified?: boolean;  // NUEVO
  // ... otros campos ...
}

export class User {
  private _is_verified: boolean;  // NUEVO

  constructor(props: UserProps) {
    // ... inicialización existente ...
    this._is_verified = props.is_verified ?? false;  // NUEVO
  }

  get is_verified(): boolean {
    return this._is_verified;
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      is_verified: this._is_verified,  // NUEVO
      // ... otros campos (sin password) ...
    };
  }
}
```

#### B) `api-users/src/infrastructure/database/models/UserModel.ts`

```typescript
const UserSchema = new Schema<UserDocument>({
  _id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true },
  is_verified: {                           // NUEVO
    type: Boolean,
    required: true,
    default: false
  },
  // ... otros campos ...
}, {
  timestamps: true,
  versionKey: false
});
```

#### C) `api-users/src/infrastructure/repositories/MongoUserRepository.ts`

Agregar método:

```typescript
export class MongoUserRepository implements UserRepository {
  // ... métodos existentes ...

  async verifyUser(email: string): Promise<void> {
    await UserModel.updateOne(
      { email: email.toLowerCase() },
      { $set: { is_verified: true } }
    );
  }
}
```

#### D) `api-users/src/domain/repositories/UserRepository.ts`

Agregar método a la interfaz:

```typescript
export interface UserRepository {
  // ... métodos existentes ...
  verifyUser(email: string): Promise<void>;
}
```

#### E) `api-users/src/presentation/controllers/UserController.ts`

Agregar endpoint:

```typescript
export class UserController {
  // ... métodos existentes ...

  verifyUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email es requerido' });
        return;
      }

      await this.verifyUserUseCase.execute(email);
      res.status(200).json({ message: 'Usuario verificado exitosamente' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
```

---

## 🧪 Testing

### Endpoints a Probar

1. **POST `/auth/register`**
   ```json
   {
     "name": "Juan García",
     "email": "juan@test.com",
     "password": "SecurePass123!"
   }
   ```

   Respuesta esperada (201):
   ```json
   {
     "message": "Registro exitoso. Verifica tu email para activar tu cuenta.",
     "email": "juan@test.com",
     "requiresVerification": true
   }
   ```

2. **POST `/auth/verify-register-2fa`**
   ```json
   {
     "email": "juan@test.com",
     "otp": "123456"
   }
   ```

   Respuesta esperada (200) + Header `Authorization: Bearer <token>`:
   ```json
   {
     "user": {
       "id": "...",
       "email": "juan@test.com",
       "name": "Juan García"
     }
   }
   ```

3. **POST `/auth/login`**
   ```json
   {
     "email": "juan@test.com",
     "password": "SecurePass123!"
   }
   ```

   Respuesta esperada (200):
   ```json
   {
     "require2FA": true,
     "sessionId": "uuid-v4",
     "message": "Código de verificación enviado a tu email",
     "expiresIn": 300
   }
   ```

4. **POST `/auth/verify-login-2fa`**
   ```json
   {
     "sessionId": "uuid-v4",
     "otp": "654321"
   }
   ```

5. **POST `/auth/resend-otp`**
   ```json
   {
     "email": "juan@test.com",
     "purpose": "register"
   }
   ```

---

## 🔥 Próximos Pasos

1. ✅ Implementar casos de uso 2FA (copiar código de arriba)
2. ✅ Actualizar RegisterUseCase y LoginUseCase
3. ✅ Actualizar AuthController
4. ✅ Actualizar rutas
5. ✅ Agregar campo `is_verified` a User (api-users)
6. ⏳ Implementar UI en Flutter (siguiente fase)

---

## 🚀 Ejecutar

```bash
# Terminal 1: MongoDB
docker-compose up mongodb

# Terminal 2: Users Service
cd api-users
npm run dev

# Terminal 3: Auth Service
cd api-auth
npm install  # Primera vez
npm run dev

# Terminal 4: Gateway
cd api-gateway
npm run dev
```

---

¿Continúo con la implementación de Flutter?
