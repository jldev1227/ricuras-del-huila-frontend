// app/api/ordenes/[id]/route.ts
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

// GET - Obtener una orden específica
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const orden = await prisma.orden.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            producto: {
              include: {
                categoria: true,
              },
            },
          },
        },
        mesa: true,
        cliente: true,
        sucursal: true,
        mesero: {
          select: {
            id: true,
            nombreCompleto: true,
            rol: true,
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
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    // Verificar que la orden existe
    const ordenExistente = await prisma.orden.findUnique({
      where: { id: params.id },
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

    const {
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
      descuento,
      especificaciones,
      notas,
    } = body;

    // Actualizar orden con transacción
    const ordenActualizada = await prisma.$transaction(async (tx) => {
      // Si hay nuevos items, eliminar los antiguos y crear los nuevos
      if (items && Array.isArray(items)) {
        // Eliminar items antiguos
        await tx.ordenItem.deleteMany({
          where: { ordenId: params.id },
        });

        // Calcular nuevo subtotal
        const subtotal = items.reduce((total: number, item: OrderItem) => {
          return total + Number(item.precioUnitario) * item.cantidad;
        }, 0);

        // Calcular nuevo total
        let total = subtotal - (descuento || 0);
        if (costoEnvio) total += Number(costoEnvio);
        if (costoAdicional) total += Number(costoAdicional);

        // Actualizar orden con nuevos items
        return await tx.orden.update({
          where: { id: params.id },
          data: {
            tipoOrden: tipoOrden || ordenExistente.tipoOrden,
            mesaId: mesaId !== undefined ? mesaId : ordenExistente.mesaId,
            clienteId:
              clienteId !== undefined ? clienteId : ordenExistente.clienteId,
            meseroId: meseroId || ordenExistente.meseroId,
            nombreCliente:
              nombreCliente !== undefined
                ? nombreCliente
                : ordenExistente.nombreCliente,
            telefonoCliente:
              telefonoCliente !== undefined
                ? telefonoCliente
                : ordenExistente.telefonoCliente,
            direccionEntrega:
              direccionEntrega !== undefined
                ? direccionEntrega
                : ordenExistente.direccionEntrega,
            indicacionesEntrega:
              indicacionesEntrega !== undefined
                ? indicacionesEntrega
                : ordenExistente.indicacionesEntrega,
            costoEnvio:
              costoEnvio !== undefined
                ? costoEnvio
                  ? Number(costoEnvio)
                  : null
                : ordenExistente.costoEnvio,
            costoAdicional:
              costoAdicional !== undefined
                ? costoAdicional
                  ? Number(costoAdicional)
                  : null
                : ordenExistente.costoAdicional,
            horaRecogida:
              horaRecogida !== undefined
                ? horaRecogida
                  ? new Date(horaRecogida)
                  : null
                : ordenExistente.horaRecogida,
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
            actualizadoEn: new Date(),
            items: {
              create: items.map((item: OrderItem) => ({
                productoId: item.productoId,
                cantidad: item.cantidad,
                precioUnitario: Number(item.precioUnitario),
                subtotal: Number(item.precioUnitario) * item.cantidad,
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
                nombreCompleto: true,
              },
            },
          },
        });
      } else {
        // Solo actualizar campos sin modificar items
        const dataUpdate: Record<string, any> = {
          actualizadoEn: new Date(),
        };

        if (tipoOrden) dataUpdate.tipoOrden = tipoOrden;
        if (mesaId !== undefined) dataUpdate.mesaId = mesaId;
        if (clienteId !== undefined) dataUpdate.clienteId = clienteId;
        if (meseroId) dataUpdate.meseroId = meseroId;
        if (nombreCliente !== undefined)
          dataUpdate.nombreCliente = nombreCliente;
        if (telefonoCliente !== undefined)
          dataUpdate.telefonoCliente = telefonoCliente;
        if (direccionEntrega !== undefined)
          dataUpdate.direccionEntrega = direccionEntrega;
        if (indicacionesEntrega !== undefined)
          dataUpdate.indicacionesEntrega = indicacionesEntrega;
        if (costoEnvio !== undefined)
          dataUpdate.costoEnvio = costoEnvio ? Number(costoEnvio) : null;
        if (costoAdicional !== undefined)
          dataUpdate.costoAdicional = costoAdicional
            ? Number(costoAdicional)
            : null;
        if (horaRecogida !== undefined)
          dataUpdate.horaRecogida = horaRecogida
            ? new Date(horaRecogida)
            : null;
        if (descuento !== undefined) dataUpdate.descuento = Number(descuento);
        if (especificaciones !== undefined)
          dataUpdate.especificaciones = especificaciones;
        if (notas !== undefined) dataUpdate.notas = notas;

        // Recalcular total si hay cambios en montos
        if (
          descuento !== undefined ||
          costoEnvio !== undefined ||
          costoAdicional !== undefined
        ) {
          const subtotalActual = ordenExistente.subtotal;
          let nuevoTotal =
            Number(subtotalActual) -
            Number(
              descuento !== undefined ? descuento : ordenExistente.descuento,
            );
          if (costoEnvio !== undefined && costoEnvio)
            nuevoTotal += Number(costoEnvio);
          else if (ordenExistente.costoEnvio)
            nuevoTotal += Number(ordenExistente.costoEnvio);
          if (costoAdicional !== undefined && costoAdicional)
            nuevoTotal += Number(costoAdicional);
          else if (ordenExistente.costoAdicional)
            nuevoTotal += Number(ordenExistente.costoAdicional);

          dataUpdate.total = nuevoTotal;
        }

        return await tx.orden.update({
          where: { id: params.id },
          data: dataUpdate,
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
                nombreCompleto: true,
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
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { accion, ...datos } = body;

    // Verificar que la orden existe
    const ordenExistente = await prisma.orden.findUnique({
      where: { id: params.id },
      include: { mesa: true },
    });

    if (!ordenExistente) {
      return NextResponse.json(
        { success: false, message: "Orden no encontrada" },
        { status: 404 },
      );
    }

    let ordenActualizada: any;

    switch (accion) {
      case "cambiar_estado":
        ordenActualizada = await cambiarEstado(
          params.id,
          datos,
          ordenExistente,
        );
        break;

      case "cancelar":
        ordenActualizada = await cancelarOrden(params.id, datos);
        break;

      case "marcar_facturada":
        ordenActualizada = await marcarFacturada(params.id, datos);
        break;

      case "sincronizar":
        ordenActualizada = await sincronizarOrden(params.id);
        break;

      case "actualizar_notas":
        ordenActualizada = await actualizarNotas(params.id, datos);
        break;

      default:
        // Actualización genérica de campos
        ordenActualizada = await prisma.orden.update({
          where: { id: params.id },
          data: {
            ...datos,
            actualizadoEn: new Date(),
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
  datos: Record<string, any>,
  ordenExistente: Record<string, any>,
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
    if (nuevoEstado === "ENTREGADA" && ordenExistente.mesaId) {
      await tx.mesa.update({
        where: { id: ordenExistente.mesaId },
        data: { disponible: true },
      });
    }

    // Actualizar orden
    return await tx.orden.update({
      where: { id: ordenId },
      data: {
        estado: nuevoEstado,
        notas: razon
          ? `${ordenExistente.notas || ""}\n[Cambio de estado]: ${razon}`.trim()
          : ordenExistente.notas,
        actualizadoEn: new Date(),
      },
      include: {
        items: {
          include: { producto: true },
        },
        mesa: true,
        cliente: true,
      },
    });
  });
}

// Función para cancelar orden
async function cancelarOrden(ordenId: string, datos: Record<string, any>) {
  const { razonCancelacion } = datos;

  if (!razonCancelacion) {
    throw new Error("Razón de cancelación requerida");
  }

  return await prisma.$transaction(async (tx) => {
    const orden = await tx.orden.findUnique({
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
    if (orden.mesaId) {
      await tx.mesa.update({
        where: { id: orden.mesaId },
        data: { disponible: true },
      });
    }

    // Actualizar orden
    return await tx.orden.update({
      where: { id: ordenId },
      data: {
        estado: "CANCELADA",
        notas: `${orden.notas || ""}\n[CANCELADA]: ${razonCancelacion}`.trim(),
        actualizadoEn: new Date(),
      },
      include: {
        items: {
          include: { producto: true },
        },
        mesa: true,
        cliente: true,
      },
    });
  });
}

// Función para marcar como facturada (agregar campo facturada al schema si es necesario)
async function marcarFacturada(ordenId: string, datos: Record<string, any>) {
  const {
    numeroFactura,
    fechaFacturacion,
    cufe, // Código Único de Facturación Electrónica
    urlPdf,
    urlXml,
  } = datos;

  // Nota: Necesitarás agregar estos campos al modelo Orden en el schema
  // Por ahora, lo guardaremos en las notas
  const orden = await prisma.orden.findUnique({
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

  return await prisma.orden.update({
    where: { id: ordenId },
    data: {
      notas: `${orden.notas || ""}\n${infoFacturacion}`.trim(),
      actualizadoEn: new Date(),
    },
    include: {
      items: {
        include: { producto: true },
      },
      mesa: true,
      cliente: true,
    },
  });
}

// Función para sincronizar orden offline
async function sincronizarOrden(ordenId: string) {
  return await prisma.orden.update({
    where: { id: ordenId },
    data: {
      sincronizado: true,
      sincronizadoEn: new Date(),
    },
    include: {
      items: {
        include: { producto: true },
      },
      mesa: true,
      cliente: true,
    },
  });
}

// Función para actualizar notas/especificaciones
async function actualizarNotas(ordenId: string, datos: Record<string, any>) {
  const { notas, especificaciones } = datos;

  return await prisma.orden.update({
    where: { id: ordenId },
    data: {
      ...(notas !== undefined && { notas }),
      ...(especificaciones !== undefined && { especificaciones }),
      actualizadoEn: new Date(),
    },
    include: {
      items: {
        include: { producto: true },
      },
      mesa: true,
      cliente: true,
    },
  });
}
