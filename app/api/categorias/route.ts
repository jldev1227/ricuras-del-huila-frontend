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
