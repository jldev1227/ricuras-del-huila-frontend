"use client";

import {
  addToast,
  Button,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { ModalConfirm } from "@/components/mesas/ModalConfirm";
import { Edit, Filter, MapPin, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Sucursal {
  id: string;
  nombre: string;
}

interface MesaConRelaciones {
  id: string;
  numero: number;
  disponible: boolean;
  ubicacion: string | null;
  notas: string | null;
  sucursal_id: string;
  creado_en: Date;
  actualizado_en: Date;
  ultima_limpieza: Date | null;
  sucursales: Sucursal;
  ordenActual?: {
    id: string;
    numeroOrden: string;
  };
  _count: {
    ordenes: number;
  };
}

// Interfaces para formularios
interface FormMesa {
  numero: number;
  disponible: boolean;
  ubicacion: string;
  notas: string;
  sucursal_id: string;
}

export default function MesasPage() {
  const [mesas, setMesas] = useState<MesaConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [sucursalActual, setSucursalActual] = useState<Sucursal | null>(null);

  // Filtros
  const [searchNumero, setSearchNumero] = useState("");
  const [selectedUbicacion, setSelectedUbicacion] = useState("");
  const [selectedDisponible, setSelectedDisponible] = useState("");

  // Estados para modales
  const {
    isOpen: isNewMesaOpen,
    onOpen: onNewMesaOpen,
    onClose: onNewMesaClose,
  } = useDisclosure();
  const {
    isOpen: isEditMesaOpen,
    onOpen: onEditMesaOpen,
    onClose: onEditMesaClose,
  } = useDisclosure();
  const {
    isOpen: isEliminarMesaOpen,
    onOpen: onEliminarMesaOpen,
    onClose: onEliminarMesaClose,
  } = useDisclosure();

  // Estados para formularios
  const [formData, setFormData] = useState<FormMesa>({
    numero: 0,
    disponible: true,
    ubicacion: "",
    notas: "",
    sucursal_id: "",
  });
  const [editingMesa, setEditingMesa] = useState<MesaConRelaciones | null>(
    null,
  );
  const [mesaAEliminar, setMesaAEliminar] = useState<MesaConRelaciones | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormMesa>>({});

  // Cargar sucursal actual al iniciar
  useEffect(() => {
    const sucursalStorage = localStorage.getItem("sucursal-actual");
    if (sucursalStorage) {
      try {
        const value = JSON.parse(sucursalStorage);
        if (value?.id) {
          setSucursalActual(value);
          setFormData((prev) => ({ ...prev, sucursal_id: value.id }));
        }
      } catch (e) {
        console.error("Error al parsear sucursal actual:", e);
      }
    }
    setLoading(false);
  }, []);

  // Cargar mesas cuando cambie la sucursal o los filtros
  useEffect(() => {
    // No cargar mesas si no hay sucursal actual
    if (!sucursalActual?.id) {
      setMesas([]);
      return;
    }

    const fetchMesas = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        // SIEMPRE filtrar por sucursal actual
        params.append("sucursal_id", sucursalActual.id);

        // Agregar filtros opcionales
        if (searchNumero) params.append("numero", searchNumero);
        if (selectedUbicacion) params.append("ubicacion", selectedUbicacion);
        if (selectedDisponible) params.append("disponible", selectedDisponible);

        const mesasRes = await fetch(`/api/mesas?${params}`);
        const mesasData = await mesasRes.json();

        if (mesasData.success) {
          setMesas(mesasData.mesas);
        } else {
          console.error("Error al cargar mesas:", mesasData.error);
          setMesas([]);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setMesas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMesas();
  }, [sucursalActual, searchNumero, selectedUbicacion, selectedDisponible]);

  // Funciones para manejar formularios
  const resetForm = useCallback(() => {
    setFormData({
      numero: 0,
      disponible: true,
      ubicacion: "",
      notas: "",
      sucursal_id: sucursalActual?.id || "",
    });
    setErrors({});
    setEditingMesa(null);
  }, [sucursalActual]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<FormMesa> = {};

    if (!formData.numero || formData.numero <= 0) {
      newErrors.numero = 1; // Usar number como mock de error
    }

    if (!formData.sucursal_id) {
      newErrors.sucursal_id = "";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const recargarMesas = useCallback(async () => {
    if (!sucursalActual?.id) return;

    try {
      const params = new URLSearchParams();
      params.append("sucursal_id", sucursalActual.id);
      if (searchNumero) params.append("numero", searchNumero);
      if (selectedUbicacion) params.append("ubicacion", selectedUbicacion);
      if (selectedDisponible) params.append("disponible", selectedDisponible);

      const mesasRes = await fetch(`/api/mesas?${params}`);
      const mesasData = await mesasRes.json();
      if (mesasData.success) {
        setMesas(mesasData.mesas);
      }
    } catch (error) {
      console.error("Error al recargar mesas:", error);
    }
  }, [sucursalActual, searchNumero, selectedUbicacion, selectedDisponible]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = editingMesa ? `/api/mesas/${editingMesa.id}` : "/api/mesas";
      const method = editingMesa ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Recargar mesas
        await recargarMesas();

        // Cerrar modal y resetear form
        if (editingMesa) {
          onEditMesaClose();
          addToast({
            title: "Mesa actualizada",
            description: `La Mesa ${formData.numero} ha sido actualizada exitosamente.`,
            color: "success",
          });
        } else {
          onNewMesaClose();
          addToast({
            title: "Mesa creada",
            description: `La Mesa ${formData.numero} ha sido creada exitosamente.`,
            color: "success",
          });
        }
        resetForm();
      } else {
        addToast({
          title: "Error",
          description: data.error || "Error al guardar la mesa",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error al guardar mesa:", error);
      addToast({
        title: "Error",
        description: "Error al guardar la mesa",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    editingMesa,
    validateForm,
    onEditMesaClose,
    onNewMesaClose,
    resetForm,
    recargarMesas,
  ]);

  const handleEdit = useCallback(
    (mesa: MesaConRelaciones) => {
      setEditingMesa(mesa);
      setFormData({
        numero: mesa.numero,
        disponible: mesa.disponible,
        ubicacion: mesa.ubicacion || "",
        notas: mesa.notas || "",
        sucursal_id: mesa.sucursal_id,
      });
      setErrors({});
      onEditMesaOpen();
    },
    [onEditMesaOpen],
  );

  const handleDelete = useCallback(
    (mesa: MesaConRelaciones) => {
      setMesaAEliminar(mesa);
      onEliminarMesaOpen();
    },
    [onEliminarMesaOpen],
  );

  const confirmDelete = useCallback(async () => {
    if (!mesaAEliminar) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/mesas/${mesaAEliminar.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Recargar mesas
        await recargarMesas();

        // Cerrar modal
        onEliminarMesaClose();
        setMesaAEliminar(null);

        addToast({
          title: "Mesa eliminada",
          description: `La Mesa ${mesaAEliminar.numero} ha sido eliminada exitosamente.`,
          color: "success",
        });
      } else {
        // Manejar error
        console.error("Error al eliminar mesa:", data.error);
        addToast({
          title: "Error",
          description: data.error || "Error al eliminar la mesa",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error al eliminar mesa:", error);
      addToast({
        title: "Error",
        description: "Error al eliminar la mesa",
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [mesaAEliminar, onEliminarMesaClose, recargarMesas]);

  const handleNewMesa = useCallback(() => {
    resetForm();
    onNewMesaOpen();
  }, [resetForm, onNewMesaOpen]);

  const limpiarFiltros = () => {
    setSearchNumero("");
    setSelectedUbicacion("");
    setSelectedDisponible("");
  };

  const tieneFiltrosActivos =
    searchNumero || selectedUbicacion || selectedDisponible;

  const getEstadoColor = (disponible: boolean) => {
    return disponible
      ? "bg-green-50 border-green-200 hover:border-green-300"
      : "bg-red-50 border-red-200 hover:border-red-300";
  };

  const getEstadoBadge = (disponible: boolean) => {
    return disponible
      ? "bg-green-100 text-green-700 ring-1 ring-green-600/20"
      : "bg-red-100 text-red-700 ring-1 ring-red-600/20";
  };

  // Si no hay sucursal actual, mostrar mensaje
  if (!sucursalActual) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🏢</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                No hay sucursal seleccionada
              </h2>
              <p className="text-gray-600 mb-6">
                Para gestionar las mesas, primero debes seleccionar una sucursal.
              </p>
              <Link href="/dashboard/sucursales">
                <Button color="primary" className="bg-wine">
                  Ir a Sucursales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Gestión de Mesas
              </h1>
              <p className="text-sm text-gray-500">
                Sucursal: <span className="font-semibold text-gray-700">{sucursalActual.nombre}</span>
              </p>
            </div>
            <Button
              color="primary"
              className="bg-wine shadow-lg hover:shadow-xl transition-all"
              startContent={<Plus size={18} />}
              onPress={handleNewMesa}
            >
              Nueva Mesa
            </Button>
          </div>

          {/* Filtros */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter size={16} />
              <span>Filtros de búsqueda</span>
              {tieneFiltrosActivos && (
                <span className="ml-auto text-xs bg-wine/10 text-wine px-2 py-1 rounded-full">
                  Filtros activos
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda por número */}
              <div>
                <label
                  htmlFor="numeroMesa"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Número de mesa
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    id="numeroMesa"
                    type="number"
                    min={1}
                    value={searchNumero}
                    onChange={(e) => setSearchNumero(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-black"
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <label
                  htmlFor="ubicacion"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Ubicación
                </label>
                <select
                  id="ubicacion"
                  value={selectedUbicacion}
                  onChange={(e) => setSelectedUbicacion(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Todas las ubicaciones</option>
                  <option value="Interior">Interior</option>
                  <option value="Terraza">Terraza</option>
                  <option value="VIP">VIP</option>
                </select>
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
                  value={selectedDisponible}
                  onChange={(e) => setSelectedDisponible(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Todos los estados</option>
                  <option value="true">Disponible</option>
                  <option value="false">Ocupada</option>
                </select>
              </div>

              {/* Botón limpiar */}
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

        {/* Resultados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {loading
                  ? "Cargando..."
                  : `${mesas.length} mesa${mesas.length !== 1 ? "s" : ""} encontrada${mesas.length !== 1 ? "s" : ""}`}
              </h2>
              {tieneFiltrosActivos && !loading && (
                <p className="text-sm text-gray-500 mt-1">
                  Mostrando resultados filtrados
                </p>
              )}
            </div>

            {mesas.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {mesas.filter((m) => m.disponible).length} disponibles
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {mesas.filter((m) => !m.disponible).length} ocupadas
                  </span>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" color="primary" />
              <p className="mt-4 text-gray-500">Cargando mesas...</p>
            </div>
          ) : mesas.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🪑</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron mesas
              </h3>
              <p className="text-gray-500 mb-6">
                {tieneFiltrosActivos
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza agregando tu primera mesa"}
              </p>
              {tieneFiltrosActivos ? (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={limpiarFiltros}
                  startContent={<X size={16} />}
                >
                  Limpiar filtros
                </Button>
              ) : (
                <Button
                  color="primary"
                  onPress={handleNewMesa}
                  className="bg-wine"
                  startContent={<Plus size={16} />}
                >
                  Crear primera mesa
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mesas.map((mesa) => (
                <div
                  key={mesa.id}
                  className={`border-2 rounded-xl p-5 transition-all hover:shadow-lg ${getEstadoColor(mesa.disponible)}`}
                >
                  {/* Header de la card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        Mesa {mesa.numero}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mesa.sucursales.nombre}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(mesa.disponible)}`}
                    >
                      {mesa.disponible ? "Disponible" : "Ocupada"}
                    </span>
                  </div>

                  {/* Información */}
                  <div className="space-y-2.5 mb-4">
                    {mesa.ubicacion && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="text-gray-400" size={16} />
                        <span>{mesa.ubicacion}</span>
                      </div>
                    )}

                    {mesa.ordenActual && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <p className="text-blue-600">
                          Orden activa{" "}
                          <span className="font-medium">
                            #{mesa.ordenActual.numeroOrden}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notas si existen */}
                  {mesa.notas && (
                    <div className="mb-4 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800 line-clamp-2">
                        {mesa.notas}
                      </p>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="bordered"
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                      startContent={<Edit size={14} />}
                      onPress={() => handleEdit(mesa)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="bordered"
                      className="flex-1 border-red-300 hover:bg-red-50 text-red-600"
                      startContent={<Trash2 size={14} />}
                      onPress={() => handleDelete(mesa)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Mesa */}
      <Modal
        isOpen={isNewMesaOpen}
        onClose={onNewMesaClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold text-gray-900">Nueva Mesa</h3>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número de Mesa"
                type="number"
                min={1}
                value={formData.numero.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    numero: parseInt(value, 10) || 0,
                  }))
                }
                isInvalid={!!errors.numero}
                errorMessage={errors.numero ? "Número de mesa requerido" : ""}
                isRequired
              />
            </div>

            <Input
              label="Ubicación"
              value={formData.ubicacion}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  ubicacion: e.target.value,
                }))
              }
              placeholder="Ej: Terraza, Salón principal, etc."
            />

            <Textarea
              label="Notas"
              value={formData.notas}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notas: e.target.value }))
              }
              placeholder="Notas adicionales sobre la mesa..."
              minRows={3}
            />

            <Checkbox
              isSelected={formData.disponible}
              onValueChange={(checked) =>
                setFormData((prev) => ({ ...prev, disponible: checked }))
              }
            >
              Mesa disponible
            </Checkbox>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onNewMesaClose}
              isDisabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              className="bg-wine"
            >
              Crear Mesa
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Editar Mesa */}
      <Modal isOpen={isEditMesaOpen} onClose={onEditMesaClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold text-gray-900">
              Editar Mesa {editingMesa?.numero}
            </h3>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número de Mesa"
                type="number"
                min={1}
                value={formData.numero.toString()}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    numero: parseInt(e.target.value, 10) || 0,
                  }))
                }
                isInvalid={!!errors.numero}
                errorMessage={errors.numero ? "Número de mesa requerido" : ""}
                isRequired
              />
            </div>

            <Input
              label="Ubicación"
              value={formData.ubicacion}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  ubicacion: e.target.value,
                }))
              }
              placeholder="Ej: Terraza, Salón principal, etc."
            />

            <Textarea
              label="Notas"
              value={formData.notas}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notas: e.target.value }))
              }
              placeholder="Notas adicionales sobre la mesa..."
              minRows={3}
            />

            <Checkbox
              isSelected={formData.disponible}
              onValueChange={(checked) =>
                setFormData((prev) => ({ ...prev, disponible: checked }))
              }
            >
              Mesa disponible
            </Checkbox>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onEditMesaClose}
              isDisabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              className="bg-wine"
            >
              Actualizar Mesa
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <ModalConfirm
        isOpen={isEliminarMesaOpen}
        onClose={onEliminarMesaClose}
        onConfirm={confirmDelete}
        title="Eliminar Mesa"
        message={
          mesaAEliminar
            ? `¿Estás seguro de que deseas eliminar la Mesa ${mesaAEliminar.numero}${mesaAEliminar.ubicacion ? ` (${mesaAEliminar.ubicacion})` : ""}? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar"
        confirmColor="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}