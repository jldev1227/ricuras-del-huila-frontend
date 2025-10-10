"use client";

import { Button, Spinner } from "@heroui/react";
import { Edit, Package, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  activo: boolean;
  _count: {
    productos: number;
  };
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/categorias");
        const data = await response.json();

        if (data.success) {
          setCategorias(data.categorias);
          console.log(data);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  const categoriasFiltradas = categorias.filter((categoria) =>
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalProductos = categorias.reduce(
    (total, cat) => total + cat._count.productos,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Categorías
              </h1>
              <p className="text-sm text-gray-500">
                Organiza tus productos por categorías
              </p>
            </div>
            <Button
              color="primary"
              className="bg-wine shadow-lg hover:shadow-xl transition-all"
              startContent={<Plus size={18} />}
            >
              Nueva Categoría
            </Button>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine transition-all"
            />
            {searchTerm && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </Button>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        {!loading && categorias.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Categorías</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {categorias.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Productos</p>
                  <p className="text-3xl font-bold text-wine">
                    {totalProductos}
                  </p>
                </div>
                <div className="w-12 h-12 bg-wine/10 rounded-lg flex items-center justify-center">
                  <div className="text-2xl">🍽️</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Promedio por Categoría
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {categorias.length > 0
                      ? Math.round(totalProductos / categorias.length)
                      : 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="text-2xl">📊</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Categorías */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {loading
                  ? "Cargando..."
                  : `${categoriasFiltradas.length} categoría${categoriasFiltradas.length !== 1 ? "s" : ""}`}
              </h2>
              {searchTerm && !loading && (
                <p className="text-sm text-gray-500 mt-1">
                  Mostrando resultados para "{searchTerm}"
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" color="primary" />
              <p className="mt-4 text-gray-500">Cargando categorías...</p>
            </div>
          ) : categoriasFiltradas.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📂</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm
                  ? "No se encontraron categorías"
                  : "No hay categorías"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? `No hay categorías que coincidan con "${searchTerm}"`
                  : "Comienza creando tu primera categoría"}
              </p>
              {searchTerm ? (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => setSearchTerm("")}
                  startContent={<X size={16} />}
                >
                  Limpiar búsqueda
                </Button>
              ) : (
                <Button
                  color="primary"
                  className="bg-wine"
                  startContent={<Plus size={16} />}
                >
                  Crear primera categoría
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoriasFiltradas.map((categoria, index) => (
                <div
                  key={categoria.id}
                  className="group bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-100 hover:border-wine/30 hover:shadow-lg transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-wine/10 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {categoria.icono || "📦"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 group-hover:text-wine transition-colors">
                            {categoria.nombre}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500">
                          Orden: {categoria.orden}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  {categoria.descripcion && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {categoria.descripcion}
                    </p>
                  )}

                  {/* Contador de productos */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="text-blue-600" size={16} />
                        <span className="text-sm font-medium text-blue-900">
                          Productos
                        </span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">
                        {categoria._count.productos}
                      </span>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        categoria.activo
                          ? "bg-green-100 text-green-700 ring-1 ring-green-600/20"
                          : "bg-gray-100 text-gray-700 ring-1 ring-gray-600/20"
                      }`}
                    >
                      {categoria.activo ? "✓ Activa" : "⊗ Inactiva"}
                    </span>
                  </div>

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
                      color="danger"
                      variant="flat"
                      isIconOnly
                      className="hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  {/* Badge de posición */}
                  <div className="absolute top-3 right-3 w-6 h-6 bg-wine rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categorías sin productos (si las hay) */}
        {!loading &&
          categorias.length > 0 &&
          (() => {
            const sinProductos = categorias.filter(
              (c) => c._count.productos === 0,
            );
            if (sinProductos.length === 0) return null;

            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 mb-1">
                      Categorías sin productos
                    </h3>
                    <p className="text-sm text-yellow-800 mb-3">
                      Las siguientes categorías no tienen productos asociados:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sinProductos.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm text-yellow-900 border border-yellow-300"
                        >
                          {cat.icono && <span>{cat.icono}</span>}
                          {cat.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
