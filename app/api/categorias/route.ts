import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categorias = await prisma.categorias.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        icono: true,
        orden: true,
        activo: true,
        creado_en: true,
        _count: {
          select: {
            productos: true,
          },
        },
      },
      orderBy: { orden: "asc" },
    });

    return NextResponse.json({
      success: true,
      categorias,
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json(
      { message: "Error al obtener categorías" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, icono, orden } = body;

    // Validaciones básicas
    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "El nombre de la categoría es requerido",
        },
        { status: 400 },
      );
    }

    if (nombre.trim().length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "El nombre de la categoría no puede exceder 100 caracteres",
        },
        { status: 400 },
      );
    }

    // Verificar si ya existe una categoría con el mismo nombre
    const categoriaExistente = await prisma.categorias.findFirst({
      where: {
        nombre: nombre.trim(),
        activo: true,
      },
    });

    if (categoriaExistente) {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe una categoría con este nombre",
        },
        { status: 409 },
      );
    }

    // Obtener el siguiente orden si no se proporciona
    let ordenFinal = orden;
    if (!ordenFinal || typeof ordenFinal !== "number") {
      const ultimaCategoria = await prisma.categorias.findFirst({
        orderBy: { orden: "desc" },
        select: { orden: true },
      });
      ordenFinal = ultimaCategoria ? ultimaCategoria.orden + 1 : 1;
    }

    // Crear la nueva categoría
    const nuevaCategoria = await prisma.categorias.create({
      data: {
        id: uuidv4(),
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        icono: icono?.trim() || null,
        orden: ordenFinal,
        activo: true,
        creado_en: new Date(),
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        icono: true,
        orden: true,
        activo: true,
        creado_en: true,
        _count: {
          select: {
            productos: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Categoría creada exitosamente",
      categoria: nuevaCategoria,
    });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor al crear la categoría",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nombre, descripcion, icono, orden, activo } = body;

    // Validar que se proporcione el ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "El ID de la categoría es requerido",
        },
        { status: 400 },
      );
    }

    // Verificar que la categoría existe
    const categoriaExistente = await prisma.categorias.findUnique({
      where: { id },
    });

    if (!categoriaExistente) {
      return NextResponse.json(
        {
          success: false,
          message: "Categoría no encontrada",
        },
        { status: 404 },
      );
    }

    // Validar el nombre si se proporciona
    if (nombre !== undefined) {
      if (typeof nombre !== "string" || nombre.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "El nombre de la categoría no puede estar vacío",
          },
          { status: 400 },
        );
      }

      if (nombre.trim().length > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "El nombre de la categoría no puede exceder 100 caracteres",
          },
          { status: 400 },
        );
      }

      // Verificar si ya existe otra categoría con el mismo nombre
      const categoriaConMismoNombre = await prisma.categorias.findFirst({
        where: {
          nombre: nombre.trim(),
          activo: true,
          id: { not: id }, // Excluir la categoría actual
        },
      });

      if (categoriaConMismoNombre) {
        return NextResponse.json(
          {
            success: false,
            message: "Ya existe otra categoría con este nombre",
          },
          { status: 409 },
        );
      }
    }

    // Validar el orden si se proporciona
    if (orden !== undefined && typeof orden !== "number") {
      return NextResponse.json(
        {
          success: false,
          message: "El orden debe ser un número",
        },
        { status: 400 },
      );
    }

    // Construir el objeto de actualización solo con los campos proporcionados
    const dataToUpdate: any = {};

    if (nombre !== undefined) dataToUpdate.nombre = nombre.trim();
    if (descripcion !== undefined) dataToUpdate.descripcion = descripcion?.trim() || null;
    if (icono !== undefined) dataToUpdate.icono = icono?.trim() || null;
    if (orden !== undefined) dataToUpdate.orden = orden;
    if (activo !== undefined) dataToUpdate.activo = activo;

    // Actualizar la categoría
    const categoriaActualizada = await prisma.categorias.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        icono: true,
        orden: true,
        activo: true,
        creado_en: true,
        _count: {
          select: {
            productos: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Categoría actualizada exitosamente",
      categoria: categoriaActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor al actualizar la categoría",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Obtener el ID desde los query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Validar que se proporcione el ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "El ID de la categoría es requerido",
        },
        { status: 400 },
      );
    }

    // Verificar que la categoría existe
    const categoriaExistente = await prisma.categorias.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productos: true,
          },
        },
      },
    });

    if (!categoriaExistente) {
      return NextResponse.json(
        {
          success: false,
          message: "Categoría no encontrada",
        },
        { status: 404 },
      );
    }

    // Verificar si la categoría tiene productos asociados
    if (categoriaExistente._count.productos > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No se puede eliminar la categoría porque tiene ${categoriaExistente._count.productos} producto(s) asociado(s)`,
        },
        { status: 409 },
      );
    }

    // Eliminar la categoría (soft delete - cambiar activo a false)
    await prisma.categorias.update({
      where: { id },
      data: { activo: false },
    });

    // Si prefieres eliminación física (hard delete), usa:
    // await prisma.categorias.delete({
    //   where: { id },
    // });

    return NextResponse.json({
      success: true,
      message: "Categoría eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor al eliminar la categoría",
      },
      { status: 500 },
    );
  }
}