/**
 * Validadores para autenticación
 * Contiene todas las validaciones de seguridad para registro y login
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AuthValidators {
  // Lista de contraseñas comunes prohibidas
  private static readonly COMMON_PASSWORDS = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    '111111', '123123', 'admin', 'letmein', 'welcome',
    '1234567890', 'password123', 'Password1', 'iloveyou'
  ];

  // Lista de palabras ofensivas (ejemplo básico - expandir según necesidad)
  private static readonly OFFENSIVE_WORDS = [
    'admin', 'root', 'system', 'test', 'null', 'undefined'
  ];

  /**
   * Validar email
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    // 1. Verificar que no esté vacío
    if (!email || email.trim().length === 0) {
      errors.push('El email es requerido');
      return { isValid: false, errors };
    }

    // 2. Quitar espacios y convertir a minúsculas
    const cleanEmail = email.trim().toLowerCase();

    // 3. Validar formato con regex
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      errors.push('El formato del email no es válido');
    }

    // 4. Validar que no tenga espacios
    if (cleanEmail.includes(' ')) {
      errors.push('El email no puede contener espacios');
    }

    // 5. Validar longitud
    if (cleanEmail.length > 254) {
      errors.push('El email es demasiado largo (máximo 254 caracteres)');
    }

    // 6. Validar partes del email
    const parts = cleanEmail.split('@');
    if (parts.length === 2) {
      const [localPart, domain] = parts;

      if (localPart.length === 0) {
        errors.push('La parte local del email no puede estar vacía');
      }

      if (localPart.length > 64) {
        errors.push('La parte local del email es demasiado larga (máximo 64 caracteres)');
      }

      if (domain.length === 0) {
        errors.push('El dominio del email no puede estar vacío');
      }

      // Validar que el dominio tenga al menos un punto
      if (!domain.includes('.')) {
        errors.push('El dominio del email debe contener al menos un punto');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Normalizar email (minúsculas y sin espacios)
   */
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Validar contraseña con reglas de seguridad
   */
  static validatePassword(password: string, email?: string, username?: string): ValidationResult {
    const errors: string[] = [];

    // 1. Verificar que no esté vacía
    if (!password || password.length === 0) {
      errors.push('La contraseña es requerida');
      return { isValid: false, errors };
    }

    // 2. Longitud mínima
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    // 3. Longitud máxima (prevenir ataques DoS)
    if (password.length > 128) {
      errors.push('La contraseña es demasiado larga (máximo 128 caracteres)');
    }

    // 4. Validar al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }

    // 5. Validar al menos una minúscula
    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }

    // 6. Validar al menos un número
    if (!/[0-9]/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }

    // 7. Validar al menos un carácter especial
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\\/;'`~]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)');
    }

    // 8. Validar que no sea una contraseña común
    const lowerPassword = password.toLowerCase();
    if (this.COMMON_PASSWORDS.includes(lowerPassword)) {
      errors.push('La contraseña es demasiado común. Por favor elige una contraseña más segura');
    }

    // 9. Validar que no contenga el email o username
    if (email && lowerPassword.includes(email.split('@')[0].toLowerCase())) {
      errors.push('La contraseña no puede contener tu email');
    }

    if (username && lowerPassword.includes(username.toLowerCase())) {
      errors.push('La contraseña no puede contener tu nombre de usuario');
    }

    // 10. Validar que no sea solo números
    if (/^\d+$/.test(password)) {
      errors.push('La contraseña no puede ser solo números');
    }

    // 11. Validar que no sea solo letras
    if (/^[a-zA-Z]+$/.test(password)) {
      errors.push('La contraseña no puede ser solo letras');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar nombre de usuario
   */
  static validateUsername(username: string): ValidationResult {
    const errors: string[] = [];

    // 1. Verificar que no esté vacío
    if (!username || username.trim().length === 0) {
      errors.push('El nombre es requerido');
      return { isValid: false, errors };
    }

    const cleanUsername = username.trim();

    // 2. Longitud mínima
    if (cleanUsername.length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    // 3. Longitud máxima
    if (cleanUsername.length > 50) {
      errors.push('El nombre es demasiado largo (máximo 50 caracteres)');
    }

    // 4. Validar caracteres permitidos (letras, números, espacios, guiones, apóstrofes)
    const usernameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']+$/;
    if (!usernameRegex.test(cleanUsername)) {
      errors.push('El nombre solo puede contener letras, espacios, guiones y apóstrofes');
    }

    // 5. Validar que no sea solo espacios
    if (cleanUsername.replace(/\s/g, '').length === 0) {
      errors.push('El nombre no puede ser solo espacios');
    }

    // 6. Validar palabras ofensivas (opcional)
    const lowerUsername = cleanUsername.toLowerCase();
    for (const word of this.OFFENSIVE_WORDS) {
      if (lowerUsername.includes(word)) {
        errors.push('El nombre contiene palabras no permitidas');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitizar string (prevenir XSS)
   */
  static sanitizeString(str: string): string {
    if (!str) return '';

    return str
      .trim()
      .replace(/[<>]/g, '') // Eliminar < y >
      .replace(/javascript:/gi, '') // Eliminar javascript:
      .replace(/on\w+\s*=/gi, ''); // Eliminar atributos on*=
  }

  /**
   * Validar teléfono (formato básico)
   */
  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];

    if (!phone || phone.trim().length === 0) {
      return { isValid: true, errors }; // Teléfono es opcional
    }

    const cleanPhone = phone.replace(/[\s\-()]/g, ''); // Quitar espacios, guiones y paréntesis

    // 1. Validar que solo contenga números y símbolos permitidos
    if (!/^[\d+]+$/.test(cleanPhone)) {
      errors.push('El teléfono solo puede contener números');
    }

    // 2. Validar longitud (10-15 dígitos es común internacionalmente)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      errors.push('El teléfono debe tener entre 10 y 15 dígitos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar fecha de nacimiento (mayor de edad)
   */
  static validateDateOfBirth(dateOfBirth: string | Date, minAge: number = 18): ValidationResult {
    const errors: string[] = [];

    if (!dateOfBirth) {
      return { isValid: true, errors }; // Fecha es opcional
    }

    const birthDate = new Date(dateOfBirth);

    // 1. Validar que sea una fecha válida
    if (isNaN(birthDate.getTime())) {
      errors.push('La fecha de nacimiento no es válida');
      return { isValid: false, errors };
    }

    // 2. Validar que no sea en el futuro
    if (birthDate > new Date()) {
      errors.push('La fecha de nacimiento no puede ser en el futuro');
    }

    // 3. Validar edad mínima
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < minAge) {
      errors.push(`Debes tener al menos ${minAge} años para registrarte`);
    }

    // 4. Validar que no sea demasiado vieja (más de 120 años)
    if (actualAge > 120) {
      errors.push('La fecha de nacimiento no es válida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar todos los campos de registro
   */
  static validateRegistration(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    dateOfBirth?: string | Date;
  }): ValidationResult {
    const allErrors: string[] = [];

    // Validar nombre
    const nameValidation = this.validateUsername(data.name);
    if (!nameValidation.isValid) {
      allErrors.push(...nameValidation.errors);
    }

    // Validar email
    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation.isValid) {
      allErrors.push(...emailValidation.errors);
    }

    // Validar contraseña
    const passwordValidation = this.validatePassword(
      data.password,
      data.email,
      data.name
    );
    if (!passwordValidation.isValid) {
      allErrors.push(...passwordValidation.errors);
    }

    // Validar teléfono (si se proporciona)
    if (data.phone) {
      const phoneValidation = this.validatePhone(data.phone);
      if (!phoneValidation.isValid) {
        allErrors.push(...phoneValidation.errors);
      }
    }

    // Validar fecha de nacimiento (si se proporciona)
    if (data.dateOfBirth) {
      const dobValidation = this.validateDateOfBirth(data.dateOfBirth);
      if (!dobValidation.isValid) {
        allErrors.push(...dobValidation.errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  /**
   * Validar todos los campos de login
   */
  static validateLogin(email: string, password: string): ValidationResult {
    const allErrors: string[] = [];

    // Validar que no estén vacíos
    if (!email || email.trim().length === 0) {
      allErrors.push('El email es requerido');
    }

    if (!password || password.length === 0) {
      allErrors.push('La contraseña es requerida');
    }

    // Si ya hay errores, retornar
    if (allErrors.length > 0) {
      return { isValid: false, errors: allErrors };
    }

    // Validar formato de email
    const emailValidation = this.validateEmail(email);
    if (!emailValidation.isValid) {
      allErrors.push(...emailValidation.errors);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }
}
