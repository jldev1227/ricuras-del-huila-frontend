import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Limpiar datos existentes (en orden por dependencias)
  await prisma.passwordReset.deleteMany();
  await prisma.sesion.deleteMany();
  await prisma.orden.deleteMany();
  await prisma.mesa.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.sucursal.deleteMany();

  console.log("🗑️  Datos anteriores eliminados");

  // 1. Crear sucursales
  const sucursalCentro = await prisma.sucursal.create({
    data: {
      nombre: "Ricuras Centro",
      direccion: "Calle 5 #10-20, Centro, Neiva",
      telefono: "3001234567",
      activo: true,
    },
  });

  const sucursalNorte = await prisma.sucursal.create({
    data: {
      nombre: "Ricuras Norte",
      direccion: "Carrera 15 #25-30, Norte, Neiva",
      telefono: "3009876543",
      activo: true,
    },
  });

  console.log("✅ Sucursales creadas:", {
    centro: sucursalCentro.nombre,
    norte: sucursalNorte.nombre,
  });

  // 2. Crear usuarios
  const adminPassword = await bcrypt.hash("admin123", 10);
  const meseroPassword = await bcrypt.hash("mesero123", 10);

  const admin = await prisma.usuario.create({
    data: {
      nombreCompleto: "Administrador Principal",
      identificacion: "1234567890",
      correo: "admin@ricurasdelhuila.com",
      telefono: "3001234567",
      password: adminPassword,
      rol: "ADMINISTRADOR",
      sucursalId: sucursalCentro.id,
    },
  });

  const mesero1 = await prisma.usuario.create({
    data: {
      nombreCompleto: "Juan Mesero",
      identificacion: "0987654321",
      correo: "mesero@ricurasdelhuila.com",
      telefono: "3009876543",
      password: meseroPassword,
      rol: "MESERO",
      sucursalId: sucursalCentro.id,
    },
  });

  const mesero2 = await prisma.usuario.create({
    data: {
      nombreCompleto: "María Mesera",
      identificacion: "1122334455",
      correo: "maria@ricurasdelhuila.com",
      telefono: "3005556677",
      password: meseroPassword,
      rol: "MESERO",
      sucursalId: sucursalNorte.id,
    },
  });

  console.log("✅ Usuarios creados:", {
    admin: admin.nombreCompleto,
    mesero1: mesero1.nombreCompleto,
    mesero2: mesero2.nombreCompleto,
  });

  // 3. Crear mesas para Sucursal Centro
  const mesasCentro = [];
  for (let i = 1; i <= 10; i++) {
    mesasCentro.push({
      numero: i,
      capacidad: i % 3 === 0 ? 6 : 4,
      disponible: true,
      sucursalId: sucursalCentro.id,
      ubicacion: i <= 4 ? "Interior" : i <= 7 ? "Terraza" : "VIP",
    });
  }

  await prisma.mesa.createMany({ data: mesasCentro });

  // 4. Crear mesas para Sucursal Norte
  const mesasNorte = [];
  for (let i = 1; i <= 8; i++) {
    mesasNorte.push({
      numero: i,
      capacidad: i % 2 === 0 ? 6 : 4,
      disponible: true,
      sucursalId: sucursalNorte.id,
      ubicacion: i <= 3 ? "Interior" : "Terraza",
    });
  }

  await prisma.mesa.createMany({ data: mesasNorte });

  console.log("✅ Mesas creadas:", {
    centro: mesasCentro.length,
    norte: mesasNorte.length,
  });

  // prisma/seed.ts - Agregar después de crear mesas

  // Crear categorías
  const _categorias = await prisma.categoria.createMany({
    data: [
      { nombre: "Platos Fuertes", icono: "🍖", orden: 1 },
      { nombre: "Entradas", icono: "🥟", orden: 2 },
      { nombre: "Bebidas", icono: "🥤", orden: 3 },
      { nombre: "Postres", icono: "🍰", orden: 4 },
    ],
  });

  const platosFuertes = await prisma.categoria.findFirst({
    where: { nombre: "Platos Fuertes" },
  });

  const bebidas = await prisma.categoria.findFirst({
    where: { nombre: "Bebidas" },
  });

  if (!platosFuertes || !bebidas) {
    throw new Error("No se encontraron las categorías necesarias para los productos.");
  }

  // Crear productos
  await prisma.producto.createMany({
    data: [
      {
        nombre: "Lechona Completa",
        descripcion: "Lechona tradicional huilense con arroz, insulso y arepa",
        precio: 25000,
        costoProduccion: 12000,
        categoriaId: platosFuertes.id,
        imagen: "/productos/lechona.jpg",
        destacado: true,
      },
      {
        nombre: "Tamales Huilenses",
        descripcion: "Tamales tradicionales envueltos en hoja de plátano",
        precio: 8000,
        costoProduccion: 3500,
        categoriaId: platosFuertes.id,
        imagen: "/productos/tamales.jpg",
      },
      {
        nombre: "Jugo Natural",
        descripcion: "Jugos naturales de frutas de la región",
        precio: 4000,
        costoProduccion: 1500,
        categoriaId: bebidas.id,
        imagen: "/productos/jugo.jpg",
      },
    ],
  });

  console.log("✅ Productos creados");

  console.log("\n📊 Resumen:");
  console.log("- Sucursales: 2");
  console.log("- Usuarios: 3");
  console.log("- Mesas: 18");
  console.log("\n🔐 Credenciales de prueba:");
  console.log("Admin: 1234567890 / admin123");
  console.log("Mesero Centro: 0987654321 / mesero123");
  console.log("Mesero Norte: 1122334455 / mesero123");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
