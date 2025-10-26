"use client";

import {
  addToast,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
} from "@heroui/react";
import { Edit, Package, Plus, Search, Trash2, X, AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  activo: boolean;
  _count: {
    productos: number;
  };
}

interface NuevaCategoria {
  nombre: string;
  descripcion: string;
  icono: string;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para modal de crear
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState<NuevaCategoria>({
    nombre: "",
    descripcion: "",
    icono: "",
  });
  
  // Estados para modal de editar
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState<Categoria | null>(null);
  const [categoriaEditForm, setCategoriaEditForm] = useState<NuevaCategoria>({
    nombre: "",
    descripcion: "",
    icono: "",
  });
  
  // Estados para modal de eliminar
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoriaEliminar, setCategoriaEliminar] = useState<Categoria | null>(null);
  
  const [errors, setErrors] = useState<Partial<NuevaCategoria>>({});

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/categorias");
      const data = await response.json();

      if (data.success) {
        setCategorias(data.categorias);
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const validarFormulario = (datos: NuevaCategoria): boolean => {
    const newErrors: Partial<NuevaCategoria> = {};

    if (!datos.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    } else if (datos.nombre.trim().length > 100) {
      newErrors.nombre = "El nombre no puede exceder 100 caracteres";
    }

    if (datos.descripcion && datos.descripcion.length > 500) {
      newErrors.descripcion = "La descripción no puede exceder 500 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para crear categoría
  const handleSubmit = async () => {
    if (!validarFormulario(nuevaCategoria)) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/categorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nuevaCategoria.nombre.trim(),
          descripcion: nuevaCategoria.descripcion.trim() || null,
          icono: nuevaCategoria.icono.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCategorias((prev) => [...prev, data.categoria]);
        setNuevaCategoria({ nombre: "", descripcion: "", icono: "" });
        setErrors({});
        setIsModalOpen(false);

        addToast({
          title: "Categoría creada",
          description: "La categoría ha sido creada exitosamente.",
          color: "success",
        });
      } else {
        setErrors({ nombre: data.message });
      }
    } catch (error) {
      console.error("Error al crear categoría:", error);
      setErrors({ nombre: "Error al crear la categoría. Inténtalo de nuevo." });
    } finally {
      setIsCreating(false);
    }
  };

  // Función para abrir modal de editar
  const handleOpenEditModal = (categoria: Categoria) => {
    setCategoriaEditar(categoria);
    setCategoriaEditForm({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
      icono: categoria.icono || "",
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  // Función para actualizar categoría
  const handleUpdate = async () => {
    if (!categoriaEditar || !validarFormulario(categoriaEditForm)) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/categorias", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: categoriaEditar.id,
          nombre: categoriaEditForm.nombre.trim(),
          descripcion: categoriaEditForm.descripcion.trim() || null,
          icono: categoriaEditForm.icono.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar el estado local
        setCategorias((prev) =>
          prev.map((cat) =>
            cat.id === categoriaEditar.id ? data.categoria : cat
          )
        );
        setIsEditModalOpen(false);
        setCategoriaEditar(null);
        setCategoriaEditForm({ nombre: "", descripcion: "", icono: "" });
        setErrors({});
      } else {
        setErrors({ nombre: data.message });
      }
    } catch (error) {
      console.error("Error al actualizar categoría:", error);
      setErrors({ nombre: "Error al actualizar la categoría. Inténtalo de nuevo." });
    } finally {
      setIsUpdating(false);
    }
  };

  // Función para abrir modal de eliminar
  const handleOpenDeleteModal = (categoria: Categoria) => {
    setCategoriaEliminar(categoria);
    setIsDeleteModalOpen(true);
  };

  // Función para eliminar categoría
  const handleDelete = async () => {
    if (!categoriaEliminar) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/categorias?id=${categoriaEliminar.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Remover del estado local
        setCategorias((prev) => prev.filter((cat) => cat.id !== categoriaEliminar.id));
        setIsDeleteModalOpen(false);
        setCategoriaEliminar(null);

        // Mostrar mensaje de éxito
        addToast({
          title: "Categoría eliminada",
          description: "La categoría ha sido eliminada exitosamente.",
          color: "success",
        });
      } else {
        // Manejar error
        alert(data.message || "Error al eliminar la categoría");
      }
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      alert("Error al eliminar la categoría. Inténtalo de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNuevaCategoria({ nombre: "", descripcion: "", icono: "" });
    setErrors({});
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCategoriaEditar(null);
    setCategoriaEditForm({ nombre: "", descripcion: "", icono: "" });
    setErrors({});
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCategoriaEliminar(null);
  };

  const categoriasFiltradas = categorias.filter((categoria) =>
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalProductos = categorias.reduce(
    (total, cat) => total + cat._count.productos,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Categorías
              </h1>
              <p className="text-sm text-gray-500">
                Organiza tus productos por categorías
              </p>
            </div>
            <Button
              color="primary"
              className="bg-wine shadow-lg hover:shadow-xl transition-all"
              startContent={<Plus size={18} />}
              onPress={() => setIsModalOpen(true)}
            >
              Nueva Categoría
            </Button>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine transition-all text-black"
            />
            {searchTerm && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </Button>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        {!loading && categorias.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Categorías</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {categorias.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Productos</p>
                  <p className="text-3xl font-bold text-wine">
                    {totalProductos}
                  </p>
                </div>
                <div className="w-12 h-12 bg-wine/10 rounded-lg flex items-center justify-center">
                  <div className="text-2xl">🍽️</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Promedio por Categoría
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {categorias.length > 0
                      ? Math.round(totalProductos / categorias.length)
                      : 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="text-2xl">📊</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid de categorías */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" color="primary" />
            </div>
          ) : categoriasFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm
                  ? "No se encontraron categorías"
                  : "No hay categorías"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "Intenta con otro término de búsqueda"
                  : "Comienza creando tu primera categoría"}
              </p>
              {!searchTerm && (
                <Button
                  color="primary"
                  className="bg-wine"
                  startContent={<Plus size={18} />}
                  onPress={() => setIsModalOpen(true)}
                >
                  Crear Primera Categoría
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoriasFiltradas.map((categoria, index) => (
                <div
                  key={categoria.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all group relative"
                >
                  {/* Icono y título */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-wine/10 rounded-lg flex items-center justify-center text-2xl shrink-0">
                      {categoria.icono || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                        {categoria.nombre}
                      </h3>
                      {categoria.descripcion && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {categoria.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contador de productos */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Productos</span>
                      <span className="font-bold text-wine">
                        {categoria._count.productos}
                      </span>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        categoria.activo
                          ? "bg-green-100 text-green-700 ring-1 ring-green-600/20"
                          : "bg-gray-100 text-gray-700 ring-1 ring-gray-600/20"
                      }`}
                    >
                      {categoria.activo ? "✓ Activa" : "⊗ Inactiva"}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="bordered"
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                      startContent={<Edit size={14} />}
                      onPress={() => handleOpenEditModal(categoria)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      isIconOnly
                      className="hover:bg-red-100"
                      onPress={() => handleOpenDeleteModal(categoria)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  {/* Badge de posición */}
                  <div className="absolute top-3 right-3 w-6 h-6 bg-wine rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categorías sin productos (si las hay) */}
        {!loading &&
          categorias.length > 0 &&
          (() => {
            const sinProductos = categorias.filter(
              (c) => c._count.productos === 0,
            );
            if (sinProductos.length === 0) return null;

            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 mb-1">
                      Categorías sin productos
                    </h3>
                    <p className="text-sm text-yellow-800 mb-3">
                      Las siguientes categorías no tienen productos asociados:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sinProductos.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm text-yellow-900 border border-yellow-300"
                        >
                          {cat.icono && <span>{cat.icono}</span>}
                          {cat.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>

      {/* Modal para crear nueva categoría */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="2xl"
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Nueva Categoría
            </h2>
            <p className="text-sm text-gray-500">
              Crea una nueva categoría para organizar tus productos
            </p>
          </ModalHeader>

          <ModalBody className="py-6">
            <div className="space-y-6">
              {/* Campo Nombre */}
              <div>
                <Input
                  label="Nombre de la categoría"
                  placeholder="Ej: Platos principales, Bebidas, Postres..."
                  value={nuevaCategoria.nombre}
                  onChange={(e) =>
                    setNuevaCategoria((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  isInvalid={!!errors.nombre}
                  errorMessage={errors.nombre}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    input: "text-base",
                    inputWrapper: "border-gray-300 focus:border-wine",
                  }}
                />
              </div>

              {/* Campo Descripción */}
              <div>
                <Textarea
                  label="Descripción (opcional)"
                  placeholder="Describe brevemente esta categoría..."
                  value={nuevaCategoria.descripcion}
                  onChange={(e) =>
                    setNuevaCategoria((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  isInvalid={!!errors.descripcion}
                  errorMessage={errors.descripcion}
                  variant="bordered"
                  size="lg"
                  minRows={3}
                  maxRows={5}
                  classNames={{
                    input: "text-base",
                    inputWrapper: "border-gray-300 focus:border-wine",
                  }}
                />
              </div>

              {/* Campo Icono */}
              <div>
                <Input
                  label="Icono (opcional)"
                  placeholder="🍽️ (emoji o texto corto)"
                  value={nuevaCategoria.icono}
                  onChange={(e) =>
                    setNuevaCategoria((prev) => ({
                      ...prev,
                      icono: e.target.value,
                    }))
                  }
                  variant="bordered"
                  size="lg"
                  description="Puedes usar emojis o texto corto para representar la categoría"
                  classNames={{
                    input: "text-base",
                    inputWrapper: "border-gray-300 focus:border-wine",
                  }}
                />
              </div>

              {/* Vista previa */}
              {(nuevaCategoria.nombre || nuevaCategoria.icono) && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 font-medium">
                    Vista previa:
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-wine/10 rounded-lg flex items-center justify-center text-lg">
                      {nuevaCategoria.icono || "📦"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {nuevaCategoria.nombre || "Nombre de la categoría"}
                      </p>
                      {nuevaCategoria.descripcion && (
                        <p className="text-sm text-gray-600">
                          {nuevaCategoria.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="light"
              onPress={handleCloseModal}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              className="bg-wine"
              onPress={handleSubmit}
              isLoading={isCreating}
              disabled={!nuevaCategoria.nombre.trim() || isCreating}
              startContent={!isCreating ? <Plus size={16} /> : null}
            >
              {isCreating ? "Creando..." : "Crear Categoría"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para editar categoría */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        size="2xl"
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Editar Categoría
            </h2>
            <p className="text-sm text-gray-500">
              Actualiza la información de la categoría
            </p>
          </ModalHeader>

          <ModalBody className="py-6">
            <div className="space-y-6">
              {/* Campo Nombre */}
              <div>
                <Input
                  label="Nombre de la categoría"
                  placeholder="Ej: Platos principales, Bebidas, Postres..."
                  value={categoriaEditForm.nombre}
                  onChange={(e) =>
                    setCategoriaEditForm((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  isInvalid={!!errors.nombre}
                  errorMessage={errors.nombre}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    input: "text-base",
                    inputWrapper: "border-gray-300 focus:border-wine",
                  }}
                />
              </div>

              {/* Campo Descripción */}
              <div>
                <Textarea
                  label="Descripción (opcional)"
                  placeholder="Describe brevemente esta categoría..."
                  value={categoriaEditForm.descripcion}
                  onChange={(e) =>
                    setCategoriaEditForm((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  isInvalid={!!errors.descripcion}
                  errorMessage={errors.descripcion}
                  variant="bordered"
                  size="lg"
                  minRows={3}
                  maxRows={5}
                  classNames={{
                    input: "text-base",
                    inputWrapper: "border-gray-300 focus:border-wine",
                  }}
                />
              </div>

              {/* Campo Icono */}
              <div>
                <Input
                  label="Icono (opcional)"
                  placeholder="🍽️ (emoji o texto corto)"
                  value={categoriaEditForm.icono}
                  onChange={(e) =>
                    setCategoriaEditForm((prev) => ({
                      ...prev,
                      icono: e.target.value,
                    }))
                  }
                  variant="bordered"
                  size="lg"
                  description="Puedes usar emojis o texto corto para representar la categoría"
                  classNames={{
                    input: "text-base",
                    inputWrapper: "border-gray-300 focus:border-wine",
                  }}
                />
              </div>

              {/* Vista previa */}
              {(categoriaEditForm.nombre || categoriaEditForm.icono) && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 font-medium">
                    Vista previa:
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-wine/10 rounded-lg flex items-center justify-center text-lg">
                      {categoriaEditForm.icono || "📦"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {categoriaEditForm.nombre || "Nombre de la categoría"}
                      </p>
                      {categoriaEditForm.descripcion && (
                        <p className="text-sm text-gray-600">
                          {categoriaEditForm.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="light"
              onPress={handleCloseEditModal}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              className="bg-wine"
              onPress={handleUpdate}
              isLoading={isUpdating}
              disabled={!categoriaEditForm.nombre.trim() || isUpdating}
              startContent={!isUpdating ? <Edit size={16} /> : null}
            >
              {isUpdating ? "Actualizando..." : "Guardar Cambios"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        size="md"
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Eliminar Categoría
              </h2>
            </div>
          </ModalHeader>

          <ModalBody className="py-6">
            {categoriaEliminar && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar la categoría{" "}
                  <span className="font-bold text-gray-900">
                    "{categoriaEliminar.nombre}"
                  </span>
                  ?
                </p>

                {categoriaEliminar._count.productos > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="text-red-600 mt-0.5 shrink-0" size={18} />
                      <div>
                        <p className="text-sm font-semibold text-red-900 mb-1">
                          ¡Advertencia!
                        </p>
                        <p className="text-sm text-red-800">
                          Esta categoría tiene{" "}
                          <span className="font-bold">
                            {categoriaEliminar._count.productos} producto
                            {categoriaEliminar._count.productos !== 1 ? "s" : ""}
                          </span>{" "}
                          asociado{categoriaEliminar._count.productos !== 1 ? "s" : ""}.
                          Al eliminar la categoría, los productos quedarán sin categoría.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              variant="light"
              onPress={handleCloseDeleteModal}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
              disabled={isDeleting}
              startContent={!isDeleting ? <Trash2 size={16} /> : null}
            >
              {isDeleting ? "Eliminando..." : "Eliminar Categoría"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}