"use client";

import { Button, Spinner } from "@heroui/react";
import type { Mesa } from "@prisma/client";
import { Edit, Filter, MapPin, Plus, Search, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Sucursal {
  id: string;
  nombre: string;
}

interface MesaConRelaciones extends Mesa {
  sucursal: Sucursal;
  _count: {
    ordenes: number;
  };
}

export default function MesasPage() {
  const [mesas, setMesas] = useState<MesaConRelaciones[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchNumero, setSearchNumero] = useState("");
  const [selectedSucursal, setSelectedSucursal] = useState("");
  const [selectedUbicacion, setSelectedUbicacion] = useState("");
  const [selectedDisponible, setSelectedDisponible] = useState("");

  useEffect(() => {
    // Cargar sucursales y mesas al montar y cuando cambien los filtros
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch sucursales
        const sucursalesRes = await fetch("/api/sucursales");
        const sucursalesData = await sucursalesRes.json();
        if (sucursalesData.success) {
          setSucursales(sucursalesData.sucursales);
        }

        // Fetch mesas con filtros
        const params = new URLSearchParams();
        if (searchNumero) params.append("numero", searchNumero);
        if (selectedSucursal) params.append("sucursalId", selectedSucursal);
        if (selectedUbicacion) params.append("ubicacion", selectedUbicacion);
        if (selectedDisponible) params.append("disponible", selectedDisponible);

        const mesasRes = await fetch(`/api/mesas?${params}`);
        const mesasData = await mesasRes.json();
        if (mesasData.success) {
          setMesas(mesasData.mesas);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [searchNumero, selectedSucursal, selectedUbicacion, selectedDisponible]);

  const limpiarFiltros = () => {
    setSearchNumero("");
    setSelectedSucursal("");
    setSelectedUbicacion("");
    setSelectedDisponible("");
  };

  const tieneFiltrosActivos =
    searchNumero || selectedSucursal || selectedUbicacion || selectedDisponible;

  const getEstadoColor = (disponible: boolean) => {
    return disponible
      ? "bg-green-50 border-green-200 hover:border-green-300"
      : "bg-red-50 border-red-200 hover:border-red-300";
  };

  const getEstadoBadge = (disponible: boolean) => {
    return disponible
      ? "bg-green-100 text-green-700 ring-1 ring-green-600/20"
      : "bg-red-100 text-red-700 ring-1 ring-red-600/20";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Gestión de Mesas
              </h1>
              <p className="text-sm text-gray-500">
                Administra las mesas de todas tus sucursales
              </p>
            </div>
            <Button
              color="primary"
              className="bg-wine shadow-lg hover:shadow-xl transition-all"
              startContent={<Plus size={18} />}
            >
              Nueva Mesa
            </Button>
          </div>

          {/* Filtros */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter size={16} />
              <span>Filtros de búsqueda</span>
              {tieneFiltrosActivos && (
                <span className="ml-auto text-xs bg-wine/10 text-wine px-2 py-1 rounded-full">
                  Filtros activos
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Búsqueda por número */}
              <div>
                <label
                  htmlFor="numeroMesa"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Número de mesa
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    id="numeroMesa"
                    type="number"
                    value={searchNumero}
                    onChange={(e) => setSearchNumero(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all"
                  />
                </div>
              </div>

              {/* Sucursal */}
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
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Todas las sucursales</option>
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ubicación */}
              <div>
                <label
                  htmlFor="ubicacion"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Ubicación
                </label>
                <select
                  id="ubicacion"
                  value={selectedUbicacion}
                  onChange={(e) => setSelectedUbicacion(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Todas las ubicaciones</option>
                  <option value="Interior">Interior</option>
                  <option value="Terraza">Terraza</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              {/* Estado */}
              <div>
                <label
                  htmlFor="estado"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Estado
                </label>
                <select
                  id="estado"
                  value={selectedDisponible}
                  onChange={(e) => setSelectedDisponible(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Todos los estados</option>
                  <option value="true">Disponible</option>
                  <option value="false">Ocupada</option>
                </select>
              </div>

              {/* Botón limpiar */}
              <div className="flex items-end">
                <Button
                  onClick={limpiarFiltros}
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

        {/* Resultados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {loading
                  ? "Cargando..."
                  : `${mesas.length} mesa${mesas.length !== 1 ? "s" : ""} encontrada${mesas.length !== 1 ? "s" : ""}`}
              </h2>
              {tieneFiltrosActivos && !loading && (
                <p className="text-sm text-gray-500 mt-1">
                  Mostrando resultados filtrados
                </p>
              )}
            </div>

            {mesas.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {mesas.filter((m) => m.disponible).length} disponibles
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {mesas.filter((m) => !m.disponible).length} ocupadas
                  </span>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" color="primary" />
              <p className="mt-4 text-gray-500">Cargando mesas...</p>
            </div>
          ) : mesas.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🪑</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron mesas
              </h3>
              <p className="text-gray-500 mb-6">
                {tieneFiltrosActivos
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza agregando tu primera mesa"}
              </p>
              {tieneFiltrosActivos ? (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={limpiarFiltros}
                  startContent={<X size={16} />}
                >
                  Limpiar filtros
                </Button>
              ) : (
                <Button
                  color="primary"
                  className="bg-wine"
                  startContent={<Plus size={16} />}
                >
                  Crear primera mesa
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mesas.map((mesa) => (
                <div
                  key={mesa.id}
                  className={`border-2 rounded-xl p-5 transition-all hover:shadow-lg ${getEstadoColor(mesa.disponible)}`}
                >
                  {/* Header de la card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        Mesa {mesa.numero}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mesa.sucursal.nombre}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(mesa.disponible)}`}
                    >
                      {mesa.disponible ? "Disponible" : "Ocupada"}
                    </span>
                  </div>

                  {/* Información */}
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Users className="text-gray-400" size={16} />
                      <span className="font-medium">{mesa.capacidad}</span>
                      <span className="text-gray-500">personas</span>
                    </div>

                    {mesa.ubicacion && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="text-gray-400" size={16} />
                        <span>{mesa.ubicacion}</span>
                      </div>
                    )}

                    {mesa._count.ordenes > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-blue-600 font-medium">
                          {mesa._count.ordenes} orden
                          {mesa._count.ordenes !== 1 ? "es" : ""} activa
                          {mesa._count.ordenes !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notas si existen */}
                  {mesa.notas && (
                    <div className="mb-4 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800 line-clamp-2">
                        {mesa.notas}
                      </p>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="bordered"
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                      startContent={<Edit size={14} />}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      color={mesa.disponible ? "primary" : "success"}
                      className={mesa.disponible ? "flex-1 bg-wine" : "flex-1"}
                    >
                      {mesa.disponible ? "Asignar" : "Liberar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
