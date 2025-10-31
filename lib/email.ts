import { render } from "@react-email/render";
import { Resend } from "resend";
import InvoiceEmail from "@/components/emails/InvoiceEmail";
import OTPEmail from "@/components/emails/OTPEmail";
import PasswordChangedEmail from "@/components/emails/PasswordChangeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// Timeout para envío de emails
const EMAIL_TIMEOUT = 10000; // 10 segundos

/**
 * Enviar email con timeout automático
 */
async function sendEmailWithTimeout<T>(
  emailPromise: Promise<T>,
  timeoutMs: number = EMAIL_TIMEOUT
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Email send timeout")), timeoutMs)
  );

  return Promise.race([emailPromise, timeoutPromise]);
}

/**
 * Enviar OTP por email
 */
export async function sendOTPEmail(
  to: string,
  otp: string,
  nombre: string,
): Promise<void> {
  try {
    const emailHtml = await render(OTPEmail({ nombre, otp }));

    const emailPromise = resend.emails.send({
      from: "Ricuras del Huila <onboarding@resend.dev>",
      to,
      subject: "Código de Recuperación de Contraseña",
      html: emailHtml,
    });

    const { data, error } = await sendEmailWithTimeout(emailPromise);

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Error sending email: ${error.message}`);
    }

    console.log("✅ Email enviado exitosamente:", data?.id);
  } catch (error) {
    console.error("Error enviando email con Resend:", error);
    throw new Error("No se pudo enviar el código de verificación");
  }
}

/**
 * Enviar factura por email
 */
export async function sendInvoiceEmail(
  to: string,
  clienteNombre: string,
  numeroFactura: string,
  total: string,
  fecha: string,
  pdfBuffer?: Buffer,
): Promise<void> {
  try {
    const emailHtml = await render(
      InvoiceEmail({ clienteNombre, numeroFactura, total, fecha }),
    );

    const attachments = pdfBuffer
      ? [
          {
            filename: `factura-${numeroFactura}.pdf`,
            content: pdfBuffer,
          },
        ]
      : [];

    const emailPromise = resend.emails.send({
      from: "Facturación <onboarding@resend.dev>",
      to,
      subject: `Factura #${numeroFactura} - Ricuras del Huila`,
      html: emailHtml,
      attachments,
    });

    const { data, error } = await sendEmailWithTimeout(emailPromise, 15000); // 15s para facturas con PDF

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Error sending invoice: ${error.message}`);
    }

    console.log("✅ Factura enviada exitosamente:", data?.id);
  } catch (error) {
    console.error("Error enviando factura:", error);
    throw new Error("No se pudo enviar la factura");
  }
}

/**
 * Enviar notificación de cambio de contraseña
 */
export async function sendPasswordChangedEmail(
  to: string,
  nombre: string,
  ipAddress?: string,
): Promise<void> {
  try {
    const fecha = new Date().toLocaleString("es-CO", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "America/Bogota",
    });

    const emailHtml = await render(
      PasswordChangedEmail({ nombre, fecha, ipAddress }),
    );

    const emailPromise = resend.emails.send({
      from: "Seguridad - Ricuras del Huila <seguridad@resend.dev>",
      to,
      subject: "⚠️ Tu contraseña ha sido actualizada",
      html: emailHtml,
    });

    const { data, error } = await sendEmailWithTimeout(emailPromise);

    if (error) {
      console.error("Resend error:", error);
      // No lanzar error para no bloquear el cambio de contraseña
      return;
    }

    console.log("✅ Notificación de cambio de contraseña enviada:", data?.id);
  } catch (error) {
    console.error("Error enviando email de confirmación:", error);
    // No lanzar error para no bloquear el cambio de contraseña
  }
}