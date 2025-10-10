// app/api/usuarios/route.ts
import type { Prisma, Rol } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filtros
    const rol = searchParams.get("rol");
    const activo = searchParams.get("activo");
    const sucursalId = searchParams.get("sucursalId");
    const search = searchParams.get("search");

    // Construir filtros
    const where: Prisma.UsuarioWhereInput = {};

    // ✅ FIX: Validar que rol sea un valor válido del enum
    if (rol && (rol === "ADMINISTRADOR" || rol === "MESERO")) {
      where.rol = rol as Rol;
    }

    // ✅ FIX: Verificar que activo no sea null antes de comparar
    if (activo !== null && activo !== undefined) {
      where.activo = activo === "true";
    }

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    if (search) {
      where.OR = [
        { nombreCompleto: { contains: search, mode: "insensitive" } },
        { identificacion: { contains: search, mode: "insensitive" } },
      ];
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombreCompleto: true,
        identificacion: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        nombreCompleto: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      usuarios,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener usuarios" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombreCompleto,
      identificacion,
      correo,
      telefono,
      password,
      rol = "MESERO",
      sucursalId,
    } = body;

    // Validaciones básicas
    if (!nombreCompleto || !identificacion || !password || !sucursalId) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // ✅ Validar que el rol sea válido
    if (rol !== "ADMINISTRADOR" && rol !== "MESERO") {
      return NextResponse.json(
        { success: false, message: "Rol inválido" },
        { status: 400 },
      );
    }

    // ✅ Verificar que la sucursal exista
    const sucursalExiste = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
    });

    if (!sucursalExiste) {
      return NextResponse.json(
        { success: false, message: "La sucursal no existe" },
        { status: 400 },
      );
    }

    // Verificar si la identificación ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { identificacion },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe un usuario con esta identificación",
        },
        { status: 400 },
      );
    }

    // ✅ Verificar si el correo ya existe (si se proporciona)
    if (correo) {
      const correoExistente = await prisma.usuario.findUnique({
        where: { correo },
      });

      if (correoExistente) {
        return NextResponse.json(
          {
            success: false,
            message: "Ya existe un usuario con este correo",
          },
          { status: 400 },
        );
      }
    }

    // ✅ Hash de contraseña con bcrypt
    const hashedPassword = await hashPassword(password);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombreCompleto,
        identificacion,
        correo,
        telefono,
        password: hashedPassword, // ✅ Usar password hasheado
        rol: rol as Rol, // ✅ Cast explícito
        sucursalId,
      },
      select: {
        id: true,
        nombreCompleto: true,
        identificacion: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        sucursal: {
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
        message: "Usuario creado exitosamente",
        usuario: nuevoUsuario,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { success: false, message: "Error al crear usuario" },
      { status: 500 },
    );
  }
}
