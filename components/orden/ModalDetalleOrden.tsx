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
import { useEffect, useState } from "react";
import { formatCOP } from "@/utils/formatCOP";
import ProductImage from "../productos/ProductImage";

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
  const [configEmpresa, setConfigEmpresa] = useState<ConfiguracionEmpresa | null>(null);

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

      // Función para cargar configuración de empresa
      const fetchConfiguracionEmpresa = async () => {
        try {
          // Obtener el userId del localStorage
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

  // utils/printTicket.ts
  const generateESCPOS = async (orden: OrdenCompleta): Promise<Uint8Array> => {
    const encoder = new TextEncoder();
    const commands: number[] = [];

    // --- Constantes ESC/POS ---
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

    const addText = (text: string) => commands.push(...Array.from(encoder.encode(text)));
    const addLine = (char = "-", length = 40) => addText(`${char.repeat(length)}\n`);
    const addRow = (left: string, right: string, width = 40) => {
      const spaces = width - left.length - right.length;
      addText(`${left}${" ".repeat(Math.max(spaces, 1))}${right}\n`);
    };

    commands.push(...INIT);

    // === 🖼️ IMAGEN DEL LOGO ===
    const logoBytes = await generateLogoESC("/logo_print.png", 240); // 240 px ≈ 3 cm
    commands.push(...logoBytes);

    // === 🧾 ENCABEZADO ===
    commands.push(...CENTER, ...SIZE_DOUBLE, ...BOLD_ON);
    addText(`${configEmpresa?.razon_social || "RICURAS DEL HUILA"}\n`);
    commands.push(...SIZE_NORMAL, ...BOLD_OFF);
    addText(`SEDE: ${orden.sucursales?.nombre || "Principal"}\n`);
    addText(`Tel: ${configEmpresa?.telefono || ""}\n`);
    addText(`NIT: ${configEmpresa?.nit || ""}\n`);
    addText(`${configEmpresa?.direccion || ""}\n`);
    addLine("=");

    // === INFORMACIÓN ORDEN ===
    const fecha = new Date(orden.creado_en).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    commands.push(...LEFT);
    addText(`ORDEN #${orden.id.slice(0, 8)}\n`);
    addText(`Fecha: ${fecha}\n`);
    addText(`Tipo: ${orden.tipo_orden}\n`);
    addText(`Mesero: ${orden.usuarios?.nombre_completo || "N/A"}\n`);
    addText(`Método: ${orden.metodo_pago}\n`);
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
      addText(`${orden.clientes.nombre} ${orden.clientes.apellido}\n`);
      if (orden.clientes.numero_identificacion) {
        addText(`${orden.clientes.tipo_identificacion}: ${orden.clientes.numero_identificacion}\n`);
      }
    }

    addLine("=");

    // === PRODUCTOS ===
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

    if (Number(orden.descuento) > 0) addRow("Descuento:", `-${formatCOP(Number(orden.descuento))}`);
    if (orden.costo_envio && Number(orden.costo_envio) > 0)
      addRow("Costo envío:", formatCOP(Number(orden.costo_envio)));
    if (orden.costo_adicional && Number(orden.costo_adicional) > 0)
      addRow("Costo adicional:", formatCOP(Number(orden.costo_adicional)));

    addLine("=");

    commands.push(...BOLD_ON, ...SIZE_DOUBLE);
    addRow("TOTAL:", formatCOP(Number(orden.total)));
    commands.push(...SIZE_NORMAL, ...BOLD_OFF);

    addLine("=");
    commands.push(...CENTER, ...BOLD_ON);
    addText(`ESTADO: ${orden.estado.replace("_", " ")}\n`);
    commands.push(...BOLD_OFF);
    addText("\nGracias por su compra!\n\n\n");
    commands.push(...CUT);

    return new Uint8Array(commands);
  };

  // === 🎨 Convertir logo a bytes ESC/POS ===
  const generateLogoESC = async (src: string, width: number): Promise<number[]> => {
    const img = new Image();
    img.src = src;
    await img.decode();

    // --- Dibujar en canvas ---
    const canvas = document.createElement("canvas");
    const aspect = img.width / img.height;
    canvas.width = width;
    canvas.height = Math.round(width / aspect);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const bytes: number[] = [];

    // ESC/POS Header
    bytes.push(0x1b, 0x61, 0x01); // Centrar
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

      if ("serial" in navigator) {
        const ports = await navigator.serial.getPorts();
        let port = ports[0];
        if (!port) port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        await writer.write(escposData);
        writer.releaseLock();
        await port.close();
        alert("🖨️ Ticket impreso correctamente");
      } else {
        const blob = new Blob([escposData], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ticket-${orden.id}.bin`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error al imprimir");
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

    const fecha = new Date(orden.creado_en).toLocaleString("es-CO", {
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
                      {/* Logo */}
                      <div className="text-center mb-2">
                        <div className="w-20 h-20 mx-auto mb-2 relative">
                          {/* <Image
                            src="/logo.png"
                            alt="Logo"
                            fill
                            className="object-contain"
                          /> */}
                        </div>
                      </div>

                      <div className="text-center font-bold text-lg mb-1">
                        {configEmpresa?.razon_social || "RICURAS DEL HUILA"}
                      </div>
                      <div className="text-center">
                        {orden.sucursales?.nombre || "Sucursal Principal"}
                      </div>
                      {configEmpresa?.telefono && (
                        <div className="text-center">Tel: {configEmpresa.telefono}</div>
                      )}
                      {configEmpresa?.nit && (
                        <div className="text-center">NIT: {configEmpresa.nit}</div>
                      )}
                      {configEmpresa?.direccion && (
                        <div className="text-center">{configEmpresa.direccion}</div>
                      )}
                      <div className="border-t-2 border-black my-2"></div>                      {/* Información de la orden */}
                      <div className="font-bold">
                        ORDEN #{orden.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div>Fecha: {fecha}</div>
                      <div>Tipo: {orden.tipo_orden}</div>
                      <div>
                        Mesero: {orden.usuarios?.nombre_completo || "N/A"}
                      </div>
                      {orden.metodo_pago && (
                        <div>Método pago: {orden.metodo_pago}</div>
                      )}

                      {/* Mesa */}
                      {orden.tipo_orden === "LOCAL" && orden.mesas && (
                        <div>
                          Mesa: {orden.mesas.numero} - {orden.mesas.ubicacion}
                        </div>
                      )}

                      {/* Domicilio */}
                      {orden.tipo_orden === "DOMICILIO" &&
                        orden.direccion_entrega && (
                          <>
                            <div className="font-bold mt-2">DOMICILIO:</div>
                            <div>{orden.direccion_entrega}</div>
                            {orden.nombre_cliente && (
                              <div>Cliente: {orden.nombre_cliente}</div>
                            )}
                            {orden.telefono_cliente && (
                              <div>Tel: {orden.telefono_cliente}</div>
                            )}
                          </>
                        )}

                      {/* Cliente */}
                      {orden.clientes && (
                        <>
                          <div className="font-bold mt-2">CLIENTE:</div>
                          <div>{orden.clientes.nombre} {orden.clientes.apellido}</div>
                          {orden.clientes.numero_identificacion && (
                            <div>
                              {orden.clientes.tipo_identificacion}:{" "}
                              {orden.clientes.numero_identificacion}
                            </div>
                          )}
                        </>
                      )}

                      <div className="border-t-2 border-black my-2"></div>

                      {/* Productos */}
                      <div className="font-bold">PRODUCTOS</div>
                      <div className="border-t border-dashed border-gray-400 my-1"></div>

                      {orden.orden_items.map((item, _index: number) => (
                        <div key={item.id as string} className="mb-2">
                          <div>{item.productos.nombre.substring(0, 38)}</div>
                          <div className="flex justify-between">
                            <span>
                              {" "}
                              {item.cantidad} x{" "}
                              {formatCOP(Number(item.precio_unitario))}
                            </span>
                            <span>{formatCOP(Number(item.subtotal))}</span>
                          </div>
                          {item.notas && (
                            <div className="text-gray-600">
                              {" "}
                              Nota: {item.notas}
                            </div>
                          )}
                        </div>
                      ))}

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

                      {orden.costo_envio && Number(orden.costo_envio) > 0 && (
                        <div className="flex justify-between">
                          <span>Costo envio:</span>
                          <span>{formatCOP(Number(orden.costo_envio))}</span>
                        </div>
                      )}

                      {orden.costo_adicional &&
                        Number(orden.costo_adicional) > 0 && (
                          <div className="flex justify-between">
                            <span>Costo adicional:</span>
                            <span>
                              {formatCOP(Number(orden.costo_adicional))}
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
                  <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="w-12 h-12 relative flex-shrink-0">
                      {/* <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                      /> */}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Orden #{orden.id.slice(0, 8).toUpperCase()}
                      </h2>
                      <p className="text-sm text-gray-500 font-normal mt-1">
                        {formatearFecha(orden.creado_en)}
                      </p>
                      {configEmpresa && (
                        <p className="text-xs text-gray-400">
                          {configEmpresa.razon_social}
                        </p>
                      )}
                    </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {getTipoOrdenIcon(orden.tipo_orden)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tipo de orden</p>
                          <p className="font-semibold text-gray-900">
                            {orden.tipo_orden}
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
                            {orden.usuarios?.nombre_completo || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Receipt className="text-green-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Método de pago</p>
                          <p className="font-semibold text-gray-900">
                            {orden.metodo_pago || "No especificado"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mesa (LOCAL) */}
                  {orden.tipo_orden === "LOCAL" && orden.mesas && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <MapPin className="text-blue-600 mt-0.5" size={20} />
                        <div>
                          <p className="font-semibold text-blue-900">
                            Mesa {orden.mesas.numero}
                          </p>
                          <p className="text-sm text-blue-700">
                            {orden.mesas.ubicacion}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Domicilio */}
                  {orden.tipo_orden === "DOMICILIO" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
                      <div className="flex items-start gap-3">
                        <Home className="text-green-600 mt-0.5" size={20} />
                        <div className="flex-1">
                          <p className="font-semibold text-green-900">
                            Dirección de entrega
                          </p>
                          <p className="text-sm text-green-700">
                            {orden.direccion_entrega}
                          </p>
                        </div>
                      </div>
                      {(orden.nombre_cliente || orden.telefono_cliente) && (
                        <div className="flex items-center gap-3 pl-8">
                          <Phone className="text-green-600" size={16} />
                          <div>
                            {orden.nombre_cliente && (
                              <p className="text-sm text-green-900">
                                {orden.nombre_cliente}
                              </p>
                            )}
                            {orden.telefono_cliente && (
                              <p className="text-sm text-green-700">
                                {orden.telefono_cliente}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cliente */}
                  {orden.clientes && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Receipt className="text-purple-600 mt-0.5" size={20} />
                        <div>
                          <p className="font-semibold text-purple-900">
                            Cliente registrado
                          </p>
                          <p className="text-sm text-purple-700">
                            {orden.clientes.nombre} {orden.clientes.apellido}
                          </p>
                          {orden.clientes.numero_identificacion && (
                            <p className="text-xs text-purple-600">
                              {orden.clientes.tipo_identificacion}:{" "}
                              {orden.clientes.numero_identificacion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">
                      Productos ({orden.orden_items.length})
                    </h3>
                    <div className="space-y-3">
                      {orden.orden_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                        >
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                              <ProductImage
                                imagePath={item.productos.imagen}
                                productName={item.productos.nombre}
                                width={200}
                                height={150}
                                className="rounded-lg"
                              />
                              {!item.productos.imagen && (
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
                              {item.productos.nombre}
                            </h4>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Precio: </span>
                                <span className="font-semibold text-gray-900">
                                  {formatCOP(Number(item.precio_unitario))}
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
                              {formatCOP(Number(item.subtotal))}
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

                      {orden.costo_envio && Number(orden.costo_envio) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Costo de envío</span>
                          <span className="font-semibold">
                            +{formatCOP(Number(orden.costo_envio))}
                          </span>
                        </div>
                      )}

                      {orden.costo_adicional &&
                        Number(orden.costo_adicional) > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Costo adicional</span>
                            <span className="font-semibold">
                              +{formatCOP(Number(orden.costo_adicional))}
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

                  {/* Información de auditoría */}
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-4">
                      Información de auditoría
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Creador */}
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                            <User className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <p className="text-sm text-blue-600">Creado por</p>
                            <p className="font-semibold text-blue-900">
                              {orden.creador?.nombre_completo || "Sistema"}
                            </p>
                            <p className="text-xs text-blue-600">
                              {formatearFecha(orden.creado_en)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Última actualización */}
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                            <User className="text-green-600" size={20} />
                          </div>
                          <div>
                            <p className="text-sm text-green-600">Actualizado por</p>
                            <p className="font-semibold text-green-900">
                              {orden.actualizador?.nombre_completo || "Sistema"}
                            </p>
                            <p className="text-xs text-green-600">
                              {formatearFecha(orden.actualizado_en)}
                            </p>
                          </div>
                        </div>
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
