import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nombre = searchParams.get("nombre");
    const categoriaId = searchParams.get("categoriaId");
    const disponible = searchParams.get("disponible");

    const where: {
      nombre?: {
        contains: string;
        mode: "insensitive";
      };
      categoriaId?: string;
      disponible?: boolean;
    } = {};

    if (nombre) {
      where.nombre = {
        contains: nombre,
        mode: "insensitive",
      };
    }

    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    if (disponible !== null && disponible !== undefined) {
      where.disponible = disponible === "true";
    }

    const productos = await prisma.productos.findMany({
      where,
      include: {
        categoria: {
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
      costoProduccion,
      categoriaId,
      imagen,
      disponible,
      destacado,
    } = body;

    // Validaciones
    if (!nombre || !categoriaId) {
      return NextResponse.json(
        { message: "Nombre y categoría son requeridos" },
        { status: 400 },
      );
    }

    if (precio <= 0 || costoProduccion < 0) {
      return NextResponse.json(
        { message: "Precios inválidos" },
        { status: 400 },
      );
    }

    const producto = await prisma.productos.create({
      data: {
        nombre,
        descripcion,
        precio,
        costoProduccion,
        categoriaId,
        imagen,
        disponible: disponible ?? true,
        destacado: destacado ?? false,
      },
      include: {
        categoria: true,
      },
    });

    return NextResponse.json({
      success: true,
      producto,
      message: "Producto creado exitosamente",
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json(
      { message: "Error al crear producto" },
      { status: 500 },
    );
  }
}
