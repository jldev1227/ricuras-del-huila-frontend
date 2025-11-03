import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const producto_id = searchParams.get("producto_id");
    const tipo_movimiento = searchParams.get("tipo_movimiento");
    const fecha_desde = searchParams.get("fecha_desde");
    const fecha_hasta = searchParams.get("fecha_hasta");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (producto_id) {
      where.producto_id = producto_id;
    }

    if (tipo_movimiento) {
      where.tipo_movimiento = tipo_movimiento;
    }

    if (fecha_desde || fecha_hasta) {
      where.creado_en = {};
      if (fecha_desde) {
        where.creado_en.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        where.creado_en.lte = new Date(fecha_hasta);
      }
    }

    const skip = (page - 1) * limit;

    const [movimientos, total] = await Promise.all([
      prisma.movimientos_stock.findMany({
        where,
        include: {
          productos: {
            select: {
              id: true,
              nombre: true,
              unidad_medida: true,
            },
          },
          usuario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
        },
        orderBy: { creado_en: "desc" },
        skip,
        take: limit,
      }),
      prisma.movimientos_stock.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      movimientos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener movimientos de stock:", error);
    return NextResponse.json(
      { message: "Error al obtener movimientos de stock" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      producto_id,
      tipo_movimiento,
      cantidad,
      motivo,
      referencia,
      creado_por,
    } = body;

    // Validaciones
    if (!producto_id || !tipo_movimiento || !cantidad) {
      return NextResponse.json(
        {
          success: false,
          message: "Producto, tipo de movimiento y cantidad son requeridos",
        },
        { status: 400 },
      );
    }

    if (!["entrada", "salida", "ajuste"].includes(tipo_movimiento)) {
      return NextResponse.json(
        {
          success: false,
          message: "Tipo de movimiento debe ser: entrada, salida o ajuste",
        },
        { status: 400 },
      );
    }

    if (cantidad <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "La cantidad debe ser mayor a 0",
        },
        { status: 400 },
      );
    }

    // Verificar que el producto existe
    const producto = await prisma.productos.findUnique({
      where: { id: producto_id },
    });

    if (!producto) {
      return NextResponse.json(
        {
          success: false,
          message: "El producto especificado no existe",
        },
        { status: 404 },
      );
    }

    // Calcular nuevo stock
    let nuevoStock = producto.stock_actual;
    
    if (tipo_movimiento === "entrada") {
      nuevoStock += cantidad;
    } else if (tipo_movimiento === "salida") {
      nuevoStock -= cantidad;
      
      // Validar que no quede en negativo
      if (nuevoStock < 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Stock insuficiente. Stock actual: ${producto.stock_actual}, cantidad solicitada: ${cantidad}`,
          },
          { status: 400 },
        );
      }
    } else if (tipo_movimiento === "ajuste") {
      nuevoStock = cantidad; // Para ajustes, la cantidad es el nuevo stock total
    }

    // Crear el movimiento y actualizar el producto en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear movimiento
      const movimiento = await tx.movimientos_stock.create({
        data: {
          id: crypto.randomUUID(),
          producto_id,
          tipo_movimiento,
          cantidad: tipo_movimiento === "ajuste" ? Math.abs(cantidad - producto.stock_actual) : cantidad,
          stock_anterior: producto.stock_actual,
          stock_nuevo: nuevoStock,
          motivo: motivo || `${tipo_movimiento.charAt(0).toUpperCase()}${tipo_movimiento.slice(1)} de stock`,
          referencia,
          creado_por,
          creado_en: new Date(),
        },
        include: {
          productos: {
            select: {
              id: true,
              nombre: true,
              unidad_medida: true,
            },
          },
          usuario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
        },
      });

      // Actualizar stock del producto
      const productoActualizado = await tx.productos.update({
        where: { id: producto_id },
        data: {
          stock_actual: nuevoStock,
          disponible: producto.controlar_stock ? nuevoStock > 0 : producto.disponible,
          actualizado_en: new Date(),
        },
      });

      return { movimiento, producto: productoActualizado };
    });

    return NextResponse.json({
      success: true,
      movimiento: resultado.movimiento,
      producto: resultado.producto,
      message: "Movimiento de stock creado exitosamente",
    });
  } catch (error) {
    console.error("Error al crear movimiento de stock:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor al crear el movimiento",
      },
      { status: 500 },
    );
  }
}