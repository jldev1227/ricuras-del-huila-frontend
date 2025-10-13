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
  Spinner,
  useDisclosure,
} from "@heroui/react";
import {
  EyeClosed,
  EyeIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface UsuarioProfile {
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

interface FormProfile {
  nombre_completo: string;
  identificacion: string;
  correo: string;
  telefono: string;
  password: string;
}

const ConfiguracionPage = () => {
  const [usuario, setUsuario] = useState<UsuarioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    isOpen: isOpenConfirm,
    onOpen: onOpenConfirm,
    onClose: onCloseConfirm,
  } = useDisclosure();

  const [formData, setFormData] = useState<FormProfile>({
    nombre_completo: "",
    identificacion: "",
    correo: "",
    telefono: "",
    password: "",
  });

  const [originalData, setOriginalData] = useState<FormProfile>({
    nombre_completo: "",
    identificacion: "",
    correo: "",
    telefono: "",
    password: "",
  });

  // Obtener usuario autenticado del localStorage
  const getCurrentUser = useCallback(() => {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        return authData?.state?.user;
      }
    } catch (error) {
      console.error("Error al obtener usuario autenticado:", error);
    }
    return null;
  }, []);

  // Cargar perfil del usuario
  const cargarPerfil = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();

      if (!currentUser?.id) {
        addToast({
          title: "Error de autenticación",
          description: "No se pudo obtener información del usuario autenticado",
          color: "danger",
        });
        return;
      }

      const response = await fetch(
        `/api/usuarios/profile?userId=${currentUser.id}`,
      );
      const result = await response.json();

      if (result.success) {
        setUsuario(result.data);
        const profileData = {
          nombre_completo: result.data.nombre_completo,
          identificacion: result.data.identificacion,
          correo: result.data.correo || "",
          telefono: result.data.telefono || "",
          password: "",
        };
        setFormData(profileData);
        setOriginalData(profileData);
      } else {
        addToast({
          title: "Error al cargar perfil",
          description: result.message || "Intenta nuevamente más tarde",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      addToast({
        title: "Error al cargar perfil",
        description: "Intenta nuevamente más tarde",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [getCurrentUser]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // Detectar cambios en el formulario
  useEffect(() => {
    const dataChanged =
      JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(dataChanged);
  }, [formData, originalData]);

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof FormProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Actualizar perfil
  const handleUpdateProfile = async () => {
    try {
      setSubmitting(true);
      const currentUser = getCurrentUser();

      if (!currentUser?.id) {
        addToast({
          title: "Error de autenticación",
          description: "No se pudo obtener información del usuario autenticado",
          color: "danger",
        });
        return;
      }

      const response = await fetch("/api/usuarios/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          title: "Perfil actualizado",
          description: "Tu información ha sido actualizada exitosamente",
          color: "success",
        });

        // Actualizar el localStorage con la nueva información
        try {
          const authStorage = localStorage.getItem("auth-storage");
          if (authStorage) {
            const authData = JSON.parse(authStorage);
            authData.user = {
              ...authData.user,
              nombre_completo: result.data.nombre_completo,
              identificacion: result.data.identificacion,
              correo: result.data.correo,
              telefono: result.data.telefono,
            };
            localStorage.setItem("auth-storage", JSON.stringify(authData));
          }
        } catch (error) {
          console.warn("No se pudo actualizar el localStorage:", error);
        }

        // Recargar datos
        cargarPerfil();
        onCloseConfirm();
      } else {
        addToast({
          title: "Error al actualizar perfil",
          description: result.message || "Intenta nuevamente más tarde",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      addToast({
        title: "Error al actualizar perfil",
        description: "Intenta nuevamente más tarde",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Descartar cambios
  const handleDiscardChanges = () => {
    setFormData(originalData);
    setMostrarPassword(false);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
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

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case "ADMINISTRADOR":
        return "Administrador";
      case "GERENTE":
        return "Gerente";
      case "MESERO":
        return "Mesero";
      case "COCINERO":
        return "Cocinero";
      case "CAJERO":
        return "Cajero";
      default:
        return rol;
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-500 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Error al cargar perfil
          </h3>
          <p className="text-gray-500 mb-4">
            No se pudo obtener la información del usuario
          </p>
          <Button color="primary" onPress={cargarPerfil}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Configuración del Perfil
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Actualiza tu información personal
            </p>
          </div>
          {hasChanges && (
            <div className="flex gap-2">
              <Button variant="bordered" onPress={handleDiscardChanges}>
                Descartar cambios
              </Button>
              <Button color="primary" onPress={onOpenConfirm}>
                Guardar cambios
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de información del usuario */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {usuario.nombre_completo}
              </h3>
              <p className="text-gray-600">ID: {usuario.identificacion}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Chip
                  color={getRolColor(usuario.rol)}
                  variant="flat"
                  size="lg"
                  startContent={<ShieldCheckIcon className="h-4 w-4" />}
                >
                  {getRolLabel(usuario.rol)}
                </Chip>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Sucursal asignada</p>
                  <p className="font-medium text-gray-900">
                    {usuario.sucursales?.nombre || "No asignada"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <Chip
                    color={usuario.activo ? "success" : "danger"}
                    variant="flat"
                    size="sm"
                  >
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </Chip>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Miembro desde</p>
                  <p className="font-medium text-gray-900">
                    {formatearFecha(usuario.creado_en)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de edición */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Información Personal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nombre completo"
                placeholder="Ej: Juan Pérez"
                value={formData.nombre_completo}
                onChange={(e) =>
                  handleInputChange("nombre_completo", e.target.value)
                }
                isRequired
                startContent={<UserIcon className="h-4 w-4 text-gray-400" />}
              />

              <Input
                label="Identificación"
                placeholder="Ej: 12345678"
                value={formData.identificacion}
                onChange={(e) =>
                  handleInputChange("identificacion", e.target.value)
                }
                isRequired
              />

              <Input
                label="Correo electrónico"
                placeholder="Ej: juan@ejemplo.com"
                type="email"
                value={formData.correo}
                onChange={(e) => handleInputChange("correo", e.target.value)}
              />

              <Input
                label="Teléfono"
                placeholder="Ej: 3001234567"
                value={formData.telefono}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
              />

              <div className="md:col-span-2">
                <Input
                  label="Nueva contraseña (opcional)"
                  placeholder="••••••••"
                  type={mostrarPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
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
            </div>

            {hasChanges && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <SaveIcon className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Tienes cambios sin guardar. No olvides guardar tus
                    modificaciones.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      <Modal isOpen={isOpenConfirm} onClose={onCloseConfirm}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Confirmar Actualización
          </ModalHeader>
          <ModalBody>
            <p>
              ¿Estás seguro de que deseas actualizar tu información personal?
            </p>
            {formData.password && (
              <p className="text-sm text-gray-600">
                <strong>Nota:</strong> También se actualizará tu contraseña.
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onCloseConfirm}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateProfile}
              isLoading={submitting}
              startContent={<SaveIcon className="h-4 w-4" />}
            >
              Actualizar Perfil
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ConfiguracionPage;
