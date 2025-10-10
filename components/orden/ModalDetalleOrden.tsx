import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import type { Prisma } from "@prisma/client";

import {
  CircleQuestionMark,
  Home,
  MapPin,
  Phone,
  Printer,
  Receipt,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formatCOP } from "@/utils/formatCOP";

type OrdenCompleta = Prisma.OrdenGetPayload<{
  include: {
    items: {
      include: {
        producto: {
          include: {
            categoria: true;
          };
        };
      };
    };
    mesa: true;
    cliente: true;
    sucursal: true;
    mesero: {
      select: {
        id: true;
        nombreCompleto: true;
        rol: true;
      };
    };
  };
}>;

interface ModalDetalleOrdenProps {
  ordenId: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ModalDetalleOrden({
  ordenId,
  isOpen,
  onOpenChange,
}: ModalDetalleOrdenProps) {
  // ✅ CAMBIO AQUÍ: Tipar correctamente el estado
  const [orden, setOrden] = useState<OrdenCompleta | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen && ordenId) {
      const fetchOrdenDetalle = async () => {
        if (!ordenId) return;

        setLoading(true);
        try {
          const response = await fetch(`/api/ordenes/${ordenId}`);
          const data = await response.json();

          if (data.success) {
            setOrden(data.orden);
          }
        } catch (error) {
          console.error("Error al cargar detalle de orden:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchOrdenDetalle();
    }
  }, [isOpen, ordenId]);

  // Genera comandos ESC/POS manualmente
  const generateESCPOS = (orden: OrdenCompleta): Uint8Array => {
    const encoder = new TextEncoder();
    const commands: number[] = [];

    // Comandos ESC/POS básicos
    const ESC = 0x1b;
    const GS = 0x1d;
    const _LF = 0x0a;
    const INIT = [ESC, 0x40]; // Inicializar impresora
    const CENTER = [ESC, 0x61, 0x01]; // Alinear centro
    const LEFT = [ESC, 0x61, 0x00]; // Alinear izquierda
    const _RIGHT = [ESC, 0x61, 0x02]; // Alinear derecha
    const BOLD_ON = [ESC, 0x45, 0x01]; // Negrita ON
    const BOLD_OFF = [ESC, 0x45, 0x00]; // Negrita OFF
    const SIZE_NORMAL = [GS, 0x21, 0x00]; // Tamaño normal
    const SIZE_DOUBLE = [GS, 0x21, 0x11]; // Tamaño doble
    const SIZE_LARGE = [GS, 0x21, 0x22]; // Tamaño grande
    const CUT = [GS, 0x56, 0x00]; // Cortar papel

    const addText = (text: string) => {
      commands.push(...Array.from(encoder.encode(text)));
    };

    const addLine = (char = "-", length = 42) => {
      addText(`${char.repeat(length)}\n`);
    };

    const addRow = (left: string, right: string, width = 42) => {
      const spaces = width - left.length - right.length;
      addText(`${left + " ".repeat(Math.max(spaces, 1)) + right}\n`);
    };

    // Inicializar
    commands.push(...INIT);

    // Header
    commands.push(...CENTER, ...SIZE_LARGE, ...BOLD_ON);
    addText("RICURAS DEL HUILA\n");
    commands.push(...SIZE_NORMAL, ...BOLD_OFF);
    addText(`${orden.sucursal?.nombre || "Sucursal Principal"}\n`);
    addText("Tel: (123) 456-7890\n");
    addText("NIT: 123456789-0\n");
    addLine("=");

    // Información de la orden
    commands.push(...LEFT, ...BOLD_ON);
    addText(`ORDEN #${orden.id.slice(0, 8).toUpperCase()}\n`);
    commands.push(...BOLD_OFF);

    const fecha = new Date(orden.creadoEn).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    addText(`Fecha: ${fecha}\n`);
    addText(`Tipo: ${orden.tipoOrden}\n`);
    addText(`Mesero: ${orden.mesero?.nombreCompleto || "N/A"}\n`);

    // Mesa (si es LOCAL)
    if (orden.tipoOrden === "LOCAL" && orden.mesa) {
      addText(`Mesa: ${orden.mesa.numero} - ${orden.mesa.ubicacion || ""}\n`);
    }

    // Dirección (si es DOMICILIO)
    if (orden.tipoOrden === "DOMICILIO" && orden.direccionEntrega) {
      commands.push(...BOLD_ON);
      addText("DOMICILIO:\n");
      commands.push(...BOLD_OFF);
      addText(`${orden.direccionEntrega}\n`);
      if (orden.nombreCliente) addText(`Cliente: ${orden.nombreCliente}\n`);
      if (orden.telefonoCliente) addText(`Tel: ${orden.telefonoCliente}\n`);
    }

    // Cliente registrado
    if (orden.cliente) {
      commands.push(...BOLD_ON);
      addText("CLIENTE:\n");
      commands.push(...BOLD_OFF);
      addText(`${orden.cliente.nombre}\n`);
      if (orden.cliente.numeroIdentificacion) {
        addText(
          `${orden.cliente.tipoIdentificacion}: ${orden.cliente.numeroIdentificacion}\n`,
        );
      }
    }

    addLine("=");

    // Items
    commands.push(...BOLD_ON);
    addText("PRODUCTOS\n");
    commands.push(...BOLD_OFF);
    addLine("-");

    orden.items.forEach((item, index) => {
      const nombre = item.producto.nombre.substring(0, 38);
      addText(`${nombre}\n`);

      const cantidad = `  ${item.cantidad} x ${formatCOP(Number(item.precioUnitario))}`;
      const subtotal = formatCOP(Number(item.subtotal));
      addRow(cantidad, subtotal);

      if (item.notas) {
        addText(`  Nota: ${item.notas}\n`);
      }

      if (index < orden.items.length - 1) {
        addText("\n");
      }
    });

    addLine("-");

    // Especificaciones
    if (orden.especificaciones) {
      commands.push(...BOLD_ON);
      addText("ESPECIFICACIONES:\n");
      commands.push(...BOLD_OFF);
      addText(`${orden.especificaciones}\n\n`);
    }

    // Notas
    if (orden.notas) {
      commands.push(...BOLD_ON);
      addText("NOTAS:\n");
      commands.push(...BOLD_OFF);
      addText(`${orden.notas}\n\n`);
    }

    // Totales
    addLine("=");
    addRow("Subtotal:", formatCOP(Number(orden.subtotal)));

    if (Number(orden.descuento) > 0) {
      addRow("Descuento:", `-${formatCOP(Number(orden.descuento))}`);
    }

    if (orden.costoEnvio && Number(orden.costoEnvio) > 0) {
      addRow("Costo envio:", formatCOP(Number(orden.costoEnvio)));
    }

    if (orden.costoAdicional && Number(orden.costoAdicional) > 0) {
      addRow("Costo adicional:", formatCOP(Number(orden.costoAdicional)));
    }

    addLine("=");

    commands.push(...BOLD_ON, ...SIZE_DOUBLE);
    addRow("TOTAL:", formatCOP(Number(orden.total)));
    commands.push(...SIZE_NORMAL, ...BOLD_OFF);

    addLine("=");

    // Estado
    commands.push(...CENTER, ...BOLD_ON);
    addText(`ESTADO: ${orden.estado.replace("_", " ")}\n`);
    commands.push(...BOLD_OFF);

    addText("\n");
    addText("Gracias por su compra!\n");
    addText("\n\n\n");

    // Cortar papel
    commands.push(...CUT);

    return new Uint8Array(commands);
  };

  const handlePrint = async () => {
    if (!orden) return;

    setPrinting(true);
    try {
      const escposData = generateESCPOS(orden);

      // Intentar imprimir con Web Serial API
      if ("serial" in navigator) {
        try {
          const port = await (
            navigator as { serial: { requestPort: () => Promise<unknown> } }
          ).serial.requestPort();
          await port.open({ baudRate: 9600 });

          const writer = port.writable.getWriter();
          await writer.write(escposData);
          writer.releaseLock();

          await port.close();

          alert("✓ Ticket impreso correctamente");
          return;
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "NotFoundError") {
            console.log("Usuario canceló la selección de puerto");
          } else {
            console.error("Error al imprimir:", err);
          }
        }
      }

      // Si Web Serial no está disponible o falló, descargar archivo
      downloadReceipt(escposData);
    } catch (error) {
      console.error("Error al generar ticket:", error);
      alert("✗ Error al generar el ticket");
    } finally {
      setPrinting(false);
    }
  };

