import { existsSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

/**
 * Procesa la imagen según el formato recibido:
 * - Si ya viene como ruta ("/productos/..."), la devuelve igual.
 * - Si viene en base64, la guarda con UUID en /public/productos/
 *   y devuelve la ruta con prefijo "/productos/".
 */
async function procesarImagen(imagen: string): Promise<string> {
  // 🟢 Caso 1: si ya es una ruta válida
  if (imagen.startsWith("/productos/")) {
    return imagen;
  }

  // 🟢 Caso 2: si viene en base64
  const matches = imagen.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Formato de imagen inválido");

  const ext = matches[1].split("/")[1]; // png, jpg, etc.
  const buffer = Buffer.from(matches[2], "base64");

  // Genera nombre único y ruta física
  const filename = `${uuidv4()}.${ext}`;
  const imagePath = join(process.cwd(), "public", "productos", filename);

  await writeFile(imagePath, buffer);

  // 🟢 Se guarda con prefijo para usar directamente en el frontend
  return `/productos/${filename}`;
}

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

    let nuevaImagen = productoActual.imagen;

    // 🧠 Solo procesar si hay imagen nueva
    if (imagen && imagen !== productoActual.imagen) {
      // Si había una imagen anterior, eliminarla
      if (productoActual.imagen?.startsWith("/productos/")) {
        const oldPath = join(
          process.cwd(),
          "public",
          productoActual.imagen.replace("/productos/", ""),
        );
        if (existsSync(oldPath)) {
          await unlink(oldPath).catch((err) =>
            console.warn("No se pudo eliminar la imagen anterior:", err),
          );
        }
      }

      // Procesar nueva imagen (ruta o base64)
      nuevaImagen = await procesarImagen(imagen);
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
        imagen: nuevaImagen, // ✅ ya tiene /productos/
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

    // Si el producto tenía imagen, eliminarla del sistema de archivos
    if (producto.imagen) {
      try {
        const imagePath = join(process.cwd(), "public", producto.imagen);
        if (existsSync(imagePath)) {
          await unlink(imagePath);
        }
      } catch (imageError) {
        console.error("Error al eliminar imagen del producto:", imageError);
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
