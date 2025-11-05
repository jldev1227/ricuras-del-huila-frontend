"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Spinner,
  addToast,
} from "@heroui/react";
import { CheckCircle, Printer, AlertTriangle, Receipt } from "lucide-react";
import { formatCOP } from "@/utils/formatCOP";
import ProductImage from "@/components/productos/ProductImage";
import { Prisma } from "@prisma/client";

type OrdenCompleta = Prisma.ordenesGetPayload<{
  include: {
    orden_items: {
      include: {
        productos: {
          include: {
            categorias: true;
          };
        };
      };
    };
    mesas: true;
    clientes: true;
    sucursales: true;
    usuarios: {
      select: {
        id: true;
        nombre_completo: true;
        rol: true;
      };
    };
    creador: {
      select: {
        id: true;
        nombre_completo: true;
      };
    };
    actualizador: {
      select: {
        id: true;
        nombre_completo: true;
      };
    };
  };
}>;

interface ConfiguracionEmpresa {
  id: string;
  nit: string;
  razon_social: string;
  telefono: string;
  correo?: string | null;
  direccion?: string | null;
  activo: boolean;
}

interface ModalEntregarOrdenProps {
  ordenId: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onOrdenEntregada?: () => void;
}

export default function ModalEntregarOrden({
  ordenId,
  isOpen,
  onOpenChange,
  onOrdenEntregada,
}: ModalEntregarOrdenProps) {
  const [orden, setOrden] = useState<OrdenCompleta | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [entregando, setEntregando] = useState(false);
  const [configEmpresa, setConfigEmpresa] = useState<ConfiguracionEmpresa | null>(null);

  useEffect(() => {
    if (isOpen && ordenId) {
      const fetchOrdenDetalle = async () => {
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

      const fetchConfiguracionEmpresa = async () => {
        try {
          let currentUserId = null;
          try {
            const authStorage = localStorage.getItem("auth-storage");
            if (authStorage) {
              const authData = JSON.parse(authStorage);
              currentUserId = authData?.state?.user?.id;
            }
          } catch (error) {
            console.warn("No se pudo obtener el usuario autenticado:", error);
            return;
          }

          if (!currentUserId) {
            console.warn("No hay usuario autenticado");
            return;
          }

          const response = await fetch(`/api/configuracion/empresa?userId=${currentUserId}`);
          if (response.ok) {
            const data = await response.json();
            setConfigEmpresa(data);
          }
        } catch (error) {
          console.error("Error al cargar configuración de empresa:", error);
        }
      };

      fetchOrdenDetalle();
      fetchConfiguracionEmpresa();
    }
  }, [isOpen, ordenId]);

  const generateESCPOS = async (orden: OrdenCompleta): Promise<Uint8Array> => {
    const commands: number[] = [];

    const encodeText = (text: string): number[] => {
      const bytes: number[] = [];
      for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        const code = text.charCodeAt(i);

        if (code < 128) {
          bytes.push(code);
          continue;
        }

        const map: { [key: string]: number } = {
          'á': 0xa0, 'é': 0x82, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3,
          'Á': 0xb5, 'É': 0x90, 'Í': 0xd6, 'Ó': 0xe0, 'Ú': 0xe9,
          'ñ': 0xa4, 'Ñ': 0xa5,
          '¿': 0xa8, '¡': 0xad, '°': 0xf8, 'º': 0xa7, 'ª': 0xa6,
          '$': 0x24, '€': 0xd5, '¢': 0x9b, '£': 0x9c, '¥': 0x9d,
          '½': 0xab, '¼': 0xac,
          '«': 0xae, '»': 0xaf, '±': 0xf1, '×': 0x9e, '÷': 0xf6,
        };

        if (map[char] !== undefined) {
          bytes.push(map[char]);
        } else {
          bytes.push(0x20);
        }
      }
      return bytes;
    };

    const ESC = 0x1b;
    const GS = 0x1d;
    const INIT = [ESC, 0x40];
    const CENTER = [ESC, 0x61, 0x01];
    const LEFT = [ESC, 0x61, 0x00];
    const BOLD_ON = [ESC, 0x45, 0x01];
    const BOLD_OFF = [ESC, 0x45, 0x00];
    const SIZE_NORMAL = [GS, 0x21, 0x00];
    const SIZE_DOUBLE = [GS, 0x21, 0x11];
    const CUT = [GS, 0x56, 0x00];
    const OPEN_DRAWER = [0x1B, 0x70, 0x00, 0x19, 0xFA]
    const SET_CP850 = [ESC, 0x74, 0x02];

    const addText = (text: string) => commands.push(...encodeText(text));
    const addLine = (char = "-", length = 40) => addText(`${char.repeat(length)}\n`);
    const addRow = (left: string, right: string, width = 40) => {
      const spaces = width - left.length - right.length;
      addText(`${left}${" ".repeat(Math.max(spaces, 1))}${right}\n`);
    };

    commands.push(...INIT);
    commands.push(...SET_CP850);

    // Logo
    const logoBytes = await generateLogoESC("/logo_print.png", 240);
    commands.push(...logoBytes);

    // Encabezado
    commands.push(...CENTER, ...SIZE_DOUBLE, ...BOLD_ON);
    addText(`${configEmpresa?.razon_social || "RICURAS DEL HUILA"}\n`);
    commands.push(...SIZE_NORMAL, ...BOLD_OFF);
    addText(`SEDE: ${orden.sucursales?.nombre || "Principal"}\n`);
    addText(`Tel: ${configEmpresa?.telefono || ""}\n`);
    addText(`NIT: ${configEmpresa?.nit || ""}\n`);
    addText(`${configEmpresa?.direccion || ""}\n`);
    addLine("=");

    // Información orden
    const fecha = new Date(orden.creado_en).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    commands.push(...LEFT);
    addText(`FACTURA #${orden.id.slice(0, 8)}\n`);
    addText(`Fecha: ${fecha}\n`);
    addText(`Tipo: ${orden.tipo_orden}\n`);
    addText(`Mesero: ${orden.usuarios?.nombre_completo || "N/A"}\n`);
    addText(`Metodo: ${orden.metodo_pago}\n`);
    if (orden.mesas) addText(`Mesa: ${orden.mesas.numero}\n`);
    addLine("-");

    if (orden.tipo_orden === "DOMICILIO" && orden.direccion_entrega) {
      commands.push(...BOLD_ON);
      addText("DOMICILIO:\n");
      commands.push(...BOLD_OFF);
      addText(`${orden.direccion_entrega}\n`);
      if (orden.nombre_cliente) addText(`Cliente: ${orden.nombre_cliente}\n`);
      if (orden.telefono_cliente) addText(`Tel: ${orden.telefono_cliente}\n`);
    }

    if (orden.clientes) {
      commands.push(...BOLD_ON);
      addText("CLIENTE:\n");
      commands.push(...BOLD_OFF);
      addText(`${orden.clientes.nombre || ""} ${orden.clientes.apellido || ""}\n`);
      if (orden.clientes.numero_identificacion) {
        addText(`${orden.clientes.tipo_identificacion || "ID"}: ${orden.clientes.numero_identificacion}\n`);
      }
    }

    addLine("=");

    // Productos
    commands.push(...BOLD_ON);
    addText("PRODUCTOS\n");
    commands.push(...BOLD_OFF);
    addLine("-");

    orden.orden_items.forEach((item, index) => {
      const nombre = item.productos.nombre.substring(0, 38);
      addText(`${nombre}\n`);

      const cantidad = `  ${item.cantidad} x ${formatCOP(Number(item.precio_unitario))}`;
      const subtotal = formatCOP(Number(item.subtotal));
      addRow(cantidad, subtotal);

      if (item.notas) addText(`  Nota: ${item.notas}\n`);
      if (index < orden.orden_items.length - 1) addText("\n");
    });

    addLine("-");

    if (orden.especificaciones) {
      commands.push(...BOLD_ON);
      addText("ESPECIFICACIONES:\n");
      commands.push(...BOLD_OFF);
      addText(`${orden.especificaciones}\n\n`);
    }

    if (orden.notas) {
      commands.push(...BOLD_ON);
      addText("NOTAS:\n");
      commands.push(...BOLD_OFF);
      addText(`${orden.notas}\n\n`);
    }

    addLine("=");
    addRow("Subtotal:", formatCOP(Number(orden.subtotal)));

    if (Number(orden.descuento) > 0)
      addRow("Descuento:", `-${formatCOP(Number(orden.descuento))}`);
    if (orden.costo_envio && Number(orden.costo_envio) > 0)
      addRow("Costo envio:", formatCOP(Number(orden.costo_envio)));
    if (orden.costo_adicional && Number(orden.costo_adicional) > 0)
      addRow("Costo adicional:", formatCOP(Number(orden.costo_adicional)));

    addLine("=");

    commands.push(...BOLD_ON, ...SIZE_DOUBLE);
    addRow("TOTAL:", formatCOP(Number(orden.total)));
    commands.push(...SIZE_NORMAL, ...BOLD_OFF);

    addLine("=");

    commands.push(...CENTER);
    addText("\nGracias por su compra!\n");
    addText("ORDEN ENTREGADA\n");
    addText("\n\n\n\n\n");

    commands.push(...CUT);
    commands.push(...OPEN_DRAWER)

    return new Uint8Array(commands);
  };

  const generateLogoESC = async (src: string, width: number): Promise<number[]> => {
    const img = new Image();
    img.src = src;
    await img.decode();

    const canvas = document.createElement("canvas");
    const aspect = img.width / img.height;
    canvas.width = width;
    canvas.height = Math.round(width / aspect);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const bytes: number[] = [];

    bytes.push(0x1b, 0x61, 0x01);
    for (let y = 0; y < canvas.height; y += 24) {
      bytes.push(0x1b, 0x2a, 33, canvas.width & 0xff, (canvas.width >> 8) & 0xff);
      for (let x = 0; x < canvas.width; x++) {
        for (let k = 0; k < 3; k++) {
          let byte = 0;
          for (let b = 0; b < 8; b++) {
            const yy = y + k * 8 + b;
            const idx = (yy * canvas.width + x) * 4;
            if (yy >= canvas.height) continue;
            const [r, g, bl] = [imageData[idx], imageData[idx + 1], imageData[idx + 2]];
            const gray = 0.3 * r + 0.59 * g + 0.11 * bl;
            if (gray < 128) byte |= 1 << (7 - b);
          }
          bytes.push(byte);
        }
      }
      bytes.push(0x0a);
    }
    bytes.push(0x0a);
    return bytes;
  };

  const handlePrint = async () => {
    if (!orden) return;
    setPrinting(true);
    try {
      const escposData = await generateESCPOS(orden);

      if ("serial" in navigator && navigator.serial) {
        const ports = await (navigator.serial as any).getPorts();
        let port = ports[0];
        if (!port) port = await (navigator.serial as any).requestPort();
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        await writer.write(escposData);
        writer.releaseLock();
        await port.close();
        addToast({
          title: "🖨️ Factura impresa correctamente",
          description: "La factura se ha enviado a la impresora.",
          color: "success",
        });
      } else {
        const blob = new Blob([new Uint8Array(escposData)], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `factura-${orden.id}.bin`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      addToast({
        title: "⚠️ Error al imprimir",
        description: "Ocurrió un error al intentar imprimir la factura.",
        color: "danger",
      });
    } finally {
      setPrinting(false);
    }
  };

  const handleEntregarOrden = async () => {
    if (!orden) return;
    setEntregando(true);

    try {
      const response = await fetch(`/api/ordenes/${orden.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: "ENTREGADA",
        }),
      });

      if (!response.ok) throw new Error("Error al entregar la orden");

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      addToast({
        title: "✅ Orden entregada",
        description: `Orden #${orden.id.slice(0, 8)} marcada como entregada`,
        color: "success",
      });

      onOrdenEntregada?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al entregar orden:", error);
      addToast({
        title: "Error al entregar orden",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        color: "danger",
      });
    } finally {
      setEntregando(false);
    }
  };

  const handleCerrarModal = () => {
    // Para órdenes LLEVAR, ya están marcadas como entregadas por el backend
    // Solo cerrar el modal y llamar onOrdenEntregada para limpiar el POS
    onOpenChange(false);
    onOrdenEntregada?.();
  };

  const getTipoOrdenIcon = (tipo: string) => {
    const iconos: Record<string, string> = {
      LOCAL: "🍽️",
      LLEVAR: "🥡",
      DOMICILIO: "🚚",
    };
    return iconos[tipo] || "📋";
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      hideCloseButton
      isDismissable={false}
      backdrop="blur"
    >
      <ModalContent>
        {(onClose: () => void) => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b bg-gradient-to-r from-green-50 to-blue-50">
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    Cargando orden...
                  </span>
                </div>
              ) : !orden ? (
                <h2 className="text-lg font-semibold text-gray-900">
                  Orden no encontrada
                </h2>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {orden.tipo_orden === "LLEVAR" 
                        ? "¡Orden para llevar lista!" 
                        : "¡Orden creada exitosamente!"
                      }
                    </h2>
                    <p className="text-sm text-gray-600">
                      Orden #{orden.id.slice(0, 8).toUpperCase()} • {getTipoOrdenIcon(orden.tipo_orden)} {orden.tipo_orden}
                    </p>
                  </div>
                </div>
              )}
            </ModalHeader>

            <ModalBody className="py-6">
              {loading ? (
                <div className="flex flex-col justify-center items-center gap-2 py-10">
                  <Spinner size="lg" />
                  <span>Cargando orden...</span>
                </div>
              ) : !orden ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No se pudo cargar la orden</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Alerta de confirmación */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                      <div className="flex-1">
                        {orden.tipo_orden === "LLEVAR" ? (
                          <>
                            <h3 className="font-semibold text-amber-900 mb-1">
                              ¡Orden lista para entregar!
                            </h3>
                            <p className="text-sm text-amber-800">
                              La orden para llevar ha sido creada correctamente. Puede imprimir la factura para el cliente.
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="font-semibold text-amber-900 mb-1">
                              ¿Desea entregar esta orden ahora?
                            </h3>
                            <p className="text-sm text-amber-800">
                              La orden ha sido creada correctamente. Puede imprimirla y marcarla como entregada
                              si el cliente ya está esperando su pedido.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resumen de la orden */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getTipoOrdenIcon(orden.tipo_orden)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Tipo de orden</p>
                          <p className="text-sm text-gray-600">{orden.tipo_orden}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Receipt className="text-green-600" size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Total</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCOP(Number(orden.total))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cliente (si existe) */}
                  {orden.clientes && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Receipt className="text-blue-600 mt-0.5" size={20} />
                        <div>
                          <p className="font-semibold text-blue-900 mb-1">Cliente facturado</p>
                          <p className="text-sm text-blue-800">
                            {orden.clientes.nombre} {orden.clientes.apellido}
                          </p>
                          {orden.clientes.numero_identificacion && (
                            <p className="text-xs text-blue-700">
                              {orden.clientes.tipo_identificacion}: {orden.clientes.numero_identificacion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mesa (si aplica) */}
                  {orden.tipo_orden === "LOCAL" && orden.mesas && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="text-purple-600 mt-0.5">🍽️</div>
                        <div>
                          <p className="font-semibold text-purple-900 mb-1">Mesa asignada</p>
                          <p className="text-sm text-purple-800">
                            Mesa {orden.mesas.numero}
                            {orden.mesas.ubicacion && ` - ${orden.mesas.ubicacion}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Productos */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">
                      Productos ({orden.orden_items.length})
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {orden.orden_items.map((item) => (
                        <div
                          key={item.id as string}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="w-12 h-12 relative flex-shrink-0">
                            <ProductImage
                              imagePath={item.productos.imagen}
                              productName={item.productos.nombre}
                              className="rounded-lg"
                              fill
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.productos.nombre}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.cantidad} x {formatCOP(Number(item.precio_unitario))}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCOP(Number(item.subtotal))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estado actual */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Estado actual</p>
                        <p className="text-sm text-gray-600">
                          {orden.tipo_orden === "LLEVAR" 
                            ? "La orden ya está marcada como entregada y lista para el cliente"
                            : "La orden está pendiente de entrega"
                          }
                        </p>
                      </div>
                      <Chip
                        color={orden.estado === "ENTREGADA" ? "success" : "warning"}
                        size="lg"
                        variant="flat"
                        className="font-semibold"
                      >
                        {orden.estado.replace("_", " ")}
                      </Chip>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="border-t bg-gray-50">
              <Button 
                color="default" 
                variant="light" 
                onPress={handleCerrarModal}
                disabled={entregando}
              >
                {orden?.tipo_orden === "LLEVAR" ? "Finalizar" : "Cerrar"}
              </Button>
              
              <Button
                color="primary"
                variant="bordered"
                onPress={handlePrint}
                isLoading={printing}
                disabled={entregando}
                startContent={!printing && <Printer size={18} />}
              >
                {printing ? "Imprimiendo..." : "Imprimir factura"}
              </Button>

              {orden && orden.tipo_orden !== "LLEVAR" && (
                <Button
                  color="success"
                  className="bg-green-600"
                  onPress={handleEntregarOrden}
                  isLoading={entregando}
                  disabled={printing}
                  startContent={!entregando && <CheckCircle size={18} />}
                >
                  {entregando ? "Entregando..." : "Entregar orden"}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}