import { type NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
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

    // Obtener el producto actual para manejar cambio de imagen
    const productoActual = await prisma.productos.findUnique({
      where: { id },
    });

    if (!productoActual) {
      return NextResponse.json(
        { message: "Producto no encontrado" },
        { status: 404 },
      );
    }

    // Si hay una nueva imagen y es diferente a la actual, eliminar la imagen anterior
    if (productoActual.imagen && imagen && productoActual.imagen !== imagen) {
      try {
        const oldImagePath = join(process.cwd(), 'public', productoActual.imagen);
        if (existsSync(oldImagePath)) {
          await unlink(oldImagePath);
        }
      } catch (imageError) {
        console.error('Error al eliminar imagen anterior:', imageError);
        // No fallar la actualización si hay error al eliminar la imagen anterior
      }
    }

    const producto = await prisma.productos.update({
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

    // Obtener el producto para acceder a la imagen antes de eliminarlo
    const producto = await prisma.productos.findUnique({
      where: { id },
    });

    if (!producto) {
      return NextResponse.json(
        { message: "Producto no encontrado" },
        { status: 404 },
      );
    }

    // Eliminar el producto de la base de datos
    await prisma.productos.delete({
      where: { id },
    });

    // Si el producto tenía imagen, eliminarla del sistema de archivos
    if (producto.imagen) {
      try {
        const imagePath = join(process.cwd(), 'public', producto.imagen);
        if (existsSync(imagePath)) {
          await unlink(imagePath);
        }
      } catch (imageError) {
        console.error('Error al eliminar imagen del producto:', imageError);
        // No fallar la eliminación del producto si hay error al eliminar la imagen
      }
    }

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
