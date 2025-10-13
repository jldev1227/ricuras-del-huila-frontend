import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando seed completo para Ricuras Del Huila...");

  // Limpiar datos existentes (en orden por dependencias)
  console.log("🗑️  Limpiando datos anteriores...");
  await prisma.orden_items.deleteMany();
  await prisma.ordenes.deleteMany();
  await prisma.productos.deleteMany();
  await prisma.categorias.deleteMany();
  await prisma.mesas.deleteMany();
  await prisma.configuracion_empresa.deleteMany();
  await prisma.password_resets.deleteMany();
  await prisma.sesiones.deleteMany();
  await prisma.usuarios.deleteMany();
  await prisma.sucursales.deleteMany();

  console.log("✅ Datos anteriores eliminados");

  // 1. Crear sucursales
  const sucursalCentro = await prisma.sucursales.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      nombre: "Ricuras Centro",
      direccion: "Calle 5 #10-20, Centro, Neiva",
      telefono: "3001234567",
      activo: true,
    },
  });

  const sucursalNorte = await prisma.sucursales.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440002",
      nombre: "Ricuras Norte",
      direccion: "Carrera 15 #25-30, Norte, Neiva",
      telefono: "3009876543",
      activo: true,
    },
  });

  const sucursalSur = await prisma.sucursales.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440003",
      nombre: "Ricuras Sur",
      direccion: "Avenida 26 #12-45, Sur, Neiva",
      telefono: "3005556677",
      activo: true,
    },
  });

  console.log("✅ Sucursales creadas:", {
    centro: sucursalCentro.nombre,
    norte: sucursalNorte.nombre,
    sur: sucursalSur.nombre,
  });

  // 2. Crear usuarios
  const adminPassword = await bcrypt.hash("admin123", 10);
  const meseroPassword = await bcrypt.hash("mesero123", 10);

  const admin = await prisma.usuarios.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440100",
      nombre_completo: "Administrador Principal",
      identificacion: "1234567890",
      correo: "admin@ricurasdelhuila.com",
      telefono: "3001234567",
      password: adminPassword,
      rol: "ADMINISTRADOR",
      sucursal_id: sucursalCentro.id,
    },
  });

  const mesero1 = await prisma.usuarios.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440101",
      nombre_completo: "Juan Mesero",
      identificacion: "0987654321",
      correo: "mesero@ricurasdelhuila.com",
      telefono: "3009876543",
      password: meseroPassword,
      rol: "MESERO",
      sucursal_id: sucursalCentro.id,
    },
  });

  const mesero2 = await prisma.usuarios.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440102",
      nombre_completo: "María Mesera",
      identificacion: "1122334455",
      correo: "maria@ricurasdelhuila.com",
      telefono: "3005556677",
      password: meseroPassword,
      rol: "MESERO",
      sucursal_id: sucursalNorte.id,
    },
  });

  const mesero3 = await prisma.usuarios.create({
    data: {
      id: "550e8400-e29b-41d4-a716-446655440103",
      nombre_completo: "Carlos Mesero",
      identificacion: "5566778899",
      correo: "carlos@ricurasdelhuila.com",
      telefono: "3007778899",
      password: meseroPassword,
      rol: "MESERO",
      sucursal_id: sucursalSur.id,
    },
  });

  console.log("✅ Usuarios creados:", {
    admin: admin.nombre_completo,
    mesero1: mesero1.nombre_completo,
    mesero2: mesero2.nombre_completo,
    mesero3: mesero3.nombre_completo,
  });

  // 3. Crear configuración de empresa
  const configEmpresa = await prisma.configuracion_empresa.create({
    data: {
      nit: "901234567-8",
      razon_social: "Ricuras Del Huila S.A.S.",
      nombre_comercial: "Ricuras Del Huila",
      telefono: "+57 318 555 1234",
      correo: "info@ricurasdelhuila.com",
      direccion: "Calle 8 #5-65, Centro, Neiva, Huila",
      ciudad: "Neiva",
      departamento: "Huila",
      codigo_postal: "410001",
      regimen_fiscal: "COMUN",
      tipo_persona: "JURIDICA",
      numero_resolucion: "18764007882636",
      fecha_resolucion: new Date("2024-01-15"),
      numeracion_desde: "1",
      numeracion_hasta: "5000",
      prefijo_factura: "RH",
      consecutivo_actual: 1,
      sitio_web: "https://ricurasdelhuila.com",
      activo: true,
      creado_por: admin.id,
    },
  });

  console.log("✅ Configuración de empresa creada:", configEmpresa.razon_social);

  // 4. Crear mesas para Sucursal Centro
  const mesasCentro = [];
  for (let i = 1; i <= 10; i++) {
    mesasCentro.push({
      numero: i,
      capacidad: i % 3 === 0 ? 6 : 4,
      disponible: true,
      sucursal_id: sucursalCentro.id,
      ubicacion: i <= 4 ? "Interior" : i <= 7 ? "Terraza" : "VIP",
    });
  }

  await prisma.mesas.createMany({ data: mesasCentro });

  // 5. Crear mesas para Sucursal Norte
  const mesasNorte = [];
  for (let i = 1; i <= 8; i++) {
    mesasNorte.push({
      numero: i,
      capacidad: i % 2 === 0 ? 6 : 4,
      disponible: true,
      sucursal_id: sucursalNorte.id,
      ubicacion: i <= 3 ? "Interior" : "Terraza",
    });
  }

  await prisma.mesas.createMany({ data: mesasNorte });

  // 6. Crear mesas para Sucursal Sur
  const mesasSur = [];
  for (let i = 1; i <= 6; i++) {
    mesasSur.push({
      numero: i,
      capacidad: i % 2 === 0 ? 4 : 2,
      disponible: true,
      sucursal_id: sucursalSur.id,
      ubicacion: i <= 3 ? "Interior" : "Terraza",
    });
  }

  await prisma.mesas.createMany({ data: mesasSur });

  console.log("✅ Mesas creadas:", {
    centro: mesasCentro.length,
    norte: mesasNorte.length,
    sur: mesasSur.length,
    total: mesasCentro.length + mesasNorte.length + mesasSur.length,
  });

  // 7. Crear categorías
  const platosTipicos = await prisma.categorias.create({
    data: { nombre: "Platos Típicos", icono: "🍖", orden: 1 }
  });

  const entradas = await prisma.categorias.create({
    data: { nombre: "Entradas", icono: "🥟", orden: 2 }
  });

  const bebidasCalientes = await prisma.categorias.create({
    data: { nombre: "Bebidas Calientes", icono: "☕", orden: 3 }
  });

  const bebidasFrias = await prisma.categorias.create({
    data: { nombre: "Bebidas Frías", icono: "🥤", orden: 4 }
  });

  const postres = await prisma.categorias.create({
    data: { nombre: "Postres", icono: "🍰", orden: 5 }
  });

  const desayunos = await prisma.categorias.create({
    data: { nombre: "Desayunos", icono: "🍳", orden: 6 }
  });

  console.log("✅ Categorías creadas: 6 categorías");

  // 8. Crear productos (sin imágenes)
  await prisma.productos.createMany({
    data: [
      // Platos Típicos
      {
        nombre: "Lechona Completa",
        descripcion: "Lechona tradicional huilense con arroz, insulso y arepa",
        precio: 28000,
        costo_produccion: 14000,
        categoria_id: platosTipicos.id,
        destacado: true,
      },
      {
        nombre: "Tamales Huilenses",
        descripcion: "Tamales tradicionales envueltos en hoja de plátano",
        precio: 12000,
        costo_produccion: 6000,
        categoria_id: platosTipicos.id,
        destacado: true,
      },
      {
        nombre: "Sancocho de Gallina",
        descripcion: "Sancocho tradicional con gallina criolla y verduras",
        precio: 25000,
        costo_produccion: 12000,
        categoria_id: platosTipicos.id,
      },
      {
        nombre: "Pescado Sudado",
        descripcion: "Pescado fresco del Magdalena sudado con verduras",
        precio: 22000,
        costo_produccion: 11000,
        categoria_id: platosTipicos.id,
      },
      
      // Entradas
      {
        nombre: "Empanadas Huilenses",
        descripcion: "Empanadas criollas rellenas de carne y papa",
        precio: 3500,
        costo_produccion: 1500,
        categoria_id: entradas.id,
      },
      {
        nombre: "Patacones",
        descripcion: "Plátano verde frito con guacamole",
        precio: 8000,
        costo_produccion: 3000,
        categoria_id: entradas.id,
      },
      {
        nombre: "Arepa con Queso",
        descripcion: "Arepa de maíz con queso campesino",
        precio: 6000,
        costo_produccion: 2500,
        categoria_id: entradas.id,
      },

      // Bebidas Calientes
      {
        nombre: "Café Huilense",
        descripcion: "Café premium de la región del Huila",
        precio: 3000,
        costo_produccion: 800,
        categoria_id: bebidasCalientes.id,
        destacado: true,
      },
      {
        nombre: "Chocolate Santafereño",
        descripcion: "Chocolate caliente con queso y almojábana",
        precio: 5000,
        costo_produccion: 2000,
        categoria_id: bebidasCalientes.id,
      },
      {
        nombre: "Aguapanela con Limón",
        descripcion: "Bebida caliente tradicional con panela y limón",
        precio: 2500,
        costo_produccion: 800,
        categoria_id: bebidasCalientes.id,
      },

      // Bebidas Frías
      {
        nombre: "Jugo de Lulo",
        descripcion: "Jugo natural de lulo del Huila",
        precio: 4500,
        costo_produccion: 1800,
        categoria_id: bebidasFrias.id,
        destacado: true,
      },
      {
        nombre: "Jugo de Maracuyá",
        descripcion: "Jugo natural de maracuyá",
        precio: 4500,
        costo_produccion: 1800,
        categoria_id: bebidasFrias.id,
      },
      {
        nombre: "Limonada de Coco",
        descripcion: "Limonada refrescante con coco rallado",
        precio: 5000,
        costo_produccion: 2000,
        categoria_id: bebidasFrias.id,
      },
      {
        nombre: "Gaseosa",
        descripcion: "Bebida gaseosa en diferentes sabores",
        precio: 3000,
        costo_produccion: 1200,
        categoria_id: bebidasFrias.id,
      },

      // Postres
      {
        nombre: "Postre de Natas",
        descripcion: "Postre tradicional huilense con natas y panela",
        precio: 8000,
        costo_produccion: 3000,
        categoria_id: postres.id,
        destacado: true,
      },
      {
        nombre: "Flan de Coco",
        descripcion: "Flan casero con coco rallado",
        precio: 6000,
        costo_produccion: 2500,
        categoria_id: postres.id,
      },
      {
        nombre: "Torta de Tres Leches",
        descripcion: "Torta húmeda con tres leches",
        precio: 7000,
        costo_produccion: 3000,
        categoria_id: postres.id,
      },

      // Desayunos
      {
        nombre: "Desayuno Huilense",
        descripcion: "Huevos, arepa, carne, chorizo y chocolate",
        precio: 15000,
        costo_produccion: 7000,
        categoria_id: desayunos.id,
        destacado: true,
      },
      {
        nombre: "Calentado Paisa",
        descripcion: "Frijoles, arroz, carne, chicharrón y huevo",
        precio: 18000,
        costo_produccion: 8000,
        categoria_id: desayunos.id,
      },
      {
        nombre: "Changua",
        descripcion: "Sopa de leche con huevos y cilantro",
        precio: 8000,
        costo_produccion: 3000,
        categoria_id: desayunos.id,
      },
    ],
  });

  console.log("✅ Productos creados: 20 productos sin imágenes");

  console.log("\n🎉 Seed completo finalizado exitosamente!");
  console.log("\n📊 Resumen de datos creados:");
  console.log("- Configuración de empresa: 1");
  console.log("- Sucursales: 3");
  console.log("- Usuarios: 4 (1 admin + 3 meseros)");
  console.log("- Mesas: 24 (10 Centro + 8 Norte + 6 Sur)");
  console.log("- Categorías: 6");
  console.log("- Productos: 20");
  
  console.log("\n🔐 Credenciales de prueba:");
  console.log("👨‍💼 Administrador:");
  console.log("   Usuario: 1234567890");
  console.log("   Contraseña: admin123");
  console.log("   ID: 550e8400-e29b-41d4-a716-446655440100");
  
  console.log("\n👨‍🍳 Meseros:");
  console.log("   Centro - Juan: 0987654321 / mesero123");
  console.log("   Norte - María: 1122334455 / mesero123");
  console.log("   Sur - Carlos: 5566778899 / mesero123");

  console.log("\n🏢 Empresa configurada:");
  console.log("   NIT: 901234567-8");
  console.log("   Razón Social: Ricuras Del Huila S.A.S.");
  console.log("   Teléfono: +57 318 555 1234");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed completo:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
