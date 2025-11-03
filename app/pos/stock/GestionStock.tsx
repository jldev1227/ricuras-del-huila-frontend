"use client";

import { Button } from "@heroui/react";
import { Download, Package, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthenticatedFetch } from "@/lib/api-client";
import ModalMovimientoStock from "./ModalMovimientoStock";

interface Producto {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  unidad_medida: string;
  disponible: boolean;
  controlar_stock: boolean;
  categorias: {
    id: string;
    nombre: string;
  };
  estado: "sin_stock" | "stock_bajo" | "stock_normal" | "stock_alto";
  porcentaje_stock: number | null;
}

interface Estadisticas {
  total_productos: number;
  sin_stock: number;
  stock_bajo: number;
  stock_normal: number;
  stock_alto: number;
}

export default function GestionStock() {
  const authenticatedFetch = useAuthenticatedFetch();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "stock_bajo">("todos");
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtro === "stock_bajo") {
        params.append("stock_bajo", "true");
      }

      const response = await authenticatedFetch(`/api/stock/resumen?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setProductos(data.productos);
        setEstadisticas(data.estadisticas);
      } else {
        console.error("Error al cargar stock:", data.message);
      }
    } catch (error) {
      console.error("Error al cargar stock:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [filtro]);

  const handleMovimientoStock = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setModalMovimiento(true);
  };

  const handleMovimientoExitoso = () => {
    setModalMovimiento(false);
    setProductoSeleccionado(null);
    fetchStock(); // Recargar los datos
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "sin_stock":
        return "bg-red-100 text-red-800 border-red-200";
      case "stock_bajo":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "stock_normal":
        return "bg-green-100 text-green-800 border-green-200";
      case "stock_alto":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "sin_stock":
        return "Sin stock";
      case "stock_bajo":
        return "Stock bajo";
      case "stock_normal":
        return "Stock normal";
      case "stock_alto":
        return "Stock alto";
      default:
        return "Desconocido";
    }
  };

  const exportarExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filtro === "stock_bajo") {
        params.append("stock_bajo", "true");
      }
      params.append("export", "excel");

      const response = await authenticatedFetch(`/api/stock/resumen?${params.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventario_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error al exportar:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h1>
        <div className="flex gap-2">
          <Button
            color="secondary"
            variant="bordered"
            startContent={<Download className="w-4 h-4" />}
            onPress={exportarExcel}
          >
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">Total productos</p>
                <p className="text-2xl font-bold text-blue-900">{estadisticas.total_productos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-red-600">Sin stock</p>
                <p className="text-2xl font-bold text-red-900">{estadisticas.sin_stock}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-yellow-600">Stock bajo</p>
                <p className="text-2xl font-bold text-yellow-900">{estadisticas.stock_bajo}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600">Stock normal</p>
                <p className="text-2xl font-bold text-green-900">{estadisticas.stock_normal}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">Stock alto</p>
                <p className="text-2xl font-bold text-blue-900">{estadisticas.stock_alto}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <Button
          color={filtro === "todos" ? "primary" : "default"}
          variant={filtro === "todos" ? "solid" : "bordered"}
          onPress={() => setFiltro("todos")}
        >
          Todos los productos
        </Button>
        <Button
          color={filtro === "stock_bajo" ? "warning" : "default"}
          variant={filtro === "stock_bajo" ? "solid" : "bordered"}
          onPress={() => setFiltro("stock_bajo")}
        >
          Solo alertas de stock
        </Button>
      </div>

      {/* Lista de productos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Producto</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Categoría</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Stock Actual</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Stock Mínimo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Stock Máximo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Unidad</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Estado</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productos.map((producto) => (
                <tr key={producto.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{producto.nombre}</p>
                      {!producto.disponible && (
                        <p className="text-sm text-red-600">No disponible</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{producto.categorias.nombre}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${producto.estado === "sin_stock" ? "text-red-600" : producto.estado === "stock_bajo" ? "text-yellow-600" : "text-gray-900"}`}>
                      {producto.stock_actual}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">{producto.stock_minimo}</td>
                  <td className="py-3 px-4 text-center text-gray-600">
                    {producto.stock_maximo || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">{producto.unidad_medida}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(producto.estado)}`}>
                      {getEstadoTexto(producto.estado)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      size="sm"
                      color="primary"
                      variant="bordered"
                      startContent={<Plus className="w-4 h-4" />}
                      onPress={() => handleMovimientoStock(producto)}
                    >
                      Movimiento
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {productos.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay productos con control de stock</p>
          </div>
        )}
      </div>

      {/* Modal de movimiento */}
      <ModalMovimientoStock
        isOpen={modalMovimiento}
        onOpenChange={setModalMovimiento}
        producto={productoSeleccionado}
        onSuccess={handleMovimientoExitoso}
      />
    </div>
  );
}