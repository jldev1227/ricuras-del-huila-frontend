import { render } from "@react-email/render";
import { Resend } from "resend";
import InvoiceEmail from "@/components/emails/InvoiceEmail";
import OTPEmail from "@/components/emails/OTPEmail";
import PasswordChangedEmail from "@/components/emails/PasswordChangeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(
  to: string,
  otp: string,
  nombre: string,
): Promise<void> {
  try {
    const emailHtml = await render(OTPEmail({ nombre, otp }));

    const { data, error } = await resend.emails.send({
      from: "Ricuras del Huila <onboarding@resend.dev>",
      to,
      subject: "Código de Recuperación de Contraseña",
      html: emailHtml,
    });

    if (error) {
      throw error;
    }

    console.log("Email enviado exitosamente:", data);
  } catch (error) {
    console.error("Error enviando email con Resend:", error);
    throw new Error("No se pudo enviar el código de verificación");
  }
}

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

    const { data, error } = await resend.emails.send({
      from: "Facturación <onboarding@resend.dev>",
      to,
      subject: `Factura #${numeroFactura} - Ricuras del Huila`,
      html: emailHtml,
      attachments,
    });

    if (error) {
      throw error;
    }

    console.log("Factura enviada exitosamente:", data);
  } catch (error) {
    console.error("Error enviando factura:", error);
    throw new Error("No se pudo enviar la factura");
  }
}

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

    const { data, error } = await resend.emails.send({
      from: "Seguridad - Ricuras del Huila <seguridad@resend.dev>",
      to,
      subject: "⚠️ Tu contraseña ha sido actualizada",
      html: emailHtml,
    });

    if (error) {
      throw error;
    }

    console.log("Email de confirmación enviado:", data);
  } catch (error) {
    console.error("Error enviando email de confirmación:", error);
    // No lanzar error para no bloquear el cambio de contraseña
  }
}
