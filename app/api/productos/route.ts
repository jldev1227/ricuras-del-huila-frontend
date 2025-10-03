import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nombre = searchParams.get('nombre');
    const categoriaId = searchParams.get('categoriaId');
    const disponible = searchParams.get('disponible');

    const where: any = {};

    if (nombre) {
      where.nombre = {
        contains: nombre,
        mode: 'insensitive',
      };
    }

    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    if (disponible !== null && disponible !== undefined) {
      where.disponible = disponible === 'true';
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            icono: true,
          },
        },
      },
      orderBy: [
        { destacado: 'desc' },
        { nombre: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      productos,
      total: productos.length,
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { message: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}