  const downloadReceipt = (data: Uint8Array) => {
    const blob = new Blob([data as BlobPart], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ticket-${orden?.id.slice(0, 8)}.bin`;
    link.click();
    URL.revokeObjectURL(url);

    alert(
      "📄 Ticket descargado como archivo .bin\n\nEnvíe este archivo a su impresora térmica para imprimir.",
    );
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<
      string,
      "warning" | "primary" | "success" | "danger" | "default"
    > = {
      PENDIENTE: "warning",
      EN_PREPARACION: "primary",
      LISTA: "success",
      ENTREGADA: "default",
      CANCELADA: "danger",
    };
    return colores[estado] || "default";
  };

  const getTipoOrdenIcon = (tipo: string) => {
    const iconos: Record<string, string> = {
      LOCAL: "🍽️",
      LLEVAR: "🥡",
      DOMICILIO: "🚚",
    };
    return iconos[tipo] || "📋";
  };

  const formatearFecha = (fecha: string | Date) => {
    return new Date(fecha).toLocaleString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Componente de vista previa del ticket
  const TicketPreview = () => {
    if (!orden) return null;

    const fecha = new Date(orden.creadoEn).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <Modal
        isOpen={showPreview}
        onOpenChange={setShowPreview}
        size="md"
        scrollBehavior="inside"
        className="z-[100]"
        hideCloseButton
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b">
                <span className="font-bold text-lg">
                  Vista previa del ticket
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="bg-white p-2">
                  <div className="border-2 border-dashed border-gray-300 p-4">
                    {/* Header */}
                    <div className="font-mono text-xs leading-tight">
                      <div className="text-center font-bold text-lg mb-1">
                        RICURAS DEL HUILA
                      </div>
                      <div className="text-center">
                        {orden.sucursal?.nombre || "Sucursal Principal"}
                      </div>
                      <div className="text-center">Tel: (123) 456-7890</div>
                      <div className="text-center">NIT: 123456789-0</div>
                      <div className="border-t-2 border-black my-2"></div>

                      {/* Información de la orden */}
                      <div className="font-bold">
                        ORDEN #{orden.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div>Fecha: {fecha}</div>
                      <div>Tipo: {orden.tipoOrden}</div>
                      <div>Mesero: {orden.mesero?.nombreCompleto || "N/A"}</div>

                      {/* Mesa */}
                      {orden.tipoOrden === "LOCAL" && orden.mesa && (
                        <div>
                          Mesa: {orden.mesa.numero} - {orden.mesa.ubicacion}
                        </div>
                      )}

                      {/* Domicilio */}
                      {orden.tipoOrden === "DOMICILIO" &&
                        orden.direccionEntrega && (
                          <>
                            <div className="font-bold mt-2">DOMICILIO:</div>
                            <div>{orden.direccionEntrega}</div>
                            {orden.nombreCliente && (
                              <div>Cliente: {orden.nombreCliente}</div>
                            )}
                            {orden.telefonoCliente && (
                              <div>Tel: {orden.telefonoCliente}</div>
                            )}
                          </>
                        )}

                      {/* Cliente */}
                      {orden.cliente && (
                        <>
                          <div className="font-bold mt-2">CLIENTE:</div>
                          <div>{orden.cliente.nombre}</div>
                          {orden.cliente.numeroIdentificacion && (
                            <div>
                              {orden.cliente.tipoIdentificacion}:{" "}
                              {orden.cliente.numeroIdentificacion}
                            </div>
                          )}
                        </>
                      )}

                      <div className="border-t-2 border-black my-2"></div>

                      {/* Productos */}
                      <div className="font-bold">PRODUCTOS</div>
                      <div className="border-t border-dashed border-gray-400 my-1"></div>

                      {orden.items.map(
                        (item: Record<string, unknown>, _index: number) => (
                          <div key={item.id as string} className="mb-2">
                            <div>{item.producto.nombre.substring(0, 38)}</div>
                            <div className="flex justify-between">
                              <span>
                                {" "}
                                {item.cantidad} x{" "}
                                {formatCOP(item.precioUnitario)}
                              </span>
                              <span>{formatCOP(item.subtotal)}</span>
                            </div>
                            {item.notas && (
                              <div className="text-gray-600">
                                {" "}
                                Nota: {item.notas}
                              </div>
                            )}
                          </div>
                        ),
                      )}

                      <div className="border-t border-dashed border-gray-400 my-1"></div>

                      {/* Especificaciones */}
                      {orden.especificaciones && (
                        <>
                          <div className="font-bold">ESPECIFICACIONES:</div>
                          <div className="mb-2">{orden.especificaciones}</div>
                        </>
                      )}

                      {/* Notas */}
                      {orden.notas && (
                        <>
                          <div className="font-bold">NOTAS:</div>
                          <div className="mb-2">{orden.notas}</div>
                        </>
                      )}

                      {/* Totales */}
                      <div className="border-t-2 border-black my-2"></div>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCOP(Number(orden.subtotal))}</span>
                      </div>

                      {Number(orden.descuento) > 0 && (
                        <div className="flex justify-between">
                          <span>Descuento:</span>
                          <span>-{formatCOP(Number(orden.descuento))}</span>
                        </div>
                      )}

                      {orden.costoEnvio && Number(orden.costoEnvio) > 0 && (
                        <div className="flex justify-between">
                          <span>Costo envio:</span>
                          <span>{formatCOP(Number(orden.costoEnvio))}</span>
                        </div>
                      )}

                      {orden.costoAdicional &&
                        Number(orden.costoAdicional) > 0 && (
                          <div className="flex justify-between">
                            <span>Costo adicional:</span>
                            <span>
                              {formatCOP(Number(orden.costoAdicional))}
                            </span>
                          </div>
                        )}

                      <div className="border-t-2 border-black my-2"></div>

                      <div className="flex justify-between font-bold text-base">
                        <span>TOTAL:</span>
                        <span>{formatCOP(Number(orden.total))}</span>
                      </div>

                      <div className="border-t-2 border-black my-2"></div>

                      {/* Estado */}
                      <div className="text-center font-bold">
                        ESTADO: {orden.estado.replace("_", " ")}
                      </div>

                      <div className="text-center mt-4">
                        Gracias por su compra!
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                <Button
                  color="primary"
                  className="bg-wine flex-1"
                  onPress={() => {
                    onClose();
                    handlePrint();
                  }}
                  startContent={<Printer size={18} />}
                >
                  Imprimir ahora
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      scrollBehavior="inside"
      hideCloseButton
    >
      <ModalContent>
        {(onClose) => (
          <>
            {showPreview && <TicketPreview />}

            <ModalHeader className="flex flex-col gap-1 border-b">
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    Obteniendo orden...
                  </span>
                </div>
              ) : !orden ? (
                <h2 className="text-lg font-semibold text-gray-900">
                  Orden no existente
                </h2>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Orden #{orden.id.slice(0, 8).toUpperCase()}
                    </h2>
                    <p className="text-sm text-gray-500 font-normal mt-1">
                      {formatearFecha(orden.creadoEn)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip
                      color={getEstadoColor(orden.estado)}
                      size="lg"
                      variant="flat"
                      className="font-semibold"
                    >
                      {orden.estado.replace("_", " ")}
                    </Chip>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
            </ModalHeader>

            <ModalBody className="py-6">
              {loading ? (
                <div className="flex flex-col justify-center items-center gap-2 py-20">
                  <Spinner size="lg" />
                  <span>Cargando orden...</span>
                </div>
              ) : !orden ? (
                <div className="text-center py-20">
                  <p className="text-gray-500">No se pudo cargar la orden</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Información general */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {getTipoOrdenIcon(orden.tipoOrden)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tipo de orden</p>
                          <p className="font-semibold text-gray-900">
                            {orden.tipoOrden}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-wine/10 rounded-full flex items-center justify-center">
                          <User className="text-wine" size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Atendido por</p>
                          <p className="font-semibold text-gray-900">
                            {orden.mesero?.nombreCompleto || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mesa (LOCAL) */}
                  {orden.tipoOrden === "LOCAL" && orden.mesa && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <MapPin className="text-blue-600 mt-0.5" size={20} />
                        <div>
                          <p className="font-semibold text-blue-900">
                            Mesa {orden.mesa.numero}
                          </p>
                          <p className="text-sm text-blue-700">
                            {orden.mesa.ubicacion}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Domicilio */}
                  {orden.tipoOrden === "DOMICILIO" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
                      <div className="flex items-start gap-3">
                        <Home className="text-green-600 mt-0.5" size={20} />
                        <div className="flex-1">
                          <p className="font-semibold text-green-900">
                            Dirección de entrega
                          </p>
                          <p className="text-sm text-green-700">
                            {orden.direccionEntrega}
                          </p>
                        </div>
                      </div>
                      {(orden.nombreCliente || orden.telefonoCliente) && (
                        <div className="flex items-center gap-3 pl-8">
                          <Phone className="text-green-600" size={16} />
                          <div>
                            {orden.nombreCliente && (
                              <p className="text-sm text-green-900">
                                {orden.nombreCliente}
                              </p>
                            )}
                            {orden.telefonoCliente && (
                              <p className="text-sm text-green-700">
                                {orden.telefonoCliente}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cliente */}
                  {orden.cliente && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Receipt className="text-purple-600 mt-0.5" size={20} />
                        <div>
                          <p className="font-semibold text-purple-900">
                            Cliente registrado
                          </p>
                          <p className="text-sm text-purple-700">
                            {orden.cliente.nombre}
                          </p>
                          {orden.cliente.numeroIdentificacion && (
                            <p className="text-xs text-purple-600">
                              {orden.cliente.tipoIdentificacion}:{" "}
                              {orden.cliente.numeroIdentificacion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">
                      Productos ({orden.items.length})
                    </h3>
                    <div className="space-y-3">
                      {orden.items.map((item: Record<string, unknown>) => (
                        <div
                          key={item.id}
                          className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                        >
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                              <Image
                                fill
                                src={
                                  (item.producto.imagen as string) ||
                                  (item.imagen as string) ||
                                  "/placeholder-producto.png"
                                }
                                alt={item.producto.nombre as string}
                                className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 ${
                                  item.producto.imagen ? "" : "opacity-60"
                                }`}
                                loading="lazy"
                                draggable={false}
                              />
                              {!item.producto.imagen && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                                  {/* You need to import CircleQuestionMark from lucide-react or your icon library */}
                                  <CircleQuestionMark
                                    size={32}
                                    className="text-white opacity-80"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {item.producto.nombre}
                            </h4>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Precio: </span>
                                <span className="font-semibold text-gray-900">
                                  {formatCOP(item.precioUnitario)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Cantidad:{" "}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  x{item.cantidad}
                                </span>
                              </div>
                            </div>
                            {item.notas && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-xs text-yellow-800">
                                  <span className="font-semibold">Nota:</span>{" "}
                                  {item.notas}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-wine text-lg">
                              {formatCOP(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Especificaciones */}
                  {orden.especificaciones && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="font-semibold text-amber-900 mb-2">
                        Especificaciones:
                      </p>
                      <p className="text-sm text-amber-800">
                        {orden.especificaciones}
                      </p>
                    </div>
                  )}

                  {/* Notas */}
                  {orden.notas && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="font-semibold text-gray-900 mb-2">Notas:</p>
                      <p className="text-sm text-gray-700">{orden.notas}</p>
                    </div>
                  )}

                  {/* Totales */}
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-4">
                      Resumen de pago
                    </h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-900">
                          {formatCOP(Number(orden.subtotal))}
                        </span>
                      </div>

                      {Number(orden.descuento) > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Descuento</span>
                          <span className="font-semibold">
                            -{formatCOP(Number(orden.descuento))}
                          </span>
                        </div>
                      )}

                      {orden.costoEnvio && Number(orden.costoEnvio) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Costo de envío</span>
                          <span className="font-semibold">
                            +{formatCOP(Number(orden.costoEnvio))}
                          </span>
                        </div>
                      )}

                      {orden.costoAdicional &&
                        Number(orden.costoAdicional) > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Costo adicional</span>
                            <span className="font-semibold">
                              +{formatCOP(Number(orden.costoAdicional))}
                            </span>
                          </div>
                        )}

                      <div className="flex justify-between pt-3 border-t border-gray-300">
                        <span className="font-bold text-lg text-gray-900">
                          Total
                        </span>
                        <span className="font-bold text-2xl text-wine">
                          {formatCOP(Number(orden.total))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="border-t">
              <Button color="danger" variant="light" onPress={onClose}>
                Cerrar
              </Button>
              <Button
                color="default"
                variant="bordered"
                onPress={() => setShowPreview(true)}
                startContent={<Receipt size={18} />}
              >
                Ver ticket
              </Button>
              <Button
                color="primary"
                className="bg-wine"
                onPress={handlePrint}
                isLoading={printing}
                startContent={!printing && <Printer size={18} />}
              >
                {printing ? "Imprimiendo..." : "Imprimir ticket"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
