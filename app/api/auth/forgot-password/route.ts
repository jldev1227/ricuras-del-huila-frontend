import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const _SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-in-production",
);

export async function POST(request: NextRequest) {
  try {
    const { identificacion } = await request.json();

    // Validar identificación
    if (!identificacion || identificacion.length < 6) {
      return NextResponse.json(
        { message: "Identificación inválida" },
        { status: 400 },
      );
    }

    // Buscar usuario por identificación
    const usuario = await prisma.usuarios.findUnique({
      where: { identificacion: identificacion.trim() },
      select: {
        id: true,
        nombre_completo: true,
        identificacion: true,
        correo: true,
        telefono: true,
        activo: true,
      },
    });

    // Por seguridad, siempre retornar éxito (no revelar si la identificación existe)
    if (!usuario || !usuario.activo) {
      // Simular procesamiento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return NextResponse.json({
        success: true,
        message:
          "Si la identificación está registrada, recibirás las instrucciones",
      });
    }

    // Verificar que el usuario tenga correo registrado
    if (!usuario.correo) {
      console.warn(`Usuario ${usuario.identificacion} sin correo registrado`);
      // Aún así retornar éxito por seguridad
      return NextResponse.json({
        success: true,
        message:
          "Si la identificación está registrada, recibirás las instrucciones",
      });
    }

    // Generar código OTP de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidar OTPs anteriores del usuario
    await prisma.password_resets.updateMany({
      where: {
        usuario_id: usuario.id,
        usado: false,
      },
      data: {
        usado: true, // Marcar como usados
      },
    });

    // Crear nuevo registro de OTP
    await prisma.password_resets.create({
      data: {
        id: crypto.randomUUID(),
        usuario_id: usuario.id,
        otp,
        expira_en: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      },
    });

    // Enviar OTP por email
    try {
      await sendOTPEmail(usuario.correo, otp, usuario.nombre_completo);

      console.log("========================================");
      console.log("EMAIL ENVIADO EXITOSAMENTE");
      console.log("========================================");
      console.log("Usuario:", usuario.nombre_completo);
      console.log("Correo:", usuario.correo);
      console.log("Código OTP:", otp);
      console.log("Expira en: 10 minutos");
      console.log("========================================");
    } catch (emailError) {
      console.error("Error al enviar email:", emailError);

      // Log de respaldo en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.log("========================================");
        console.log("CÓDIGO OTP (EMAIL FALLÓ)");
        console.log("========================================");
        console.log("OTP:", otp);
        console.log("========================================");
      }

      // Retornar error si el email falla
      return NextResponse.json(
        { message: "Error al enviar el código. Intenta de nuevo." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Si la identificación está registrada, recibirás las instrucciones",
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json(
      { message: "Error al procesar solicitud" },
      { status: 500 },
    );
  }
}
