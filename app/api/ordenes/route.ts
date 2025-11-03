// app/api/ordenes/route.ts

import crypto from "node:crypto";
import type { $Enums, Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-server";

// Tipos para los items de orden
interface OrderItem {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  especificaciones?: string;
  notas?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Actualiza el stock de productos y su disponibilidad automática
 */
async function actualizarStockProductos(
  items: OrderItem[],
  transactionClient: any, // PrismaTransaction
  tipoMovimiento: "entrada" | "salida" = "salida",
  referencia: string,
  creadoPor?: string
) {
  for (const item of items) {
    // Obtener el producto actual
    const producto = await transactionClient.productos.findUnique({
      where: { id: item.producto_id },
      select: {
        id: true,
        nombre: true,
        stock_actual: true,
        controlar_stock: true,
        unidad_medida: true,
      },
    });

    if (!producto) {
      throw new Error(`Producto con ID ${item.producto_id} no encontrado`);
    }

    // Solo procesar productos que controlan stock
    if (!producto.controlar_stock) {
      continue;
    }

    // Calcular nuevo stock
    const cantidadMovimiento = item.cantidad;
    const stockAnterior = producto.stock_actual;
    let stockNuevo = stockAnterior;

    if (tipoMovimiento === "salida") {
      stockNuevo = Math.max(0, stockAnterior - cantidadMovimiento);
      
      // Validar que hay suficiente stock
      if (stockAnterior < cantidadMovimiento) {
        throw new Error(`Stock insuficiente para el producto ${producto.nombre}. Stock disponible: ${stockAnterior}, cantidad solicitada: ${cantidadMovimiento}`);
      }
    } else if (tipoMovimiento === "entrada") {
      stockNuevo = stockAnterior + cantidadMovimiento;
    }

    // Actualizar stock del producto
    await transactionClient.productos.update({
      where: { id: producto.id },
      data: {
        stock_actual: stockNuevo,
        disponible: stockNuevo > 0, // Auto-actualizar disponibilidad
        actualizado_en: new Date(),
      },
    });

    // Crear movimiento de stock
    await transactionClient.movimientos_stock.create({
      data: {
        id: crypto.randomUUID(),
        producto_id: producto.id,
        tipo_movimiento: tipoMovimiento,
        cantidad: cantidadMovimiento,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        motivo: tipoMovimiento === "salida" ? "Venta realizada" : "Devolución de venta",
        referencia,
        creado_por: creadoPor,
        creado_en: new Date(),
      },
    });
  }
}

// GET - Listar órdenes con filtros
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filtros
    const sucursal_id = searchParams.get("sucursal_id");
    const mesero_id = searchParams.get("mesero_id");
    const mesa_id = searchParams.get("mesa_id");
    const cliente_id = searchParams.get("cliente_id");
    const estado = searchParams.get("estado");
    const tipo_orden = searchParams.get("tipo_orden");
    const fecha = searchParams.get("fecha");
    const sincronizado = searchParams.get("sincronizado");

    // Paginación
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.ordenesWhereInput = {};

    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (mesero_id) where.mesero_id = mesero_id;
    if (mesa_id) where.mesa_id = mesa_id;
    if (cliente_id) where.cliente_id = cliente_id;
    if (estado) where.estado = estado as $Enums.estados_orden;
    if (tipo_orden) where.tipo_orden = tipo_orden as $Enums.tipos_orden;
    if (sincronizado) where.sincronizado = sincronizado === "true";

    if (fecha) {
      // Convertir la fecha a hora de Colombia (UTC-5)
      const colombiaDate = new Date(fecha + "T00:00:00-05:00");
      const startDate = new Date(colombiaDate);
      const endDate = new Date(colombiaDate);
      endDate.setDate(endDate.getDate() + 1);

      where.creado_en = {
        gte: startDate,
        lt: endDate,
      };
    }

    // Obtener órdenes con solo los campos necesarios y calcular total acumulado
    const [ordenes, total, totalAcumuladoResult] = await Promise.all([
      prisma.ordenes.findMany({
        where,
        select: {
          id: true,
          tipo_orden: true,
          estado: true,
          total: true,
          descuento: true,
          metodo_pago: true,
          creado_en: true,
          sucursales: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
            },
          },
          mesas: {
            select: {
              numero: true,
              ubicacion: true,
            },
          },
          usuarios: {
            select: {
              nombre_completo: true,
            },
          },
          clientes: {
            select: {
              nombre: true,
            },
          },
          orden_items: {
            select: {
              cantidad: true,
              precio_unitario: true,
              productos: {
                select: {
                  id: true,
                  nombre: true,
                  precio: true,
                },
              },
            },
          },
          _count: {
            select: {
              orden_items: true,
            },
          },
        },
        orderBy: { creado_en: "desc" },
        skip,
        take: limit,
      }),
      prisma.ordenes.count({ where }),
      // ✅ Calcular total acumulado de TODAS las órdenes que cumplen los filtros (sin paginación)
      prisma.ordenes.aggregate({
        where,
        _sum: {
          total: true,
        },
      }),
    ]);

    // Formatear las fechas en la respuesta a hora de Colombia
    const ordenesConFechaColombia = ordenes.map((orden) => ({
      ...orden,
      creado_en: orden.creado_en, // Dejar como Date/ISO string
      creado_en_utc: orden.creado_en, // Mantener el original si lo necesitas
    }));

    // Total acumulado de TODAS las órdenes (sin límite de paginación)
    const totalAcumulado = totalAcumuladoResult._sum.total || 0;

    return NextResponse.json({
      success: true,
      ordenes: ordenesConFechaColombia,
      totalAcumulado, // ✅ Total acumulado de los valores de todas las órdenes
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
      userId, // Campo para el usuario que crea la orden (desde el frontend)
      metodoPago = "EFECTIVO", // Método de pago por defecto
    } = body;

    // Obtener el usuario autenticado del header Authorization
    const userIdFromAuth = await getUserFromRequest(request);
    const finalUserId = userId || userIdFromAuth; // Priorizar el userId del cuerpo, luego el del auth

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

    // Validar que todos los items tengan los campos requeridos
    for (const item of items) {
      if (!item.producto_id || !item.precio_unitario || !item.cantidad) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Todos los items deben tener producto_id, precio_unitario y cantidad",
            item: item,
          },
          { status: 400 },
        );
      }
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
      const precio = Number(item.precio_unitario) || 0;
      const cantidad = Number(item.cantidad) || 0;
      return total + precio * cantidad;
    }, 0);

    // Calcular total
    let total = subtotal - (Number(descuento) || 0);
    if (costoEnvio) total += Number(costoEnvio) || 0;
    if (costoAdicional) total += Number(costoAdicional) || 0;

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
          id: crypto.randomUUID(),
          sucursal_id: sucursalId,
          tipo_orden: tipoOrden,
          estado: tipoOrden === "LLEVAR" ? "ENTREGADA" : "PENDIENTE", // ✅ Auto-completar LLEVAR como ENTREGADA
          mesa_id: tipoOrden === "LOCAL" ? mesaId : null,
          cliente_id: clienteId || null,
          mesero_id: meseroId || null,
          nombre_cliente: nombreCliente || null,
          telefono_cliente: telefonoCliente || null,
          direccion_entrega: direccionEntrega || null,
          indicaciones_entrega: indicacionesEntrega || null,
          costo_envio: costoEnvio ? Number(costoEnvio) : null,
          costo_adicional: costoAdicional ? Number(costoAdicional) : null,
          hora_recogida: horaRecogida ? new Date(horaRecogida) : null,
          subtotal,
          descuento: Number(descuento) || 0,
          total,
          notas,
          especificaciones,
          metodo_pago: metodoPago,
          creado_offline: creadoOffline,
          sincronizado: !creadoOffline,
          creado_por: finalUserId || null,
          actualizado_por: finalUserId || null,
          actualizado_en: new Date(),
          orden_items: {
            create: items.map((item: OrderItem) => ({
              id: crypto.randomUUID(),
              producto_id: item.producto_id,
              cantidad: Number(item.cantidad),
              precio_unitario: Number(item.precio_unitario),
              subtotal: Number(item.precio_unitario) * Number(item.cantidad),
              notas: item.notas,
            })),
          },
        },
        include: {
          orden_items: {
            include: {
              productos: true,
            },
          },
          mesas: true,
          clientes: true,
          sucursales: true,
          usuarios: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
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

      // ✅ Actualizar stock de productos si están configurados para controlarlo
      await actualizarStockProductos(
        items,
        tx,
        "salida",
        `ORDEN_${nuevaOrden.id}`,
        finalUserId
      );

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
    const { id, userId, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID de orden requerido" },
        { status: 400 },
      );
    }

    // Obtener el usuario autenticado del header Authorization
    const userIdFromAuth = await getUserFromRequest(request);
    const finalUserId = userId || userIdFromAuth;

    // Verificar que la orden existe
    const ordenExistente = await prisma.ordenes.findUnique({
      where: { id },
      include: { orden_items: true },
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
        await tx.orden_items.deleteMany({
          where: { orden_id: id },
        });

        const subtotal = data.items.reduce((total: number, item: OrderItem) => {
          return total + item.precio_unitario * item.cantidad;
        }, 0);

        let total = subtotal - (data.descuento || 0);
        if (data.costo_envio) total += parseFloat(data.costo_envio);
        if (data.costo_adicional) total += parseFloat(data.costo_adicional);

        data.subtotal = subtotal;
        data.total = total;
      }

      const { items, ...ordenData } = data;

      const updated = await tx.ordenes.update({
        where: { id },
        data: {
          ...ordenData,
          actualizado_por: finalUserId || null,
          actualizado_en: new Date(),
          ...(items && {
            orden_items: {
              create: items.map((item: OrderItem) => ({
                id: crypto.randomUUID(),
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.precio_unitario * item.cantidad,
                notas: item.notas,
              })),
            },
          }),
        },
        include: {
          orden_items: {
            include: {
              productos: true,
            },
          },
          mesas: true,
          clientes: true,
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

    const orden = await prisma.ordenes.findUnique({
      where: { id },
      include: { mesas: true },
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
      if (orden.mesa_id) {
        await tx.mesas.update({
          where: { id: orden.mesa_id },
          data: { disponible: true },
        });
      }

      // Eliminar la orden (esto también eliminará los items por el onDelete: Cascade)
      await tx.ordenes.delete({
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
