import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteProductImage } from "@/lib/supabase";


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
      costo_produccion,
      categoria_id,
      imagen,
      disponible,
      destacado,
    } = body;

    if (!nombre || !categoria_id) {
      return NextResponse.json(
        { message: "Nombre y categoría son requeridos" },
        { status: 400 },
      );
    }

    const productoActual = await prisma.productos.findUnique({ where: { id } });
    if (!productoActual) {
      return NextResponse.json(
        { message: "Producto no encontrado" },
        { status: 404 },
      );
    }

    // Actualizar en la base de datos
    const producto = await prisma.productos.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        precio,
        costo_produccion: costo_produccion,
        categoria_id: categoria_id,
        imagen, // ✅ ya tiene /productos/
        disponible,
        destacado,
        actualizado_en: new Date(),
      },
      include: { categorias: true },
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

    // Si el producto tenía imagen, eliminarla de Supabase Storage
    if (producto.imagen) {
      try {
        await deleteProductImage(producto.imagen);
      } catch (imageError) {
        console.error("Error al eliminar imagen del producto:", imageError);
        // No fallar la eliminación del producto si hay error al eliminar la imagen
      }
    }

    return NextResponse.json({
      success: true,
      message: "Producto eliminado exitosamente",
    });
  } catch (error: unknown) {
    console.error("Error al eliminar producto:", error);
    
    // Type guard para errores de Prisma
    const prismaError = error as { code?: string; message?: string };
    
    // Manejar específicamente el error de constraint violation (órdenes relacionadas)
    if (prismaError?.code === "P2011" || prismaError?.message?.includes("Null constraint violation")) {
      return NextResponse.json(
        { 
          message: "No se puede eliminar este producto porque tiene órdenes relacionadas. Para eliminarlo, primero debe eliminar todas las órdenes que incluyen este producto.",
          error: "CONSTRAINT_VIOLATION",
          details: "Este producto está siendo utilizado en órdenes existentes"
        },
        { status: 400 }
      );
    }

    // Otros errores de Prisma
    if (prismaError?.code) {
      return NextResponse.json(
        { 
          message: "Error de base de datos al eliminar el producto",
          error: "DATABASE_ERROR" 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "Error interno del servidor al eliminar producto",
        error: "INTERNAL_ERROR" 
      },
      { status: 500 }
    );
  }
}
