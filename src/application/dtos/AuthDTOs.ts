export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

// ============================================================================
// DTOs para 2FA (Autenticación de Dos Factores)
// ============================================================================

/**
 * DTO para verificar OTP en el registro
 */
export interface VerifyRegister2FADTO {
  email: string;
  otp: string;
}

/**
 * DTO para verificar OTP en el login
 */
export interface VerifyLogin2FADTO {
  sessionId: string;  // ID de sesión generado durante el login
  otp: string;
}

/**
 * DTO para reenviar OTP
 */
export interface ResendOTPDTO {
  email: string;
  purpose: 'register' | 'login';
}

/**
 * DTO para respuesta de login que requiere 2FA
 */
export interface Login2FARequiredDTO {
  require2FA: true;
  sessionId: string;
  message: string;
  expiresIn: number;  // Tiempo de expiración en segundos
}

/**
 * DTO para respuesta de registro que requiere verificación
 */
export interface RegisterPending2FADTO {
  message: string;
  email: string;
  requiresVerification: true;
}
