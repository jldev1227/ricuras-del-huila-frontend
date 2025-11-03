"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import {
  BarChart3,
  ChevronRight,
  ClipboardList,
  Grid,
  LogOut,
  MapPin,
  Menu,
  Package,
  Settings,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth, useRoleGuard } from "@/hooks/useAuth";

// ============================================================================
// TYPES
// ============================================================================

interface MenuItem {
  name: string;
  href: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

interface Sucursal {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MENU_ITEMS: MenuItem[] = [
  {
    name: "Punto de venta",
    href: "/pos",
    icon: <Grid className="w-6 h-6" />,
  },
  {
    name: "Mesas",
    href: "/pos/mesas",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width="24"
        height="24"
        fill="currentColor"
        aria-label="mesas"
        role="img"
      >
        <rect x="64" y="120" width="392" height="48" rx="8" />
        <rect x="96" y="152" width="48" height="240" rx="6" />
        <rect x="392" y="152" width="48" height="240" rx="6" />
      </svg>
    ),
  },
  {
    name: "Órdenes",
    href: "/pos/ordenes",
    icon: <ClipboardList className="w-6 h-6" />,
  },
  {
    name: "Productos",
    href: "/pos/productos",
    icon: <Package className="w-6 h-6" />,
    adminOnly: true,
  },
  {
    name: "Gestión de Stock",
    href: "/pos/stock",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L12 22l8-4.27A2 2 0 0 0 21 16z"/>
        <polyline points="7.5,10.5 12,15 16.5,10.5"/>
      </svg>
    ),
    adminOnly: true,
  },
  {
    name: "Categorías",
    href: "/pos/categorias",
    icon: <Grid className="w-6 h-6" />,
    adminOnly: true,
  },
  {
    name: "Usuarios",
    href: "/pos/usuarios",
    icon: <User className="w-6 h-6" />,
    adminOnly: true,
  },
  {
    name: "Reportes",
    href: "/pos/reportes",
    icon: <BarChart3 className="w-6 h-6" />,
    adminOnly: true,
  },
  {
    name: "Configuración",
    href: "/pos/configuracion",
    icon: <Settings className="w-6 h-6" />,
    adminOnly: true,
  },
];

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook para manejar la sucursal actual
 */
