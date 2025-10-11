import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const mesa = await prisma.mesa.findUnique({
      where: { id },
      include: {
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
                correo: true
              }
            },
            items: {
              include: {
                producto: {
                  select: {
                    id: true,
                    nombre: true,
                    precio: true,
                    imagen: true
                  }
                }
              }
            }
          },
          orderBy: {
            creadoEn: "desc"
          },
          take: 1
        }
      }
    });

    if (!mesa) {
      return NextResponse.json(
        { success: false, error: "Mesa no encontrada" },
        { status: 404 }
      );
    }

    // Agregar información de orden actual si existe
    const mesaConOrden = {
      ...mesa,
      ordenActual: mesa.ordenes.length > 0 ? mesa.ordenes[0] : null
    };

    // Remover el array de ordenes ya que tenemos ordenActual
    const { ordenes, ...mesaFinal } = mesaConOrden;

    return NextResponse.json({
      success: true,
      mesa: mesaFinal
    });
  } catch (error) {
    console.error("Error al obtener mesa:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}