// scripts/verify-audit-fields.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAuditFields() {
  try {
    console.log('🔍 Verificando campos de auditoría en las órdenes...\n');
    
    // Obtener las últimas 5 órdenes
    const ordenes = await prisma.ordenes.findMany({
      take: 5,
      orderBy: { creado_en: 'desc' },
      select: {
        id: true,
        creado_en: true,
        actualizado_en: true,
        creado_por: true,
        actualizado_por: true,
        metodo_pago: true,
        creador: {
          select: {
            id: true,
            nombre_completo: true,
          },
        },
        actualizador: {
          select: {
            id: true,
            nombre_completo: true,
          },
        },
      },
    });

    console.log(`📊 Encontradas ${ordenes.length} órdenes recientes:\n`);
    
    ordenes.forEach((orden, index) => {
      console.log(`${index + 1}. Orden ID: ${orden.id.substring(0, 8)}...`);
      console.log(`   📅 Creada: ${orden.creado_en.toLocaleString()}`);
      console.log(`   📅 Actualizada: ${orden.actualizado_en.toLocaleString()}`);
      console.log(`   💳 Método de pago: ${orden.metodo_pago || 'No especificado'}`);
      
      if (orden.creado_por) {
        console.log(`   👤 Creada por ID: ${orden.creado_por.substring(0, 8)}...`);
        if (orden.creador) {
          console.log(`   👤 Creador: ${orden.creador.nombre_completo}`);
        }
      } else {
        console.log('   ❌ Sin información del creador');
      }
      
      if (orden.actualizado_por) {
        console.log(`   ✏️  Actualizada por ID: ${orden.actualizado_por.substring(0, 8)}...`);
        if (orden.actualizador) {
          console.log(`   ✏️  Actualizador: ${orden.actualizador.nombre_completo}`);
        }
      } else {
        console.log('   ❌ Sin información del actualizador');
      }
      
      console.log('');
    });

    // Verificar si hay órdenes sin campos de auditoría
    const ordenesSinAuditoria = await prisma.ordenes.count({
      where: {
        OR: [
          { creado_por: null },
          { actualizado_por: null },
        ],
      },
    });

    console.log(`⚠️  Órdenes sin campos de auditoría completos: ${ordenesSinAuditoria}`);
    
    // Verificar sesiones activas
    const sesionesActivas = await prisma.sesiones.count({
      where: { activa: true },
    });
    
    console.log(`🔐 Sesiones activas: ${sesionesActivas}`);
    
    if (sesionesActivas === 0) {
      console.log('❌ No hay sesiones activas. El usuario debe estar logueado para que funcione la auditoría.');
    }

  } catch (error) {
    console.error('❌ Error al verificar campos de auditoría:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAuditFields();