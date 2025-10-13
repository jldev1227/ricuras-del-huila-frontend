import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const mesa = await prisma.mesas.findUnique({
      where: { id },
      include: {
        sucursales: true,
        ordenes: {
          where: {
            estado: {
              in: ["PENDIENTE", "EN_PREPARACION", "LISTA"],
            },
          },
          include: {
            usuarios: {
              select: {
                id: true,
                nombre_completo: true,
                correo: true,
              },
            },
            orden_items: {
              include: {
                productos: {
                  select: {
                    id: true,
                    nombre: true,
                    precio: true,
                    imagen: true,
                  },
                },
              },
            },
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
        { success: false, error: "Mesa no encontrada" },
        { status: 404 },
      );
    }

    // Agregar información de orden actual si existe
    const mesaFinal = {
      ...mesa,
      ordenActual: mesa.ordenes.length > 0 ? mesa.ordenes[0] : null,
      ordenes: undefined, // Remove ordenes array from response
    };

    return NextResponse.json({
      success: true,
      mesa: mesaFinal,
    });
  } catch (error) {
    console.error("Error al obtener mesa:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// PUT - Actualizar mesa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { numero, capacidad, sucursalId, ubicacion, notas, disponible } =
      body;

    // Validar que la mesa exista
    const mesaExistente = await prisma.mesas.findUnique({
      where: { id },
    });

    if (!mesaExistente) {
      return NextResponse.json(
        { success: false, message: "Mesa no encontrada" },
        { status: 404 },
      );
    }

    // Si se está cambiando el número, verificar que no exista otra mesa con el mismo número en la misma sucursal
    if (numero && numero !== mesaExistente.numero) {
      const mesaConMismoNumero = await prisma.mesas.findFirst({
        where: {
          numero: parseInt(numero, 10),
          sucursal_id: sucursalId || mesaExistente.sucursal_id,
          id: { not: id },
        },
      });
      if (mesaConMismoNumero) {
        return NextResponse.json(
          {
            success: false,
            message: "Ya existe una mesa con ese número en esta sucursal",
          },
          { status: 400 },
        );
      }
    }

    // Actualizar la mesa
    const mesaActualizada = await prisma.mesas.update({
      where: { id },
      data: {
        numero: numero ? parseInt(numero, 10) : undefined,
        capacidad: capacidad ? parseInt(capacidad, 10) : undefined,
        sucursal_id: sucursalId || undefined,
        ubicacion: ubicacion !== undefined ? ubicacion : undefined,
        notas: notas !== undefined ? notas : undefined,
        disponible: disponible !== undefined ? disponible : undefined,
        actualizado_en: new Date(),
      },
      include: {
        sucursales: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Mesa actualizada exitosamente",
      mesa: mesaActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar mesa:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar mesa" },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar mesa
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // Verificar que la mesa exista
    const mesaExistente = await prisma.mesas.findUnique({
      where: { id },
      include: {
        ordenes: true,
      },
    });

    if (!mesaExistente) {
      return NextResponse.json(
        { success: false, message: "Mesa no encontrada" },
        { status: 404 },
      );
    }

    // Verificar que no tenga órdenes activas
    if (mesaExistente.ordenes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No se puede eliminar una mesa con órdenes activas",
        },
        { status: 400 },
      );
    }

    // Eliminar la mesa
    await prisma.mesas.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Mesa eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar mesa:", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar mesa" },
      { status: 500 },
    );
  }
}