function useSucursal() {
  const [sucursalActual, setSucursalActual] = useState<Sucursal | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar sucursal actual del localStorage
  useEffect(() => {
    try {
      const sucursalStorage = localStorage.getItem("sucursal-actual");
      if (sucursalStorage) {
        const sucursal = JSON.parse(sucursalStorage);
        setSucursalActual(sucursal);
      }
    } catch (err) {
      console.error("Error al cargar sucursal:", err);
      setError("Error al cargar la sucursal");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar lista de sucursales
  useEffect(() => {
    async function fetchSucursales() {
      try {
        const response = await fetch("/api/sucursales");
        const data = await response.json();

        if (data.success && Array.isArray(data.sucursales)) {
          setSucursales(data.sucursales);
        } else {
          throw new Error("Formato de respuesta inválido");
        }
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
        setError("No se pudieron cargar las sucursales");
      }
    }

    fetchSucursales();
  }, []);

  const cambiarSucursal = useCallback((sucursal: Sucursal) => {
    try {
      localStorage.setItem("sucursal-actual", JSON.stringify(sucursal));
      setSucursalActual(sucursal);

      // Actualizar también en auth-storage si existe
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        authData.state.sucursal = sucursal;
        localStorage.setItem("auth-storage", JSON.stringify(authData));
      }

      // Recargar para actualizar contexto
      window.location.reload();
    } catch (err) {
      console.error("Error al cambiar sucursal:", err);
      setError("Error al cambiar de sucursal");
    }
  }, []);

  return {
    sucursalActual,
    sucursales,
    isLoading,
    error,
    cambiarSucursal,
  };
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Componente de navegación individual
 */
function NavItem({
  item,
  isActive,
  isExpanded,
  onClick,
}: {
  item: MenuItem;
  isActive: boolean;
  isExpanded: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group ${isActive
          ? "bg-wine text-white shadow-md"
          : "text-gray-700 hover:bg-gray-100"
        }`}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      <span
        className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
          }`}
      >
        {item.name}
      </span>
      {!isExpanded && (
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {item.name}
        </span>
      )}
    </Link>
  );
}

/**
 * Selector de sucursal
 */
function SucursalSelector({
  sucursalActual,
  sucursales,
  onSelect,
  variant = "desktop",
}: {
  sucursalActual: Sucursal | null;
  sucursales: Sucursal[];
  onSelect: (sucursal: Sucursal) => void;
  variant?: "desktop" | "mobile";
}) {
  const buttonClasses =
    variant === "desktop"
      ? "border border-wine/30 bg-white hover:bg-wine/10 shadow-sm px-10 py-6 rounded-lg hidden lg:flex items-center gap-2"
      : "border border-wine/30 bg-white hover:bg-wine/10 shadow-sm px-4 py-6 rounded-lg flex lg:hidden items-center gap-2 w-full";

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="flat"
          className={buttonClasses}
          startContent={<MapPin className="text-wine" size={20} />}
        >
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-500">Sucursal</span>
            <span className="font-semibold text-wine text-sm">
              {sucursalActual?.nombre || "Sin sucursal"}
            </span>
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Seleccionar sucursal"
        onAction={(key) => {
          const sucursal = sucursales.find((s) => s.id === key);
          if (sucursal && sucursal.id !== sucursalActual?.id) {
            onSelect(sucursal);
          }
        }}
        className="min-w-[220px]"
      >
        {sucursales.map((sucursal) => (
          <DropdownItem
            key={sucursal.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${sucursal.id === sucursalActual?.id
                ? "bg-wine/10 text-wine font-semibold"
                : "hover:bg-gray-100 text-gray-700"
              }`}
            startContent={
              <MapPin
                size={18}
                className={
                  sucursal.id === sucursalActual?.id
                    ? "text-wine"
                    : "text-gray-400"
                }
              />
            }
          >
            <div className="flex items-center justify-between w-full">
              <span>{sucursal.nombre}</span>
              {sucursal.id === sucursalActual?.id && (
                <span className="ml-2 px-2 py-0.5 bg-wine/20 text-xs rounded text-wine font-medium">
                  Actual
                </span>
              )}
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

/**
 * Menú de usuario
 */
function UserMenu({
  user,
  onLogout,
  isExpanded,
}: {
  user: { nombre_completo: string; rol: string };
  onLogout: () => void;
  isExpanded: boolean;
}) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="light"
          className="flex items-center gap-3 px-3 py-8 rounded-lg hover:bg-gray-100 w-full"
        >
          <div className="w-8 h-8 bg-wine/20 rounded-full flex-shrink-0 flex items-center justify-center text-wine font-bold">
            {user.nombre_completo.charAt(0).toUpperCase()}
          </div>
          <div
            className={`transition-all duration-300 overflow-hidden text-left ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              }`}
          >
            <p className="text-sm font-medium text-gray-700">
              {user.nombre_completo}
            </p>
            <p className="text-xs text-gray-500">{user.rol}</p>
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Opciones de usuario">
        <DropdownItem
          key="logout"
          startContent={<LogOut size={18} className="text-wine" />}
          onPress={onLogout}
          className="text-wine"
        >
          Cerrar sesión
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

/**
 * Sidebar Desktop
 */
function DesktopSidebar({
  menuItems,
  pathname,
  isHovered,
  onHoverChange,
  user,
  onLogout,
}: {
  menuItems: MenuItem[];
  pathname: string;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  user: { nombre_completo: string; rol: string };
  onLogout: () => void;
}) {
  return (
    <aside
      className={`hidden lg:block relative bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${isHovered ? "w-64" : "w-20"
        }`}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-gray-200">
        <Image
          width={250}
          height={250}
          src="/logo.png"
          alt="Logo Ricuras del Huila"
          className="transition-all duration-300 w-24 h-24"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href} className="relative">
              <NavItem
                item={item}
                isActive={pathname === item.href}
                isExpanded={isHovered}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className={`absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white ${isHovered ? "p-4" : ""} transition-all`}>
        <UserMenu user={user} onLogout={onLogout} isExpanded={isHovered} />
      </div>
    </aside>
  );
}

/**
 * Sidebar Mobile
 */
function MobileSidebar({
  isOpen,
  onClose,
  menuItems,
  pathname,
  user,
  onLogout,
  sucursalActual,
  sucursales,
  onSelectSucursal,
}: {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  pathname: string;
  user: { nombre_completo: string; rol: string };
  onLogout: () => void;
  sucursalActual: Sucursal | null;
  sucursales: Sucursal[];
  onSelectSucursal: (sucursal: Sucursal) => void;
}) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden border-0 cursor-default"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onClose();
            }
          }}
          aria-label="Cerrar menú"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-gray-200">
          <Image
            width={250}
            height={250}
            src="/logo.png"
            alt="Logo Ricuras del Huila"
            className="w-24 h-24"
            priority
          />
          <Button
            isIconOnly
            size="sm"
            onPress={onClose}
            className="p-2 bg-wine text-white rounded-lg"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${pathname === item.href
                      ? "bg-wine text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {pathname === item.href && <ChevronRight size={20} />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white space-y-4">
          <SucursalSelector
            sucursalActual={sucursalActual}
            sucursales={sucursales}
            onSelect={onSelectSucursal}
            variant="mobile"
          />

          <Dropdown>
            <DropdownTrigger>
              <Button
                className="w-full flex items-center gap-3 px-4 py-8 rounded-lg bg-gray-50"
                variant="light"
              >
                <div className="w-10 h-10 bg-wine/20 rounded-full flex items-center justify-center text-wine font-bold">
                  {user.nombre_completo.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium text-gray-700">
                    {user.nombre_completo}
                  </p>
                  <p className="text-xs text-gray-500">{user.rol}</p>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Opciones de usuario">
              <DropdownItem
                key="logout"
                startContent={<LogOut size={18} className="text-wine" />}
                onPress={onLogout}
                className="text-wine"
              >
                Cerrar sesión
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </aside>
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Auth hooks
  const { user, isAuthenticated, hasHydrated, logout } = useAuth();
  const { hasPermission: isAdmin } = useRoleGuard(["ADMINISTRADOR"]);

  // Estado para verificación de usuario
  const [_isVerifyingUser, _setIsVerifyingUser] = useState(false);

  // Función auxiliar para limpiar sesión (fuera del componente o como función interna)
  const clearSessionAndRedirect = useCallback(async () => {
    // Limpiar todo el localStorage relacionado con auth
    localStorage.removeItem("auth-storage");
    localStorage.removeItem("sucursal-actual");

    // Hacer logout y redirigir al login
    await logout();
    router.push("/auth/login");
  }, [logout, router]);

  // Función para verificar que el usuario existe en la base de datos
  const verifyUserExists = useCallback(async (userId: string, signal?: AbortSignal) => {
    try {
      const response = await fetch(
        `/api/usuarios/profile?userId=${userId}`,
        { signal }
      );

      if (!response.ok) {
        console.warn("Usuario no encontrado en la base de datos, limpiando sesión");
        await clearSessionAndRedirect();
        return;
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        console.warn("Datos de usuario inválidos, limpiando sesión");
        await clearSessionAndRedirect();
        return;
      }

      // Verificación exitosa
      return result.data;
    } catch (error) {
      // Ignorar errores de cancelación
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error("Error verificando usuario:", error);
      // En caso de error de red, no limpiar la sesión automáticamente
      // Solo loggear el error para investigación
    }
  }, [clearSessionAndRedirect]);

  // Verificar usuario al cargar y cuando cambie el usuario
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user?.id) {
      return;
    }

    const abortController = new AbortController();
    let isActive = true;

    const verify = async () => {
      if (!isActive) return;

      await verifyUserExists(user.id, abortController.signal);
    };

    verify();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [hasHydrated, isAuthenticated, user?.id, verifyUserExists]);


  // Validar acceso - solo administradores pueden acceder al POS
  useEffect(() => {
    if (
      hasHydrated &&
      isAuthenticated &&
      user &&
      user.rol !== "ADMINISTRADOR"
    ) {
      // Si el usuario no es administrador, redirigir a su área correspondiente
      router.push("/mesero");
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  // Sucursal hook
  const {
    sucursalActual,
    sucursales,
    isLoading: isLoadingSucursal,
    cambiarSucursal,
  } = useSucursal();

  // UI State
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sucursalSeleccionada, setSucursalSeleccionada] =
    useState<Sucursal | null>(null);

  // Modal
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Filtrar menú según permisos
  const filteredMenuItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  }, [isAdmin]);

  // Manejar selección de sucursal
  const handleSelectSucursal = useCallback(
    (sucursal: Sucursal) => {
      setSucursalSeleccionada(sucursal);
      onOpen();
    },
    [onOpen],
  );

  // Confirmar cambio de sucursal
  const handleConfirmCambio = useCallback(() => {
    if (sucursalSeleccionada) {
      cambiarSucursal(sucursalSeleccionada);
      onClose();
    }
  }, [sucursalSeleccionada, cambiarSucursal, onClose]);

  // Manejar logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      localStorage.removeItem("sucursal-actual");
      router.push("/auth/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }, [logout, router]);

  // Protección de rutas
  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (!isLoadingSucursal && !sucursalActual) {
      router.push("/");
    }
  }, [hasHydrated, isAuthenticated, isLoadingSucursal, sucursalActual, router]);

  // Loading state
  if (!hasHydrated || isLoadingSucursal || !sucursalActual || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-wine" />
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Modal de confirmación */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Confirmar cambio de sucursal</ModalHeader>
          <ModalBody>
            <p className="text-gray-700">
              ¿Estás seguro de cambiar a la sucursal{" "}
              <span className="font-bold text-wine">
                {sucursalSeleccionada?.nombre}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Se recargará la aplicación para actualizar todos los datos.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button
              className="bg-wine text-white"
              onPress={handleConfirmCambio}
            >
              Confirmar cambio
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Desktop Sidebar */}
      <DesktopSidebar
        menuItems={filteredMenuItems}
        pathname={pathname}
        isHovered={isHovered}
        onHoverChange={setIsHovered}
        user={{
          nombre_completo: user.nombre_completo,
          rol: user.rol,
        }}
        onLogout={handleLogout}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={filteredMenuItems}
        pathname={pathname}
        user={{
          nombre_completo: user.nombre_completo,
          rol: user.rol,
        }}
        onLogout={handleLogout}
        sucursalActual={sucursalActual}
        sucursales={sucursales}
        onSelectSucursal={handleSelectSucursal}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 lg:h-20 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30">
          {/* Mobile menu button */}
          <Button
            isIconOnly
            variant="light"
            onPress={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </Button>

          {/* Logo mobile */}
          <Image
            width={250}
            height={250}
            src="/logo.png"
            alt="Logo"
            className="w-24 h-24 lg:hidden"
            priority
          />

          {/* Title Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <h1 className="font-bold text-2xl">Ricuras Del Huila</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Sucursal Selector - Desktop */}
            <SucursalSelector
              sucursalActual={sucursalActual}
              sucursales={sucursales}
              onSelect={handleSelectSucursal}
              variant="desktop"
            />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
