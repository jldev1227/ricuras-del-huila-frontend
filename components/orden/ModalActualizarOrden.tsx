import {
  addToast,
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
  Select,
  SelectItem,
} from "@heroui/react";
import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import ModalSeleccionarMesa from "./ModalSeleccionarMesa";

interface ModalActualizarOrdenProps {
  ordenId: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onOrdenActualizada?: () => void;
}

export default function ModalActualizarOrden({
  ordenId,
  isOpen,
  onOpenChange,
  onOrdenActualizada,
}: ModalActualizarOrdenProps) {
  const [orden, setOrden] = useState<{
    id: string;
    estado: string;
    especificaciones?: string;
    notas?: string;
    items?: Array<{
      id: string;
      cantidad: number;
      precio: number;
      producto: { nombre: string };
    }>;
    tipoOrden: string;
    subtotal: number;
    mesa_id?: string;
    mesero_id?: string;
    cliente_id?: string;
    metodo_pago?: string;
    mesas?: { numero: number };
    usuarios?: { nombre: string };
    clientes?: { nombre: string };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estados editables
  const [especificaciones, setEspecificaciones] = useState("");
  const [notas, setNotas] = useState("");
  const [descuento, setDescuento] = useState<number>(0);
  const [costoAdicional, setCostoAdicional] = useState<number>(0);
  const [costoEnvio, setCostoEnvio] = useState<number>(0);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<any>(null);
  const [meseroSeleccionado, setMeseroSeleccionado] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  
  // Estados para datos auxiliares
  const [meseros, setMeseros] = useState<Array<{id: string, nombre: string}>>([]);
  const [clientes, setClientes] = useState<Array<{id: string, nombre: string}>>([]);

  const estadosPermitidosParaEditar = ["PENDIENTE", "EN_PREPARACION"];

  useEffect(() => {
    const fetchOrden = async () => {
      if (!ordenId) return;

      setLoading(true);
      try {
        // Cargar datos en paralelo
        const [ordenResponse, meserosResponse, clientesResponse] = await Promise.all([
          fetch(`/api/ordenes/${ordenId}`),
          fetch('/api/usuarios?rol=MESERO'),
          fetch('/api/clientes')
        ]);

        const ordenData = await ordenResponse.json();
        const meserosData = await meserosResponse.json();
        const clientesData = await clientesResponse.json();

        if (ordenData.success) {
          setOrden(ordenData.orden);
          setEspecificaciones(ordenData.orden.especificaciones || "");
          setNotas(ordenData.orden.notas || "");
          setDescuento(Number(ordenData.orden.descuento) || 0);
          setCostoAdicional(Number(ordenData.orden.costoAdicional) || 0);
          setCostoEnvio(Number(ordenData.orden.costoEnvio) || 0);
          setMeseroSeleccionado(ordenData.orden.mesero_id || "");
          setMetodoPago(ordenData.orden.metodo_pago || "");
          setNombreCliente(ordenData.orden.clientes?.nombre || "");
        }

        if (meserosData.success) {
          setMeseros(meserosData.usuarios || []);
        }

        if (clientesData.success) {
          setClientes(clientesData.clientes || []);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        addToast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && ordenId) {
      fetchOrden();
    }
  }, [isOpen, ordenId]);

  const puedeEditar = () => {
    if (!orden) return false;
    return estadosPermitidosParaEditar.includes(orden.estado);
  };

  const handleActualizar = async () => {
    if (!orden || !puedeEditar()) return;

    setGuardando(true);
    try {
      const payload: any = {
        especificaciones,
        notas,
        descuento: Number(descuento),
      };

      // Agregar campos opcionales según el tipo de orden
      if (orden.tipoOrden === "LLEVAR") {
        payload.costoAdicional = Number(costoAdicional);
      }
      
      if (orden.tipoOrden === "DOMICILIO") {
        payload.costoEnvio = Number(costoEnvio);
      }

      // Agregar nuevos campos editables
      if (mesaSeleccionada) {
        payload.mesa_id = mesaSeleccionada.id;
      }
      
      if (meseroSeleccionado) {
        payload.mesero_id = meseroSeleccionado;
      }
      
      if (metodoPago) {
        payload.metodo_pago = metodoPago;
      }

      const response = await fetch(`/api/ordenes/${ordenId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        addToast({
          title: "Orden actualizada",
          description: "La orden se actualizó correctamente",
          color: "success",
        });

        if (onOrdenActualizada) {
          onOrdenActualizada();
        }

        onOpenChange(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error: unknown) {
      addToast({
        title: "Error al actualizar",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado",
      });
    } finally {
      setGuardando(false);
    }
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

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      hideCloseButton
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center justify-between border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Actualizar Orden
                </h2>
                {orden && (
                  <p className="text-sm text-gray-500 font-normal">
                    #{orden.id.slice(0, 8).toUpperCase()}
                  </p>
                )}
              </div>
              <Button isIconOnly size="sm" variant="light" onPress={onClose}>
                <X className="w-5 h-5 text-gray-400" />
              </Button>
            </ModalHeader>

            <ModalBody className="py-6">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Spinner size="lg" />
                </div>
              ) : !orden ? (
                <div className="text-center py-20">
                  <p className="text-gray-500">No se pudo cargar la orden</p>
                </div>
              ) : !puedeEditar() ? (
                <div className="py-10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="text-red-600" size={32} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No se puede editar esta orden
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Solo se pueden editar órdenes en estado{" "}
                        <strong>PENDIENTE</strong> o{" "}
                        <strong>EN PREPARACIÓN</strong>
                      </p>
                      <Chip
                        color={getEstadoColor(orden.estado)}
                        size="lg"
                        variant="flat"
                      >
                        Estado actual: {orden.estado.replace("_", " ")}
                      </Chip>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Info de estado */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div>
                      <p className="text-sm text-blue-900 font-semibold">
                        Estado de la orden
                      </p>
                      <p className="text-xs text-blue-700">
                        Esta orden puede ser editada
                      </p>
                    </div>
                    <Chip color={getEstadoColor(orden.estado)} variant="flat">
                      {orden.estado.replace("_", " ")}
                    </Chip>
                  </div>

                  {/* Especificaciones */}
                  <div>
                    <label
                      htmlFor="especificaciones"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Especificaciones de la orden
                    </label>
                    <Textarea
                      id="especificaciones"
                      placeholder="Detalles especiales, alergias, preferencias..."
                      value={especificaciones}
                      onValueChange={setEspecificaciones}
                      minRows={3}
                      maxRows={6}
                    />
                  </div>

                  {/* Selección de Mesa (solo para órdenes LOCAL) */}
                  {orden.tipoOrden === "LOCAL" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mesa asignada
                      </label>
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-sm text-gray-600">
                            Mesa actual: #{orden.mesas?.numero || 'Sin asignar'}
                          </p>
                        </div>
                        <ModalSeleccionarMesa
                          mesaSeleccionada={mesaSeleccionada?.id || null}
                          onSelectMesa={setMesaSeleccionada}
                          mesaActualId={orden.mesa_id}
                        />
                      </div>
                    </div>
                  )}

                  {/* Selección de Mesero */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mesero asignado
                    </label>
                    <Select
                      placeholder="Seleccionar mesero"
                      selectedKeys={meseroSeleccionado ? [meseroSeleccionado] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setMeseroSeleccionado(selected || "");
                      }}
                      items={[{id: "", nombre: "Sin asignar"}, ...meseros]}
                    >
                      {(mesero) => <SelectItem key={mesero.id}>{mesero.nombre}</SelectItem>}
                    </Select>
                    {orden.usuarios?.nombre && (
                      <p className="text-xs text-gray-500 mt-1">
                        Mesero actual: {orden.usuarios.nombre}
                      </p>
                    )}
                  </div>

                  {/* Método de Pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de pago
                    </label>
                    <Select
                      placeholder="Seleccionar método de pago"
                      selectedKeys={metodoPago ? [metodoPago] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setMetodoPago(selected || "");
                      }}
                      items={[
                        {id: "EFECTIVO", nombre: "Efectivo"},
                        {id: "TARJETA", nombre: "Tarjeta"},
                        {id: "TRANSFERENCIA", nombre: "Transferencia"},
                        {id: "QR", nombre: "Código QR"}
                      ]}
                    >
                      {(metodo) => <SelectItem key={metodo.id}>{metodo.nombre}</SelectItem>}
                    </Select>
                    {orden.metodo_pago && (
                      <p className="text-xs text-gray-500 mt-1">
                        Método actual: {orden.metodo_pago}
                      </p>
                    )}
                  </div>

                  {/* Cliente (solo mostrar nombre, no editable directamente) */}
                  {orden.clientes?.nombre && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cliente
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm text-gray-900">{orden.clientes.nombre}</p>
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  <div>
                    <label
                      htmlFor="notas"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Notas internas
                    </label>
                    <Textarea
                      id="notas"
                      placeholder="Notas para el personal..."
                      value={notas}
                      onValueChange={setNotas}
                      minRows={2}
                      maxRows={4}
                    />
                  </div>

                  {/* Descuento */}
                  <div>
                    <label
                      htmlFor="descuento"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Descuento
                    </label>
                    <Input
                      id="descuento"
                      type="number"
                      placeholder="0"
                      value={descuento.toString()}
                      onValueChange={(value) =>
                        setDescuento(Number(value) || 0)
                      }
                      min="0"
                      max={Number(orden.subtotal)}
                      startContent={<span className="text-gray-500">$</span>}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo: ${Number(orden.subtotal).toLocaleString("es-CO")}
                    </p>
                  </div>

                  {/* Costo adicional (solo para LLEVAR) */}
                  {orden.tipoOrden === "LLEVAR" && (
                    <div>
                      <label
                        htmlFor="costoAdicional"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Costo adicional
                      </label>
                      <Input
                        id="costoAdicional"
                        type="number"
                        placeholder="0"
                        value={costoAdicional.toString()}
                        onValueChange={(value) =>
                          setCostoAdicional(Number(value) || 0)
                        }
                        min="0"
                        startContent={<span className="text-gray-500">$</span>}
                      />
                    </div>
                  )}

                  {/* Costo de envío (solo para DOMICILIO) */}
                  {orden.tipoOrden === "DOMICILIO" && (
                    <div>
                      <label
                        htmlFor="costoEnvio"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Costo de envío
                      </label>
                      <Input
                        id="costoEnvio"
                        type="number"
                        placeholder="0"
                        value={costoEnvio.toString()}
                        onValueChange={(value) =>
                          setCostoEnvio(Number(value) || 0)
                        }
                        min="0"
                        startContent={<span className="text-gray-500">$</span>}
                      />
                    </div>
                  )}

                  {/* Resumen de cambios */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Nuevo total
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">
                          ${Number(orden.subtotal).toLocaleString("es-CO")}
                        </span>
                      </div>
                      {descuento > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Descuento</span>
                          <span className="font-semibold">
                            -${descuento.toLocaleString("es-CO")}
                          </span>
                        </div>
                      )}
                      {orden.tipoOrden === "LLEVAR" && costoAdicional > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Costo adicional</span>
                          <span className="font-semibold">
                            +${costoAdicional.toLocaleString("es-CO")}
                          </span>
                        </div>
                      )}
                      {orden.tipoOrden === "DOMICILIO" && costoEnvio > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Costo de envío</span>
                          <span className="font-semibold">
                            +${costoEnvio.toLocaleString("es-CO")}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t font-bold text-lg">
                        <span>Total</span>
                        <span className="text-wine">
                          $
                          {(
                            Number(orden.subtotal) -
                            descuento +
                            (orden.tipoOrden === "LLEVAR"
                              ? costoAdicional
                              : 0) +
                            (orden.tipoOrden === "DOMICILIO" ? costoEnvio : 0)
                          ).toLocaleString("es-CO")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="border-t">
              <Button color="danger" variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button
                color="primary"
                className="bg-wine"
                onPress={handleActualizar}
                isDisabled={!puedeEditar() || guardando}
                isLoading={guardando}
              >
                {guardando ? "Guardando..." : "Actualizar orden"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
