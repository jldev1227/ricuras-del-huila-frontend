// app/api/ordenes/[id]/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-server";

// Types for better type safety
interface EstadoUpdateData {
  nuevoEstado: string;
  razon?: string;
}

interface CancelacionData {
  razonCancelacion: string;
}

interface FacturacionData {
  numeroFactura?: string;
  metodoPago?: string;
  observaciones?: string;
  fechaFacturacion?: string;
  cufe?: string;
  urlPdf?: string;
  urlXml?: string;
}

interface NotasUpdateData {
  notas?: string;
  especificaciones?: string;
}

interface OrdenExistente {
  id: string;
  estado: string;
  meseroId?: string | null;
  mesa_id?: string | null;
  notas?: string | null;
  mesa?: { numero: number } | null;
  [key: string]: unknown;
}

interface OrdenActualizada {
  id: string;
  estado: string;
  [key: string]: unknown;
}

// Tipos para los items de orden
interface OrderItem {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  especificaciones?: string;
  notas?: string;
}

// GET - Obtener una orden específica
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const orden = await prisma.ordenes.findUnique({
      where: { id },
      include: {
        orden_items: {
          include: {
            productos: {
              include: {
                categorias: true,
              },
            },
          },
        },
        mesas: true,
        clientes: true,
        sucursales: true,
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            rol: true,
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

    if (!orden) {
      return NextResponse.json(
        { success: false, message: "Orden no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      orden,
    });
  } catch (error) {
    console.error("Error al obtener orden:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener orden" },
      { status: 500 },
    );
  }
}

// PUT - Actualizar orden completa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

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

    const {
      tipo_orden,
      mesa_id,
      cliente_id,
      mesero_id,
      nombre_cliente,
      telefono_cliente,
      direccion_entrega,
      indicaciones_entrega,
      costo_envio,
      costo_adicional,
      hora_recogida,
      items,
      descuento,
      especificaciones,
      notas,
      metodo_pago,
      userId, // Usuario que actualiza la orden (desde el frontend)
    } = body;

    // Obtener el usuario autenticado del header Authorization
    const userIdFromAuth = await getUserFromRequest(request);
    const finalUserId = userId || userIdFromAuth;

    // Actualizar orden con transacción
    const ordenActualizada = await prisma.$transaction(async (tx) => {
      // Si hay nuevos items, eliminar los antiguos y crear los nuevos
      if (items && Array.isArray(items)) {
        // Eliminar items antiguos
        await tx.orden_items.deleteMany({
          where: { orden_id: id },
        });

        // Calcular nuevo subtotal
        const subtotal = items.reduce((total: number, item: OrderItem) => {
          return total + Number(item.precio_unitario) * item.cantidad;
        }, 0);

        // Calcular nuevo total
        let total = subtotal - (descuento || 0);
        if (costo_envio) total += Number(costo_envio);
        if (costo_adicional) total += Number(costo_adicional);

        // Actualizar orden con nuevos items
        return await tx.ordenes.update({
          where: { id },
          data: {
            tipo_orden: tipo_orden || ordenExistente.tipo_orden,
            mesa_id: mesa_id !== undefined ? mesa_id : ordenExistente.mesa_id,
            cliente_id:
              cliente_id !== undefined ? cliente_id : ordenExistente.cliente_id,
            mesero_id: mesero_id || ordenExistente.mesero_id,
            nombre_cliente:
              nombre_cliente !== undefined
                ? nombre_cliente
                : ordenExistente.nombre_cliente,
            telefono_cliente:
              telefono_cliente !== undefined
                ? telefono_cliente
                : ordenExistente.telefono_cliente,
            direccion_entrega:
              direccion_entrega !== undefined
                ? direccion_entrega
                : ordenExistente.direccion_entrega,
            indicaciones_entrega:
              indicaciones_entrega !== undefined
                ? indicaciones_entrega
                : ordenExistente.indicaciones_entrega,
            costo_envio:
              costo_envio !== undefined
                ? costo_envio
                  ? Number(costo_envio)
                  : null
                : ordenExistente.costo_envio,
            costo_adicional:
              costo_adicional !== undefined
                ? costo_adicional
                  ? Number(costo_adicional)
                  : null
                : ordenExistente.costo_adicional,
            hora_recogida:
              hora_recogida !== undefined
                ? hora_recogida
                  ? new Date(hora_recogida)
                  : null
                : ordenExistente.hora_recogida,
            subtotal,
            descuento:
              descuento !== undefined
                ? Number(descuento)
                : ordenExistente.descuento,
            total,
            especificaciones:
              especificaciones !== undefined
                ? especificaciones
                : ordenExistente.especificaciones,
            notas: notas !== undefined ? notas : ordenExistente.notas,
            metodo_pago: metodo_pago !== undefined ? metodo_pago : ordenExistente.metodo_pago,
            actualizado_por: finalUserId || null,
            actualizado_en: new Date(),
            orden_items: {
              create: items.map((item: OrderItem) => ({
                id: crypto.randomUUID(),
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: Number(item.precio_unitario),
                subtotal: Number(item.precio_unitario) * item.cantidad,
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
            usuarios: {
              select: {
                id: true,
                nombre_completo: true,
              },
            },
          },
        });
      } else {
        // Solo actualizar campos sin modificar items
        const dataUpdate: Record<string, unknown> = {
          actualizado_en: new Date(),
        };

        if (tipo_orden) dataUpdate.tipo_orden = tipo_orden;
        if (mesa_id !== undefined) dataUpdate.mesa_id = mesa_id;
        if (cliente_id !== undefined) dataUpdate.cliente_id = cliente_id;
        if (mesero_id) dataUpdate.mesero_id = mesero_id;
        if (nombre_cliente !== undefined)
          dataUpdate.nombre_cliente = nombre_cliente;
        if (telefono_cliente !== undefined)
          dataUpdate.telefono_cliente = telefono_cliente;
        if (direccion_entrega !== undefined)
          dataUpdate.direccion_entrega = direccion_entrega;
        if (indicaciones_entrega !== undefined)
          dataUpdate.indicaciones_entrega = indicaciones_entrega;
        if (costo_envio !== undefined)
          dataUpdate.costo_envio = costo_envio ? Number(costo_envio) : null;
        if (costo_adicional !== undefined)
          dataUpdate.costo_adicional = costo_adicional
            ? Number(costo_adicional)
            : null;
        if (hora_recogida !== undefined)
          dataUpdate.hora_recogida = hora_recogida
            ? new Date(hora_recogida)
            : null;
        if (descuento !== undefined) dataUpdate.descuento = Number(descuento);
        if (especificaciones !== undefined)
          dataUpdate.especificaciones = especificaciones;
        if (notas !== undefined) dataUpdate.notas = notas;
        if (metodo_pago !== undefined) dataUpdate.metodo_pago = metodo_pago;

        // Recalcular total si hay cambios en montos
        if (
          descuento !== undefined ||
          costo_envio !== undefined ||
          costo_adicional !== undefined
        ) {
          const subtotalActual = ordenExistente.subtotal;
          let nuevoTotal =
            Number(subtotalActual) -
            Number(
              descuento !== undefined ? descuento : ordenExistente.descuento,
            );
          if (costo_envio !== undefined && costo_envio)
            nuevoTotal += Number(costo_envio);
          else if (ordenExistente.costo_envio)
            nuevoTotal += Number(ordenExistente.costo_envio);
          if (costo_adicional !== undefined && costo_adicional)
            nuevoTotal += Number(costo_adicional);
          else if (ordenExistente.costo_adicional)
            nuevoTotal += Number(ordenExistente.costo_adicional);

          dataUpdate.total = nuevoTotal;
        }

        return await tx.ordenes.update({
          where: { id },
          data: {
            ...dataUpdate,
            actualizado_por: finalUserId || null,
          },
          include: {
            orden_items: {
              include: {
                productos: true,
              },
            },
            mesas: true,
            clientes: true,
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
      }
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

// PATCH - Actualizar campos específicos (cambios de estado, facturación, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { accion, userId, ...datos } = body;

    // Obtener el usuario autenticado del header Authorization
    const userIdFromAuth = await getUserFromRequest(request);
    const finalUserId = userId || userIdFromAuth;

    // Verificar que la orden existe
    const ordenExistente = await prisma.ordenes.findUnique({
      where: { id },
      include: { mesas: true },
    });

    if (!ordenExistente) {
      return NextResponse.json(
        { success: false, message: "Orden no encontrada" },
        { status: 404 },
      );
    }

    let ordenActualizada: OrdenActualizada;

    switch (accion) {
      case "cambiar_estado":
        ordenActualizada = await cambiarEstado(id, datos, ordenExistente, finalUserId);
        break;

      case "cancelar":
        ordenActualizada = await cancelarOrden(id, datos, finalUserId);
        break;

      case "marcar_facturada":
        ordenActualizada = await marcarFacturada(id, datos, finalUserId);
        break;

      case "sincronizar":
        ordenActualizada = await sincronizarOrden(id, finalUserId);
        break;

      case "actualizar_notas":
        ordenActualizada = await actualizarNotas(id, datos, finalUserId);
        break;

      default:
        // Actualización genérica de campos
        ordenActualizada = await prisma.ordenes.update({
          where: { id },
          data: {
            ...datos,
            actualizado_por: finalUserId || null,
            actualizado_en: new Date(),
          },
          include: {
            orden_items: {
              include: {
                productos: true,
              },
            },
            mesas: true,
            clientes: true,
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
    }

    return NextResponse.json({
      success: true,
      message: "Orden actualizada exitosamente",
      orden: ordenActualizada,
    });
  } catch (error: unknown) {
    console.error("Error al actualizar orden:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al actualizar orden";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 },
    );
  }
}

// Función para cambiar estado de la orden
async function cambiarEstado(
  ordenId: string,
  datos: EstadoUpdateData,
  ordenExistente: OrdenExistente,
  userId?: string | null,
) {
  const { nuevoEstado, razon } = datos;

  if (!nuevoEstado) {
    throw new Error("Nuevo estado requerido");
  }

  // Validar transición de estados
  const transicionesValidas: Record<string, string[]> = {
    PENDIENTE: ["EN_PREPARACION", "CANCELADA"],
    EN_PREPARACION: ["LISTA", "CANCELADA"],
    LISTA: ["ENTREGADA", "CANCELADA"],
    ENTREGADA: [], // No se puede cambiar desde entregada
    CANCELADA: [], // No se puede cambiar desde cancelada
  };

  if (!transicionesValidas[ordenExistente.estado].includes(nuevoEstado)) {
    throw new Error(
      `No se puede cambiar de ${ordenExistente.estado} a ${nuevoEstado}`,
    );
  }

  return await prisma.$transaction(async (tx) => {
    // Si el nuevo estado es ENTREGADA y tiene mesa, liberarla
    if (nuevoEstado === "ENTREGADA" && ordenExistente.mesa_id) {
      await tx.mesas.update({
        where: { id: ordenExistente.mesa_id },
        data: { disponible: true },
      });
    }

    // Actualizar orden
    return await tx.ordenes.update({
      where: { id: ordenId },
      data: {
        estado: nuevoEstado as
          | "PENDIENTE"
          | "EN_PREPARACION"
          | "LISTA"
          | "ENTREGADA"
          | "CANCELADA",
        notas: (razon
          ? `${ordenExistente.notas || ""}\n[Cambio de estado]: ${razon}`.trim()
          : ordenExistente.notas) as string | null,
        actualizado_por: userId || null,
        actualizado_en: new Date(),
      },
      include: {
        orden_items: {
          include: { productos: true },
        },
        mesas: true,
        clientes: true,
      },
    });
  });
}

// Función para cancelar orden
async function cancelarOrden(ordenId: string, datos: CancelacionData, userId?: string | null) {
  const { razonCancelacion } = datos;

  if (!razonCancelacion) {
    throw new Error("Razón de cancelación requerida");
  }

  return await prisma.$transaction(async (tx) => {
    const orden = await tx.ordenes.findUnique({
      where: { id: ordenId },
    });

    if (!orden) {
      throw new Error("Orden no encontrada");
    }

    // No permitir cancelar órdenes ya entregadas
    if (orden.estado === "ENTREGADA") {
      throw new Error("No se puede cancelar una orden ya entregada");
    }

    // Si tiene mesa, liberarla
    if (orden.mesa_id) {
      await tx.mesas.update({
        where: { id: orden.mesa_id },
        data: { disponible: true },
      });
    }

    // Actualizar orden
    return await tx.ordenes.update({
      where: { id: ordenId },
      data: {
        estado: "CANCELADA",
        notas: `${orden.notas || ""}\n[CANCELADA]: ${razonCancelacion}`.trim(),
        actualizado_por: userId || null,
        actualizado_en: new Date(),
      },
      include: {
        orden_items: {
          include: { productos: true },
        },
        mesas: true,
        clientes: true,
      },
    });
  });
}

// Función para marcar como facturada (agregar campo facturada al schema si es necesario)
async function marcarFacturada(ordenId: string, datos: FacturacionData, userId?: string | null) {
  const {
    numeroFactura,
    fechaFacturacion,
    cufe, // Código Único de Facturación Electrónica
    urlPdf,
    urlXml,
  } = datos;

  // Nota: Necesitarás agregar estos campos al modelo Orden en el schema
  // Por ahora, lo guardaremos en las notas
  const orden = await prisma.ordenes.findUnique({
    where: { id: ordenId },
  });

  if (!orden) {
    throw new Error("Orden no encontrada");
  }

  if (orden.estado !== "ENTREGADA") {
    throw new Error("Solo se pueden facturar órdenes entregadas");
  }

  const infoFacturacion = `
[FACTURACIÓN]
Número: ${numeroFactura}
Fecha: ${fechaFacturacion || new Date().toISOString()}
${cufe ? `CUFE: ${cufe}` : ""}
${urlPdf ? `PDF: ${urlPdf}` : ""}
${urlXml ? `XML: ${urlXml}` : ""}
  `.trim();

  return await prisma.ordenes.update({
    where: { id: ordenId },
    data: {
      notas: `${orden.notas || ""}\n${infoFacturacion}`.trim(),
      actualizado_por: userId || null,
      actualizado_en: new Date(),
    },
    include: {
      orden_items: {
        include: { productos: true },
      },
      mesas: true,
      clientes: true,
    },
  });
}

// Función para sincronizar orden offline
async function sincronizarOrden(ordenId: string, userId?: string | null) {
  return await prisma.ordenes.update({
    where: { id: ordenId },
    data: {
      sincronizado: true,
      sincronizado_en: new Date(),
      actualizado_por: userId || null,
    },
    include: {
      orden_items: {
        include: { productos: true },
      },
      mesas: true,
      clientes: true,
    },
  });
}

// Función para actualizar notas/especificaciones
async function actualizarNotas(ordenId: string, datos: NotasUpdateData, userId?: string | null) {
  const { notas, especificaciones } = datos;

  return await prisma.ordenes.update({
    where: { id: ordenId },
    data: {
      ...(notas !== undefined && { notas }),
      ...(especificaciones !== undefined && { especificaciones }),
      actualizado_por: userId || null,
      actualizado_en: new Date(),
    },
    include: {
      orden_items: {
        include: { productos: true },
      },
      mesas: true,
      clientes: true,
    },
  });
}

// DELETE - Eliminar orden
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verificar que la orden existe
    const ordenExistente = await prisma.ordenes.findUnique({
      where: { id },
      include: {
        orden_items: true,
        mesas: true,
      },
    });

    if (!ordenExistente) {
      return NextResponse.json(
        { success: false, message: "Orden no encontrada" },
        { status: 404 },
      );
    }

    // Solo permitir eliminar órdenes en estado PENDIENTE
    if (ordenExistente.estado !== "PENDIENTE") {
      return NextResponse.json(
        {
          success: false,
          message: "Solo se pueden eliminar órdenes en estado PENDIENTE",
        },
        { status: 400 },
      );
    }

    // Eliminar la orden con transacción
    await prisma.$transaction(async (tx) => {
      // Primero eliminar los items de la orden
      await tx.orden_items.deleteMany({
        where: { orden_id: id },
      });

      // Liberar la mesa si estaba ocupada
      if (ordenExistente.mesa_id) {
        await tx.mesas.update({
          where: { id: ordenExistente.mesa_id },
          data: { disponible: true },
        });
      }

      // Finalmente eliminar la orden
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
