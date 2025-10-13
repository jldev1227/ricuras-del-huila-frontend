"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
  Eye,
  Package,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSucursal } from "@/hooks/useSucursal";
import { formatCOP } from "@/utils/formatCOP";

interface Orden {
  id: string;
  numeroOrden: string;
  tipoOrden: string;
  estado: string;
  total: number;
  subtotal?: number;
  descuento?: number;
  mesa?: {
    numero: number;
    capacidad: number;
  };
  cliente?: {
    nombre: string;
    telefono?: string;
    email?: string;
  };
  nombreCliente?: string;
  direccionEntrega?: string;
  especificaciones?: string;
  notas?: string;
  creadoEn: string;
  actualizadoEn?: string;
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
  _count: {
    items: number;
  };
}

interface Stats {
  ordenesHoy: number;
  ordenesActivas: number;
  ventasHoy: number;
  promedioOrden: number;
}

export default function MeseroPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { sucursal } = useSucursal();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [stats, setStats] = useState<Stats>({
    ordenesHoy: 0,
    ordenesActivas: 0,
    ventasHoy: 0,
    promedioOrden: 0,
  });
  const [loading, setLoading] = useState(true);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(
    null,
  );
  const [_loadingDetalles, setLoadingDetalles] = useState(false);

  // Obtener órdenes del mesero
  const fetchOrdenesDelMesero = async () => {
    try {
      if (!user?.id || !sucursal?.id) return;

      const response = await fetch(
        `/api/ordenes?meseroId=${user.id}&sucursalId=${sucursal.id}&limit=20`,
      );

      if (response.ok) {
        const data = await response.json();
        setOrdenes(data.ordenes || []);

        // Calcular estadísticas
        const today = new Date().toISOString().split("T")[0];
        const ordenesHoy = data.ordenes.filter((orden: Orden) =>
          orden.creadoEn.startsWith(today),
        );

        const ordenesActivas = data.ordenes.filter((orden: Orden) =>
          ["PENDIENTE", "EN_PREPARACION"].includes(orden.estado),
        );

        const ventasHoy = ordenesHoy.reduce(
          (sum: number, orden: Orden) => sum + Number(orden.total),
          0,
        );

        setStats({
          ordenesHoy: ordenesHoy.length,
          ordenesActivas: ordenesActivas.length,
          ventasHoy,
          promedioOrden:
            ordenesHoy.length > 0 ? ventasHoy / ordenesHoy.length : 0,
        });
      }
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdenesDelMesero();
  }, [fetchOrdenesDelMesero]);

  // Obtener detalles completos de una orden
  const fetchDetallesOrden = async (ordenId: string) => {
    setLoadingDetalles(true);
    try {
      const response = await fetch(`/api/ordenes/${ordenId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrdenSeleccionada(data.orden);
          onOpen();
        }
      }
    } catch (error) {
      console.error("Error al cargar detalles de la orden:", error);
    } finally {
      setLoadingDetalles(false);
    }
  };

  const getEstadoColor = (
    estado: string,
  ): "warning" | "primary" | "success" | "default" | "danger" => {
    switch (estado) {
      case "PENDIENTE":
        return "warning";
      case "EN_PREPARACION":
        return "primary";
      case "LISTA":
        return "success";
      case "ENTREGADA":
        return "default";
      case "CANCELADA":
        return "danger";
      default:
        return "default";
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "Pendiente";
      case "EN_PREPARACION":
        return "En Preparación";
      case "LISTA":
        return "Lista";
      case "ENTREGADA":
        return "Entregada";
      case "CANCELADA":
        return "Cancelada";
      default:
        return estado;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Panel de Mesero
          </h1>
          <p className="text-gray-600">
            Bienvenido, {user?.nombre_completo} - {sucursal?.nombre}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => router.push("/mesero/orden")}
          >
            Nueva Orden
          </Button>
          <Button
            variant="bordered"
            startContent={<ClipboardList className="w-4 h-4" />}
            onPress={() => router.push("/mesero/mesas")}
          >
            Ver Mesas
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Órdenes Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.ordenesHoy}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Órdenes Activas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.ordenesActivas}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ventas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCOP(stats.ventasHoy)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Promedio/Orden</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCOP(stats.promedioOrden)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Órdenes Recientes */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">Mis Órdenes Recientes</h2>
            <Button
              variant="light"
              color="primary"
              size="sm"
              endContent={<Eye className="w-4 h-4" />}
              onPress={() => router.push("/mesero/ordenes")}
            >
              Ver Todas
            </Button>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {ordenes.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes órdenes registradas</p>
              <Button
                color="primary"
                variant="light"
                className="mt-4"
                onPress={() => router.push("/mesero/orden")}
              >
                Crear Primera Orden
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {ordenes.slice(0, 10).map((orden) => (
                <div
                  key={orden.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            #{orden.numeroOrden || orden.id.slice(-6)}
                          </span>
                          <Chip
                            size="sm"
                            color={getEstadoColor(orden.estado)}
                            variant="flat"
                          >
                            {getEstadoTexto(orden.estado)}
                          </Chip>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span className="capitalize">{orden.tipoOrden}</span>
                          {orden.mesa && (
                            <>
                              <span>•</span>
                              <span>Mesa {orden.mesa.numero}</span>
                            </>
                          )}
                          {(orden.cliente?.nombre || orden.nombreCliente) && (
                            <>
                              <span>•</span>
                              <span>
                                {orden.cliente?.nombre || orden.nombreCliente}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatCOP(orden.total)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {orden._count.items} producto
                          {orden._count.items !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="hidden sm:block text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(orden.creadoEn).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(orden.creadoEn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        isIconOnly
                        onPress={() => fetchDetallesOrden(orden.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Órdenes Activas */}
      {stats.ordenesActivas > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-semibold">Órdenes Activas</h2>
              <Chip size="sm" color="warning" variant="flat">
                {stats.ordenesActivas}
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-3">
              {ordenes
                .filter((orden) =>
                  ["PENDIENTE", "EN_PREPARACION"].includes(orden.estado),
                )
                .slice(0, 5)
                .map((orden) => (
                  <div
                    key={orden.id}
                    className="p-4 border-l-4 border-orange-400 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              #{orden.numeroOrden || orden.id.slice(-6)}
                            </span>
                            <Chip
                              size="sm"
                              color={getEstadoColor(orden.estado)}
                              variant="flat"
                            >
                              {getEstadoTexto(orden.estado)}
                            </Chip>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            {orden.mesa && (
                              <span>Mesa {orden.mesa.numero}</span>
                            )}
                            {(orden.cliente?.nombre || orden.nombreCliente) && (
                              <>
                                {orden.mesa && <span>•</span>}
                                <span>
                                  {orden.cliente?.nombre || orden.nombreCliente}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatCOP(orden.total)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(orden.creadoEn).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          color="primary"
                          onPress={() => fetchDetallesOrden(orden.id)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal de detalles de orden */}
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
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">
                      Orden #
                      {ordenSeleccionada?.numeroOrden ||
                        ordenSeleccionada?.id.slice(-6)}
                    </h3>
                    {ordenSeleccionada && (
                      <div className="flex items-center gap-2 mt-1">
                        <Chip
                          size="sm"
                          color={getEstadoColor(ordenSeleccionada.estado)}
                          variant="flat"
                        >
                          {getEstadoTexto(ordenSeleccionada.estado)}
                        </Chip>
                        <span className="text-sm text-gray-500 capitalize">
                          {ordenSeleccionada.tipoOrden}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                {ordenSeleccionada && (
                  <div className="space-y-6">
                    {/* Información general */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Información General
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">
                            Fecha y hora:
                          </span>
                          <p className="font-medium">
                            {new Date(
                              ordenSeleccionada.creadoEn,
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              ordenSeleccionada.creadoEn,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {ordenSeleccionada.mesa && (
                          <div>
                            <span className="text-sm text-gray-500">Mesa:</span>
                            <p className="font-medium">
                              Mesa {ordenSeleccionada.mesa.numero}
                              {ordenSeleccionada.mesa.capacidad &&
                                ` (${ordenSeleccionada.mesa.capacidad} personas)`}
                            </p>
                          </div>
                        )}

                        {(ordenSeleccionada.cliente?.nombre ||
                          ordenSeleccionada.nombreCliente) && (
                          <div>
                            <span className="text-sm text-gray-500">
                              Cliente:
                            </span>
                            <p className="font-medium">
                              {ordenSeleccionada.cliente?.nombre ||
                                ordenSeleccionada.nombreCliente}
                            </p>
                          </div>
                        )}

                        {ordenSeleccionada.direccionEntrega && (
                          <div>
                            <span className="text-sm text-gray-500">
                              Dirección de entrega:
                            </span>
                            <p className="font-medium">
                              {ordenSeleccionada.direccionEntrega}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Productos */}
                    {ordenSeleccionada.items &&
                      ordenSeleccionada.items.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Productos
                          </h4>
                          <div className="space-y-3">
                            {ordenSeleccionada.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                              >
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
                                  <h5 className="font-medium text-gray-900">
                                    {item.producto.nombre}
                                  </h5>
                                  <p className="text-sm text-gray-500">
                                    {formatCOP(item.precioUnitario)} x{" "}
                                    {item.cantidad}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">
                                    {formatCOP(
                                      item.precioUnitario * item.cantidad,
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Especificaciones y notas */}
                    {(ordenSeleccionada.especificaciones ||
                      ordenSeleccionada.notas) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Especificaciones y Notas
                        </h4>
                        {ordenSeleccionada.especificaciones && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-500">
                              Especificaciones:
                            </span>
                            <p className="text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                              {ordenSeleccionada.especificaciones}
                            </p>
                          </div>
                        )}
                        {ordenSeleccionada.notas && (
                          <div>
                            <span className="text-sm text-gray-500">
                              Notas:
                            </span>
                            <p className="text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                              {ordenSeleccionada.notas}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resumen financiero */}
                    <div className="bg-primary/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Resumen
                      </h4>
                      <div className="space-y-2">
                        {ordenSeleccionada.subtotal && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">
                              {formatCOP(ordenSeleccionada.subtotal)}
                            </span>
                          </div>
                        )}
                        {ordenSeleccionada.descuento &&
                          ordenSeleccionada.descuento > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Descuento:</span>
                              <span className="font-medium">
                                -{formatCOP(ordenSeleccionada.descuento)}
                              </span>
                            </div>
                          )}
                        <div className="flex justify-between pt-2 border-t border-primary">
                          <span className="font-bold text-gray-900">
                            Total:
                          </span>
                          <span className="font-bold text-primary text-lg">
                            {formatCOP(ordenSeleccionada.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
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
