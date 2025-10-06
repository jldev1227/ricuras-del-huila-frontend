// app/api/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Filtros
    const rol = searchParams.get('rol');
    const activo = searchParams.get('activo');
    const sucursalId = searchParams.get('sucursalId');
    const search = searchParams.get('search'); // Buscar por nombre o identificación
    
    // Construir filtros
    const where: any = {};
    
    if (rol) where.rol = rol;
    if (activo !== null) where.activo = activo === 'true';
    if (sucursalId) where.sucursalId = sucursalId;
    
    if (search) {
      where.OR = [
        { nombreCompleto: { contains: search, mode: 'insensitive' } },
        { identificacion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombreCompleto: true,
        identificacion: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        nombreCompleto: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      usuarios,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      nombreCompleto,
      identificacion,
      correo,
      telefono,
      password,
      rol = 'MESERO',
      sucursalId,
    } = body;

    // Validaciones básicas
    if (!nombreCompleto || !identificacion || !password || !sucursalId) {
      return NextResponse.json(
        { success: false, message: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si la identificación ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { identificacion },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { success: false, message: 'Ya existe un usuario con esta identificación' },
        { status: 400 }
      );
    }

    // Hash de contraseña (deberías usar bcrypt en producción)
    // const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombreCompleto,
        identificacion,
        correo,
        telefono,
        password, // En producción: hashedPassword
        rol,
        sucursalId,
      },
      select: {
        id: true,
        nombreCompleto: true,
        identificacion: true,
        rol: true,
        activo: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      usuario: nuevoUsuario,
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}