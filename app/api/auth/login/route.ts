// app/api/auth/login/route.ts

import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-in-production",
);

export async function POST(request: NextRequest) {
  try {
    const { identificacion, password } = await request.json();

    // Validar campos
    if (!identificacion || !password) {
      return NextResponse.json(
        { message: "Identificación y contraseña son requeridos" },
        { status: 400 },
      );
    }

    // Buscar usuario en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { identificacion },
      select: {
        id: true,
        nombreCompleto: true,
        identificacion: true,
        correo: true,
        telefono: true,
        password: true,
        rol: true,
        activo: true,
      },
    });

    // Verificar si el usuario existe
    if (!usuario) {
      return NextResponse.json(
        { message: "Identificación o contraseña incorrecta" },
        { status: 401 },
      );
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return NextResponse.json(
        { message: "Usuario inactivo. Contacte al administrador" },
        { status: 403 },
      );
    }

    // Verificar contraseña
    const esPasswordValido = await bcrypt.compare(password, usuario.password);

    if (!esPasswordValido) {
      return NextResponse.json(
        { message: "Identificación o contraseña incorrecta" },
        { status: 401 },
      );
    }

    // Generar token JWT (válido por 24 horas)
    const token = await new SignJWT({
      userId: usuario.id,
      rol: usuario.rol,
      identificacion: usuario.identificacion,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(SECRET);

    // Generar refresh token (válido por 7 días)
    const refreshToken = await new SignJWT({
      userId: usuario.id,
      type: "refresh",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET);

    // Guardar sesión en la base de datos
    const expiraEn = new Date();
    expiraEn.setHours(expiraEn.getHours() + 24);

    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "unknown";

    await prisma.sesion.create({
      data: {
        usuarioId: usuario.id,
        token,
        refreshToken,
        expiraEn,
        dispositivoId: request.headers.get("x-device-id") || undefined,
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    // Actualizar última conexión
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimaConexion: new Date() },
    });

    // Respuesta exitosa (sin password)
    const { password: _, ...usuarioSinPassword } = usuario;

    return NextResponse.json({
      success: true,
      user: usuarioSinPassword,
      token,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 horas en segundos
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
