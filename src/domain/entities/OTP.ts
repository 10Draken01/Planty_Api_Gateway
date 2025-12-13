/**
 * Entidad de Dominio: OTP (One-Time Password)
 * Representa un código de verificación de dos factores
 */

export interface OTPProps {
  email: string;
  otpHash: string;          // OTP hasheado (nunca almacenar en texto plano)
  expiresAt: Date;          // Fecha de expiración
  attempts: number;         // Intentos de verificación
  isUsed: boolean;          // Si ya fue usado
  purpose: 'register' | 'login';  // Propósito del OTP
  sessionId?: string;       // ID de sesión para login 2FA
}

export class OTP {
  private constructor(private props: OTPProps) {}

  /**
   * Factory method para crear un nuevo OTP
   */
  static create(data: {
    email: string;
    otpHash: string;
    purpose: 'register' | 'login';
    sessionId?: string;
  }): OTP {
    // Validaciones
    if (!data.email || data.email.trim().length === 0) {
      throw new Error('El email es requerido');
    }

    if (!data.otpHash || data.otpHash.trim().length === 0) {
      throw new Error('El OTP hash es requerido');
    }

    // El OTP expira en 5 minutos
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    return new OTP({
      email: data.email.toLowerCase().trim(),
      otpHash: data.otpHash,
      expiresAt,
      attempts: 0,
      isUsed: false,
      purpose: data.purpose,
      sessionId: data.sessionId
    });
  }

  /**
   * Factory method para reconstruir desde persistencia
   */
  static fromPersistence(props: OTPProps): OTP {
    return new OTP(props);
  }

  // Getters
  get email(): string {
    return this.props.email;
  }

  get otpHash(): string {
    return this.props.otpHash;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get attempts(): number {
    return this.props.attempts;
  }

  get isUsed(): boolean {
    return this.props.isUsed;
  }

  get purpose(): 'register' | 'login' {
    return this.props.purpose;
  }

  get sessionId(): string | undefined {
    return this.props.sessionId;
  }

  // Métodos de negocio

  /**
   * Verifica si el OTP ha expirado
   */
  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  /**
   * Verifica si se han excedido los intentos máximos
   */
  hasExceededAttempts(): boolean {
    return this.props.attempts >= 5;
  }

  /**
   * Incrementa el contador de intentos
   */
  incrementAttempts(): void {
    this.props.attempts += 1;
  }

  /**
   * Marca el OTP como usado
   */
  markAsUsed(): void {
    this.props.isUsed = true;
  }

  /**
   * Verifica si el OTP es válido para ser usado
   */
  isValid(): boolean {
    return !this.isExpired() &&
           !this.isUsed &&
           !this.hasExceededAttempts();
  }

  /**
   * Obtiene el tiempo restante en milisegundos
   */
  getRemainingTimeMs(): number {
    const now = new Date().getTime();
    const expires = this.props.expiresAt.getTime();
    return Math.max(0, expires - now);
  }

  /**
   * Obtiene el tiempo restante en minutos
   */
  getRemainingMinutes(): number {
    return Math.ceil(this.getRemainingTimeMs() / (60 * 1000));
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toJSON() {
    return {
      email: this.props.email,
      otpHash: this.props.otpHash,
      expiresAt: this.props.expiresAt,
      attempts: this.props.attempts,
      isUsed: this.props.isUsed,
      purpose: this.props.purpose,
      sessionId: this.props.sessionId
    };
  }
}
