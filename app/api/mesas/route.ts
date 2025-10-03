import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const numero = searchParams.get('numero');
    const sucursalId = searchParams.get('sucursalId');
    const ubicacion = searchParams.get('ubicacion');
    const disponible = searchParams.get('disponible');

    // Construir filtros dinámicos
    const where: any = {};

    if (numero) {
      where.numero = parseInt(numero);
    }

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    if (ubicacion) {
      where.ubicacion = {
        contains: ubicacion,
        mode: 'insensitive',
      };
    }

    if (disponible !== null && disponible !== undefined) {
      where.disponible = disponible === 'true';
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
        _count: {
          select: {
            ordenes: true,
          },
        },
      },
      orderBy: [
        { sucursalId: 'asc' },
        { numero: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      mesas,
      total: mesas.length,
    });

  } catch (error) {
    console.error('Error al obtener mesas:', error);
    return NextResponse.json(
      { message: 'Error al obtener mesas' },
      { status: 500 }
    );
  }
}