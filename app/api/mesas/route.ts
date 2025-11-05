import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const numero = searchParams.get("numero");
    const sucursal_id = searchParams.get("sucursal_id");
    const ubicacion = searchParams.get("ubicacion");
    const disponible = searchParams.get("disponible");

    // Construir filtros dinámicos
    const where: {
      numero?: number;
      sucursal_id?: string;
      disponible?: boolean;
      ubicacion?: {
        contains: string;
        mode: "insensitive";
      };
    } = {};

    if (numero) {
      where.numero = parseInt(numero, 10);
    }

    if (sucursal_id) {
      where.sucursal_id = sucursal_id;
    }

    if (ubicacion) {
      where.ubicacion = {
        contains: ubicacion,
        mode: "insensitive",
      };
    }

    if (disponible !== null && disponible !== undefined) {
      where.disponible = disponible === "true";
    }

    const mesas = await prisma.mesas.findMany({
      where,
      include: {
        sucursales: true,
        ordenes: {
          where: {
            estado: {
              in: ["PENDIENTE", "EN_PREPARACION", "LISTA"], // Solo órdenes activas
            },
          },
          include: {
            usuarios: true,
            _count: {
              select: {
                orden_items: true,
              },
            },
          },
          orderBy: {
            creado_en: "desc", // Ordenar por más reciente
          },
          take: 1, // Solo tomar la más reciente
        },
      },
    });

    // Transformar los datos para incluir ordenActual
    const mesasConOrdenActual = mesas.map((mesa) => {
      const ordenActiva = mesa.ordenes.length > 0 ? mesa.ordenes[0] : null;
      
      return {
        ...mesa,
        ordenActual: ordenActiva
          ? {
              id: ordenActiva.id,
              numeroOrden: ordenActiva.id.slice(-6),
              estado: ordenActiva.estado,
              total: ordenActiva.total,
              subtotal: ordenActiva.subtotal,
              creadoEn: ordenActiva.creado_en,
              meseroId: ordenActiva.mesero_id,
              especificaciones: ordenActiva.especificaciones,
              mesero: ordenActiva.usuarios
                ? {
                    nombre_completo: ordenActiva.usuarios.nombre_completo,
                  }
                : null,
              _count: ordenActiva._count,
            }
          : null,
        ordenes: undefined, // Remove the ordenes array from response
        activa: true, // Las mesas siempre están activas (pueden recibir órdenes)
      };
    });

    return NextResponse.json({
      success: true,
      mesas: mesasConOrdenActual,
      total: mesasConOrdenActual.length,
    });
  } catch (error) {
    console.error("Error al obtener mesas:", error);
    return NextResponse.json(
      { message: "Error al obtener mesas" },
      { status: 500 },
    );
  }
}

// POST - Crear nueva mesa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numero, sucursal_id, ubicacion, notas, disponible } =
      body;

    // Validar datos requeridos
    if (!numero || !sucursal_id) {
      return NextResponse.json(
        { success: false, message: "Número y sucursal son requeridos" },
        { status: 400 },
      );
    }

    // Verificar que no exista otra mesa con el mismo número en la misma sucursal
    const mesaExistente = await prisma.mesas.findFirst({
      where: {
        numero: parseInt(numero, 10),
        sucursal_id: sucursal_id,
      },
    });

    if (mesaExistente) {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe una mesa con ese número en esta sucursal",
        },
        { status: 400 },
      );
    }

    // Crear la mesa
    const nuevaMesa = await prisma.mesas.create({
      data: {
        id: crypto.randomUUID(),
        numero: parseInt(numero, 10),
        sucursal_id,
        ubicacion: ubicacion || null,
        notas: notas || null,
        disponible: disponible !== false,
        actualizado_en: new Date(),
      },
      include: {
        sucursales: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Mesa creada exitosamente",
      mesa: nuevaMesa,
    });
  } catch (error) {
    console.error("Error al crear mesa:", error);
    return NextResponse.json(
      { success: false, message: "Error al crear mesa" },
      { status: 500 },
    );
  }
}
