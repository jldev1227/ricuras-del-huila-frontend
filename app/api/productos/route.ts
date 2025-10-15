import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nombre = searchParams.get("nombre");
    const categoria_id = searchParams.get("categoria_id");
    const disponible = searchParams.get("disponible");

    const where: {
      nombre?: {
        contains: string;
        mode: "insensitive";
      };
      categoria_id?: string;
      disponible?: boolean;
    } = {};

    if (nombre) {
      where.nombre = {
        contains: nombre,
        mode: "insensitive",
      };
    }

    if (categoria_id) {
      where.categoria_id = categoria_id;
    }

    if (disponible !== null && disponible !== undefined) {
      where.disponible = disponible === "true";
    }

    const productos = await prisma.productos.findMany({
      where,
      include: {
        categorias: {
          select: {
            id: true,
            nombre: true,
            icono: true,
          },
        },
      },
      orderBy: [{ destacado: "desc" }, { nombre: "asc" }],
    });

    return NextResponse.json({
      success: true,
      productos,
      total: productos.length,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { message: "Error al obtener productos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      descripcion,
      precio,
      costo_produccion,
      categoria_id,
      imagen,
      disponible = true,
      destacado = false,
    } = body;


    console.log(imagen, "Imagen dele body")

    // 🔍 Validaciones mejoradas
    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "El nombre del producto es requerido",
        },
        { status: 400 },
      );
    }

    if (!categoria_id || typeof categoria_id !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "La categoría es requerida",
        },
        { status: 400 },
      );
    }

    if (!precio || precio <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "El precio debe ser mayor a 0",
        },
        { status: 400 },
      );
    }

    if (costo_produccion < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "El costo de producción no puede ser negativo",
        },
        { status: 400 },
      );
    }

    // 🔍 Verificar que la categoría existe
    const categoriaExiste = await prisma.categorias.findUnique({
      where: { id: categoria_id },
    });

    if (!categoriaExiste) {
      return NextResponse.json(
        {
          success: false,
          message: "La categoría especificada no existe",
        },
        { status: 404 },
      );
    }

    // 🔍 Verificar si ya existe un producto con el mismo nombre
    const productoExistente = await prisma.productos.findFirst({
      where: {
        nombre: nombre.trim(),
        disponible: true,
      },
    });

    if (productoExistente) {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe un producto con este nombre",
        },
        { status: 409 },
      );
    }

    // 💾 Crear el producto
    const producto = await prisma.productos.create({
      data: {
        id: uuidv4(),
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        precio,
        costo_produccion,
        categoria_id: categoria_id,
        imagen,
        disponible: Boolean(disponible),
        destacado: Boolean(destacado),
        creado_en: new Date(),
        actualizado_en: new Date(),
      },
      include: {
        categorias: {
          select: {
            id: true,
            nombre: true,
            icono: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      producto,
      message: "Producto creado exitosamente",
    });
  } catch (error) {
    console.error("Error al crear producto:", error);

    // Manejo específico de errores de Prisma
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          {
            success: false,
            message: "La categoría especificada no es válida",
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor al crear el producto",
      },
      { status: 500 },
    );
  }
}
