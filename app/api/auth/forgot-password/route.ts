import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { usuarios } from "@prisma/client";

// Configuración de timeouts
const QUERY_TIMEOUT = 5000; // 5 segundos
const EMAIL_TIMEOUT = 10000; // 10 segundos

export async function POST(request: NextRequest) {
  try {
    // 1. Validar body
    const body = await request.json();
    const { identificacion } = body;

    if (!identificacion || identificacion.length < 6) {
      return NextResponse.json(
        { message: "Identificación inválida" },
        { status: 400 },
      );
    }

    // 2. Buscar usuario con timeout
    const usuarioPromise = prisma.usuarios.findUnique({
      where: { identificacion: identificacion.trim() },
      select: {
        id: true,
        nombre_completo: true,
        identificacion: true,
        correo: true,
        activo: true,
      },
    });

    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("Database timeout")), QUERY_TIMEOUT)
    );

    let usuario: {
      id: string;
      nombre_completo: string;
      identificacion: string;
      correo: string | null;
      activo: boolean;
    } | null = null;
    try {
      usuario = await Promise.race([usuarioPromise, timeoutPromise]);
    } catch (error) {
      console.error("Error buscando usuario:", error);
      // Retornar error genérico
      return NextResponse.json(
        { message: "Error al procesar solicitud. Intenta de nuevo." },
        { status: 500 },
      );
    }

    // 3. Validar usuario (siempre retornar éxito por seguridad)
    if (!usuario || !usuario.activo || !usuario.correo) {
      // Simular procesamiento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return NextResponse.json({
        success: true,
        message: "Si la identificación está registrada, recibirás un código por correo",
      });
    }

    // 4. Generar OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // 5. Guardar OTP en base de datos con timeout
    try {
      await Promise.race([
        prisma.$transaction(
          async (tx) => {
            // Invalidar OTPs anteriores
            await tx.password_resets.updateMany({
              where: {
                usuario_id: usuario!.id,
                usado: false,
                expira_en: {
                  gte: new Date(),
                },
              },
              data: {
                usado: true,
              },
            });

            // Crear nuevo OTP
            await tx.password_resets.create({
              data: {
                id: crypto.randomUUID(),
                usuario_id: usuario!.id,
                otp,
                expira_en: expiraEn,
                usado: false,
              },
            });
          },
          {
            maxWait: 3000,
            timeout: 5000,
          }
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Transaction timeout")), QUERY_TIMEOUT)
        ),
      ]);
    } catch (error) {
      console.error("Error guardando OTP:", error);
      return NextResponse.json(
        { message: "Error al procesar solicitud. Intenta de nuevo." },
        { status: 500 },
      );
    }

    // 6. Enviar email con timeout
    try {
      const emailPromise = sendOTPEmail(usuario.correo, otp, usuario.nombre_completo);
      const emailTimeoutPromise = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Email timeout")), EMAIL_TIMEOUT)
      );

      await Promise.race([emailPromise, emailTimeoutPromise]);
    } catch (emailError) {
      console.error("Error enviando email:", emailError);
      
      // Invalidar el OTP que acabamos de crear
      await prisma.password_resets
        .updateMany({
          where: {
            usuario_id: usuario.id,
            otp,
            usado: false,
          },
          data: {
            usado: true,
          },
        })
        .catch((err) => console.error("Error invalidando OTP:", err));

      return NextResponse.json(
        { message: "Error al enviar el código. Intenta de nuevo más tarde." },
        { status: 500 },
      );
    }

    // 7. Éxito
    return NextResponse.json({
      success: true,
      message: "Si la identificación está registrada, recibirás un código por correo",
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json(
      { message: "Error al procesar solicitud" },
      { status: 500 },
    );
  } finally {
    // Desconectar Prisma en serverless
    if (process.env.VERCEL) {
      await prisma.$disconnect().catch(() => {
        // Ignorar errores al desconectar
      });
    }
  }
}