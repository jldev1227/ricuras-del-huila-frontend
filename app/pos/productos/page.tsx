"use client";

import { Button, useDisclosure } from "@heroui/react";
import { PlusIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import ModalDetallesProducto from "@/components/productos/ModalDetallesProducto";
import ModalFormProducto from "@/components/productos/ModalFormProducto";
import type { ProductoConCategoria } from "@/types/producto";

interface Categoria {
  id: string;
  nombre: string;
  icono: string | null;
  _count: {
    productos: number;
  };
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<ProductoConCategoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchNombre, setSearchNombre] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [selectedDisponible, setSelectedDisponible] = useState("");
  const {
    isOpen: isOpenForm,
    onOpen: onOpenForm,
    onOpenChange: onOpenChangeForm,
  } = useDisclosure();
  const {
    isOpen: isOpenDetails,
    onOpen: onOpenDetails,
    onOpenChange: onOpenChangeDetails,
  } = useDisclosure();

  const [selectedProducto, setSelectedProducto] =
    useState<ProductoConCategoria | null>(null);

  // Función para abrir modal de edición
  const handleEdit = (producto: ProductoConCategoria) => {
    setSelectedProducto(producto);
    onOpenForm();
  };

  // Función para abrir modal de creación
  const handleCreate = () => {
    setSelectedProducto(null);
    onOpenForm();
  };

  const handleViewDetails = (producto: ProductoConCategoria) => {
    setSelectedProducto(producto);
    onOpenDetails();
  };

  const handleEditFromDetails = (producto: ProductoConCategoria) => {
    setSelectedProducto(producto);
    onOpenForm();
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch categorías
        const categoriasRes = await fetch("/api/categorias");
        const categoriasData = await categoriasRes.json();
        if (categoriasData.success) {
          setCategorias(categoriasData.categorias);
        }

        // Fetch productos con filtros
        const params = new URLSearchParams();
        if (searchNombre) params.append("nombre", searchNombre);
        if (selectedCategoria) params.append("categoriaId", selectedCategoria);
        if (selectedDisponible) params.append("disponible", selectedDisponible);

        const productosRes = await fetch(`/api/productos?${params}`);
        const productosData = await productosRes.json();
        console.log(productosData);
        if (productosData.success) {
          setProductos(productosData.productos);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchNombre, selectedCategoria, selectedDisponible]);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchNombre) params.append("nombre", searchNombre);
      if (selectedCategoria) params.append("categoriaId", selectedCategoria);
      if (selectedDisponible) params.append("disponible", selectedDisponible);

      const response = await fetch(`/api/productos?${params}`);
      const data = await response.json();

      console.log(data);

      if (data.success) {
        setProductos(data.productos);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setSearchNombre("");
    setSelectedCategoria("");
    setSelectedDisponible("");
  };

  const calcularGanancia = (precio: number, costo: number) => {
    return precio - costo;
  };

  const calcularMargen = (precio: number, costo: number) => {
    return (((precio - costo) / precio) * 100).toFixed(1);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header con búsqueda */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Gestión de Productos
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Menú de comida típica huilense
            </p>
          </div>

          <Button
            color="primary"
            startContent={<PlusIcon size={18} />}
            onPress={handleCreate}
          >
            Nuevo Producto
          </Button>
        </div>

        {/* Filtros de búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Buscar producto
            </label>
            <input
              id="search"
              type="text"
              value={searchNombre}
              onChange={(e) => setSearchNombre(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
            />
          </div>

          <div>
            <label
              htmlFor="categoria"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Categoría
            </label>
            <select
              id="categoria"
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.icono} {categoria.nombre} (
                  {categoria._count.productos})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="disponibilidad"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Disponibilidad
            </label>
            <select
              id="disponibilidad"
              value={selectedDisponible}
              onChange={(e) => setSelectedDisponible(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="true">Disponible</option>
              <option value="false">No disponible</option>
            </select>
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {(searchNombre || selectedCategoria || selectedDisponible) && (
          <div className="mt-4">
            <Button onPress={limpiarFiltros} variant="bordered" size="sm">
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Productos encontrados: {productos.length}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Cargando productos...</p>
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {productos.map((producto) => {
              const ganancia = calcularGanancia(
                Number(producto.precio),
                Number(producto.costo_produccion),
              );
              const margen = calcularMargen(
                Number(producto.precio),
                Number(producto.costo_produccion),
              );

              return (
                <div
                  key={producto.id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Imagen */}
                  <div className="relative h-48 bg-gray-100">
                    {producto.imagen ? (
                      <Image
                        src={producto.imagen}
                        alt={producto.nombre}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-16 h-16"
                          aria-label="Imagen no disponible"
                          role="img"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      {producto.destacado && (
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Destacado
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          producto.disponible
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {producto.disponible ? "Disponible" : "Agotado"}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {producto.nombre}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {producto.categorias.icono}{" "}
                          {producto.categorias.nombre}
                        </p>
                      </div>
                    </div>

                    {producto.descripcion && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {producto.descripcion}
                      </p>
                    )}

                    {/* Precios y ganancias */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Precio venta:</span>
                        <span className="font-bold text-gray-800">
                          ${Number(producto.precio).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Costo producción:</span>
                        <span className="text-gray-800">
                          ${Number(producto.costo_produccion).toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ganancia:</span>
                          <span className="font-bold text-green-600">
                            ${ganancia.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Margen:</span>
                          <span className="font-bold text-green-600">
                            {margen}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="bordered"
                        fullWidth
                        onPress={() => handleEdit(producto)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        fullWidth
                        onPress={() => handleViewDetails(producto)}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modales al final */}
      <ModalFormProducto
        isOpen={isOpenForm}
        onOpenChange={onOpenChangeForm}
        producto={selectedProducto}
        onSuccess={fetchProductos}
      />

      <ModalDetallesProducto
        isOpen={isOpenDetails}
        onOpenChange={onOpenChangeDetails}
        producto={selectedProducto}
        onEdit={handleEditFromDetails}
      />
    </div>
  );
}
