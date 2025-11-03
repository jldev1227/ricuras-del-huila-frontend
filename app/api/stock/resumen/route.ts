import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoria_id = searchParams.get("categoria_id");
    const stock_bajo = searchParams.get("stock_bajo"); // "true" para mostrar solo productos con stock bajo

    const where: any = {
      controlar_stock: true, // Solo productos que controlan stock
    };

    if (categoria_id) {
      where.categoria_id = categoria_id;
    }

    const productos = await prisma.productos.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        stock_actual: true,
        stock_minimo: true,
        stock_maximo: true,
        unidad_medida: true,
        disponible: true,
        controlar_stock: true,
        categorias: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: [
        { stock_actual: "asc" }, // Mostrar primero los de menor stock
        { nombre: "asc" },
      ],
    });

    // Calcular alertas y estados
    const productosConEstado = productos
      .map((producto) => {
        const stockBajo = producto.stock_actual <= producto.stock_minimo;
        const sinStock = producto.stock_actual === 0;
        
        let estado: "sin_stock" | "stock_bajo" | "stock_normal" | "stock_alto" = "stock_normal";
        
        if (sinStock) {
          estado = "sin_stock";
        } else if (stockBajo) {
          estado = "stock_bajo";
        } else if (producto.stock_maximo && producto.stock_actual >= producto.stock_maximo) {
          estado = "stock_alto";
        }

        return {
          ...producto,
          estado,
          porcentaje_stock: producto.stock_maximo 
            ? Math.round((producto.stock_actual / producto.stock_maximo) * 100)
            : null,
        };
      })
      .filter((producto) => {
        if (stock_bajo === "true") {
          return producto.estado === "sin_stock" || producto.estado === "stock_bajo";
        }
        return true;
      });

    // Estadísticas generales
    const estadisticas = {
      total_productos: productosConEstado.length,
      sin_stock: productosConEstado.filter(p => p.estado === "sin_stock").length,
      stock_bajo: productosConEstado.filter(p => p.estado === "stock_bajo").length,
      stock_normal: productosConEstado.filter(p => p.estado === "stock_normal").length,
      stock_alto: productosConEstado.filter(p => p.estado === "stock_alto").length,
    };

    return NextResponse.json({
      success: true,
      productos: productosConEstado,
      estadisticas,
    });
  } catch (error) {
    console.error("Error al obtener resumen de stock:", error);
    return NextResponse.json(
      { message: "Error al obtener resumen de stock" },
      { status: 500 },
    );
  }
}