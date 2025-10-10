import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        precio,
        costoProduccion,
        categoriaId,
        imagen,
        disponible,
        destacado,
      },
      include: {
        categoria: true,
      },
    });

    return NextResponse.json({
      success: true,
      producto,
      message: "Producto actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json(
      { message: "Error al actualizar producto" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.producto.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Producto eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json(
      { message: "Error al eliminar producto" },
      { status: 500 },
    );
  }
}
