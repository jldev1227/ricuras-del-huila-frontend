import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener una sucursal específica por ID
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "ID de sucursal requerido" },
        { status: 400 }
      );
    }

    const sucursal = await prisma.sucursales.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            mesas: true,
          },
        },
      },
    });

    if (!sucursal) {
      return NextResponse.json(
        { message: "Sucursal no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sucursal,
    });
  } catch (error) {
    console.error("Error al obtener sucursal:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una sucursal existente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { nombre, direccion, telefono } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID de sucursal requerido" },
        { status: 400 }
      );
    }

    // Validaciones
    if (!nombre || !direccion) {
      return NextResponse.json(
        { message: "Nombre y dirección son obligatorios" },
        { status: 400 }
      );
    }

    if (nombre.trim().length < 3) {
      return NextResponse.json(
        { message: "El nombre debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    if (direccion.trim().length < 10) {
      return NextResponse.json(
        { message: "La dirección debe tener al menos 10 caracteres" },
        { status: 400 }
      );
    }

    // Verificar si la sucursal existe
    const sucursalExistente = await prisma.sucursales.findUnique({
      where: { id }
    });

    if (!sucursalExistente) {
      return NextResponse.json(
        { message: "Sucursal no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si ya existe otra sucursal con el mismo nombre (excluyendo la actual)
    const sucursalConMismoNombre = await prisma.sucursales.findFirst({
      where: {
        nombre: {
          equals: nombre.trim(),
          mode: 'insensitive'
        },
        NOT: {
          id: id
        }
      }
    });

    if (sucursalConMismoNombre) {
      return NextResponse.json(
        { message: "Ya existe otra sucursal con este nombre" },
        { status: 409 }
      );
    }

    // Validar teléfono si se proporciona
    if (telefono && telefono.trim().length > 0) {
      const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
      if (telefonoLimpio.length < 7 || telefonoLimpio.length > 15) {
        return NextResponse.json(
          { message: "El teléfono debe tener entre 7 y 15 dígitos" },
          { status: 400 }
        );
      }
    }

    const sucursalActualizada = await prisma.sucursales.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        telefono: telefono?.trim() || null,
      },
      include: {
        _count: {
          select: {
            mesas: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sucursal actualizada exitosamente",
      sucursal: sucursalActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar sucursal:", error);
    return NextResponse.json(
      { message: "Error interno del servidor al actualizar la sucursal" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una sucursal
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "ID de sucursal requerido" },
        { status: 400 }
      );
    }

    // Verificar si la sucursal existe
    const sucursalExistente = await prisma.sucursales.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            mesas: true,
            ordenes: true,
          },
        },
      },
    });

    if (!sucursalExistente) {
      return NextResponse.json(
        { message: "Sucursal no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si la sucursal tiene datos relacionados
    const tieneRelaciones = sucursalExistente._count.mesas > 0 || 
                           sucursalExistente._count.ordenes > 0;

    if (tieneRelaciones) {
      return NextResponse.json(
        { message: "No se puede eliminar la sucursal porque tiene mesas u órdenes asociadas" },
        { status: 409 }
      );
    }

    // Si no tiene relaciones, eliminar completamente
    await prisma.sucursales.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Sucursal eliminada exitosamente",
    });
  } catch (error: unknown) {
    console.error("Error al eliminar sucursal:", error);
    
    // Manejar errores de constraintes de foreign key
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { message: "No se puede eliminar la sucursal porque tiene registros relacionados" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Error interno del servidor al eliminar la sucursal" },
      { status: 500 }
    );
  }
}