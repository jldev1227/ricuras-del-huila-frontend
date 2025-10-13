"use client";

import {
  addToast,
  Button,
  Card,
  Checkbox,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Tab,
  Tabs,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import {
  Building,
  Edit,
  Plus,
  Save,
  Settings,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Interfaces
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

interface Sucursal {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string | null;
  activo: boolean;
  _count?: {
    mesas: number;
  };
}

interface ConfiguracionEmpresa {
  nit: string;
  razon_social: string;
  telefono: string;
  correo?: string | null;
  direccion?: string | null;
}

const ConfiguracionPage = () => {
  // Estados principales
  const [selectedTab, setSelectedTab] = useState("perfil");

  // Estados para usuario/perfil
  const [usuario, setUsuario] = useState<UsuarioProfile | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);

  // Estados para sucursales
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargandoSucursales, setCargandoSucursales] = useState(false);
  const [guardandoSucursal, setGuardandoSucursal] = useState(false);
  const [sucursalSeleccionada, setSucursalSeleccionada] =
    useState<Sucursal | null>(null);
  const [formSucursal, setFormSucursal] = useState({
    nombre: "",
    direccion: "",
    telefono: null as string | null,
    activo: true,
  });

  // Estados para empresa
  const [configuracionEmpresa, setConfiguracionEmpresa] =
    useState<ConfiguracionEmpresa>({
      nit: "",
      razon_social: "Ricuras Del Huila",
      telefono: "",
      correo: null,
      direccion: null,
    });
  const [cargandoEmpresa, setCargandoEmpresa] = useState(false);
  const [guardandoEmpresa, setGuardandoEmpresa] = useState(false);

  // Modal controls
  const {
    isOpen: modalSucursalAbierto,
    onOpen: abrirModalSucursal,
    onClose: cerrarModalSucursal,
  } = useDisclosure();

  // Función para determinar las pestañas disponibles según el rol
  const getAvailableTabs = () => {
    const tabs = [
      {
        key: "perfil",
        title: "Mi Perfil",
        icon: <User className="w-4 h-4" />,
      },
    ];

    if (usuario?.rol === "ADMINISTRADOR") {
      tabs.push(
        {
          key: "sucursales",
          title: "Sucursales",
          icon: <Building className="w-4 h-4" />,
        },
        {
          key: "empresa",
          title: "Empresa",
          icon: <Settings className="w-4 h-4" />,
        },
      );
    }

    return tabs;
  };

  // Cargar perfil del usuario
  const cargarUsuario = useCallback(async () => {
    try {
      setCargandoUsuario(true);

      // Obtener el usuario autenticado desde localStorage
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

      if (!currentUserId) {
        addToast({
          title: "Error",
          description: "No hay sesión activa. Por favor inicia sesión.",
          color: "danger",
        });
        return;
      }

      const response = await fetch(
        `/api/usuarios/profile?userId=${currentUserId}`,
      );
      if (!response.ok) throw new Error("Error al cargar usuario");

      const result = await response.json();
      if (result.success && result.data) {
        setUsuario(result.data);
      } else {
        throw new Error(result.message || "Error al cargar datos del usuario");
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
      addToast({
        title: "Error",
        description: "No se pudo cargar la información del usuario",
        color: "danger",
      });
    } finally {
      setCargandoUsuario(false);
    }
  }, []);

  // Cargar sucursales
  const cargarSucursales = useCallback(async () => {
    try {
      setCargandoSucursales(true);
      const response = await fetch("/api/sucursales");
      if (!response.ok) throw new Error("Error al cargar sucursales");

      const data = await response.json();
      setSucursales(data.sucursales);
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
      addToast({
        title: "Error",
        description: "No se pudieron cargar las sucursales",
        color: "danger",
      });
    } finally {
      setCargandoSucursales(false);
    }
  }, []);

  // Cargar configuración de empresa
  const cargarConfiguracionEmpresa = useCallback(async () => {
    try {
      setCargandoEmpresa(true);

      // Obtener el userId
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

      if (!currentUserId) {
        addToast({
          title: "Error",
          description: "No hay sesión activa. Por favor inicia sesión.",
          color: "danger",
        });
        return;
      }

      const response = await fetch(
        `/api/configuracion/empresa?userId=${currentUserId}`,
      );
      if (!response.ok) throw new Error("Error al cargar configuración");

      const data = await response.json();
      setConfiguracionEmpresa({
        nit: data.nit || "",
        razon_social: data.razon_social || "Ricuras Del Huila",
        telefono: data.telefono || "",
        correo: data.correo || null,
        direccion: data.direccion || null,
      });
    } catch (error) {
      console.error("Error al cargar configuración empresa:", error);
      addToast({
        title: "Error",
        description: "No se pudo cargar la configuración de la empresa",
        color: "danger",
      });
    } finally {
      setCargandoEmpresa(false);
    }
  }, []);

  // Función auxiliar para resetear el formulario de sucursal
  const resetFormSucursal = useCallback(() => {
    setFormSucursal({
      nombre: "",
      direccion: "",
      telefono: null,
      activo: true,
    });
    setSucursalSeleccionada(null);
  }, []);

  // Guardar sucursal
  const guardarSucursal = useCallback(async () => {
    try {
      setGuardandoSucursal(true);

      if (!formSucursal.nombre || !formSucursal.direccion) {
        addToast({
          title: "Error",
          description: "Nombre y dirección son obligatorios",
          color: "danger",
        });
        return;
      }

      const url = sucursalSeleccionada
        ? `/api/sucursales/${sucursalSeleccionada.id}`
        : "/api/sucursales";

      const method = sucursalSeleccionada ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formSucursal),
      });

      if (!response.ok) throw new Error("Error al guardar sucursal");

      await cargarSucursales();
      cerrarModalSucursal();
      resetFormSucursal();

      addToast({
        title: "Éxito",
        description: `Sucursal ${sucursalSeleccionada ? "actualizada" : "creada"} correctamente`,
      });
    } catch (error) {
      console.error("Error al guardar sucursal:", error);
      addToast({
        title: "Error",
        description: "No se pudo guardar la sucursal",
        color: "danger",
      });
    } finally {
      setGuardandoSucursal(false);
    }
  }, [
    cargarSucursales,
    cerrarModalSucursal,
    formSucursal,
    resetFormSucursal,
    sucursalSeleccionada,
  ]);

  // Eliminar sucursal
  const eliminarSucursal = useCallback(
    async (id: string) => {
      if (!confirm("¿Estás seguro de eliminar esta sucursal?")) return;

      try {
        const response = await fetch(`/api/sucursales/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Error al eliminar sucursal");

        await cargarSucursales();
        addToast({
          title: "Éxito",
          description: "Sucursal eliminada correctamente",
        });
      } catch (error) {
        console.error("Error al eliminar sucursal:", error);
        addToast({
          title: "Error",
          description: "No se pudo eliminar la sucursal",
          color: "danger",
        });
      }
    },
    [cargarSucursales],
  );

  // Guardar configuración de empresa
  const guardarConfiguracionEmpresa = useCallback(async () => {
    try {
      setGuardandoEmpresa(true);

      if (
        !configuracionEmpresa.nit ||
        !configuracionEmpresa.razon_social ||
        !configuracionEmpresa.telefono
      ) {
        addToast({
          title: "Error",
          description: "NIT, razón social y teléfono son obligatorios",
          color: "danger",
        });
        return;
      }

      // Obtener el userId
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

      if (!currentUserId) {
        addToast({
          title: "Error",
          description: "No hay sesión activa. Por favor inicia sesión.",
          color: "danger",
        });
        return;
      }

      const response = await fetch("/api/configuracion/empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...configuracionEmpresa,
          userId: currentUserId,
        }),
      });

      if (!response.ok) throw new Error("Error al guardar configuración");

      addToast({
        title: "Éxito",
        description: "Configuración de empresa guardada correctamente",
      });
    } catch (error) {
      console.error("Error al guardar configuración empresa:", error);
      addToast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        color: "danger",
      });
    } finally {
      setGuardandoEmpresa(false);
    }
  }, [configuracionEmpresa]);

  // Funciones auxiliares
  const abrirModalEditar = (sucursal: Sucursal) => {
    setSucursalSeleccionada(sucursal);
    setFormSucursal({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      activo: sucursal.activo,
    });
    abrirModalSucursal();
  };

  const abrirModalNuevo = () => {
    resetFormSucursal();
    abrirModalSucursal();
  };

  // useEffect hooks
  useEffect(() => {
    cargarUsuario();
  }, [cargarUsuario]);

  useEffect(() => {
    if (usuario?.rol === "ADMINISTRADOR") {
      if (selectedTab === "sucursales") {
        cargarSucursales();
      } else if (selectedTab === "empresa") {
        cargarConfiguracionEmpresa();
      }
    }
  }, [selectedTab, usuario?.rol, cargarConfiguracionEmpresa, cargarSucursales]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">
          Gestiona la configuración del sistema
        </p>
      </div>

      <Tabs
        aria-label="Configuración"
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        className="w-full"
        color="primary"
        variant="underlined"
      >
        {getAvailableTabs().map((tab) => (
          <Tab
            key={tab.key}
            title={
              <div className="flex items-center space-x-2">
                {tab.icon}
                <span>{tab.title}</span>
              </div>
            }
          >
            <div className="py-6">
              {tab.key === "perfil" && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">Mi Perfil</h2>
                    <Chip
                      color={usuario?.activo ? "success" : "danger"}
                      variant="flat"
                    >
                      {usuario?.activo ? "Activo" : "Inactivo"}
                    </Chip>
                  </div>

                  {cargandoUsuario ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : usuario ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="nombre-completo"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Nombre Completo
                          </label>
                          <Input
                            id="nombre-completo"
                            value={usuario.nombre_completo}
                            isReadOnly
                            variant="bordered"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="identificacion"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Identificación
                          </label>
                          <Input
                            id="identificacion"
                            value={usuario.identificacion}
                            isReadOnly
                            variant="bordered"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="correo"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Correo Electrónico
                          </label>
                          <Input
                            id="correo"
                            value={usuario.correo || "No especificado"}
                            isReadOnly
                            variant="bordered"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="telefono"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Teléfono
                          </label>
                          <Input
                            id="telefono"
                            value={usuario.telefono || "No especificado"}
                            isReadOnly
                            variant="bordered"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="rol"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Rol
                          </label>
                          <Chip
                            id="rol"
                            color={
                              usuario.rol === "ADMINISTRADOR"
                                ? "primary"
                                : "secondary"
                            }
                            className="text-primary"
                            variant="flat"
                            size="lg"
                          >
                            {usuario.rol}
                          </Chip>
                        </div>
                        {usuario.sucursales && (
                          <div>
                            <label
                              htmlFor="sucursal"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Sucursal Asignada
                            </label>
                            <Input
                              id="sucursal"
                              value={usuario.sucursales.nombre}
                              isReadOnly
                              variant="bordered"
                            />
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">
                          Información de Cuenta
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                          <div>
                            <strong>Fecha de Creación:</strong>
                            <br />
                            {new Date(usuario.creado_en).toLocaleDateString(
                              "es-CO",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                          <div>
                            <strong>Última Actualización:</strong>
                            <br />
                            {new Date(
                              usuario.actualizado_en,
                            ).toLocaleDateString("es-CO", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No se pudo cargar la información del usuario
                    </div>
                  )}
                </Card>
              )}

              {tab.key === "sucursales" && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                      <h2 className="text-2xl font-semibold">
                        Gestión de Sucursales
                      </h2>
                      <Button
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={abrirModalNuevo}
                      >
                        Nueva Sucursal
                      </Button>
                    </div>

                    {cargandoSucursales ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="lg" />
                      </div>
                    ) : sucursales.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sucursales.map((sucursal) => (
                          <Card key={sucursal.id} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold">
                                {sucursal.nombre}
                              </h3>
                              <Chip
                                color={sucursal.activo ? "success" : "danger"}
                                size="sm"
                                variant="flat"
                              >
                                {sucursal.activo ? "Activa" : "Inactiva"}
                              </Chip>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p>
                                <strong>Dirección:</strong> {sucursal.direccion}
                              </p>
                              <p>
                                <strong>Teléfono:</strong>{" "}
                                {sucursal.telefono || "No especificado"}
                              </p>
                              <p>
                                <strong>Mesas:</strong>{" "}
                                {sucursal._count?.mesas || 0}
                              </p>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                className="text-primary"
                                startContent={<Edit className="w-3 h-3" />}
                                onPress={() => abrirModalEditar(sucursal)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                startContent={<Trash2 className="w-3 h-3" />}
                                onPress={() => eliminarSucursal(sucursal.id)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay sucursales registradas</p>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {tab.key === "empresa" && (
                <Card className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-semibold">
                      Configuración de Empresa
                    </h2>
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        Ricuras Del Huila
                      </span>
                    </div>
                  </div>

                  {cargandoEmpresa ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        guardarConfiguracionEmpresa();
                      }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="nit-empresa"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            NIT de la Empresa *
                          </label>
                          <Input
                            id="nit-empresa"
                            value={configuracionEmpresa.nit}
                            onChange={(e) =>
                              setConfiguracionEmpresa((prev) => ({
                                ...prev,
                                nit: e.target.value,
                              }))
                            }
                            placeholder="Ej: 900123456-7"
                            variant="bordered"
                            isRequired
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="razon-social"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Razón Social *
                          </label>
                          <Input
                            id="razon-social"
                            value={configuracionEmpresa.razon_social}
                            onChange={(e) =>
                              setConfiguracionEmpresa((prev) => ({
                                ...prev,
                                razon_social: e.target.value,
                              }))
                            }
                            placeholder="Ej: Ricuras Del Huila S.A.S."
                            variant="bordered"
                            isRequired
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="telefono-empresa"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Teléfono Principal *
                          </label>
                          <Input
                            id="telefono-empresa"
                            value={configuracionEmpresa.telefono}
                            onChange={(e) =>
                              setConfiguracionEmpresa((prev) => ({
                                ...prev,
                                telefono: e.target.value,
                              }))
                            }
                            placeholder="Ej: +57 300 123 4567"
                            variant="bordered"
                            isRequired
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="correo-empresa"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Correo Electrónico
                          </label>
                          <Input
                            id="correo-empresa"
                            value={configuracionEmpresa.correo || ""}
                            onChange={(e) =>
                              setConfiguracionEmpresa((prev) => ({
                                ...prev,
                                correo: e.target.value || null,
                              }))
                            }
                            placeholder="Ej: info@ricurasdelhuila.com"
                            type="email"
                            variant="bordered"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="direccion"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Dirección Principal
                        </label>
                        <Textarea
                          id="direccion"
                          value={configuracionEmpresa.direccion || ""}
                          onChange={(e) =>
                            setConfiguracionEmpresa((prev) => ({
                              ...prev,
                              direccion: e.target.value || null,
                            }))
                          }
                          placeholder="Dirección completa de la empresa"
                          variant="bordered"
                          minRows={2}
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          color="primary"
                          isLoading={guardandoEmpresa}
                          startContent={
                            guardandoEmpresa ? null : (
                              <Save className="w-4 h-4" />
                            )
                          }
                        >
                          {guardandoEmpresa
                            ? "Guardando..."
                            : "Guardar Configuración"}
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>
              )}
            </div>
          </Tab>
        ))}
      </Tabs>

      {/* Modal para Sucursales */}
      <Modal
        isOpen={modalSucursalAbierto}
        onOpenChange={(open) => {
          if (!open) {
            cerrarModalSucursal();
            resetFormSucursal();
          }
        }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {sucursalSeleccionada ? "Editar Sucursal" : "Nueva Sucursal"}
              </ModalHeader>
              <ModalBody>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    guardarSucursal();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="nombre"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nombre de la Sucursal *
                    </label>
                    <Input
                      id="nombre"
                      value={formSucursal.nombre}
                      onChange={(e) =>
                        setFormSucursal((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }))
                      }
                      placeholder="Ej: Sucursal Centro"
                      variant="bordered"
                      isRequired
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="direccion"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Dirección *
                    </label>
                    <Textarea
                      id="direccion"
                      value={formSucursal.direccion}
                      onChange={(e) =>
                        setFormSucursal((prev) => ({
                          ...prev,
                          direccion: e.target.value,
                        }))
                      }
                      placeholder="Dirección completa de la sucursal"
                      variant="bordered"
                      minRows={2}
                      isRequired
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="telefono"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Teléfono
                    </label>
                    <Input
                      id="telefono"
                      value={formSucursal.telefono || ""}
                      onChange={(e) =>
                        setFormSucursal((prev) => ({
                          ...prev,
                          telefono: e.target.value || null,
                        }))
                      }
                      placeholder="Ej: +57 300 123 4567"
                      variant="bordered"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={formSucursal.activo}
                      onValueChange={(checked) =>
                        setFormSucursal((prev) => ({
                          ...prev,
                          activo: checked,
                        }))
                      }
                    >
                      Sucursal activa
                    </Checkbox>
                  </div>
                </form>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={guardarSucursal}
                  isLoading={guardandoSucursal}
                >
                  {guardandoSucursal ? "Guardando..." : "Guardar"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ConfiguracionPage;
