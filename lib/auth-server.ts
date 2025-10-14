// lib/auth-server.ts
import type { NextRequest } from 'next/server';
import { prisma } from './prisma';

/**
 * Extrae el usuario autenticado del token de autorización en el header
 */
export async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    console.log('🔐 Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'No header');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header found');
      return null;
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    console.log('🎟️ Token extraído:', `${token.substring(0, 20)}...`);

    // Buscar la sesión activa con este token
    const sesion = await prisma.sesiones.findFirst({
      where: {
        token: token,
        activa: true,
        expira_en: {
          gt: new Date(), // Token no expirado
        },
      },
      select: {
        usuario_id: true,
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            rol: true,
          },
        },
      },
    });

    if (!sesion) {
      console.log('❌ No se encontró sesión activa para el token');
      return null;
    }

    console.log('✅ Usuario encontrado:', sesion.usuarios?.nombre_completo, `ID: ${sesion.usuario_id.substring(0, 8)}...`);

    // Actualizar último uso de la sesión
    await prisma.sesiones.updateMany({
      where: {
        token: token,
        activa: true,
      },
      data: {
        ultimo_uso: new Date(),
      },
    });

    return sesion.usuario_id;
  } catch (error) {
    console.error('Error al obtener usuario de la petición:', error);
    return null;
  }
}

/**
 * Valida que el usuario tenga los permisos necesarios
 */
export async function validateUserPermissions(
  userId: string,
  requiredRoles?: string[]
): Promise<boolean> {
  try {
    const user = await prisma.usuarios.findUnique({
      where: { id: userId },
      select: { rol: true, activo: true },
    });

    if (!user || !user.activo) {
      return false;
    }

    if (requiredRoles && !requiredRoles.includes(user.rol)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error al validar permisos:', error);
    return false;
  }
}