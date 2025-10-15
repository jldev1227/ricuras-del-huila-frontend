import { type NextRequest, NextResponse } from "next/server";
import { verificarConexionDB } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 [API] Verificación de salud de la base de datos solicitada');
    
    const resultado = await verificarConexionDB();
    
    if (resultado.success) {
      console.log('✅ [API] Verificación exitosa');
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        supabase: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          connected: true
        },
        ...resultado
      }, { status: 200 });
    } else {
      console.log('❌ [API] Verificación falló');
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        error: resultado.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ [API] Error en endpoint de salud:', error);
    return NextResponse.json({
      status: 'error',
      database: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}