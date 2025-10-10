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
  Bell,
  ChevronRight,
  LogOut,
  MapPin,
  Menu,
  X,
  ClipboardList,
  Home,
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
import { useSucursal } from "@/hooks/useSucursal";

// ============================================================================
// TYPES
// ============================================================================

interface MenuItem {
  name: string;
  href: string;
  icon: ReactNode;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MENU_ITEMS: MenuItem[] = [
  {
    name: "Mis Órdenes",
    href: "/mesero",
    icon: <ClipboardList className="w-6 h-6" />,
  },
  {
    name: "Mesas",
    href: "/mesero/mesas",
    icon: <Home className="w-6 h-6" />,
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

interface LayoutProps {
  children: ReactNode;
}

export default function MeseroLayout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading: authLoading, hasHydrated } = useAuth();
  const { sucursal, loading: sucursalLoading } = useSucursal();

  // Estados del componente
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Proteger la ruta para solo meseros
  const { hasPermission } = useRoleGuard(["MESERO"]);

  useEffect(() => {
    if (!hasPermission && !authLoading && hasHydrated) {
      router.push("/auth/login");
    }
  }, [hasPermission, authLoading, hasHydrated, router]);

  // Verificar si tenemos sucursal seleccionada
  useEffect(() => {
    if (!authLoading && !sucursalLoading && user && !sucursal) {
      // Si no hay sucursal seleccionada, redirigir a la página principal
      router.push("/");
      return;
    }
  }, [user, sucursal, authLoading, sucursalLoading, router]);

  // Funciones auxiliares
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }, [logout, router]);

  const handleChangeBranch = useCallback(() => {
    // Limpiar sucursal del localStorage y redirigir
    localStorage.removeItem("sucursal-actual");
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      if (authData.state) {
        delete authData.state.sucursal;
        localStorage.setItem("auth-storage", JSON.stringify(authData));
      }
    }
    router.push("/");
  }, [router]);

  // Elementos de navegación filtrados
  const navigationItems = useMemo(() => {
    return MENU_ITEMS;
  }, []);

  // Si está cargando o no hay sucursal, no renderizar el layout
  if (authLoading || sucursalLoading || !user || !sucursal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-80">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center h-20 flex-shrink-0 px-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    width={48}
                    height={48}
                    src="/logo.png"
                    alt="Logo"
                    className="w-12 h-12"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    Ricuras del Huila
                  </h1>
                  <p className="text-sm text-gray-500">Sistema Mesero</p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user?.nombreCompleto?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.nombreCompleto || "Usuario"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.rol?.toLowerCase() || "mesero"}
                  </p>
                </div>
              </div>

              {/* Sucursal Info */}
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {sucursal.nombre}
                      </p>
                      <p className="text-xs text-gray-500">Sucursal actual</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="primary"
                    onClick={handleChangeBranch}
                    className="text-xs"
                  >
                    Cambiar
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span
                      className={`mr-3 flex-shrink-0 ${
                        isActive ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200">
              <Button
                variant="light"
                color="danger"
                onClick={onOpen}
                startContent={<LogOut className="w-4 h-4" />}
                className="w-full justify-start"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 flex z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={closeSidebar}
            onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
            role="button"
            tabIndex={0}
            aria-label="Cerrar menú"
          />
          <aside className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            {/* Close Button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                isIconOnly
                variant="light"
                onClick={closeSidebar}
                className="text-white"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Mobile Sidebar Content */}
            <div className="flex flex-col h-0 flex-1">
              {/* Header */}
              <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Image
                    width={32}
                    height={32}
                    src="/logo.png"
                    alt="Logo"
                    className="w-8 h-8"
                  />
                  <h1 className="text-lg font-bold text-gray-900">
                    Sistema Mesero
                  </h1>
                </div>
              </div>

              {/* User Info Mobile */}
              <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.nombreCompleto?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user?.nombreCompleto || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.rol?.toLowerCase() || "mesero"}
                    </p>
                  </div>
                </div>

                {/* Sucursal Info Mobile */}
                <div className="mt-3 p-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {sucursal.nombre}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      onClick={handleChangeBranch}
                      className="text-xs"
                    >
                      Cambiar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeSidebar}
                      className={`group flex items-center px-2 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span
                        className={`mr-3 flex-shrink-0 ${
                          isActive ? "text-white" : "text-gray-400"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="flex-shrink-0 p-4 border-t border-gray-200">
                <Button
                  variant="light"
                  color="danger"
                  onClick={onOpen}
                  startContent={<LogOut className="w-4 h-4" />}
                  className="w-full justify-start"
                >
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar Mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button isIconOnly variant="light" onClick={toggleSidebar}>
                <Menu className="w-6 h-6" />
              </Button>
              <Image
                width={32}
                height={32}
                src="/logo.png"
                alt="Logo"
                className="w-8 h-8"
              />
              <h1 className="text-lg font-bold text-gray-900">
                Sistema Mesero
              </h1>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" className="text-gray-500">
                    <Bell className="w-5 h-5" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="no-notifications">
                    No hay notificaciones
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger>
                  <Button variant="light" className="gap-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {user?.nombreCompleto?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-small">
                        {user?.nombreCompleto || "Usuario"}
                      </p>
                      <p className="text-tiny text-default-400 capitalize">
                        {user?.rol?.toLowerCase() || "mesero"}
                      </p>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    key="branch"
                    startContent={<MapPin className="w-4 h-4" />}
                    onClick={handleChangeBranch}
                  >
                    Cambiar Sucursal
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    color="danger"
                    startContent={<LogOut className="w-4 h-4" />}
                    onClick={onOpen}
                  >
                    Cerrar Sesión
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Confirmar cierre de sesión
          </ModalHeader>
          <ModalBody>
            <p>¿Estás seguro de que quieres cerrar sesión?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="danger" onPress={handleLogout}>
              Cerrar Sesión
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
