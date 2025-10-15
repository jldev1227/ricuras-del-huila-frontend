import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' }, 
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ]
      : [
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
    errorFormat: 'pretty',
  });

// Event listeners para logs más detallados
if (process.env.NODE_ENV === "development") {
  prisma.$on('query', (e: { query: string; params: string; duration: number }) => {
    console.log('📊 [PRISMA QUERY]', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      target: e.target
    });
  });
}

prisma.$on('error', (e: { message: string; target?: string; timestamp: Date }) => {
  console.error('❌ [PRISMA ERROR]', {
    message: e.message,
    target: e.target,
    timestamp: new Date().toISOString()
  });
});

prisma.$on('warn', (e: { message: string; target?: string; timestamp: Date }) => {
  console.warn('⚠️ [PRISMA WARNING]', {
    message: e.message,
    target: e.target,
    timestamp: new Date().toISOString()
  });
});

prisma.$on('info', (e: { message: string; target?: string; timestamp: Date }) => {
  console.info('ℹ️ [PRISMA INFO]', {
    message: e.message,
    target: e.target,
    timestamp: new Date().toISOString()
  });
});

// Función para verificar la conexión
export async function verificarConexionDB() {
  try {
    console.log('🔌 [DATABASE] Verificando conexión...');
    
    // Test básico de conexión
    await prisma.$connect();
    console.log('✅ [DATABASE] Conexión establecida exitosamente');
    
    // Verificar que podemos hacer una query simple
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ [DATABASE] Query de prueba exitosa:', result);
    
    // Verificar algunas tablas principales
    const tablas = await Promise.all([
      prisma.usuarios.count().catch(() => null),
      prisma.sucursales.count().catch(() => null),
      prisma.productos.count().catch(() => null),
      prisma.categorias.count().catch(() => null),
    ]);
    
    console.log('📊 [DATABASE] Conteo de registros:', {
      usuarios: tablas[0],
      sucursales: tablas[1], 
      productos: tablas[2],
      categorias: tablas[3]
    });
    
    // Información de la base de datos
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    ` as { database_name: string; current_user: string; postgres_version: string }[];
    
    console.log('🗄️ [DATABASE] Información:', {
      nombre: dbInfo[0]?.database_name,
      usuario: dbInfo[0]?.current_user,
      version: dbInfo[0]?.postgres_version?.split(' ')[0]
    });
    
    return {
      success: true,
      message: 'Conexión exitosa',
      counts: {
        usuarios: tablas[0],
        sucursales: tablas[1],
        productos: tablas[2], 
        categorias: tablas[3]
      },
      database: dbInfo[0]
    };
    
  } catch (error) {
    console.error('❌ [DATABASE] Error de conexión:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
      error
    };
  }
}

// Auto-verificación al inicializar (solo en desarrollo)
if (process.env.NODE_ENV === "development") {
  // Ejecutar verificación después de un pequeño delay para evitar logs durante build
  setTimeout(async () => {
    await verificarConexionDB();
  }, 1000);
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
