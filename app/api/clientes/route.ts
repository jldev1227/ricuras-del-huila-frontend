import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener todos los clientes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const busqueda = searchParams.get("busqueda");

    let whereClause = {};
    
    if (busqueda) {
      whereClause = {
        OR: [
          { nombre: { contains: busqueda, mode: "insensitive" } },
          { apellido: { contains: busqueda, mode: "insensitive" } },
          { numero_identificacion: { contains: busqueda, mode: "insensitive" } },
          { telefono: { contains: busqueda, mode: "insensitive" } },
          { correo: { contains: busqueda, mode: "insensitive" } },
        ],
      };
    }

    const clientes = await prisma.clientes.findMany({
      where: whereClause,
      orderBy: [
        { frecuente: "desc" },
        { nombre: "asc" },
      ],
      take: 50, // Límite para evitar sobrecarga
    });

    return NextResponse.json({
      success: true,
      clientes,
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      apellido,
      telefono,
      correo,
      tipo_identificacion,
      numero_identificacion,
      digito_verificacion,
      tipo_persona,
      regimen_fiscal,
      responsabilidad_fiscal,
      direccion,
      ciudad,
      departamento,
      codigo_postal,
      notas_especiales,
      frecuente = false,
    } = body;

    // Validaciones requeridas
    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "El nombre es obligatorio y debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    // Validar identificación si se proporciona
    if (numero_identificacion) {
      const clienteExistente = await prisma.clientes.findFirst({
        where: { numero_identificacion },
      });

      if (clienteExistente) {
        return NextResponse.json(
          { success: false, message: "Ya existe un cliente con este número de identificación" },
          { status: 400 }
        );
      }
    }

    // Validar correo si se proporciona
    if (correo) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return NextResponse.json(
          { success: false, message: "El formato del correo electrónico no es válido" },
          { status: 400 }
        );
      }

      const clienteExistente = await prisma.clientes.findFirst({
        where: { correo },
      });

      if (clienteExistente) {
        return NextResponse.json(
          { success: false, message: "Ya existe un cliente con este correo electrónico" },
          { status: 400 }
        );
      }
    }

    // Crear el cliente
    const cliente = await prisma.clientes.create({
      data: {
        id: crypto.randomUUID(),
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        telefono: telefono?.trim() || null,
        correo: correo?.trim() || null,
        tipo_identificacion: tipo_identificacion?.trim() || null,
        numero_identificacion: numero_identificacion?.trim() || null,
        digito_verificacion: digito_verificacion?.trim() || null,
        tipo_persona: tipo_persona?.trim() || null,
        regimen_fiscal: regimen_fiscal?.trim() || null,
        responsabilidad_fiscal: responsabilidad_fiscal?.trim() || null,
        direccion: direccion?.trim() || null,
        ciudad: ciudad?.trim() || null,
        departamento: departamento?.trim() || null,
        codigo_postal: codigo_postal?.trim() || null,
        notas_especiales: notas_especiales?.trim() || null,
        frecuente,
        actualizado_en: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Cliente creado exitosamente",
        cliente,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return NextResponse.json(
      { success: false, message: "Error al crear cliente" },
      { status: 500 }
    );
  }
}