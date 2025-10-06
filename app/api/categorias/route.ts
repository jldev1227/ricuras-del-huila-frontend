import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        icono: true,
        activo: true,
        _count: {
          select: {
            productos: true,
          },
        },
      },
      orderBy: { orden: 'asc' },
    });

    return NextResponse.json({
      success: true,
      categorias,
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return NextResponse.json(
      { message: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}