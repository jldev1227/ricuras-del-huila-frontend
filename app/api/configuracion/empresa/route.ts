import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Obtener configuración de empresa
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Solo administradores pueden ver la configuración de empresa
    if (session.user.rol !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta información" },
        { status: 403 }
      );
    }

    const configuracion = await prisma.configuracion_empresa.findFirst({
      where: {
        activo: true
      }
    });

    return NextResponse.json(configuracion);
  } catch (error) {
    console.error("Error obteniendo configuración de empresa:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear configuración de empresa
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Solo administradores pueden crear configuración de empresa
    if (session.user.rol !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nit,
      razon_social,
      nombre_comercial,
      telefono,
      correo,
      direccion,
      ciudad,
      departamento,
      codigo_postal,
      regimen_fiscal,
      tipo_persona,
      numero_resolucion,
      fecha_resolucion,
      numeracion_desde,
      numeracion_hasta,
      prefijo_factura,
      consecutivo_actual,
      logo_url,
      sitio_web
    } = body;

    // Validaciones básicas
    if (!nit || !razon_social) {
      return NextResponse.json(
        { error: "NIT y razón social son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una configuración activa
    const existeConfiguracion = await prisma.configuracion_empresa.findFirst({
      where: { activo: true }
    });

    if (existeConfiguracion) {
      return NextResponse.json(
        { error: "Ya existe una configuración de empresa activa" },
        { status: 409 }
      );
    }

    const nuevaConfiguracion = await prisma.configuracion_empresa.create({
      data: {
        nit,
        razon_social,
        nombre_comercial,
        telefono,
        correo,
        direccion,
        ciudad,
        departamento,
        codigo_postal,
        regimen_fiscal,
        tipo_persona: tipo_persona || "JURIDICA",
        numero_resolucion,
        fecha_resolucion: fecha_resolucion ? new Date(fecha_resolucion) : null,
        numeracion_desde,
        numeracion_hasta,
        prefijo_factura,
        consecutivo_actual: consecutivo_actual || 1,
        logo_url,
        sitio_web,
        creado_por: session.user.id
      }
    });

    return NextResponse.json(nuevaConfiguracion, { status: 201 });
  } catch (error) {
    console.error("Error creando configuración de empresa:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de empresa
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Solo administradores pueden actualizar configuración de empresa
    if (session.user.rol !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      id,
      nit,
      razon_social,
      nombre_comercial,
      telefono,
      correo,
      direccion,
      ciudad,
      departamento,
      codigo_postal,
      regimen_fiscal,
      tipo_persona,
      numero_resolucion,
      fecha_resolucion,
      numeracion_desde,
      numeracion_hasta,
      prefijo_factura,
      consecutivo_actual,
      logo_url,
      sitio_web
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de configuración es obligatorio" },
        { status: 400 }
      );
    }

    // Verificar que existe la configuración
    const configuracionExistente = await prisma.configuracion_empresa.findUnique({
      where: { id }
    });

    if (!configuracionExistente) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    const configuracionActualizada = await prisma.configuracion_empresa.update({
      where: { id },
      data: {
        nit,
        razon_social,
        nombre_comercial,
        telefono,
        correo,
        direccion,
        ciudad,
        departamento,
        codigo_postal,
        regimen_fiscal,
        tipo_persona,
        numero_resolucion,
        fecha_resolucion: fecha_resolucion ? new Date(fecha_resolucion) : null,
        numeracion_desde,
        numeracion_hasta,
        prefijo_factura,
        consecutivo_actual,
        logo_url,
        sitio_web
      }
    });

    return NextResponse.json(configuracionActualizada);
  } catch (error) {
    console.error("Error actualizando configuración de empresa:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}