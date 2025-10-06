'use client'

import React, { useState, useEffect } from 'react'
import { Button, Spinner, Chip, useDisclosure } from '@heroui/react'
import { Search, Filter, X, Eye, ChevronDown, Calendar } from 'lucide-react'
import { formatCOP } from '@/utils/formatCOP'
import ModalDetalleOrden from '@/components/orden/ModalDetalleOrden'
import ModalActualizarOrden from '@/components/orden/ModalActualizarOrden'

interface Orden {
  id: string
  tipoOrden: string
  estado: string
  total: number
  subtotal: number
  descuento: number
  creadoEn: string
  mesa?: {
    numero: number
    ubicacion: string
  }
  mesero: {
    nombreCompleto: string
  }
  cliente?: {
    nombre: string
  }
  items: Array<{
    cantidad: number
    precioUnitario: number
    producto: {
      nombre: string
    }
  }>
  _count?: {
    items: number
  }
}

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [tipoOrdenFiltro, setTipoOrdenFiltro] = useState('')
  const [fechaFiltro, setFechaFiltro] = useState('')

  // Paginación
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Orden seleccionada para ver detalles
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<string | null>(null)

  const { isOpen: openDetalle, onOpen: abrirDetalle, onOpenChange: cerrarDetalle } = useDisclosure();
  const [ordenIdEditar, setOrdenIdEditar] = useState<string | null>(null);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();

  useEffect(() => {
    fetchOrdenes()
  }, [estadoFiltro, tipoOrdenFiltro, fechaFiltro, page])

  const fetchOrdenes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (estadoFiltro) params.append('estado', estadoFiltro)
      if (tipoOrdenFiltro) params.append('tipoOrden', tipoOrdenFiltro)
      if (fechaFiltro) params.append('fecha', fechaFiltro)
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/ordenes?${params}`)
      const data = await response.json()

      console.log(data)

      if (data.success) {
        setOrdenes(data.ordenes)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error al cargar órdenes:', error)
    } finally {
      setLoading(false)
    }
  }

  const limpiarFiltros = () => {
    setEstadoFiltro('')
    setTipoOrdenFiltro('')
    setFechaFiltro('')
    setSearchTerm('')
    setPage(1)
  }

  const tieneFiltrosActivos = estadoFiltro || tipoOrdenFiltro || fechaFiltro || searchTerm

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      PENDIENTE: 'warning',
      EN_PREPARACION: 'primary',
      LISTA: 'success',
      ENTREGADA: 'default',
      CANCELADA: 'danger',
    }
    return colores[estado] || 'default'
  }

  const getTipoOrdenIcon = (tipo: string) => {
    const iconos: Record<string, string> = {
      LOCAL: '🍽️',
      LLEVAR: '🥡',
      DOMICILIO: '🚚',
    }
    return iconos[tipo] || '📋'
  }

  const ordenesFiltradas = ordenes.filter(orden => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      orden.mesero.nombreCompleto.toLowerCase().includes(search) ||
      orden.mesa?.numero.toString().includes(search) ||
      orden.cliente?.nombre.toLowerCase().includes(search)
    )
  })

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleOpenDetalle = (ordenId: string) => {
    setOrdenSeleccionada(ordenId)
    abrirDetalle()
  }

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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por mesero, mesa o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de orden
                </label>
                <select
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all"
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
                {ordenes.filter(o => o.estado === 'PENDIENTE').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-600 mb-1">En preparación</p>
              <p className="text-3xl font-bold text-blue-600">
                {ordenes.filter(o => o.estado === 'EN_PREPARACION').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-600 mb-1">Ventas totales</p>
              <p className="text-2xl font-bold text-wine">
                {formatCOP(ordenes.reduce((sum, o) => sum + Number(o.total), 0))}
              </p>
            </div>
          </div>
        )}

        {/* Lista de órdenes estilo card en mobile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {loading ? 'Cargando...' : `${ordenesFiltradas.length} orden${ordenesFiltradas.length !== 1 ? 'es' : ''}`}
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
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'No hay órdenes registradas'
                }
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
              {/* Cards en mobile, tabla en desktop */}
              <div className="grid grid-cols-1 gap-4 sm:hidden">
                {ordenesFiltradas.map((orden) => (
                  <div key={orden.id} className="border rounded-xl shadow-sm p-4 flex flex-col gap-2 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getTipoOrdenIcon(orden.tipoOrden)}</span>
                        <span className="text-sm text-gray-700">{orden.tipoOrden}</span>
                      </div>
                      <Chip
                        color={getEstadoColor(orden.estado) as any}
                        size="sm"
                        variant="flat"
                      >
                        {orden.estado.replace('_', ' ')}
                      </Chip>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="font-semibold text-gray-900">#{orden.id.slice(0, 8)}</p>
                      {orden.mesa && (
                        <p className="text-xs text-gray-500">Mesa {orden.mesa.numero}</p>
                      )}
                      {orden.cliente && (
                        <p className="text-xs text-gray-500">{orden.cliente.nombre}</p>
                      )}
                      <p className="text-sm text-gray-700">Mesero: {orden.mesero.nombreCompleto}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {orden._count?.items ?? 0} item{orden._count?.items !== 1 ? 's' : ''}
                      </p>
                      <p className="font-bold text-wine">{formatCOP(orden.total)}</p>
                      {orden.descuento > 0 && (
                        <p className="text-xs text-red-600">-{formatCOP(orden.descuento)}</p>
                      )}
                      <p className="text-sm text-gray-600">{formatearFecha(orden.creadoEn)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <Button
                        fullWidth
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => handleOpenDetalle(orden.id)}
                        startContent={<Eye className='text-primary' size={16} />}
                        className='text-primary'
                      >
                        Ver
                      </Button>
                      <Button
                        fullWidth
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          setOrdenIdEditar(orden.id);
                          onEditOpen();
                        }}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla en desktop */}
              <div className="overflow-x-auto hidden sm:block">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 text-sm font-semibold text-gray-600">Orden</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Tipo</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Mesero</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Items</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Total</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Estado</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Fecha</th>
                      <th className="pb-3 text-sm font-semibold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesFiltradas.map((orden) => (
                      <tr key={orden.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              #{orden.id.slice(0, 8)}
                            </p>
                            {orden.mesa && (
                              <p className="text-xs text-gray-500">Mesa {orden.mesa.numero}</p>
                            )}
                            {orden.cliente && (
                              <p className="text-xs text-gray-500">{orden.cliente.nombre}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getTipoOrdenIcon(orden.tipoOrden)}</span>
                            <span className="text-sm text-gray-700">{orden.tipoOrden}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-gray-700">{orden.mesero.nombreCompleto}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm font-semibold text-gray-900">
                            {orden._count?.items ?? 0} item{orden._count?.items !== 1 ? 's' : ''}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="font-bold text-wine">{formatCOP(orden.total)}</p>
                          {orden.descuento > 0 && (
                            <p className="text-xs text-red-600">-{formatCOP(orden.descuento)}</p>
                          )}
                        </td>
                        <td className="py-4">
                          <Chip
                            color={getEstadoColor(orden.estado) as any}
                            size="sm"
                            variant="flat"
                          >
                            {orden.estado.replace('_', ' ')}
                          </Chip>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-gray-600">{formatearFecha(orden.creadoEn)}</p>
                        </td>
                        <td className="py-4">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => handleOpenDetalle(orden.id)}
                            startContent={<Eye size={16} />}
                            className='text-primary'
                          >
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => {
                              setOrdenIdEditar(orden.id);
                              onEditOpen();
                            }}
                          >
                            Editar
                          </Button>
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
                      onPress={() => setPage(p => Math.max(1, p - 1))}
                      isDisabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="bordered"
                      onPress={() => setPage(p => Math.min(totalPages, p + 1))}
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

      <ModalDetalleOrden isOpen={openDetalle} onOpenChange={cerrarDetalle} ordenId={ordenSeleccionada} />
      <ModalActualizarOrden
        ordenId={ordenIdEditar}
        isOpen={isEditOpen}
        onOpenChange={onEditOpenChange}
        onOrdenActualizada={() => fetchOrdenes()}
      />
    </div>
  )
}