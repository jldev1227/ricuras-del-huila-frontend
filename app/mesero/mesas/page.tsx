"use client";

import {
  Button,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  addToast
} from "@heroui/react";
import { Users, CheckCircle, AlertCircle, Plus, Eye, X, Package, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSucursal } from "@/hooks/useSucursal";
import { formatCOP } from "@/utils/formatCOP";

interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  disponible: boolean;
  activa: boolean;
  ordenActual?: {
    id: string;
    numeroOrden: string;
    estado: string;
    total: number;
    subtotal?: number;
    creadoEn: string;
    meseroId: string;
    especificaciones?: string;
    mesero: {
      nombre_completo: string;
    };
    items?: {
      id: string;
      cantidad: number;
      precioUnitario: number;
      producto: {
        id: string;
        nombre: string;
        imagen?: string;
      };
    }[];
  };
}

export default function MeseroMesasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { sucursal } = useSucursal();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [liberandoMesa, setLiberandoMesa] = useState(false);

  // Obtener mesas de la sucursal
  const fetchMesas = useCallback(async () => {
    try {
      if (!sucursal?.id) return;

      const response = await fetch(`/api/mesas?sucursalId=${sucursal.id}`);

      if (response.ok) {
        const data = await response.json();
        setMesas(data.mesas || []);
      }
    } catch (error) {
      console.error("Error al cargar mesas:", error);
    } finally {
      setLoading(false);
    }
  }, [sucursal?.id]);

  useEffect(() => {
    fetchMesas();
  }, [fetchMesas]);

  // Obtener detalles completos de una mesa
  const fetchDetallesMesa = async (mesa: Mesa) => {
    setLoadingDetalles(true);
    try {
      if (mesa.ordenActual) {
        const response = await fetch(`/api/ordenes/${mesa.ordenActual.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMesaSeleccionada({
              ...mesa,
              ordenActual: {
                ...mesa.ordenActual,
                items: data.orden.items || [],
                subtotal: data.orden.subtotal,
                especificaciones: data.orden.especificaciones
              }
            });
          }
        }
      } else {
        setMesaSeleccionada(mesa);
      }
      onOpen();
    } catch (error) {
      console.error("Error al cargar detalles de la mesa:", error);
    } finally {
      setLoadingDetalles(false);
    }
  };

  // Liberar mesa (solo si es del mesero)
  const liberarMesa = async (mesaId: string) => {
    setLiberandoMesa(true);
    try {
      const response = await fetch(`/api/mesas/${mesaId}/liberar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meseroId: user?.id
        })
      });

      const data = await response.json();

      if (data.success) {
        addToast({
          title: "Mesa liberada",
          description: "La mesa ha sido liberada exitosamente",
          color: "success",
        });

        // Refrescar la lista de mesas
        fetchMesas();
        onClose();
      } else {
        addToast({
          title: "Error",
          description: data.message || "No se pudo liberar la mesa",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error al liberar mesa:", error);
      addToast({
        title: "Error",
        description: "Ocurrió un error al liberar la mesa",
        color: "danger",
      });
    } finally {
      setLiberandoMesa(false);
    }
  };

  const _getEstadoMesa = (mesa: Mesa) => {
    if (!mesa.activa) return { text: "Inactiva", color: "default" };
    if (mesa.ordenActual) {
      if (mesa.ordenActual.meseroId === user?.id) {
        return { text: "Mi Mesa", color: "primary" };
      } else {
        return { text: "Ocupada", color: "danger" };
      }
    }
    return { text: "Disponible", color: "success" };
  };

  const getMisMesas = () => {
    return mesas.filter(
      (mesa) => mesa.ordenActual && mesa.ordenActual.meseroId === user?.id,
    );
  };

  const getMesasDisponibles = () => {
    return mesas.filter((mesa) => mesa.activa && !mesa.ordenActual);
  };

  const getMesasOcupadas = () => {
    return mesas.filter(
      (mesa) => mesa.ordenActual && mesa.ordenActual.meseroId !== user?.id,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const misMesas = getMisMesas();
  const mesasDisponibles = getMesasDisponibles();
  const mesasOcupadas = getMesasOcupadas();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Estado de Mesas
          </h1>
          <p className="text-gray-600">{sucursal?.nombre} - Vista del mesero</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm font-medium">Mis Mesas</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {misMesas.length}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Disponibles</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {mesasDisponibles.length}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Ocupadas</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {mesasOcupadas.length}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{mesas.length}</p>
          </div>
        </div>
      </div>

      {/* Mis Mesas */}
      {misMesas.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Mis Mesas Activas ({misMesas.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {misMesas.map((mesa) => (
              <div
                key={mesa.id}
                className="border-2 rounded-xl p-5 transition-all hover:shadow-lg bg-primary/10 border-primary/20 hover:border-primary/300"
              >
                {/* Header de la card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      Mesa {mesa.numero}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {sucursal?.nombre}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary ring-1 ring-primary/20">
                    Mi Mesa
                  </span>
                </div>

                {/* Información */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Users className="text-gray-400" size={16} />
                    <span className="font-medium">{mesa.capacidad}</span>
                    <span className="text-gray-500">personas</span>
                  </div>

                  {mesa.ordenActual && (
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        color={
                          mesa.ordenActual.estado === "PENDIENTE"
                            ? "warning"
                            : mesa.ordenActual.estado === "EN_PREPARACION"
                              ? "primary"
                              : mesa.ordenActual.estado === "LISTA"
                                ? "success"
                                : "default"
                        }
                        variant="flat"
                      >
                        {mesa.ordenActual.estado.replace("_", " ")}
                      </Chip>
                    </div>
                  )}

                  {mesa.ordenActual && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-black font-medium">
                        Total: {formatCOP(mesa.ordenActual.total)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="flex-1 text-primary bg-primary/10"
                    startContent={<Eye className="w-4 h-4" />}
                    onPress={() => fetchDetallesMesa(mesa)}
                  >
                    Ver Detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mesas Disponibles */}
      {mesasDisponibles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Mesas Disponibles ({mesasDisponibles.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mesasDisponibles.map((mesa) => (
              <div
                key={mesa.id}
                className="border-2 rounded-xl p-5 transition-all hover:shadow-lg bg-green-50 border-green-200 hover:border-green-300"
              >
                {/* Header de la card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      Mesa {mesa.numero}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {sucursal?.nombre}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 ring-1 ring-green-600/20">
                    Disponible
                  </span>
                </div>

                {/* Información */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Users className="text-gray-400" size={16} />
                    <span className="font-medium">{mesa.capacidad}</span>
                    <span className="text-gray-500">personas</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="success"
                    variant="flat"
                    className="flex-1"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={() => router.push(`/mesero/orden?mesa=${mesa.id}`)}
                  >
                    Tomar Mesa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mesas Ocupadas por Otros */}
      {mesasOcupadas.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Mesas Ocupadas ({mesasOcupadas.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mesasOcupadas.map((mesa) => (
              <div
                key={mesa.id}
                className="border-2 rounded-xl p-5 transition-all hover:shadow-lg bg-red-50 border-red-200 hover:border-red-300"
              >
                {/* Header de la card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      Mesa {mesa.numero}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {sucursal?.nombre}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 ring-1 ring-red-600/20">
                    Ocupada
                  </span>
                </div>

                {/* Información */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Users className="text-gray-400" size={16} />
                    <span className="font-medium">{mesa.capacidad}</span>
                    <span className="text-gray-500">personas</span>
                  </div>

                  {mesa.ordenActual && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-gray-500">Mesero:</span>
                      <span className="font-medium">
                        {mesa.ordenActual.mesero?.nombre_completo || "Sin mesero"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="default"
                    variant="flat"
                    className="flex-1"
                    startContent={<Eye className="w-4 h-4" />}
                    onPress={() => fetchDetallesMesa(mesa)}
                  >
                    Ver Detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {mesas.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay mesas configuradas
          </h3>
          <p className="text-gray-500">
            Contacta al administrador para configurar las mesas de esta
            sucursal.
          </p>
        </div>
      )}

      {/* Modal de detalles de mesa */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-bold">
                      Mesa {mesaSeleccionada?.numero}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">
                        Capacidad: {mesaSeleccionada?.capacidad} personas
                      </span>
                      {mesaSeleccionada?.ordenActual && (
                        <Chip
                          size="sm"
                          color={
                            mesaSeleccionada.ordenActual.meseroId === user?.id
                              ? "primary"
                              : "danger"
                          }
                          variant="flat"
                        >
                          {mesaSeleccionada.ordenActual.meseroId === user?.id
                            ? "Mi Mesa"
                            : "Ocupada"
                          }
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                {mesaSeleccionada && (
                  <div className="space-y-6">
                    {mesaSeleccionada.ordenActual ? (
                      <>
                        {/* Información de la orden */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">Información de la Orden</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-500">Número de orden:</span>
                              <p className="font-medium">
                                #{mesaSeleccionada.ordenActual.numeroOrden || mesaSeleccionada.ordenActual.id.slice(-6)}
                              </p>
                            </div>

                            <div>
                              <span className="text-sm text-gray-500">Estado:</span>
                              <div className="mt-1">
                                <Chip
                                  size="sm"
                                  color={
                                    mesaSeleccionada.ordenActual.estado === "PENDIENTE"
                                      ? "warning"
                                      : mesaSeleccionada.ordenActual.estado === "EN_PREPARACION"
                                        ? "primary"
                                        : mesaSeleccionada.ordenActual.estado === "LISTA"
                                          ? "success"
                                          : "default"
                                  }
                                  variant="flat"
                                >
                                  {mesaSeleccionada.ordenActual.estado.replace("_", " ")}
                                </Chip>
                              </div>
                            </div>

                            <div>
                              <span className="text-sm text-gray-500">Mesero:</span>
                              <p className="font-medium">
                                {mesaSeleccionada.ordenActual.mesero
                                  ? mesaSeleccionada.ordenActual.mesero.nombre_completo +
                                    (mesaSeleccionada.ordenActual.meseroId === user?.id ? " (Tú)" : "")
                                  : "Sin asignar"}
                              </p>
                            </div>

                            <div>
                              <span className="text-sm text-gray-500">Hora de inicio:</span>
                              <p className="font-medium">
                                {new Date(mesaSeleccionada.ordenActual.creadoEn).toLocaleDateString()} - {" "}
                                {new Date(mesaSeleccionada.ordenActual.creadoEn).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Productos de la orden */}
                        {mesaSeleccionada.ordenActual.items && mesaSeleccionada.ordenActual.items.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Productos Ordenados</h4>
                            <div className="space-y-3">
                              {mesaSeleccionada.ordenActual.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {item.producto.imagen ? (
                                      <img
                                        src={item.producto.imagen}
                                        alt={item.producto.nombre}
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                    ) : (
                                      <Package className="w-6 h-6 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{item.producto.nombre}</h5>
                                    <p className="text-sm text-gray-500">
                                      {formatCOP(item.precioUnitario)} x {item.cantidad}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                      {formatCOP(item.precioUnitario * item.cantidad)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Especificaciones */}
                        {mesaSeleccionada.ordenActual.especificaciones && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Especificaciones</h4>
                            <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">
                              {mesaSeleccionada.ordenActual.especificaciones}
                            </p>
                          </div>
                        )}

                        {/* Total */}
                        <div className="bg-primary/20 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900">Total de la orden:</span>
                            <span className="font-bold text-primary text-lg">
                              {formatCOP(mesaSeleccionada.ordenActual.total)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Mesa disponible</h4>
                        <p className="text-gray-500">
                          Esta mesa está libre y lista para recibir clientes.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {mesaSeleccionada?.ordenActual?.meseroId === user?.id && (
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => mesaSeleccionada && liberarMesa(mesaSeleccionada.id)}
                  >
                    Liberar Mesa
                  </Button>
                )}
                <Button color="primary" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
