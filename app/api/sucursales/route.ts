import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sucursales = await prisma.sucursales.findMany({
      include: {
        _count: {
          select: {
            mesas: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({
      success: true,
      sucursales,
    });
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return NextResponse.json(
      { message: "Error al obtener sucursales" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, direccion, telefono } = body;

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

    // Verificar si ya existe una sucursal con el mismo nombre
    const sucursalExistente = await prisma.sucursales.findFirst({
      where: {
        nombre: {
          equals: nombre.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (sucursalExistente) {
      return NextResponse.json(
        { message: "Ya existe una sucursal con este nombre" },
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

    const nuevaSucursal = await prisma.sucursales.create({
      data: {
        id: crypto.randomUUID(),
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
      message: "Sucursal creada exitosamente",
      sucursal: nuevaSucursal,
    });
  } catch (error) {
    console.error("Error al crear sucursal:", error);
    return NextResponse.json(
      { message: "Error interno del servidor al crear la sucursal" },
      { status: 500 }
    );
  }
}
