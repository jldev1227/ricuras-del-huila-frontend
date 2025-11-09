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

// ============================================================================
// HELPER FUNCTIONS PARA STOCK
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
      console.log(`⏭️ Producto ${producto.nombre} no controla stock, omitiendo...`);
      continue;
    }

    // Calcular nuevo stock
    const cantidadMovimiento = item.cantidad;
    const stockAnterior = producto.stock_actual;
    let stockNuevo = stockAnterior;

    if (tipoMovimiento === "salida") {
      stockNuevo = Math.max(0, stockAnterior - cantidadMovimiento);
      
      console.log(`📦 ${tipoMovimiento.toUpperCase()}: ${producto.nombre} | Stock: ${stockAnterior} - ${cantidadMovimiento} = ${stockNuevo}`);
      
      // Validar que hay suficiente stock (permitir continuar pero alertar)
      if (stockAnterior < cantidadMovimiento) {
        console.warn(`⚠️ Stock insuficiente para ${producto.nombre}. Disponible: ${stockAnterior}, Requerido: ${cantidadMovimiento}`);
        // No lanzar error, permitir que continúe pero quede en 0
      }
    } else if (tipoMovimiento === "entrada") {
      stockNuevo = stockAnterior + cantidadMovimiento;
      console.log(`📦 ${tipoMovimiento.toUpperCase()}: ${producto.nombre} | Stock: ${stockAnterior} + ${cantidadMovimiento} = ${stockNuevo}`);
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
        motivo: tipoMovimiento === "salida" ? "Venta realizada" : "Devolución/Cancelación",
        referencia,
        creado_por: creadoPor,
        creado_en: new Date(),
      },
    });

    console.log(`✅ Stock actualizado para ${producto.nombre}: ${stockAnterior} → ${stockNuevo}`);
  }
}

/**
 * Calcula las diferencias entre items anteriores y nuevos para ajustar stock
 */
async function ajustarStockPorCambios(
  itemsAnteriores: any[],
  itemsNuevos: OrderItem[],
  transactionClient: any,
  referencia: string,
  creadoPor?: string
) {
  console.log(`🔄 Ajustando stock por cambios en orden ${referencia}...`);
  
  // Crear mapas para facilitar la comparación
  const mapaAnteriores = new Map();
  const mapaNuevos = new Map();
  
  itemsAnteriores.forEach((item: any) => {
    mapaAnteriores.set(item.producto_id, item.cantidad);
  });
  
  itemsNuevos.forEach(item => {
    mapaNuevos.set(item.producto_id, item.cantidad);
  });
  
  // Obtener todos los productos únicos
  const todosLosProductos = new Set([...mapaAnteriores.keys(), ...mapaNuevos.keys()]);
  
  for (const productoId of todosLosProductos) {
    const cantidadAnterior = mapaAnteriores.get(productoId) || 0;
    const cantidadNueva = mapaNuevos.get(productoId) || 0;
    const diferencia = cantidadNueva - cantidadAnterior;
    
    if (diferencia !== 0) {
      const itemAjuste: OrderItem = {
        producto_id: productoId,
        cantidad: Math.abs(diferencia),
        precio_unitario: 0, // No relevante para movimientos de stock
      };
      
      const tipoMovimiento = diferencia > 0 ? "salida" : "entrada";
      const referenciaDetallada = `${referencia}_AJUSTE_${tipoMovimiento.toUpperCase()}`;
      
      await actualizarStockProductos(
        [itemAjuste],
        transactionClient,
        tipoMovimiento,
        referenciaDetallada,
        creadoPor
      );
      
      console.log(`📊 Ajuste: Producto ${productoId} | Anterior: ${cantidadAnterior} → Nuevo: ${cantidadNueva} (${diferencia > 0 ? '+' : ''}${diferencia})`);
    }
  }
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
        pagos_orden: {
          select: {
            id: true,
            metodo_pago: true,
            monto: true,
            referencia: true,
            notas: true,
            creado_en: true,
            usuario: {
              select: {
                id: true,
                nombre_completo: true,
              },
            },
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

    console.log('🔄 PUT - Datos recibidos para actualización:', {
      ordenId: id,
      mesa_id: body.mesa_id,
      tipo_orden: body.tipo_orden,
      allFields: Object.keys(body)
    });

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

    // Permitir actualizar órdenes en cualquier estado
    // Comentado: No permitir actualizar órdenes entregadas o canceladas
    // if (["ENTREGADA", "CANCELADA"].includes(ordenExistente.estado)) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: "No se puede actualizar una orden entregada o cancelada",
    //     },
    //     { status: 400 },
    //   );
    // }

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
        console.log(`🔄 Actualizando items de orden ${id}...`);
        
        // ============================================================================
        // GESTIÓN DE STOCK: Ajustar stock por cambios en items
        // ============================================================================
        await ajustarStockPorCambios(
          ordenExistente.orden_items,
          items,
          tx,
          `ORDEN_${id}`,
          finalUserId
        );

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
        if (mesa_id !== undefined) {
          console.log('🏠 Actualizando mesa_id:', {
            valorAnterior: ordenExistente.mesa_id,
            valorNuevo: mesa_id,
            esNull: mesa_id === null,
            esUndefined: mesa_id === undefined
          });
          dataUpdate.mesa_id = mesa_id;
        }
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
        // Si se está cambiando el estado a ENTREGADA, liberar la mesa
        if (datos.estado === "ENTREGADA" && ordenExistente.mesa_id) {
          ordenActualizada = await prisma.$transaction(async (tx) => {
            // Liberar la mesa
            await tx.mesas.update({
              where: { id: ordenExistente.mesa_id! }, // Non-null assertion ya que verificamos que existe
              data: {
                disponible: true,
                actualizado_en: new Date(),
              },
            });

            // Actualizar la orden
            return await tx.ordenes.update({
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
          });
        } else {
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
  id: string,
  datos: any,
  ordenExistente: any,
  finalUserId: string | null,
) {
  const { estado } = datos;

  // Preparar datos de actualización
  const dataToUpdate: any = {
    estado,
    actualizado_por: finalUserId || null,
    actualizado_en: new Date(),
  };

  // Si el estado es ENTREGADA y la orden tiene mesa asignada, liberar la mesa
  if (estado === "ENTREGADA" && ordenExistente.mesa_id) {
    // Actualizar la orden y liberar la mesa en una transacción
    return await prisma.$transaction(async (tx) => {
      // Liberar la mesa
      await tx.mesas.update({
        where: { id: ordenExistente.mesa_id! }, // Non-null assertion ya que verificamos que existe
        data: {
          disponible: true,
          actualizado_en: new Date(),
        },
      });

      // Actualizar la orden
      const ordenActualizada = await tx.ordenes.update({
        where: { id },
        data: dataToUpdate,
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

      return ordenActualizada;
    });
  }

  // Si no es ENTREGADA o no tiene mesa, solo actualizar la orden
  const ordenActualizada = await prisma.ordenes.update({
    where: { id },
    data: dataToUpdate,
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

  return ordenActualizada;
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

    // Permitir cancelar órdenes en cualquier estado
    // Comentado: No permitir cancelar órdenes ya entregadas
    // if (orden.estado === "ENTREGADA") {
    //   throw new Error("No se puede cancelar una orden ya entregada");
    // }

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

  // Permitir facturar órdenes en cualquier estado
  // Comentado: Solo se pueden facturar órdenes entregadas
  // if (orden.estado !== "ENTREGADA") {
  //   throw new Error("Solo se pueden facturar órdenes entregadas");
  // }

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
