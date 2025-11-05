import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    const { params } = await context;
    const mesaId = params.id;
    const body = await request.json();
    const { meseroId } = body;

    if (!mesaId || !meseroId) {
      return NextResponse.json(
        {
          success: false,
          message: "Mesa ID y Mesero ID son requeridos",
        },
        { status: 400 },
      );
    }

    // Verificar que la mesa existe y obtener la orden activa
    const mesa = await prisma.mesas.findUnique({
      where: { id: mesaId },
      include: {
        ordenes: {
          where: {
            estado: {
              in: ["PENDIENTE", "EN_PREPARACION", "LISTA"],
            },
          },
          include: {
            usuarios: true,
          },
          orderBy: {
            creado_en: "desc",
          },
          take: 1,
        },
      },
    });

    if (!mesa) {
      return NextResponse.json(
        {
          success: false,
          message: "Mesa no encontrada",
        },
        { status: 404 },
      );
    }

    // Verificar que la mesa tiene una orden activa
    const ordenActiva = mesa.ordenes[0];
    if (!ordenActiva) {
      return NextResponse.json(
        {
          success: false,
          message: "La mesa no tiene una orden activa",
        },
        { status: 400 },
      );
    }

    // Verificar que el mesero que intenta liberar la mesa es el mismo que la tiene asignada
    if (ordenActiva.mesero_id !== meseroId) {
      return NextResponse.json(
        {
          success: false,
          message: "Solo el mesero asignado puede liberar esta mesa",
        },
        { status: 403 },
      );
    }

    // Al liberar la mesa, automáticamente marcar la orden como ENTREGADA y liberar la mesa
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar el estado de la orden a ENTREGADA
      await tx.ordenes.update({
        where: { id: ordenActiva.id },
        data: {
          estado: "ENTREGADA",
          actualizado_en: new Date(),
          actualizado_por: meseroId,
        },
      });

      // 2. Liberar la mesa
      await tx.mesas.update({
        where: { id: mesaId },
        data: {
          disponible: true,
          actualizado_en: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Mesa liberada y orden entregada exitosamente",
    });
  } catch (error) {
    console.error("Error al liberar mesa:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}
