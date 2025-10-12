// app/api/ordenes/route.ts

import type { Prisma, $Enums } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tipos para los items de orden
interface OrderItem {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  especificaciones?: string;
  notas?: string;
}

// GET - Listar órdenes con filtros
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filtros
    const sucursalId = searchParams.get("sucursalId");
    const meseroId = searchParams.get("meseroId");
    const mesaId = searchParams.get("mesaId");
    const clienteId = searchParams.get("clienteId");
    const estado = searchParams.get("estado");
    const tipoOrden = searchParams.get("tipoOrden");
    const fecha = searchParams.get("fecha");
    const sincronizado = searchParams.get("sincronizado");

    // Paginación
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.ordenesWhereInput = {};

    if (sucursalId) where.sucursal_id = sucursalId;
    if (meseroId) where.mesero_id = meseroId;
    if (mesaId) where.mesa_id = mesaId;
    if (clienteId) where.cliente_id = clienteId;
    if (estado) where.estado = estado as $Enums.estados_orden;
    if (tipoOrden) where.tipo_orden = tipoOrden as $Enums.tipos_orden;
    if (sincronizado) where.sincronizado = sincronizado === "true";

    if (fecha) {
      const startDate = new Date(fecha);
      const endDate = new Date(fecha);
      endDate.setDate(endDate.getDate() + 1);

      where.creado_en = {
        gte: startDate,
        lt: endDate,
      };
    }

    // Obtener órdenes con solo los campos necesarios
    const [ordenes, total] = await Promise.all([
      prisma.ordenes.findMany({
        where,
        select: {
          id: true,
          tipoOrden: true,
          estado: true,
          total: true,
          descuento: true,
          creadoEn: true,
          sucursal: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
            },
          },
          mesa: {
            select: {
              numero: true,
              ubicacion: true,
            },
          },
          mesero: {
            select: {
              nombre_completo: true,
            },
          },
          cliente: {
            select: {
              nombre: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: { creado_en: "desc" },
        skip,
        take: limit,
      }),
      prisma.ordenes.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      ordenes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener órdenes" },
      { status: 500 },
    );
  }
}

// POST - Crear nueva orden
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      sucursalId,
      tipoOrden,
      mesaId,
      clienteId,
      meseroId,
      nombreCliente,
      telefonoCliente,
      direccionEntrega,
      indicacionesEntrega,
      costoEnvio,
      costoAdicional,
      horaRecogida,
      items,
      descuento = 0,
      notas,
      especificaciones,
      creadoOffline = false,
    } = body;

    // Validar sucursalId
    if (!sucursalId) {
      return NextResponse.json(
        { success: false, message: "Sucursal requerida" },
        { status: 400 },
      );
    }

    // Verificar que la sucursal existe
    const sucursal = await prisma.sucursales.findUnique({
      where: { id: sucursalId },
    });

    if (!sucursal) {
      return NextResponse.json(
        { success: false, message: "Sucursal no encontrada" },
        { status: 404 },
      );
    }

    // Validaciones básicas
    if (!tipoOrden || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Validación específica por tipo de orden
    if (tipoOrden === "LOCAL" && !mesaId) {
      return NextResponse.json(
        { success: false, message: "Las órdenes locales requieren una mesa" },
        { status: 400 },
      );
    }

    if (tipoOrden === "DOMICILIO" && !direccionEntrega) {
      return NextResponse.json(
        {
          success: false,
          message: "Las órdenes a domicilio requieren dirección",
        },
        { status: 400 },
      );
    }

    // Calcular subtotal
    const subtotal = items.reduce((total: number, item: OrderItem) => {
      return total + item.precioUnitario * item.cantidad;
    }, 0);

    // Calcular total
    let total = subtotal - descuento;
    if (costoEnvio) total += parseFloat(costoEnvio);
    if (costoAdicional) total += parseFloat(costoAdicional);

    // Crear la orden con transacción
    const orden = await prisma.$transaction(async (tx) => {
      // Si es orden local, marcar mesa como ocupada
      if (tipoOrden === "LOCAL" && mesaId) {
        await tx.mesas.update({
          where: { id: mesaId },
          data: { disponible: false },
        });
      }

      // Crear la orden
      const nuevaOrden = await tx.ordenes.create({
        data: {
          sucursalId,
          tipoOrden,
          mesaId: tipoOrden === "LOCAL" ? mesaId : null,
          clienteId,
          meseroId,
          nombreCliente,
          telefonoCliente,
          direccionEntrega,
          indicacionesEntrega,
          costoEnvio: costoEnvio ? parseFloat(costoEnvio) : null,
          costoAdicional: costoAdicional ? parseFloat(costoAdicional) : null,
          horaRecogida: horaRecogida ? new Date(horaRecogida) : null,
          subtotal,
          descuento,
          total,
          notas,
          especificaciones,
          creadoOffline,
          sincronizado: !creadoOffline,
          items: {
            create: items.map((item: OrderItem) => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.precioUnitario * item.cantidad,
              notas: item.notas,
            })),
          },
        },
        include: {
          items: {
            include: {
              producto: true,
            },
          },
          mesa: true,
          cliente: true,
          mesero: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
        },
      });

      return nuevaOrden;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Orden creada exitosamente",
        orden,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error al crear orden:", error);
    return NextResponse.json(
      { success: false, message: "Error al crear orden" },
      { status: 500 },
    );
  }
}

