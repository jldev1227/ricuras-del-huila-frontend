// app/api/usuarios/profile/route.ts

import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener perfil del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    console.log(userId, "Usuario");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ID de usuario requerido" },
        { status: 400 },
      );
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre_completo: true,
        identificacion: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        sucursales: {
          select: {
            id: true,
            nombre: true,
          },
        },
        creado_en: true,
        actualizado_en: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener perfil" },
      { status: 500 },
    );
  }
}

// PUT - Actualizar perfil del usuario autenticado
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      nombre_completo,
      identificacion,
      correo,
      telefono,
      password,
    } = body;

    // Validar datos requeridos
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ID de usuario requerido" },
        { status: 400 },
      );
    }

    if (!nombre_completo || !identificacion) {
      return NextResponse.json(
        {
          success: false,
          message: "Nombre completo e identificación son requeridos",
        },
        { status: 400 },
      );
    }

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { id: userId },
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Verificar que la identificación no esté duplicada (excepto para el mismo usuario)
    const identificacionDuplicada = await prisma.usuarios.findFirst({
      where: {
        identificacion,
        NOT: { id: userId },
      },
    });

    if (identificacionDuplicada) {
      return NextResponse.json(
        { success: false, message: "La identificación ya está registrada" },
        { status: 400 },
      );
    }

    // Verificar que el correo no esté duplicado (excepto para el mismo usuario)
    if (correo) {
      const correoDuplicado = await prisma.usuarios.findFirst({
        where: {
          correo,
          NOT: { id: userId },
        },
      });

      if (correoDuplicado) {
        return NextResponse.json(
          { success: false, message: "El correo ya está registrado" },
          { status: 400 },
        );
      }
    }

    // Preparar datos para actualizar (sin rol)
    const datosActualizacion: Prisma.usuariosUncheckedUpdateInput = {
      nombre_completo,
      identificacion,
      correo: correo || null,
      telefono: telefono || null,
      actualizado_en: new Date(),
    };

    // Solo actualizar password si se proporciona uno nuevo
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 12);
      datosActualizacion.password = hashedPassword;
    }

    // Actualizar usuario (manteniendo el rol)
    const usuarioActualizado = await prisma.usuarios.update({
      where: { id: userId },
      data: datosActualizacion,
      select: {
        id: true,
        nombre_completo: true,
        identificacion: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        creado_en: true,
        actualizado_en: true,
        sucursales: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Perfil actualizado exitosamente",
        data: usuarioActualizado,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar perfil" },
      { status: 500 },
    );
  }
}
