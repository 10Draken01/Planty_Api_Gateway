import { Resend } from 'resend';
import { IEmailService } from '../../domain/interfaces/IEmailService';

export class EmailService implements IEmailService {
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY no está configurada en las variables de entorno');
    }

    this.resend = new Resend(apiKey);
    this.fromName = process.env.SMTP_FROM_NAME || 'Planty';
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev';

    console.log('✓ Resend inicializado correctamente');
  }

  async sendOTP(to: string, otp: string, purpose: 'register' | 'login'): Promise<void> {
    const subject =
      purpose === 'register'
        ? '🌱 Verifica tu cuenta en Planty'
        : '🔐 Código de acceso - Planty';

    const html = this.getOTPEmailTemplate(otp, purpose);

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('❌ Error enviando OTP con Resend:', error);
        throw new Error(`Error al enviar email: ${error.message}`);
      }

      console.log('✅ OTP enviado correctamente:', data?.id);
    } catch (error: any) {
      console.error('❌ Error en sendOTP:', error);
      throw new Error(`Error al enviar email de verificación: ${error.message}`);
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const subject = '🌱 ¡Bienvenido a Planty!';
    const html = this.getWelcomeEmailTemplate(name);

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('❌ Error enviando email de bienvenida con Resend:', error);
        throw new Error(`Error al enviar email: ${error.message}`);
      }

      console.log('✅ Email de bienvenida enviado correctamente:', data?.id);
    } catch (error: any) {
      console.error('❌ Error en sendWelcomeEmail:', error);
      // No lanzar error aquí porque el email de bienvenida no es crítico
    }
  }

  private getOTPEmailTemplate(otp: string, purpose: 'register' | 'login'): string {
    const title = purpose === 'register'
      ? '¡Bienvenido a Planty! 🌱'
      : 'Código de Acceso 🔐';

    const message = purpose === 'register'
      ? 'Gracias por registrarte en Planty. Para completar tu registro, por favor ingresa el siguiente código de verificación:'
      : 'Has solicitado iniciar sesión en Planty. Por favor ingresa el siguiente código de verificación:';

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #67ff49 0%, #4ade80 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                🌱 Planty
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                ${title}
              </h2>

              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>

              <!-- OTP Code -->
              <div style="background-color: #f9fafb; border: 2px solid #67ff49; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                  Tu código de verificación
                </p>
                <h1 style="margin: 0; color: #1f2937; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </h1>
              </div>

              <!-- Warning -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  ⚠️ <strong>Importante:</strong> Este código expira en 5 minutos. No lo compartas con nadie.
                </p>
              </div>

              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                Este es un mensaje automático, por favor no respondas a este correo.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Planty. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Bienvenido a Planty!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #67ff49 0%, #4ade80 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                🌱 Planty
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 28px; font-weight: 600;">
                ¡Hola ${name}! 👋
              </h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ¡Bienvenido a <strong>Planty</strong>! Tu cuenta ha sido verificada exitosamente y ya puedes comenzar a disfrutar de todas nuestras funcionalidades.
              </p>

              <!-- Features -->
              <div style="margin: 30px 0;">
                <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                  ¿Qué puedes hacer en Planty?
                </h3>

                <div style="margin: 15px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #67ff49; border-radius: 4px;">
                  <p style="margin: 0; color: #166534; font-size: 15px;">
                    🌿 <strong>Gestiona tu huerto:</strong> Organiza y planifica tus cultivos de manera eficiente
                  </p>
                </div>

                <div style="margin: 15px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #67ff49; border-radius: 4px;">
                  <p style="margin: 0; color: #166534; font-size: 15px;">
                    🤖 <strong>Asistente IA:</strong> Obtén recomendaciones personalizadas para tus plantas
                  </p>
                </div>

                <div style="margin: 15px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #67ff49; border-radius: 4px;">
                  <p style="margin: 0; color: #166534; font-size: 15px;">
                    📊 <strong>Seguimiento:</strong> Monitorea el progreso de tus cultivos en tiempo real
                  </p>
                </div>
              </div>

              <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Estamos emocionados de tenerte con nosotros. Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
              </p>

              <p style="margin: 20px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ¡Feliz cultivo! 🌱
              </p>

              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 16px; font-weight: 600;">
                El equipo de Planty
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                Este es un mensaje automático, por favor no respondas a este correo.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Planty. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
