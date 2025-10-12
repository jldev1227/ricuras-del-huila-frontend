// app/api/usuarios/route.ts
import type { Prisma } from "@prisma/client";
import { roles } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filtros
    const rol = searchParams.get("rol");
    const activo = searchParams.get("activo");
    const sucursal_id = searchParams.get("sucursal_id");
    const search = searchParams.get("search");
    const excludeUserId = searchParams.get("excludeUserId"); // ID del usuario autenticado a excluir

    console.log(excludeUserId, "USUARIOO EXCLUIDO")
    // Construir filtros
    const where: Prisma.usuariosWhereInput = {};

    // ✅ Excluir al usuario autenticado de la lista
    if (excludeUserId) {
      where.NOT = { id: excludeUserId };
    }

    // ✅ FIX: Validar que rol sea un valor válido del enum
    if (rol && Object.values(roles).includes(rol as roles)) {
      where.rol = rol as roles;
    }

    // ✅ FIX: Verificar que activo no sea null antes de comparar
    if (activo !== null && activo !== undefined && activo !== "") {
      where.activo = activo === "true";
    }

    if (sucursal_id) {
      where.sucursal_id = sucursal_id;
    }

    if (search) {
      where.OR = [
        { nombre_completo: { contains: search, mode: "insensitive" } },
        { identificacion: { contains: search, mode: "insensitive" } },
        { correo: { contains: search, mode: "insensitive" } }, // Agregar búsqueda por correo
      ];
    }

    const usuarios = await prisma.usuarios.findMany({
      where,
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
      orderBy: {
        nombre_completo: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: usuarios, // Cambiar a 'data' para consistencia
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
      nombre_completo,
      identificacion,
      correo,
      telefono,
      password,
      rol = "MESERO",
      sucursalId,
    } = body;

    // Validaciones básicas
    if (!nombre_completo || !identificacion || !password || !sucursalId) {
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
    const sucursalExiste = await prisma.sucursales.findUnique({
      where: { id: sucursalId },
    });

    if (!sucursalExiste) {
      return NextResponse.json(
        { success: false, message: "La sucursal no existe" },
        { status: 400 },
      );
    }

    // Verificar si la identificación ya existe
    const usuarioExistente = await prisma.usuarios.findUnique({
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
      const correoExistente = await prisma.usuarios.findFirst({
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
    const hashedPassword = await bcrypt.hash(password, 12);

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        id: uuidv4(),
        nombre_completo,
        identificacion,
        correo,
        telefono,
        password: hashedPassword, // ✅ Usar password hasheado
        rol: rol as roles, // ✅ Cast explícito
        sucursal_id: sucursalId,
        creado_en: new Date(),
        actualizado_en: new Date(),
      },
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

// PUT - Actualizar usuario
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      nombre_completo, 
      identificacion, 
      correo, 
      telefono, 
      password,
      rol, 
      sucursal_id, 
      activo 
    } = body;

    // Validar datos requeridos (sin id en el body para update)
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID de usuario requerido" },
        { status: 400 },
      );
    }

    if (!nombre_completo || !identificacion || !correo || !rol) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { id },
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
        NOT: { id },
      },
    });

    if (identificacionDuplicada) {
      return NextResponse.json(
        { success: false, message: "La identificación ya está registrada" },
        { status: 400 },
      );
    }

    // Verificar que el correo no esté duplicado (excepto para el mismo usuario)
    const correoDuplicado = await prisma.usuarios.findFirst({
      where: {
        correo,
        NOT: { id },
      },
    });

    if (correoDuplicado) {
      return NextResponse.json(
        { success: false, message: "El correo ya está registrado" },
        { status: 400 },
      );
    }

    // Verificar rol válido
    if (!Object.values(roles).includes(rol)) {
      return NextResponse.json(
        { success: false, message: "Rol inválido" },
        { status: 400 },
      );
    }

    // Verificar que la sucursal existe si se proporciona
    if (sucursal_id) {
      const sucursalExiste = await prisma.sucursales.findUnique({
        where: { id: sucursal_id },
      });

      if (!sucursalExiste) {
        return NextResponse.json(
          { success: false, message: "Sucursal no encontrada" },
          { status: 400 },
        );
      }
    }

    // Preparar datos para actualizar
    const datosActualizacion: any = {
      nombre_completo,
      identificacion,
      correo,
      telefono,
      rol,
      sucursal_id,
      activo: activo !== undefined ? activo : true,
      actualizado_en: new Date(),
    };

    // Solo actualizar password si se proporciona uno nuevo
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 12);
      datosActualizacion.password = hashedPassword;
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuarios.update({
      where: { id },
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
        message: "Usuario actualizado exitosamente",
        data: usuarioActualizado,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar usuario" },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar usuario
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID de usuario requerido" },
        { status: 400 },
      );
    }

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { id },
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { success: false, message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Verificar si el usuario tiene órdenes asociadas
    const ordenesAsociadas = await prisma.ordenes.findFirst({
      where: { mesero_id: id },
    });

    if (ordenesAsociadas) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No se puede eliminar el usuario porque tiene órdenes asociadas. Desactívelo en su lugar." 
        },
        { status: 400 },
      );
    }

    // Eliminar usuario
    await prisma.usuarios.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Usuario eliminado exitosamente",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar usuario" },
      { status: 500 },
    );
  }
}
