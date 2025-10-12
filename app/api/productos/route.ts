import { type NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

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
      categoria_id?: string;
      disponible?: boolean;
    } = {};

    if (nombre) {
      where.nombre = {
        contains: nombre,
        mode: "insensitive",
      };
    }

    if (categoriaId) {
      where.categoria_id = categoriaId;
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
      categoriaId,
      imagen,
      disponible = true,
      destacado = false,
    } = body;

    // 🔍 Validaciones mejoradas
    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "El nombre del producto es requerido" 
        },
        { status: 400 }
      );
    }

    if (!categoriaId || typeof categoriaId !== "string") {
      return NextResponse.json(
        { 
          success: false,
          message: "La categoría es requerida" 
        },
        { status: 400 }
      );
    }

    if (!precio || precio <= 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "El precio debe ser mayor a 0" 
        },
        { status: 400 }
      );
    }

    if (costo_produccion < 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "El costo de producción no puede ser negativo" 
        },
        { status: 400 }
      );
    }

    // 🔍 Verificar que la categoría existe
    const categoriaExiste = await prisma.categorias.findUnique({
      where: { id: categoriaId }
    });

    if (!categoriaExiste) {
      return NextResponse.json(
        { 
          success: false,
          message: "La categoría especificada no existe" 
        },
        { status: 404 }
      );
    }

    // 🔍 Verificar si ya existe un producto con el mismo nombre
    const productoExistente = await prisma.productos.findFirst({
      where: { 
        nombre: nombre.trim(),
        disponible: true 
      }
    });

    if (productoExistente) {
      return NextResponse.json(
        { 
          success: false,
          message: "Ya existe un producto con este nombre" 
        },
        { status: 409 }
      );
    }

    // 🖼️ Procesar imagen si se proporciona
    let imagenProcesada = null;
    if (imagen && imagen.trim() !== "") {
      try {
        imagenProcesada = await procesarImagen(imagen);
      } catch (error) {
        return NextResponse.json(
          { 
            success: false,
            message: "Error al procesar la imagen. Verifica que sea un formato válido." 
          },
          { status: 400 }
        );
      }
    }

    // 💾 Crear el producto
    const producto = await prisma.productos.create({
      data: {
        id: uuidv4(),
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        precio,
        costo_produccion,
        categoria_id: categoriaId,
        imagen: imagenProcesada,
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
            message: "La categoría especificada no es válida" 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        message: "Error interno del servidor al crear el producto" 
      },
      { status: 500 }
    );
  }
}
