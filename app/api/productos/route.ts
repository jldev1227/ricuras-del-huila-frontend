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
      stock_actual = 0,
      stock_minimo = 0,
      stock_maximo,
      unidad_medida = "unidad",
      controlar_stock = false,
    } = body;

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

    // 🔍 Validaciones de stock
    if (controlar_stock && stock_actual < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "El stock actual no puede ser negativo",
        },
        { status: 400 },
      );
    }

    if (controlar_stock && stock_minimo < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "El stock mínimo no puede ser negativo",
        },
        { status: 400 },
      );
    }

    if (controlar_stock && stock_maximo !== null && stock_maximo !== undefined && stock_maximo < stock_minimo) {
      return NextResponse.json(
        {
          success: false,
          message: "El stock máximo debe ser mayor o igual al stock mínimo",
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

    // � Determinar disponibilidad automática si se controla stock
    const disponibilidadFinal = controlar_stock ? stock_actual > 0 : disponible;

    const productoId = uuidv4();

    // �💾 Crear el producto
    const producto = await prisma.productos.create({
      data: {
        id: productoId,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        precio,
        costo_produccion,
        categoria_id: categoria_id,
        imagen,
        disponible: Boolean(disponibilidadFinal),
        destacado: Boolean(destacado),
        stock_actual: Number(stock_actual),
        stock_minimo: Number(stock_minimo),
        stock_maximo: stock_maximo ? Number(stock_maximo) : null,
        unidad_medida: unidad_medida.trim(),
        controlar_stock: Boolean(controlar_stock),
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

    // 📝 Crear movimiento de stock inicial si se controla stock y hay stock inicial
    if (controlar_stock && stock_actual > 0) {
      await prisma.movimientos_stock.create({
        data: {
          id: uuidv4(),
          producto_id: productoId,
          tipo_movimiento: "entrada",
          cantidad: stock_actual,
          stock_anterior: 0,
          stock_nuevo: stock_actual,
          motivo: "Stock inicial del producto",
          referencia: `PRODUCTO_CREADO_${productoId}`,
          creado_en: new Date(),
        },
      });
    }

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