// PUT - Actualizar orden completa
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID de orden requerido" },
        { status: 400 },
      );
    }

    // Verificar que la orden existe
    const ordenExistente = await prisma.orden.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!ordenExistente) {
      return NextResponse.json(
        { success: false, message: "Orden no encontrada" },
        { status: 404 },
      );
    }

    // No permitir actualizar órdenes entregadas o canceladas
    if (["ENTREGADA", "CANCELADA"].includes(ordenExistente.estado)) {
      return NextResponse.json(
        {
          success: false,
          message: "No se puede actualizar una orden entregada o cancelada",
        },
        { status: 400 },
      );
    }

    // Actualizar orden con transacción
    const ordenActualizada = await prisma.$transaction(async (tx) => {
      // Si hay nuevos items, eliminar los antiguos y crear los nuevos
      if (data.items) {
        await tx.ordenItem.deleteMany({
          where: { ordenId: id },
        });

        const subtotal = data.items.reduce((total: number, item: OrderItem) => {
          return total + item.precioUnitario * item.cantidad;
        }, 0);

        let total = subtotal - (data.descuento || 0);
        if (data.costoEnvio) total += parseFloat(data.costoEnvio);
        if (data.costoAdicional) total += parseFloat(data.costoAdicional);

        data.subtotal = subtotal;
        data.total = total;
      }

      const { items, ...ordenData } = data;

      const updated = await tx.orden.update({
        where: { id },
        data: {
          ...ordenData,
          actualizadoEn: new Date(),
          ...(items && {
            items: {
              create: items.map((item: OrderItem) => ({
                productoId: item.productoId,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                subtotal: item.precioUnitario * item.cantidad,
                notas: item.notas,
              })),
            },
          }),
        },
        include: {
          items: {
            include: {
              producto: true,
            },
          },
          mesa: true,
          cliente: true,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "Orden actualizada exitosamente",
      orden: ordenActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar orden:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar orden" },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar orden (soft delete recomendado)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID de orden requerido" },
        { status: 400 },
      );
    }

    const orden = await prisma.orden.findUnique({
      where: { id },
      include: { mesa: true },
    });

    if (!orden) {
      return NextResponse.json(
        { success: false, message: "Orden no encontrada" },
        { status: 404 },
      );
    }

    // Usar transacción para liberar mesa si es necesario
    await prisma.$transaction(async (tx) => {
      // Si la orden tiene mesa, liberarla
      if (orden.mesaId) {
        await tx.mesa.update({
          where: { id: orden.mesaId },
          data: { disponible: true },
        });
      }

      // Eliminar la orden (esto también eliminará los items por el onDelete: Cascade)
      await tx.orden.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Orden eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar orden:", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar orden" },
      { status: 500 },
    );
  }
}
