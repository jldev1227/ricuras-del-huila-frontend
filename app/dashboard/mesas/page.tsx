'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@heroui/react'

interface Mesa {
  id: string
  numero: number
  capacidad: number
  disponible: boolean
  ubicacion: string | null
  sucursal: {
    id: string
    nombre: string
  }
  _count: {
    ordenes: number
  }
}

interface Sucursal {
  id: string
  nombre: string
}

export default function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [searchNumero, setSearchNumero] = useState('')
  const [selectedSucursal, setSelectedSucursal] = useState('')
  const [selectedUbicacion, setSelectedUbicacion] = useState('')
  const [selectedDisponible, setSelectedDisponible] = useState('')

  // Cargar sucursales al montar
  useEffect(() => {
    fetchSucursales()
  }, [])

  // Cargar mesas cuando cambien los filtros
  useEffect(() => {
    fetchMesas()
  }, [searchNumero, selectedSucursal, selectedUbicacion, selectedDisponible])

  const fetchSucursales = async () => {
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

  const fetchMesas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchNumero) params.append('numero', searchNumero)
      if (selectedSucursal) params.append('sucursalId', selectedSucursal)
      if (selectedUbicacion) params.append('ubicacion', selectedUbicacion)
      if (selectedDisponible) params.append('disponible', selectedDisponible)

      const response = await fetch(`/api/mesas?${params}`)
      const data = await response.json()

      if (data.success) {
        setMesas(data.mesas)
      }
    } catch (error) {
      console.error('Error al cargar mesas:', error)
    } finally {
      setLoading(false)
    }
  }

  const limpiarFiltros = () => {
    setSearchNumero('')
    setSelectedSucursal('')
    setSelectedUbicacion('')
    setSelectedDisponible('')
  }

  return (
    <div className="space-y-6">
      {/* Header con búsqueda */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Mesas</h1>
          <Button color="primary">
            Nueva Mesa
          </Button>
        </div>

        {/* Filtros de búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Número de mesa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número
            </label>
            <input
              type="number"
              value={searchNumero}
              onChange={(e) => setSearchNumero(e.target.value)}
              placeholder="Buscar por número"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal
            </label>
            <select
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todas</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación
            </label>
            <select
              value={selectedUbicacion}
              onChange={(e) => setSelectedUbicacion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="Interior">Interior</option>
              <option value="Terraza">Terraza</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          {/* Disponibilidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={selectedDisponible}
              onChange={(e) => setSelectedDisponible(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="true">Disponible</option>
              <option value="false">Ocupada</option>
            </select>
          </div>

          {/* Botón limpiar */}
          <div className="flex items-end">
            <Button
              onClick={limpiarFiltros}
              variant="bordered"
              className="w-full"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Mesas encontradas: {mesas.length}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Cargando mesas...</p>
          </div>
        ) : mesas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontraron mesas con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mesas.map((mesa) => (
              <div
                key={mesa.id}
                className={`border-2 rounded-lg p-4 transition-all hover:shadow-lg ${
                  mesa.disponible
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Mesa {mesa.numero}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {mesa.sucursal.nombre}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      mesa.disponible
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {mesa.disponible ? 'Disponible' : 'Ocupada'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    Capacidad: {mesa.capacidad} personas
                  </div>
                  {mesa.ubicacion && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      {mesa.ubicacion}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="bordered" fullWidth>
                    Ver detalles
                  </Button>
                  <Button size="sm" color="primary" fullWidth>
                    {mesa.disponible ? 'Asignar' : 'Liberar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}