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
          include: {
            usuarios: true,
            _count: {
              select: {
                orden_items: true,
              },
            },
          },
        },
      },
    });

    // Transformar los datos para incluir ordenActual
    const mesasConOrdenActual = mesas.map((mesa) => ({
      ...mesa,
      ordenActual:
        mesa.ordenes.length > 0
          ? {
              id: mesa.ordenes[0].id,
              numeroOrden: mesa.ordenes[0].id.slice(-6), // Assuming numeroOrden is derived from id
              estado: mesa.ordenes[0].estado,
              total: mesa.ordenes[0].total,
              creadoEn: mesa.ordenes[0].creado_en,
              meseroId: mesa.ordenes[0].mesero_id,
              mesero: mesa.ordenes[0].usuarios,
              _count: mesa.ordenes[0]._count,
            }
          : null,
      ordenes: undefined, // Remove the ordenes array from response
      activa: mesa.disponible && mesa.ordenes.length === 0, // Mesa is active if available and no active orders
    }));

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
    const { numero, capacidad, sucursal_id, ubicacion, notas, disponible } =
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
        capacidad: parseInt(capacidad, 10) || 4,
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
