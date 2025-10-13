"use client";

import {
  addToast,
  Button,
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
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  Filter,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ModalActualizarOrden from "@/components/orden/ModalActualizarOrden";
import ModalDetalleOrden from "@/components/orden/ModalDetalleOrden";
import { formatCOP } from "@/utils/formatCOP";

interface Sucursal {
  id: string;
  nombre: string;
}

interface Orden {
  id: string;
  tipoOrden: string;
  estado: string;
  total: number;
  subtotal: number;
  descuento: number;
  creado_en: string;
  mesa?: {
    numero: number;
    ubicacion: string;
  };
  mesero?: {
    nombre_completo: string;
  };
  cliente?: {
    nombre: string;
  };
  sucursal: {
    id: string;
    nombre: string;
  };
  items: Array<{
    cantidad: number;
    precioUnitario: number;
    producto: {
      nombre: string;
    };
  }>;
  _count?: {
    items: number;
  };
}

export default function OrdenesPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [tipoOrdenFiltro, setTipoOrdenFiltro] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [sucursalFiltro, setSucursalFiltro] = useState("");

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modales
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<string | null>(
    null,
  );
  const [ordenIdEditar, _setOrdenIdEditar] = useState<string | null>(null);

  const {
    isOpen: openDetalle,
    onOpen: abrirDetalle,
    onOpenChange: cerrarDetalle,
  } = useDisclosure();
  const { isOpen: isEditOpen, onOpenChange: onEditOpenChange } =
    useDisclosure();

  // Modales de confirmación
  const {
    isOpen: isEntregarOpen,
    onOpen: onEntregarOpen,
    onClose: onEntregarClose,
  } = useDisclosure();
  const {
    isOpen: isCancelarOpen,
    onOpen: onCancelarOpen,
    onClose: onCancelarClose,
  } = useDisclosure();
  const {
    isOpen: isEliminarOpen,
    onOpen: onEliminarOpen,
    onClose: onEliminarClose,
  } = useDisclosure();

  const [ordenAccion, setOrdenAccion] = useState<Orden | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch sucursales
        const sucursalesRes = await fetch("/api/sucursales");
        const sucursalesData = await sucursalesRes.json();
        if (sucursalesData.success) {
          setSucursales(sucursalesData.sucursales);
        }

        // Fetch ordenes
        const params = new URLSearchParams();
        if (estadoFiltro) params.append("estado", estadoFiltro);
        if (tipoOrdenFiltro) params.append("tipoOrden", tipoOrdenFiltro);
        if (fechaFiltro) params.append("fecha", fechaFiltro);
        if (sucursalFiltro) params.append("sucursalId", sucursalFiltro);
        params.append("page", page.toString());
        params.append("limit", "20");

        const ordenesRes = await fetch(`/api/ordenes?${params}`);
        const ordenesData = await ordenesRes.json();

        if (ordenesData.success) {
          setOrdenes(ordenesData.ordenes);
          setTotal(ordenesData.pagination.total);
          setTotalPages(ordenesData.pagination.totalPages);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoFiltro, tipoOrdenFiltro, fechaFiltro, sucursalFiltro, page]);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (estadoFiltro) params.append("estado", estadoFiltro);
      if (tipoOrdenFiltro) params.append("tipoOrden", tipoOrdenFiltro);
      if (fechaFiltro) params.append("fecha", fechaFiltro);
      if (sucursalFiltro) params.append("sucursalId", sucursalFiltro);
      params.append("page", page.toString());
      params.append("limit", "20");

      const response = await fetch(`/api/ordenes?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrdenes(data.ordenes);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setEstadoFiltro("");
    setTipoOrdenFiltro("");
    setFechaFiltro("");
    setSucursalFiltro("");
    setSearchTerm("");
    setPage(1);
  };

  const handleMarcarEntregada = async () => {
    if (!ordenAccion) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/ordenes/${ordenAccion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "ENTREGADA" }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchOrdenes();
        onEntregarClose();
      } else {
        alert(`Error al marcar como entregada: ${data.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al marcar como entregada");
    } finally {
      setActionLoading(false);
      setOrdenAccion(null);
    }
  };

  const handleCancelarOrden = async () => {
    if (!ordenAccion) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/ordenes/${ordenAccion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "CANCELADA" }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchOrdenes();
        onCancelarClose();
      } else {
        alert(`Error al cancelar orden: ${data.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cancelar orden");
    } finally {
      setActionLoading(false);
      setOrdenAccion(null);
    }
  };

  const handleEliminarOrden = async () => {
    if (!ordenAccion) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/ordenes/${ordenAccion.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await fetchOrdenes();
        onEliminarClose();

        addToast({
          title: "Orden eliminada",
          description: "La orden ha sido eliminada exitosamente",
          color: "success",
        });
      } else {
        alert(`Error al eliminar orden: ${data.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar orden");
    } finally {
      setActionLoading(false);
      setOrdenAccion(null);
    }
  };

  const tieneFiltrosActivos =
    estadoFiltro ||
    tipoOrdenFiltro ||
    fechaFiltro ||
    searchTerm ||
    sucursalFiltro;

  type EstadoOrden =
    | "PENDIENTE"
    | "EN_PREPARACION"
    | "LISTA"
    | "ENTREGADA"
    | "CANCELADA";

  const getEstadoColor = (
    estado: EstadoOrden,
  ):
    | "default"
    | "warning"
    | "primary"
    | "success"
    | "danger"
    | "secondary"
    | undefined => {
    const colores: Record<
      EstadoOrden,
      "default" | "warning" | "primary" | "success" | "danger" | "secondary"
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

  const ordenesFiltradas = ordenes.filter((orden) => {
    console.log(orden);
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      orden.meseros?.nombre_completo.toLowerCase().includes(search) ||
      orden.mesas?.numero.toString().includes(search) ||
      orden.clientes?.nombre.toLowerCase().includes(search) ||
      orden.sucursales?.nombre.toLowerCase().includes(search)
    );
  });

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenDetalle = (ordenId: string) => {
    setOrdenSeleccionada(ordenId);
    abrirDetalle();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Órdenes</h1>
              <p className="text-sm text-gray-500">
                Gestiona y consulta todas las órdenes del sistema
              </p>
            </div>
          </div>

          {/* Búsqueda y filtros */}
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por mesero, mesa, cliente o sucursal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine transition-all text-black"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter size={16} />
              <span>Filtros:</span>
              {tieneFiltrosActivos && (
                <span className="ml-auto text-xs bg-wine/10 text-wine px-2 py-1 rounded-full">
                  Filtros activos
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Sucursal */}
              <div>
                <label
                  htmlFor="sucursal"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Sucursal
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <select
                    id="sucursal"
                    value={sucursalFiltro}
                    onChange={(e) => setSucursalFiltro(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">Todas las sucursales</option>
                    {sucursales.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Estado */}
              <div>
                <label
                  htmlFor="estado"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Estado
                </label>
                <select
                  id="estado"
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Todos los estados</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PREPARACION">En preparación</option>
                  <option value="LISTA">Lista</option>
                  <option value="ENTREGADA">Entregada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>

              {/* Tipo de orden */}
              <div>
                <label
                  htmlFor="tipoOrden"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tipo de orden
                </label>
                <select
                  id="tipoOrden"
                  value={tipoOrdenFiltro}
                  onChange={(e) => setTipoOrdenFiltro(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Todos los tipos</option>
                  <option value="LOCAL">En el local</option>
                  <option value="LLEVAR">Para llevar</option>
                  <option value="DOMICILIO">Domicilio</option>
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label
                  htmlFor="fecha"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Fecha
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    id="fecha"
                    type="date"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-black"
                  />
                </div>
              </div>

              {/* Limpiar */}
              <div className="flex items-end">
                <Button
                  onPress={limpiarFiltros}
                  variant="bordered"
                  className="w-full border-gray-300 hover:bg-gray-50"
                  isDisabled={!tieneFiltrosActivos}
                  startContent={<X size={16} />}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {!loading && ordenes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-600 mb-1">Total órdenes</p>
              <p className="text-3xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-600 mb-1">Pendientes</p>
              <p className="text-3xl font-bold text-orange-600">
                {ordenes.filter((o) => o.estado === "PENDIENTE").length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-600 mb-1">En preparación</p>
              <p className="text-3xl font-bold text-blue-600">
                {ordenes.filter((o) => o.estado === "EN_PREPARACION").length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-600 mb-1">Ventas totales</p>
              <p className="text-2xl font-bold text-wine">
                {formatCOP(
                  ordenes.reduce((sum, o) => sum + Number(o.total), 0),
                )}
              </p>
            </div>
          </div>
        )}

        {/* Lista de órdenes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {loading
                ? "Cargando..."
                : `${ordenesFiltradas.length} orden${ordenesFiltradas.length !== 1 ? "es" : ""}`}
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" color="primary" />
              <p className="mt-4 text-gray-500">Cargando órdenes...</p>
            </div>
          ) : ordenesFiltradas.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron órdenes
              </h3>
              <p className="text-gray-500 mb-6">
                {tieneFiltrosActivos
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "No hay órdenes registradas"}
              </p>
              {tieneFiltrosActivos && (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={limpiarFiltros}
                  startContent={<X size={16} />}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Cards en mobile */}
              <div className="grid grid-cols-1 gap-4 xl:hidden">
                {ordenesFiltradas.map((orden) => (
                  <div
                    key={orden.id}
                    className="border rounded-xl shadow-sm p-4 flex flex-col gap-2 bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {getTipoOrdenIcon(orden.tipoOrden)}
                        </span>
                        <span className="text-sm text-gray-700">
                          {orden.tipoOrden}
                        </span>
                      </div>
                      <Chip
                        color={getEstadoColor(orden.estado as EstadoOrden)}
                        size="sm"
                        variant="flat"
                      >
                        {orden.estado.replace("_", " ")}
                      </Chip>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="font-semibold text-gray-900">
                        #{orden.id.slice(0, 8)}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Building2 size={14} />
                        <span>{orden.sucursales.nombre}</span>
                      </div>
                      {orden.mesa && (
                        <p className="text-xs text-gray-500">
                          Mesa {orden.mesa.numero}
                        </p>
                      )}
                      {orden.cliente && (
                        <p className="text-xs text-gray-500">
                          {orden.cliente.nombre}
                        </p>
                      )}
                      <p className="text-sm text-gray-700">
                        Mesero: {orden.mesero?.nombre_completo || "Sin asignar"}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {orden._count?.orden_items ?? 0} producto
                        {orden._count?.orden_items !== 1 ? "s" : ""}
                      </p>
                      <p className="font-bold text-wine">
                        {formatCOP(orden.total)}
                      </p>
                      {orden.descuento > 0 && (
                        <p className="text-xs text-red-600">
                          -{formatCOP(orden.descuento)}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {formatearFecha(orden.creado_en)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => handleOpenDetalle(orden.id)}
                        startContent={<Eye size={16} />}
                        title="Ver detalles"
                        className="text-primary-600 bg-primary-50"
                      >
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="secondary"
                        startContent={<Edit size={16} />}
                        onPress={() => {
                          router.push(`/pos/ordenes/${orden.id}/editar`);
                        }}
                        title="Editar orden"
                        className="text-secondary bg-secondary/10"
                      >
                        Editar
                      </Button>
                      {orden.estado !== "ENTREGADA" &&
                        orden.estado !== "CANCELADA" && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="success"
                            startContent={<CheckCircle size={16} />}
                            onPress={() => {
                              setOrdenAccion(orden);
                              onEntregarOpen();
                            }}
                            title="Marcar como entregada"
                            className="text-success bg-success/10"
                          >
                            Entregar
                          </Button>
                        )}
                      {orden.estado !== "CANCELADA" &&
                        orden.estado !== "ENTREGADA" && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            startContent={<XCircle size={16} />}
                            onPress={() => {
                              setOrdenAccion(orden);
                              onCancelarOpen();
                            }}
                            title="Cancelar orden"
                            className="text-warning bg-warning/10"
                          >
                            Cancelar
                          </Button>
                        )}
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<Trash2 size={16} />}
                        onPress={() => {
                          setOrdenAccion(orden);
                          onEliminarOpen();
                        }}
                        title="Eliminar orden"
                        className="col-span-2 text-danger bg-danger/10"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla en desktop */}
              <div className="overflow-x-auto hidden xl:block">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 text-sm font-semibold text-gray-600">
                        Orden
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">
                        Sucursal
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">
                        Tipo
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">
                        Mesero
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">
                        Items
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">
                        Total
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">
                        Estado
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">
                        Fecha
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesFiltradas.map((orden) => (
                      <tr
                        key={orden.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              #{orden.id.slice(0, 8)}
                            </p>
                            {orden.mesa && (
                              <p className="text-xs text-gray-500">
                                Mesa {orden.mesa.numero}
                              </p>
                            )}
                            {orden.cliente && (
                              <p className="text-xs text-gray-500">
                                {orden.cliente.nombre}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-700">
                              {orden.sucursales.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {getTipoOrdenIcon(orden.tipoOrden)}
                            </span>
                            <span className="text-sm text-gray-700">
                              {orden.tipoOrden}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-gray-700">
                            {orden.mesero?.nombre_completo || "Sin asignar"}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm font-semibold text-gray-900">
                            {orden._count?.orden_items ?? 0} producto
                            {orden._count?.orden_items !== 1 ? "s" : ""}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="font-bold text-wine">
                            {formatCOP(orden.total)}
                          </p>
                          {orden.descuento > 0 && (
                            <p className="text-xs text-red-600">
                              -{formatCOP(orden.descuento)}
                            </p>
                          )}
                        </td>
                        <td className="py-4">
                          <Chip
                            color={getEstadoColor(orden.estado as EstadoOrden)}
                            size="sm"
                            variant="flat"
                          >
                            {orden.estado.replace("_", " ")}
                          </Chip>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-gray-600">
                            {formatearFecha(orden.creado_en)}
                          </p>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => handleOpenDetalle(orden.id)}
                              isIconOnly
                              title="Ver detalles"
                              className="text-primary-600 bg-primary-50"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="secondary"
                              onPress={() => {
                                router.push(`/pos/ordenes/${orden.id}/editar`);
                              }}
                              isIconOnly
                              title="Editar orden"
                              className="text-secondary bg-secondary/10"
                            >
                              <Edit size={16} />
                            </Button>
                            {orden.estado !== "ENTREGADA" &&
                              orden.estado !== "CANCELADA" && (
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color="success"
                                  onPress={() => {
                                    setOrdenAccion(orden);
                                    onEntregarOpen();
                                  }}
                                  isIconOnly
                                  title="Marcar como entregada"
                                  className="text-success bg-success/10"
                                >
                                  <CheckCircle size={16} />
                                </Button>
                              )}
                            {orden.estado !== "CANCELADA" &&
                              orden.estado !== "ENTREGADA" && (
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color="warning"
                                  onPress={() => {
                                    setOrdenAccion(orden);
                                    onCancelarOpen();
                                  }}
                                  isIconOnly
                                  title="Cancelar orden"
                                  className="text-warning bg-warning/10"
                                >
                                  <XCircle size={16} />
                                </Button>
                              )}
                            <Button
                              size="sm"
                              variant="flat"
                              color="danger"
                              onPress={() => {
                                setOrdenAccion(orden);
                                onEliminarOpen();
                              }}
                              isIconOnly
                              title="Eliminar orden"
                              className="text-danger bg-danger/10"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="bordered"
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                      isDisabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="bordered"
                      onPress={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      isDisabled={page === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Detalle */}
      <ModalDetalleOrden
        isOpen={openDetalle}
        onOpenChange={cerrarDetalle}
        ordenId={ordenSeleccionada}
      />

      {/* Modal de Editar */}
      <ModalActualizarOrden
        ordenId={ordenIdEditar}
        isOpen={isEditOpen}
        onOpenChange={onEditOpenChange}
        onOrdenActualizada={() => fetchOrdenes()}
      />

      {/* Modal Confirmar Entrega */}
      <Modal isOpen={isEntregarOpen} onClose={onEntregarClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={24} />
                  <span>Confirmar Entrega</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas marcar esta orden como{" "}
                  <span className="font-bold text-green-600">ENTREGADA</span>?
                </p>
                {ordenAccion && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Orden:</span> #
                      {ordenAccion.id.slice(0, 8)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Total:</span>{" "}
                      {formatCOP(ordenAccion.total)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Tipo:</span>{" "}
                      {ordenAccion.tipoOrden}
                    </p>
                    {ordenAccion.mesa && (
                      <p className="text-sm">
                        <span className="font-semibold">Mesa:</span>{" "}
                        {ordenAccion.mesa.numero}
                      </p>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  color="danger"
                  onPress={onClose}
                  isDisabled={actionLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="flat"
                  color="success"
                  onPress={handleMarcarEntregada}
                  isLoading={actionLoading}
                  startContent={!actionLoading && <CheckCircle size={16} />}
                >
                  Marcar como Entregada
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Confirmar Cancelación */}
      <Modal isOpen={isCancelarOpen} onClose={onCancelarClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <XCircle className="text-orange-600" size={24} />
                  <span>Cancelar Orden</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas{" "}
                  <span className="font-bold text-orange-600">CANCELAR</span>{" "}
                  esta orden?
                </p>
                {ordenAccion && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Orden:</span> #
                      {ordenAccion.id.slice(0, 8)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Total:</span>{" "}
                      {formatCOP(ordenAccion.total)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Estado actual:</span>{" "}
                      {ordenAccion.estado}
                    </p>
                    {ordenAccion.cliente && (
                      <p className="text-sm">
                        <span className="font-semibold">Cliente:</span>{" "}
                        {ordenAccion.cliente.nombre}
                      </p>
                    )}
                  </div>
                )}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Esta acción cambiará el estado de la orden a CANCELADA. La
                    orden seguirá visible en el sistema.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  color="danger"
                  onPress={onClose}
                  isDisabled={actionLoading}
                >
                  No, volver
                </Button>
                <Button
                  variant="flat"
                  color="warning"
                  onPress={handleCancelarOrden}
                  isLoading={actionLoading}
                  startContent={!actionLoading && <XCircle size={16} />}
                >
                  Sí, Cancelar Orden
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal isOpen={isEliminarOpen} onClose={onEliminarClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-600" size={24} />
                  <span>Eliminar Orden</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas{" "}
                  <span className="font-bold text-red-600">ELIMINAR</span>{" "}
                  permanentemente esta orden?
                </p>
                {ordenAccion && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-2 border border-red-200">
                    <p className="text-sm">
                      <span className="font-semibold">Orden:</span> #
                      {ordenAccion.id.slice(0, 8)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Total:</span>{" "}
                      {formatCOP(ordenAccion.total)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Estado:</span>{" "}
                      {ordenAccion.estado}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Fecha:</span>{" "}
                      {formatearFecha(ordenAccion.creado_en)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Items:</span>{" "}
                      {ordenAccion._count?.orden_items ?? 0}
                    </p>
                  </div>
                )}
                <div className="mt-4 p-4 bg-red-100 border-2 border-red-300 rounded-lg">
                  <p className="text-sm text-red-900 font-semibold flex items-start gap-2">
                    <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                    <span>
                      ¡ADVERTENCIA! Esta acción es IRREVERSIBLE. La orden y
                      todos sus datos se eliminarán permanentemente del sistema.
                    </span>
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  color="danger"
                  onPress={onClose}
                  isDisabled={actionLoading}
                >
                  No, conservar orden
                </Button>
                <Button
                  variant="flat"
                  color="danger"
                  onPress={handleEliminarOrden}
                  isLoading={actionLoading}
                  startContent={!actionLoading && <Trash2 size={16} />}
                >
                  Sí, Eliminar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
