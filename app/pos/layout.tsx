'use client'

import React, { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Bell, ChevronRight, MapPin, LogOut } from 'lucide-react'
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure
} from "@heroui/react"

interface MenuItem {
    name: string
    href: string
    icon: ReactNode
}

interface Sucursal {
    id: string
    nombre: string
}

interface AuthState {
    state: {
        user: any
        token: string
        isLoading: boolean
        isOnline: boolean
        sucursal?: Sucursal
    }
    version: number
}

const menuItems: MenuItem[] = [
    {
        name: 'Punto de venta',
        href: '/pos',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
        ),
    },
    {
        name: 'Mesas',
        href: '/pos/mesas',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
        ),
    },
    {
        name: 'Órdenes',
        href: '/pos/ordenes',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
        ),
    },
    {
        name: 'Productos',
        href: '/pos/productos',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
        ),
    },
    {
        name: 'Categorías',
        href: '/pos/categorias',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
                <path d="M12 22V12" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <path d="m7.5 4.27 9 5.15" />
            </svg>
        ),
    },
    {
        name: 'Reportes',
        href: '/pos/reportes',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        ),
    },
    {
        name: 'Configuración',
        href: '/pos/configuracion',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
        ),
    },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isHovered, setIsHovered] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [sucursalActual, setSucursalActual] = useState<Sucursal | null>(null)
    const [sucursales, setSucursales] = useState<Sucursal[]>([])
    const [usuario, setUsuario] = useState<any>(null)
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState<Sucursal | null>(null)

    const { isOpen, onOpen, onClose } = useDisclosure()

    useEffect(() => {
        cargarDatos()
        cargarSucursales()
    }, [])

    const cargarDatos = () => {
        try {
            const authStorage = localStorage.getItem('auth-storage')
            if (authStorage) {
                const authData: AuthState = JSON.parse(authStorage)
                setUsuario(authData.state.user)
                if (authData.state.sucursal) {
                    setSucursalActual(authData.state.sucursal)
                }
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
        }
    }

    const cargarSucursales = async () => {
        try {
            const response = await fetch('/api/sucursales')
            const data = await response.json()
            if (data.success) {
                setSucursales(data.sucursales)
            }
        } catch (error) {
            console.error('Error al cargar sucursales:', error)
        }
    }

    const handleSeleccionarSucursal = (sucursal: Sucursal) => {
        setSucursalSeleccionada(sucursal)
        onOpen()
    }

    const confirmarCambioSucursal = () => {
        if (!sucursalSeleccionada) return

        try {
            const authStorage = localStorage.getItem('auth-storage')
            if (!authStorage) return

            const authData: AuthState = JSON.parse(authStorage)
            authData.state.sucursal = sucursalSeleccionada
            authData.version = (authData.version || 0) + 1

            localStorage.setItem('auth-storage', JSON.stringify(authData))
            localStorage.setItem('sucursal-actual', JSON.stringify(sucursalSeleccionada))

            setSucursalActual(sucursalSeleccionada)
            onClose()

            // Recargar la página para actualizar todo el contexto
            window.location.reload()
        } catch (error) {
            console.error('Error al cambiar sucursal:', error)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('auth-storage')
        localStorage.removeItem('sucursal-actual')
        router.push('/login')
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Modal de confirmación */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        Confirmar cambio de sucursal
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-gray-700">
                            ¿Estás seguro de cambiar a la sucursal{' '}
                            <span className="font-bold text-wine">{sucursalSeleccionada?.nombre}</span>?
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Se recargará la aplicación para actualizar todos los datos.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                            Cancelar
                        </Button>
                        <Button className="bg-wine text-white" onPress={confirmarCambioSucursal}>
                            Confirmar cambio
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Overlay para mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Desktop */}
            <aside
                className={`hidden lg:block relative bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${isHovered ? 'w-64' : 'w-20'
                    }`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Logo */}
                <div className="h-20 flex items-center justify-center border-b border-gray-200">
                    <img
                        src="/logo.png"
                        alt="Logo Ricuras del Huila"
                        className="transition-all duration-300 w-24 h-24"
                        loading="eager"
                    />
                </div>

                {/* Navigation */}
                <nav className="p-4">
                    <ul className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${isActive
                                            ? 'bg-wine text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="flex-shrink-0">{item.icon}</span>
                                        <span
                                            className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                                                }`}
                                        >
                                            {item.name}
                                        </span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                    <button className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 w-full transition-colors">
                        <div className="w-8 h-8 bg-wine/20 rounded-full flex-shrink-0 flex items-center justify-center text-wine font-bold">
                            {usuario?.nombreCompleto?.charAt(0) || 'U'}
                        </div>
                        <div
                            className={`transition-all duration-300 overflow-hidden ${isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                                }`}
                        >
                            <p className="text-sm font-medium text-gray-700">{usuario?.nombreCompleto || 'Usuario'}</p>
                            <p className="text-xs text-gray-500">{usuario?.rol || 'Admin'}</p>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Sidebar Mobile */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header Mobile */}
                <div className="h-20 flex items-center justify-between px-4 border-b border-gray-200">
                    <img
                        src="/logo.png"
                        alt="Logo Ricuras del Huila"
                        className="w-24 h-24"
                        loading="eager"
                    />
                    <Button
                        isIconOnly
                        size='sm'
                        onPress={() => setIsMobileMenuOpen(false)}
                        className="p-2 bg-wine text-white rounded-lg"
                    >
                        <X size={24} />
                    </Button>
                </div>

                {/* Navigation Mobile */}
                <nav className="p-4">
                    <ul className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                            ? 'bg-wine text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex-shrink-0">{item.icon}</span>
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                        {isActive && <ChevronRight size={20} />}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* User section Mobile */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                    {/* Sucursal Selector - Desktop */}
                    <div className="space-y-4">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    fullWidth
                                    variant="flat"
                                    className="border border-wine/30 bg-white hover:bg-wine/10 shadow-sm px-4 py-6 rounded-lg flex lg:hidden items-center gap-2"
                                    startContent={
                                        <MapPin className="text-wine" size={20} />
                                    }
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs text-gray-500">Sucursal</span>
                                        <span className="font-semibold text-wine text-sm">
                                            {sucursalActual?.nombre || 'Sin sucursal'}
                                        </span>
                                    </div>
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Sucursales"
                                onAction={(key) => {
                                    const sucursal = sucursales.find(s => s.id === key)
                                    if (sucursal && sucursal.id !== sucursalActual?.id) {
                                        handleSeleccionarSucursal(sucursal)
                                    }
                                }}
                                className="min-w-[220px]"
                            >
                                {sucursales.map((sucursal) => (
                                    <DropdownItem
                                        key={sucursal.id}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${sucursal.id === sucursalActual?.id
                                            ? 'bg-wine/10 text-wine font-semibold'
                                            : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        startContent={
                                            <MapPin
                                                size={18}
                                                className={
                                                    sucursal.id === sucursalActual?.id
                                                        ? 'text-wine'
                                                        : 'text-gray-400'
                                                }
                                            />
                                        }
                                    >
                                        {sucursal.nombre}
                                        {sucursal.id === sucursalActual?.id && (
                                            <span className="ml-2 px-2 py-0.5 bg-wine/20 text-xs rounded text-wine font-medium">
                                                Actual
                                            </span>
                                        )}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button className="w-full flex items-center gap-3 px-4 py-8 rounded-lg bg-gray-50" variant="light">
                                    <div className="w-10 h-10 bg-wine/20 rounded-full flex items-center justify-center text-wine font-bold">
                                        {usuario?.nombreCompleto?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <p className="text-sm font-medium text-gray-700">{usuario?.nombreCompleto || 'Usuario'}</p>
                                        <p className="text-xs text-gray-500">{usuario?.rol || 'Admin'}</p>
                                    </div>
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Opciones de usuario">
                                <DropdownItem
                                    key="logout"
                                    startContent={<LogOut size={18} className="text-wine" />}
                                    onPress={handleLogout}
                                    className="text-wine"
                                >
                                    Cerrar sesión
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto flex flex-col">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 h-16 lg:h-20 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30">
                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Logo mobile */}
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-24 h-24 lg:hidden"
                    />

                    {/* Sucursal Selector - Desktop */}
                    <div className="hidden lg:flex items-center gap-3">
                        <h1 className='font-bold text-2xl'>Ricuras Del Huila</h1>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:gap-4">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    variant="flat"
                                    className="border border-wine/30 bg-white hover:bg-wine/10 shadow-sm px-10 py-6 rounded-lg hidden lg:flex items-center gap-2"
                                    startContent={
                                        <MapPin className="text-wine" size={20} />
                                    }
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs text-gray-500">Sucursal</span>
                                        <span className="font-semibold text-wine text-sm">
                                            {sucursalActual?.nombre || 'Sin sucursal'}
                                        </span>
                                    </div>
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Sucursales"
                                onAction={(key) => {
                                    const sucursal = sucursales.find(s => s.id === key)
                                    if (sucursal && sucursal.id !== sucursalActual?.id) {
                                        handleSeleccionarSucursal(sucursal)
                                    }
                                }}
                                className="min-w-[220px]"
                            >
                                {sucursales.map((sucursal) => (
                                    <DropdownItem
                                        key={sucursal.id}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${sucursal.id === sucursalActual?.id
                                            ? 'bg-wine/10 text-wine font-semibold'
                                            : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        startContent={
                                            <MapPin
                                                size={18}
                                                className={
                                                    sucursal.id === sucursalActual?.id
                                                        ? 'text-wine'
                                                        : 'text-gray-400'
                                                }
                                            />
                                        }
                                    >
                                        {sucursal.nombre}
                                        {sucursal.id === sucursalActual?.id && (
                                            <span className="ml-2 px-2 py-0.5 bg-wine/20 text-xs rounded text-wine font-medium">
                                                Actual
                                            </span>
                                        )}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                            <Bell size={20} className="lg:w-6 lg:h-6" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}