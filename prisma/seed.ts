import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Limpiar datos existentes
  await prisma.sesion.deleteMany();
  await prisma.orden.deleteMany();
  await prisma.usuario.deleteMany();

  // Crear usuarios de prueba
  const adminPassword = await bcrypt.hash('admin123', 10);
  const meseroPassword = await bcrypt.hash('mesero123', 10);

  const admin = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Administrador Principal',
      identificacion: '1234567890',
      correo: 'admin@ricurasdelhuila.com',
      telefono: '3001234567',
      password: adminPassword,
      rol: 'ADMINISTRADOR',
    },
  });

  const mesero = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Juan Mesero',
      identificacion: '0987654321',
      correo: 'mesero@ricurasdelhuila.com',
      telefono: '3009876543',
      password: meseroPassword,
      rol: 'MESERO',
    },
  });

  console.log('✅ Usuarios creados:', { admin, mesero });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });