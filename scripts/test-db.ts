import { verificarConexionDB, prisma } from '../lib/prisma';

async function main() {
  console.log('🚀 [SCRIPT] Iniciando verificación completa de la base de datos...\n');
  
  const resultado = await verificarConexionDB();
  
  if (resultado.success) {
    console.log('\n🎉 [SCRIPT] ¡Todas las verificaciones pasaron exitosamente!');
    
    // Verificaciones adicionales específicas para el script
    console.log('\n🔍 [SCRIPT] Ejecutando verificaciones adicionales...');
    
    try {
      // Verificar estructura de tablas críticas
      const estructuras = await Promise.all([
        prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'usuarios' 
          ORDER BY ordinal_position
        `,
        prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'sucursales' 
          ORDER BY ordinal_position
        `
      ]);
      
      console.log('🏗️ [SCRIPT] Estructura de tabla usuarios:', estructuras[0]);
      console.log('🏗️ [SCRIPT] Estructura de tabla sucursales:', estructuras[1]);
      
    } catch (error) {
      console.warn('⚠️ [SCRIPT] No se pudo verificar la estructura de tablas:', error);
    }
    
    process.exit(0);
  } else {
    console.log('\n💥 [SCRIPT] Verificación falló');
    console.error('Error:', resultado.message);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('💥 [SCRIPT] Error fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 [SCRIPT] Conexión cerrada');
  });