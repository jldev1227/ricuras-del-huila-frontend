import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const numero = searchParams.get("numero");
    const sucursalId = searchParams.get("sucursalId");
    const ubicacion = searchParams.get("ubicacion");
    const disponible = searchParams.get("disponible");

    // Construir filtros dinámicos
    const where: {
      numero?: number;
      sucursalId?: string;
      disponible?: boolean;
      ubicacion?: {
        contains: string;
        mode: "insensitive";
      };
    } = {};

    if (numero) {
      where.numero = parseInt(numero, 10);
    }

    if (sucursalId) {
      where.sucursalId = sucursalId;
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

    const mesas = await prisma.mesa.findMany({
      where,
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
        ordenes: {
          where: {
            estado: {
              in: ["PENDIENTE", "EN_PREPARACION", "LISTA"]
            }
          },
          include: {
            mesero: {
              select: {
                id: true,
                nombreCompleto: true,
              }
            },
            _count: {
              select: {
                items: true,
              }
            }
          },
          orderBy: {
            creadoEn: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            ordenes: true,
          },
        },
      },
      orderBy: [{ sucursalId: "asc" }, { numero: "asc" }],
    });

    // Transformar los datos para incluir ordenActual
    const mesasConOrdenActual = mesas.map(mesa => ({
      ...mesa,
      ordenActual: mesa.ordenes.length > 0 ? {
        id: mesa.ordenes[0].id,
        numeroOrden: mesa.ordenes[0].id.slice(-6), // Assuming numeroOrden is derived from id
        estado: mesa.ordenes[0].estado,
        total: mesa.ordenes[0].total,
        creadoEn: mesa.ordenes[0].creadoEn,
        meseroId: mesa.ordenes[0].meseroId,
        mesero: mesa.ordenes[0].mesero,
        _count: mesa.ordenes[0]._count
      } : null,
      ordenes: undefined, // Remove the ordenes array from response
      activa: mesa.disponible && mesa.ordenes.length === 0 // Mesa is active if available and no active orders
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
