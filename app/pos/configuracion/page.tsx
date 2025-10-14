"use client";

import {
  addToast,
  Button,
  Card,
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
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

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
  });

  // Estados para editar perfil
  const [formPerfil, setFormPerfil] = useState({
    nombre_completo: "",
    identificacion: "",
    correo: null as string | null,
    telefono: null as string | null,
    password: "",
    confirmar_password: "",
  });

  // Estados de errores
  const [erroresPerfil, setErroresPerfil] = useState<{ [key: string]: string }>({});
  const [erroresSucursal, setErroresSucursal] = useState<{ [key: string]: string }>({});

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

  // Estados de errores para empresa
  const [erroresEmpresa, setErroresEmpresa] = useState<{ [key: string]: string }>({});

  // Modal controls
  const {
    isOpen: modalSucursalAbierto,
    onOpen: abrirModalSucursal,
    onClose: cerrarModalSucursal,
  } = useDisclosure();

  // Funciones de validación
  const validarPerfil = useCallback(() => {
    const errores: { [key: string]: string } = {};

    // Validar nombre completo
    if (!formPerfil.nombre_completo || formPerfil.nombre_completo.trim().length === 0) {
      errores.nombre_completo = "El nombre completo es obligatorio";
    } else if (formPerfil.nombre_completo.trim().length < 3) {
      errores.nombre_completo = "El nombre debe tener al menos 3 caracteres";
    } else if (formPerfil.nombre_completo.trim().length > 100) {
      errores.nombre_completo = "El nombre no puede exceder los 100 caracteres";
    }

    // Validar identificación
    if (!formPerfil.identificacion || formPerfil.identificacion.trim().length === 0) {
      errores.identificacion = "La identificación es obligatoria";
    } else if (formPerfil.identificacion.trim().length < 6) {
      errores.identificacion = "La identificación debe tener al menos 6 caracteres";
    } else if (formPerfil.identificacion.trim().length > 20) {
      errores.identificacion = "La identificación no puede exceder los 20 caracteres";
    }

    // Validar correo (opcional, pero si se proporciona debe ser válido)
    if (formPerfil.correo && formPerfil.correo.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formPerfil.correo)) {
        errores.correo = "El formato del correo electrónico no es válido";
      } else if (formPerfil.correo.length > 100) {
        errores.correo = "El correo no puede exceder los 100 caracteres";
      }
    }

    // Validar teléfono (opcional, pero si se proporciona debe ser válido)
    if (formPerfil.telefono && formPerfil.telefono.trim().length > 0) {
      const telefonoRegex = /^[0-9+\-\s()]+$/;
      if (!telefonoRegex.test(formPerfil.telefono)) {
        errores.telefono = "El teléfono contiene caracteres no válidos";
      } else if (formPerfil.telefono.replace(/[^0-9]/g, '').length < 7) {
        errores.telefono = "El teléfono debe tener al menos 7 dígitos";
      } else if (formPerfil.telefono.replace(/[^0-9]/g, '').length > 15) {
        errores.telefono = "El teléfono no puede tener más de 15 dígitos";
      }
    }

    // Validar contraseña (solo si se proporciona)
    if (formPerfil.password && formPerfil.password.trim().length > 0) {
      if (formPerfil.password.length < 6) {
        errores.password = "La contraseña debe tener al menos 6 caracteres";
      } else if (formPerfil.password.length > 50) {
        errores.password = "La contraseña no puede exceder los 50 caracteres";
      }

      // Validar confirmación de contraseña
      if (formPerfil.password !== formPerfil.confirmar_password) {
        errores.confirmar_password = "Las contraseñas no coinciden";
      }
    }

    setErroresPerfil(errores);
    return Object.keys(errores).length === 0;
  }, [formPerfil]);

  const validarSucursal = useCallback(() => {
    const errores: { [key: string]: string } = {};

    // Validar nombre
    if (!formSucursal.nombre || formSucursal.nombre.trim().length === 0) {
      errores.nombre = "El nombre de la sucursal es obligatorio";
    } else if (formSucursal.nombre.trim().length < 3) {
      errores.nombre = "El nombre debe tener al menos 3 caracteres";
    } else if (formSucursal.nombre.trim().length > 100) {
      errores.nombre = "El nombre no puede exceder los 100 caracteres";
    }

    // Validar dirección
    if (!formSucursal.direccion || formSucursal.direccion.trim().length === 0) {
      errores.direccion = "La dirección es obligatoria";
    } else if (formSucursal.direccion.trim().length < 10) {
      errores.direccion = "La dirección debe tener al menos 10 caracteres";
    } else if (formSucursal.direccion.trim().length > 200) {
      errores.direccion = "La dirección no puede exceder los 200 caracteres";
    }

    // Validar teléfono (opcional, pero si se proporciona debe ser válido)
    if (formSucursal.telefono && formSucursal.telefono.trim().length > 0) {
      const telefonoRegex = /^[0-9+\-\s()]+$/;
      if (!telefonoRegex.test(formSucursal.telefono)) {
        errores.telefono = "El teléfono contiene caracteres no válidos";
      } else if (formSucursal.telefono.replace(/[^0-9]/g, '').length < 7) {
        errores.telefono = "El teléfono debe tener al menos 7 dígitos";
      } else if (formSucursal.telefono.replace(/[^0-9]/g, '').length > 15) {
        errores.telefono = "El teléfono no puede tener más de 15 dígitos";
      }
    }

    setErroresSucursal(errores);
    return Object.keys(errores).length === 0;
  }, [formSucursal]);

  const validarEmpresa = useCallback(() => {
    const errores: { [key: string]: string } = {};

    // Validar NIT
    if (!configuracionEmpresa.nit || configuracionEmpresa.nit.trim().length === 0) {
      errores.nit = "El NIT es obligatorio";
    } else if (configuracionEmpresa.nit.trim().length < 8) {
      errores.nit = "El NIT debe tener al menos 8 caracteres";
    } else if (configuracionEmpresa.nit.trim().length > 20) {
      errores.nit = "El NIT no puede exceder los 20 caracteres";
    }

    // Validar razón social
    if (!configuracionEmpresa.razon_social || configuracionEmpresa.razon_social.trim().length === 0) {
      errores.razon_social = "La razón social es obligatoria";
    } else if (configuracionEmpresa.razon_social.trim().length < 3) {
      errores.razon_social = "La razón social debe tener al menos 3 caracteres";
    } else if (configuracionEmpresa.razon_social.trim().length > 200) {
      errores.razon_social = "La razón social no puede exceder los 200 caracteres";
    }

    // Validar teléfono
    if (!configuracionEmpresa.telefono || configuracionEmpresa.telefono.trim().length === 0) {
      errores.telefono = "El teléfono es obligatorio";
    } else {
      const telefonoRegex = /^[0-9+\-\s()]+$/;
      if (!telefonoRegex.test(configuracionEmpresa.telefono)) {
        errores.telefono = "El teléfono contiene caracteres no válidos";
      } else if (configuracionEmpresa.telefono.replace(/[^0-9]/g, '').length < 7) {
        errores.telefono = "El teléfono debe tener al menos 7 dígitos";
      } else if (configuracionEmpresa.telefono.replace(/[^0-9]/g, '').length > 15) {
        errores.telefono = "El teléfono no puede tener más de 15 dígitos";
      }
    }

    // Validar correo (opcional, pero si se proporciona debe ser válido)
    if (configuracionEmpresa.correo && configuracionEmpresa.correo.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(configuracionEmpresa.correo)) {
        errores.correo = "El formato del correo electrónico no es válido";
      } else if (configuracionEmpresa.correo.length > 100) {
        errores.correo = "El correo no puede exceder los 100 caracteres";
      }
    }

    // Validar dirección (opcional)
    if (configuracionEmpresa.direccion && configuracionEmpresa.direccion.trim().length > 0) {
      if (configuracionEmpresa.direccion.trim().length < 10) {
        errores.direccion = "La dirección debe tener al menos 10 caracteres";
      } else if (configuracionEmpresa.direccion.trim().length > 200) {
        errores.direccion = "La dirección no puede exceder los 200 caracteres";
      }
    }

    setErroresEmpresa(errores);
    return Object.keys(errores).length === 0;
  }, [configuracionEmpresa]);

  // Función para limpiar errores individuales
  const limpiarErrorPerfil = (campo: string) => {
    setErroresPerfil(prev => {
      const nuevosErrores = { ...prev };
      delete nuevosErrores[campo];
      return nuevosErrores;
    });
  };

  const limpiarErrorSucursal = (campo: string) => {
    setErroresSucursal(prev => {
      const nuevosErrores = { ...prev };
      delete nuevosErrores[campo];
      return nuevosErrores;
    });
  };

  const limpiarErrorEmpresa = (campo: string) => {
    setErroresEmpresa(prev => {
      const nuevosErrores = { ...prev };
      delete nuevosErrores[campo];
      return nuevosErrores;
    });
  };

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

  // Funciones auxiliares para perfil
  const iniciarEdicionPerfil = () => {
    if (usuario) {
      setFormPerfil({
        nombre_completo: usuario.nombre_completo,
        identificacion: usuario.identificacion,
        correo: usuario.correo,
        telefono: usuario.telefono,
        password: "",
        confirmar_password: "",
      });
      setErroresPerfil({});
      setEditandoPerfil(true);
    }
  };

  const cancelarEdicionPerfil = useCallback(() => {
    setEditandoPerfil(false);
    setFormPerfil({
      nombre_completo: "",
      identificacion: "",
      correo: null,
      telefono: null,
      password: "",
      confirmar_password: "",
    });
    setErroresPerfil({});
  }, []);

  // Función auxiliar para resetear el formulario de sucursal
  const resetFormSucursal = useCallback(() => {
    setFormSucursal({
      nombre: "",
      direccion: "",
      telefono: null,
    });
    setSucursalSeleccionada(null);
    setErroresSucursal({});
  }, []);

  // Guardar perfil
  const guardarPerfil = useCallback(async () => {
    try {
      setGuardandoPerfil(true);

      // Validar formulario
      if (!validarPerfil()) {
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

      // Preparar datos para enviar
      const datosActualizacion = {
        userId: currentUserId,
        nombre_completo: formPerfil.nombre_completo,
        identificacion: formPerfil.identificacion,
        correo: formPerfil.correo || null,
        telefono: formPerfil.telefono || null,
        // Solo incluir password si no está vacía
        ...(formPerfil.password.trim() && { password: formPerfil.password }),
      };

      const response = await fetch("/api/usuarios/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosActualizacion),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al actualizar perfil");
      }

      // Actualizar el estado del usuario con los nuevos datos
      setUsuario(result.data);

      // Actualizar el auth-storage con los nuevos datos del usuario
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const authData = JSON.parse(authStorage);
          if (authData?.state?.user) {
            // Actualizar los datos del usuario en el auth-storage
            authData.state.user = {
              ...authData.state.user,
              nombre_completo: result.data.nombre_completo,
              identificacion: result.data.identificacion,
              correo: result.data.correo,
              telefono: result.data.telefono,
              actualizado_en: result.data.actualizado_en,
            };
            localStorage.setItem("auth-storage", JSON.stringify(authData));
          }
        }
      } catch (error) {
        console.warn("No se pudo actualizar el auth-storage:", error);
      }

      setEditandoPerfil(false);
      cancelarEdicionPerfil();

      addToast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
        color: "success",
      });
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el perfil",
        color: "danger",
      });
    } finally {
      setGuardandoPerfil(false);
    }
  }, [formPerfil, validarPerfil, cancelarEdicionPerfil]);

  // Guardar sucursal
  const guardarSucursal = useCallback(async () => {
    try {
      setGuardandoSucursal(true);

      // Validar formulario
      if (!validarSucursal()) {
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
        color: "success",
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
    validarSucursal,
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

      // Validar formulario
      if (!validarEmpresa()) {
        const camposConError = Object.keys(erroresEmpresa);
        addToast({
          title: "Error de validación",
          description: `Por favor corrige los errores en: ${camposConError.join(', ')}`,
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
  }, [configuracionEmpresa, erroresEmpresa, validarEmpresa]);

  // Funciones auxiliares
  const abrirModalEditar = (sucursal: Sucursal) => {
    setSucursalSeleccionada(sucursal);
    setFormSucursal({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
    });
    setErroresSucursal({});
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
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <h2 className="text-2xl font-semibold">Mi Perfil</h2>
                    <div className="flex flex-row items-center gap-3">
                      <Chip
                        color={usuario?.activo ? "success" : "danger"}
                        variant="flat"
                      >
                        {usuario?.activo ? "Activo" : "Inactivo"}
                      </Chip>
                      {!editandoPerfil ? (
                        <Button
                          color="primary"
                          variant="light"
                          startContent={<Edit className="w-4 h-4" />}
                          onPress={iniciarEdicionPerfil}
                        >
                          Editar
                        </Button>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <Button
                            color="danger"
                            variant="light"
                            onPress={cancelarEdicionPerfil}
                          >
                            Cancelar
                          </Button>
                          <Button
                            color="primary"
                            startContent={<Save className="w-4 h-4" />}
                            onPress={guardarPerfil}
                            isLoading={guardandoPerfil}
                          >
                            {guardandoPerfil ? "Guardando..." : "Guardar"}
                          </Button>
                        </div>
                      )}
                    </div>
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
                            Nombre Completo {editandoPerfil && "*"}
                          </label>
                          <Input
                            id="nombre-completo"
                            value={editandoPerfil ? formPerfil.nombre_completo : usuario.nombre_completo}
                            onChange={editandoPerfil ? (e) => {
                              setFormPerfil(prev => ({ ...prev, nombre_completo: e.target.value }));
                              limpiarErrorPerfil('nombre_completo');
                            } : undefined}
                            isReadOnly={!editandoPerfil}
                            variant="bordered"
                            isRequired={editandoPerfil}
                            isInvalid={editandoPerfil && !!erroresPerfil.nombre_completo}
                            errorMessage={editandoPerfil ? erroresPerfil.nombre_completo : undefined}
                            className="text-black"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="identificacion"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Identificación {editandoPerfil && "*"}
                          </label>
                          <Input
                            id="identificacion"
                            value={editandoPerfil ? formPerfil.identificacion : usuario.identificacion}
                            onChange={editandoPerfil ? (e) => {
                              setFormPerfil(prev => ({ ...prev, identificacion: e.target.value }));
                              limpiarErrorPerfil('identificacion');
                            } : undefined}
                            isReadOnly={!editandoPerfil}
                            variant="bordered"
                            isRequired={editandoPerfil}
                            isInvalid={editandoPerfil && !!erroresPerfil.identificacion}
                            errorMessage={editandoPerfil ? erroresPerfil.identificacion : undefined}
                            className="text-black"
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
                            value={editandoPerfil ? (formPerfil.correo || "") : (usuario.correo || "No especificado")}
                            onChange={editandoPerfil ? (e) => {
                              setFormPerfil(prev => ({ ...prev, correo: e.target.value || null }));
                              limpiarErrorPerfil('correo');
                            } : undefined}
                            isReadOnly={!editandoPerfil}
                            variant="bordered"
                            type="email"
                            placeholder={editandoPerfil ? "ejemplo@correo.com" : undefined}
                            isInvalid={editandoPerfil && !!erroresPerfil.correo}
                            errorMessage={editandoPerfil ? erroresPerfil.correo : undefined}
                            className="text-black"
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
                            value={editandoPerfil ? (formPerfil.telefono || "") : (usuario.telefono || "No especificado")}
                            onChange={editandoPerfil ? (e) => {
                              setFormPerfil(prev => ({ ...prev, telefono: e.target.value || null }));
                              limpiarErrorPerfil('telefono');
                            } : undefined}
                            isReadOnly={!editandoPerfil}
                            variant="bordered"
                            placeholder={editandoPerfil ? "+57 300 123 4567" : undefined}
                            isInvalid={editandoPerfil && !!erroresPerfil.telefono}
                            errorMessage={editandoPerfil ? erroresPerfil.telefono : undefined}
                            className="text-black"
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

                        {editandoPerfil && (
                          <>
                            <div>
                              <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Nueva Contraseña
                              </label>
                              <Input
                                id="password"
                                type="password"
                                value={formPerfil.password}
                                onChange={(e) => {
                                  setFormPerfil(prev => ({ ...prev, password: e.target.value }));
                                  limpiarErrorPerfil('password');
                                }}
                                variant="bordered"
                                placeholder="Dejar vacío para mantener actual"
                                isInvalid={!!erroresPerfil.password}
                                errorMessage={erroresPerfil.password}
                                className="text-black"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="confirmar_password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Confirmar Contraseña
                              </label>
                              <Input
                                id="confirmar_password"
                                type="password"
                                value={formPerfil.confirmar_password}
                                onChange={(e) => {
                                  setFormPerfil(prev => ({ ...prev, confirmar_password: e.target.value }));
                                  limpiarErrorPerfil('confirmar_password');
                                }}
                                variant="bordered"
                                placeholder="Confirmar nueva contraseña"
                                isInvalid={!!erroresPerfil.confirmar_password}
                                errorMessage={erroresPerfil.confirmar_password}
                                className="text-black"
                              />
                            </div>
                          </>
                        )}
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
                            onChange={(e) => {
                              setConfiguracionEmpresa((prev) => ({
                                ...prev,
                                nit: e.target.value,
                              }));
                              limpiarErrorEmpresa('nit');
                            }}
                            placeholder="Ej: 900123456-7"
                            variant="bordered"
                            isRequired
                            isInvalid={!!erroresEmpresa.nit}
                            errorMessage={erroresEmpresa.nit}
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
                            onChange={(e) => {
                              setConfiguracionEmpresa((prev) => ({
                                ...prev,
                                razon_social: e.target.value,
                              }));
                              limpiarErrorEmpresa('razon_social');
                            }}
                            placeholder="Ej: Ricuras Del Huila S.A.S."
                            variant="bordered"
                            isRequired
                            isInvalid={!!erroresEmpresa.razon_social}
                            errorMessage={erroresEmpresa.razon_social}
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
                            onChange={(e) => {
                              setConfiguracionEmpresa((prev) => ({
                                ...prev,
                                telefono: e.target.value,
                              }));
                              limpiarErrorEmpresa('telefono');
                            }}
                            placeholder="Ej: +57 300 123 4567"
                            variant="bordered"
                            isRequired
                            isInvalid={!!erroresEmpresa.telefono}
                            errorMessage={erroresEmpresa.telefono}
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
                            onChange={(e) => {
                              setConfiguracionEmpresa((prev) => ({
                                ...prev,
                                correo: e.target.value || null,
                              }));
                              limpiarErrorEmpresa('correo');
                            }}
                            placeholder="Ej: info@ricurasdelhuila.com"
                            type="email"
                            variant="bordered"
                            isInvalid={!!erroresEmpresa.correo}
                            errorMessage={erroresEmpresa.correo}
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
                          onChange={(e) => {
                            setConfiguracionEmpresa((prev) => ({
                              ...prev,
                              direccion: e.target.value || null,
                            }));
                            limpiarErrorEmpresa('direccion');
                          }}
                          placeholder="Dirección completa de la empresa"
                          variant="bordered"
                          minRows={2}
                          isInvalid={!!erroresEmpresa.direccion}
                          errorMessage={erroresEmpresa.direccion}
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
                      onChange={(e) => {
                        setFormSucursal((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }));
                        limpiarErrorSucursal('nombre');
                      }}
                      placeholder="Ej: Sucursal Centro"
                      variant="bordered"
                      isRequired
                      isInvalid={!!erroresSucursal.nombre}
                      errorMessage={erroresSucursal.nombre}
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
                      onChange={(e) => {
                        setFormSucursal((prev) => ({
                          ...prev,
                          direccion: e.target.value,
                        }));
                        limpiarErrorSucursal('direccion');
                      }}
                      placeholder="Dirección completa de la sucursal"
                      variant="bordered"
                      minRows={2}
                      isRequired
                      isInvalid={!!erroresSucursal.direccion}
                      errorMessage={erroresSucursal.direccion}
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
                      onChange={(e) => {
                        setFormSucursal((prev) => ({
                          ...prev,
                          telefono: e.target.value || null,
                        }));
                        limpiarErrorSucursal('telefono');
                      }}
                      placeholder="Ej: +57 300 123 4567"
                      variant="bordered"
                      isInvalid={!!erroresSucursal.telefono}
                      errorMessage={erroresSucursal.telefono}
                    />
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
