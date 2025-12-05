import nodemailer, { Transporter } from 'nodemailer';
import { IEmailService } from '../../domain/interfaces/IEmailService';

/**
 * Servicio de Email usando Nodemailer
 * Implementa el envío de correos electrónicos
 */

export class EmailService implements IEmailService {
  private transporter: Transporter;
  private from: string;

  constructor() {
    // Configuración del transporter de nodemailer
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const fromName = process.env.SMTP_FROM_NAME || 'Planty';
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@planty.app';
    this.from = `${fromName} <${fromEmail}>`;

    // Verificar la conexión al iniciar (opcional)
    this.verifyConnection();
  }

  /**
   * Verifica la conexión SMTP
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✓ Email service ready to send messages');
    } catch (error) {
      console.error('✗ Email service verification failed:', error);
      console.warn('Emails will not be sent. Please check SMTP configuration.');
    }
  }

  /**
   * Envía un OTP por correo electrónico
   */
  async sendOTP(to: string, otp: string, purpose: 'register' | 'login'): Promise<void> {
    try {
      const subject = purpose === 'register'
        ? 'Verifica tu cuenta en Planty'
        : 'Código de verificación - Planty';

      const html = this.getOTPEmailTemplate(otp, purpose);

      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });

      console.log(`✓ OTP email sent to ${to} (${purpose})`);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('No se pudo enviar el correo de verificación');
    }
  }

  /**
   * Envía un correo de bienvenida
   */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    try {
      const subject = '¡Bienvenido a Planty! 🌱';
      const html = this.getWelcomeEmailTemplate(name);

      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });

      console.log(`✓ Welcome email sent to ${to}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // No lanzar error para no bloquear el flujo
    }
  }

  /**
   * Template HTML para el email de OTP
   */
  private getOTPEmailTemplate(otp: string, purpose: 'register' | 'login'): string {
    const title = purpose === 'register'
      ? '¡Bienvenido a Planty! 🌱'
      : 'Inicio de sesión en Planty';

    const message = purpose === 'register'
      ? 'Gracias por registrarte en Planty. Para completar tu registro, verifica tu cuenta con el siguiente código:'
      : 'Hemos detectado un intento de inicio de sesión en tu cuenta. Usa el siguiente código para continuar:';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 0;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                      🌱 Planty
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                      ${title}
                    </h2>

                    <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                      ${message}
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                      <div style="color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                        Tu código de verificación
                      </div>
                      <div style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${otp}
                      </div>
                    </div>

                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                        <strong>⏱️ Este código expira en 5 minutos.</strong><br>
                        Por seguridad, no compartas este código con nadie.
                      </p>
                    </div>

                    <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} Planty. Todos los derechos reservados.
                    </p>
                    <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                      Este es un correo automático, por favor no respondas a este mensaje.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Template HTML para el email de bienvenida
   */
  private getWelcomeEmailTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Bienvenido a Planty!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 0;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #34d399 0%, #10b981 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">
                      🌱 ¡Bienvenido a Planty!
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                      Hola, ${name} 👋
                    </h2>

                    <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                      ¡Tu cuenta ha sido verificada exitosamente! Ahora puedes disfrutar de todas las funcionalidades de Planty.
                    </p>

                    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; padding: 25px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px; color: #166534; font-size: 18px;">¿Qué puedes hacer en Planty?</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #166534; line-height: 1.8;">
                        <li>🌿 Crear y gestionar tus huertos</li>
                        <li>📊 Monitorear el crecimiento de tus plantas</li>
                        <li>💬 Consultar al asistente IA de Planty</li>
                        <li>📱 Recibir notificaciones de riego y cuidado</li>
                        <li>🎯 Obtener recomendaciones personalizadas</li>
                      </ul>
                    </div>

                    <p style="margin: 30px 0 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      ¡Comienza tu aventura verde hoy mismo! 🚀
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} Planty. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
