"use client";

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
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import {
  EyeClosed,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Usuario {
  id: string;
  nombre_completo: string;
  identificacion: string;
  correo: string | null;
  telefono: string | null;
  rol: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  sucursales?: {
    id: string;
    nombre: string;
  };
}

interface Sucursal {
  id: string;
  nombre: string;
}

interface FormUsuario {
  nombre_completo: string;
  identificacion: string;
  correo: string;
  telefono: string;
  password: string;
  rol: string;
  sucursal_id: string;
  activo: boolean;
}

const rolesOptions = [
  { key: "ADMINISTRADOR", label: "Administrador" },
  { key: "MESERO", label: "Mesero" },
];

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<Usuario | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Estados para filtros
  const [searchText, setSearchText] = useState("");
  const [selectedRol, setSelectedRol] = useState("");
  const [selectedSucursal, setSelectedSucursal] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");

  const {
    isOpen: isOpenCreate,
    onOpen: onOpenCreate,
    onClose: onCloseCreate,
  } = useDisclosure();
  const {
    isOpen: isOpenEdit,
    onOpen: onOpenEdit,
    onClose: onCloseEdit,
  } = useDisclosure();
  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete,
  } = useDisclosure();
  const {
    isOpen: isOpenDetail,
    onOpen: onOpenDetail,
    onClose: onCloseDetail,
  } = useDisclosure();

  const [formData, setFormData] = useState<FormUsuario>({
    nombre_completo: "",
    identificacion: "",
    correo: "",
    telefono: "",
    password: "",
    rol: "MESERO",
    sucursal_id: "",
    activo: true,
  });

  // Cargar usuarios con filtros
  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);

      // Obtener el usuario autenticado del localStorage
      let currentUserId = null;
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const authData = JSON.parse(authStorage);
          currentUserId = authData?.state?.user?.id;
        }
      } catch (error) {
        console.warn("No se pudo obtener el usuario autenticado:", error);
      }

      // Construir parámetros de búsqueda
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      if (selectedRol) params.append("rol", selectedRol);
      if (selectedSucursal) params.append("sucursal_id", selectedSucursal);
      if (selectedEstado) params.append("activo", selectedEstado);
      if (currentUserId) params.append("excludeUserId", currentUserId); // Excluir usuario autenticado

      const response = await fetch(`/api/usuarios?${params}`);
      const result = await response.json();

      if (result.success) {
        setUsuarios(result.data || result.usuarios || []);
        console.log(result.data || result.usuarios);
      } else {
        addToast({
          title: "Error al cargar usuarios",
          description: result.message || "Intenta nuevamente más tarde",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      addToast({
        title: "Error al cargar usuarios",
        description: "Intenta nuevamente más tarde",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedEstado, selectedRol, selectedSucursal]);

  // Cargar sucursales
  const cargarSucursales = useCallback(async () => {
    try {
      const response = await fetch("/api/sucursales");
      const result = await response.json();

      if (result.success) {
        setSucursales(result.sucursales);
      } else {
        addToast({
          title: "Error al cargar sucursales",
          description: result.message || "Intenta nuevamente más tarde",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
      addToast({
        title: "Error al cargar sucursales",
        description: "Intenta nuevamente más tarde",
        color: "danger",
      });
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
    cargarSucursales();
  }, [cargarSucursales, cargarUsuarios]);

  // Efecto para filtros en tiempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarUsuarios();
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargarUsuarios]);

  // Manejar envío del formulario
  const handleSubmit = async (isEdit = false) => {
    try {
      setSubmitting(true);

      const dataToSend = isEdit
        ? { id: usuarioSeleccionado?.id, ...formData }
        : formData;

      const url = "/api/usuarios";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          title: "Usuario guardado",
          description: result.message || "El usuario ha sido guardado",
          color: "success",
        });
        cargarUsuarios();
        resetForm();
        if (isEdit) {
          onCloseEdit();
        } else {
          onCloseCreate();
        }
      } else {
        addToast({
          title: "Error al guardar usuario",
          description: result.message || "Intenta nuevamente más tarde",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      addToast({
        title: "Error al guardar usuario",
        description: "Intenta nuevamente más tarde",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar usuario
  const handleDelete = async () => {
    if (!usuarioSeleccionado) return;

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/usuarios?id=${usuarioSeleccionado.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (result.success) {
        addToast({
          title: "Usuario eliminado",
          description: result.message || "El usuario ha sido eliminado",
          color: "success",
        });
        cargarUsuarios();
        onCloseDelete();
        setUsuarioSeleccionado(null);
      } else {
        addToast({
          title: "Error al eliminar usuario",
          description: result.message || "Intenta nuevamente más tarde",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      addToast({
        title: "Error al eliminar usuario",
        description: "Intenta nuevamente más tarde",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre_completo: "",
      identificacion: "",
      correo: "",
      telefono: "",
      password: "",
      rol: "MESERO",
      sucursal_id: "",
      activo: true,
    });
    setUsuarioSeleccionado(null);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchText("");
    setSelectedRol("");
    setSelectedSucursal("");
    setSelectedEstado("");
  };

  // Abrir modal de detalles
  const openDetailModal = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    onOpenDetail();
  };

  // Abrir modal de edición
  const openEditModal = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormData({
      nombre_completo: usuario.nombre_completo,
      identificacion: usuario.identificacion,
      correo: usuario.correo || "",
      telefono: usuario.telefono || "",
      password: "", // No mostrar password actual
      rol: usuario.rol,
      sucursal_id: usuario.sucursales?.id || "",
      activo: usuario.activo,
    });
    onOpenEdit();
  };

  // Abrir modal de eliminación
  const _openDeleteModal = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    onOpenDelete();
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case "ADMINISTRADOR":
        return "danger";
      case "GERENTE":
        return "warning";
      case "MESERO":
        return "primary";
      case "COCINERO":
        return "secondary";
      case "CAJERO":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header con búsqueda */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Administra los usuarios del sistema
            </p>
          </div>

          <Button
            color="primary"
            startContent={<PlusIcon size={18} />}
            onPress={() => {
              resetForm();
              onOpenCreate();
            }}
          >
            Nuevo Usuario
          </Button>
        </div>

        {/* Filtros de búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Buscar usuario
            </label>
            <input
              id="search"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar por nombre, correo o identificación..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="rol"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Rol
            </label>
            <select
              id="rol"
              value={selectedRol}
              onChange={(e) => setSelectedRol(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todos los roles</option>
              {rolesOptions.map((rol) => (
                <option key={rol.key} value={rol.key}>
                  {rol.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="estado"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Estado
            </label>
            <select
              id="estado"
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Filtro adicional para sucursal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label
              htmlFor="sucursal"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Sucursal
            </label>
            <select
              id="sucursal"
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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

        {/* Botón limpiar filtros */}
        {(searchText || selectedRol || selectedSucursal || selectedEstado) && (
          <div className="mt-4">
            <Button onPress={limpiarFiltros} variant="bordered" size="sm">
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Usuarios encontrados: {usuarios.length}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Cargando usuarios...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-gray-500 mb-4">
              {searchText || selectedRol || selectedSucursal || selectedEstado
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza agregando tu primer usuario"}
            </p>
            <Button
              color="primary"
              onPress={() => {
                resetForm();
                onOpenCreate();
              }}
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              Crear Usuario
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Contenido */}
                <div className="p-4">
                  <div className="flex justify-between">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">
                        {usuario.nombre_completo}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ID: {usuario.identificacion}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Chip
                        color={getRolColor(usuario.rol)}
                        variant="flat"
                        size="sm"
                        className="text-xs"
                      >
                        {rolesOptions.find((r) => r.key === usuario.rol)
                          ?.label || usuario.rol}
                      </Chip>
                      <Chip
                        color={usuario.activo ? "success" : "danger"}
                        variant="flat"
                        size="sm"
                        className="text-xs"
                      >
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </Chip>
                    </div>
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-2 mb-4">
                    {usuario.correo && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Correo:</span>
                        <span className="text-gray-800 truncate ml-2">
                          {usuario.correo}
                        </span>
                      </div>
                    )}
                    {usuario.telefono && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Teléfono:</span>
                        <span className="text-gray-800">
                          {usuario.telefono}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sucursal:</span>
                      <span className="text-gray-800 truncate ml-2">
                        {usuario.sucursales?.nombre || "No asignada"}
                      </span>
                    </div>
                  </div>

                  {/* Fecha de creación */}
                  <div className="mb-4 pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      Creado: {formatearFecha(usuario.creado_en)}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="bordered"
                      fullWidth
                      onPress={() => openEditModal(usuario)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      color="primary"
                      fullWidth
                      onPress={() => openDetailModal(usuario)}
                    >
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      <Modal
        isOpen={isOpenCreate}
        onClose={onCloseCreate}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Crear Nuevo Usuario
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre completo"
                placeholder="Ej: Juan Pérez"
                value={formData.nombre_completo}
                onChange={(e) =>
                  setFormData({ ...formData, nombre_completo: e.target.value })
                }
                isRequired
              />
              <Input
                label="Identificación"
                placeholder="Ej: 12345678"
                value={formData.identificacion}
                onChange={(e) =>
                  setFormData({ ...formData, identificacion: e.target.value })
                }
                isRequired
              />
              <Input
                label="Correo electrónico"
                placeholder="Ej: juan@ejemplo.com"
                type="email"
                value={formData.correo}
                onChange={(e) =>
                  setFormData({ ...formData, correo: e.target.value })
                }
              />
              <Input
                label="Teléfono"
                placeholder="Ej: 3001234567"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
              />
              <div className="relative">
                <Input
                  label="Contraseña"
                  placeholder="••••••••"
                  type={mostrarPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  isRequired
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                    >
                      {mostrarPassword ? (
                        <EyeClosed className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  }
                />
              </div>
              <Select
                label="Rol"
                placeholder="Seleccionar rol"
                selectedKeys={[formData.rol]}
                onChange={(e) =>
                  setFormData({ ...formData, rol: e.target.value })
                }
                isRequired
              >
                {rolesOptions.map((rol) => (
                  <SelectItem key={rol.key}>{rol.label}</SelectItem>
                ))}
              </Select>
              <Select
                label="Sucursal"
                placeholder="Seleccionar sucursal"
                selectedKeys={[formData.sucursal_id]}
                onChange={(e) =>
                  setFormData({ ...formData, sucursal_id: e.target.value })
                }
                isRequired
              >
                {sucursales.map((sucursal) => (
                  <SelectItem key={sucursal.id}>{sucursal.nombre}</SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onCloseCreate}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={() => handleSubmit(false)}
              isLoading={submitting}
            >
              Crear Usuario
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Editar Usuario */}
      <Modal
        isOpen={isOpenEdit}
        onClose={onCloseEdit}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Editar Usuario
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre completo"
                placeholder="Ej: Juan Pérez"
                value={formData.nombre_completo}
                onChange={(e) =>
                  setFormData({ ...formData, nombre_completo: e.target.value })
                }
                isRequired
              />
              <Input
                label="Identificación"
                placeholder="Ej: 12345678"
                value={formData.identificacion}
                onChange={(e) =>
                  setFormData({ ...formData, identificacion: e.target.value })
                }
                isRequired
              />
              <Input
                label="Correo electrónico"
                placeholder="Ej: juan@ejemplo.com"
                type="email"
                value={formData.correo}
                onChange={(e) =>
                  setFormData({ ...formData, correo: e.target.value })
                }
              />
              <Input
                label="Teléfono"
                placeholder="Ej: 3001234567"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
              />
              <div className="relative">
                <Input
                  label="Nueva contraseña (opcional)"
                  placeholder="••••••••"
                  type={mostrarPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  description="Dejar en blanco para mantener la contraseña actual"
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                    >
                      {mostrarPassword ? (
                        <EyeClosed className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  }
                />
              </div>
              <Select
                label="Rol"
                placeholder="Seleccionar rol"
                selectedKeys={[formData.rol]}
                onChange={(e) =>
                  setFormData({ ...formData, rol: e.target.value })
                }
                isRequired
              >
                {rolesOptions.map((rol) => (
                  <SelectItem key={rol.key} textValue={rol.key}>
                    {rol.label}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Sucursal"
                placeholder="Seleccionar sucursal"
                selectedKeys={[formData.sucursal_id]}
                onChange={(e) =>
                  setFormData({ ...formData, sucursal_id: e.target.value })
                }
                isRequired
              >
                {sucursales.map((sucursal) => (
                  <SelectItem key={sucursal.id} textValue={sucursal.id}>
                    {sucursal.nombre}
                  </SelectItem>
                ))}
              </Select>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) =>
                    setFormData({ ...formData, activo: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <label htmlFor="activo" className="text-sm">
                  Usuario activo
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onCloseEdit}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={() => handleSubmit(true)}
              isLoading={submitting}
            >
              Actualizar Usuario
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal isOpen={isOpenDelete} onClose={onCloseDelete}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Confirmar Eliminación
          </ModalHeader>
          <ModalBody>
            <p>
              ¿Estás seguro de que deseas eliminar al usuario{" "}
              <strong>{usuarioSeleccionado?.nombre_completo}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onCloseDelete}>
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={submitting}
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Detalles de Usuario */}
      <Modal
        isOpen={isOpenDetail}
        onClose={onCloseDetail}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Detalles del Usuario
          </ModalHeader>
          <ModalBody>
            {usuarioSeleccionado && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda - Avatar y datos básicos */}
                <div className="space-y-4">
                  <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-900 text-center">
                      {usuarioSeleccionado.nombre_completo}
                    </h3>
                    <Chip
                      color={getRolColor(usuarioSeleccionado.rol)}
                      variant="flat"
                      size="lg"
                      className="mt-2"
                    >
                      {rolesOptions.find(
                        (r) => r.key === usuarioSeleccionado.rol,
                      )?.label || usuarioSeleccionado.rol}
                    </Chip>
                    <Chip
                      color={usuarioSeleccionado.activo ? "success" : "danger"}
                      variant="flat"
                      size="sm"
                      className="mt-2"
                    >
                      {usuarioSeleccionado.activo ? "Activo" : "Inactivo"}
                    </Chip>
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">
                      Información de Contacto
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">
                            Identificación
                          </p>
                          <p className="font-medium">
                            {usuarioSeleccionado.identificacion}
                          </p>
                        </div>
                      </div>
                      {usuarioSeleccionado.correo && (
                        <div className="flex items-center gap-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-label="correo"
                            role="img"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                            />
                          </svg>
                          <div>
                            <p className="text-sm text-gray-500">
                              Correo electrónico
                            </p>
                            <p className="font-medium">
                              {usuarioSeleccionado.correo}
                            </p>
                          </div>
                        </div>
                      )}
                      {usuarioSeleccionado.telefono && (
                        <div className="flex items-center gap-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-label="teléfono"
                            role="img"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm text-gray-500">Teléfono</p>
                            <p className="font-medium">
                              {usuarioSeleccionado.telefono}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Columna derecha - Información del sistema */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">
                      Información del Sistema
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Sucursal asignada
                        </p>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="font-medium text-blue-900">
                            {usuarioSeleccionado.sucursales?.nombre ||
                              "No asignada"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          ID del usuario
                        </p>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-mono text-sm text-gray-700">
                            {usuarioSeleccionado.id}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Fecha de creación
                          </p>
                          <p className="font-medium">
                            {formatearFecha(usuarioSeleccionado.creado_en)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Última actualización
                          </p>
                          <p className="font-medium">
                            {formatearFecha(usuarioSeleccionado.actualizado_en)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onCloseDetail}>
              Cerrar
            </Button>
            <Button
              color="warning"
              variant="flat"
              onPress={() => {
                onCloseDetail();
                if (usuarioSeleccionado) {
                  openEditModal(usuarioSeleccionado);
                }
              }}
              startContent={<PencilIcon className="h-4 w-4" />}
            >
              Editar Usuario
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default UsuariosPage;
