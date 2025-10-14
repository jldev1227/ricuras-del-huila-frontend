import bcrypt from "bcrypt";
import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { sendPasswordChangedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-in-production",
);

export async function POST(request: NextRequest) {
  try {
    const { resetToken, newPassword } = await request.json();

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { message: "Datos incompletos" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    // Verificar token
    let payload: { email?: string; exp?: number };
    try {
      const verified = await jwtVerify(resetToken, SECRET);
      payload = verified.payload;
    } catch (_error) {
      return NextResponse.json(
        { message: "Token inválido o expirado" },
        { status: 401 },
      );
    }

    const { userId } = payload as { userId: string };

    // Buscar usuario con correo
    const usuario = await prisma.usuarios.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre_completo: true,
        correo: true,
        activo: true,
      },
    });

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: { password: hashedPassword },
    });

    // Invalidar sesiones
    await prisma.sesiones.updateMany({
      where: { usuario_id: usuario.id },
      data: { activa: false },
    });

    // Marcar password resets como usados
    await prisma.password_resets.updateMany({
      where: { usuario_id: usuario.id },
      data: { usado: true },
    });

    // Obtener IP del usuario
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "Desconocida";

    // Enviar email de confirmación
    if (usuario.correo) {
      try {
        await sendPasswordChangedEmail(
          usuario.correo,
          usuario.nombre_completo,
          ipAddress,
        );
      } catch (emailError) {
        console.error("Error al enviar email de confirmación:", emailError);
        // Continuar aunque falle el email
      }
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    return NextResponse.json(
      { message: "Error al procesar solicitud" },
      { status: 500 },
    );
  }
}
