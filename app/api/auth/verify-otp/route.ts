// app/api/auth/verify-otp/route.ts

import { SignJWT } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function POST(request: NextRequest) {
  try {
    const { identificacion, otp } = await request.json();

    // Buscar usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { identificacion },
      select: { id: true },
    });

    if (!usuario) {
      return NextResponse.json({ message: "Código inválido" }, { status: 401 });
    }

    // Buscar el OTP más reciente válido
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        usuarioId: usuario.id,
        otp,
        usado: false,
        expiraEn: {
          gt: new Date(), // Mayor que ahora (no expirado)
        },
      },
      orderBy: {
        creadoEn: "desc",
      },
    });

    // Validaciones
    if (!passwordReset) {
      // Incrementar intentos fallidos
      await prisma.passwordReset.updateMany({
        where: {
          usuarioId: usuario.id,
          usado: false,
        },
        data: {
          intentos: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        { message: "Código inválido o expirado" },
        { status: 401 },
      );
    }

    // Verificar intentos (máximo 3)
    if (passwordReset.intentos >= 3) {
      await prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { usado: true }, // Bloquear
      });

      return NextResponse.json(
        { message: "Demasiados intentos. Solicita un nuevo código" },
        { status: 429 },
      );
    }

    // Marcar como usado
    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { usado: true },
    });

    // Generar token de reset
    const resetToken = await new SignJWT({
      userId: usuario.id,
      identificacion,
      resetId: passwordReset.id,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("10m")
      .sign(SECRET);

    return NextResponse.json({
      success: true,
      resetToken,
    });
  } catch (error) {
    console.error("Error verificando OTP:", error);
    return NextResponse.json(
      { message: "Error al verificar código" },
      { status: 500 },
    );
  }
}
