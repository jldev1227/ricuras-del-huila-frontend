"use client";

import {
  Button,
  Card,
  Chip,
  Spinner,
  Input,
  Select,
  SelectItem,
  Textarea,
  addToast,
} from "@heroui/react";
import {
  Search,
  X,
  ShoppingBag,
  ClipboardCheck,
  ArrowLeft,
  Plus,
  Minus,
  Package,
  UtensilsCrossed,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSucursal } from "@/hooks/useSucursal";
import { formatCOP } from "@/utils/formatCOP";
import Image from "next/image";
import ModalSeleccionarMesa from "@/components/orden/ModalSeleccionarMesa";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  disponible: boolean;
  categoriaId: string;
  categoria?: {
    id: string;
    nombre: string;
  };
}

interface Categoria {
  id: string;
  nombre: string;
}

interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  disponible: boolean;
}

interface Carrito extends Producto {
  cantidad: number;
}

export default function MeseroNuevaOrden() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { sucursal } = useSucursal();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [carrito, setCarrito] = useState<Carrito[]>([]);
  const [tipoOrden, setTipoOrden] = useState("local");
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [loading, setLoading] = useState(true);
  const [mostrarAside, setMostrarAside] = useState(false);
  const [especificaciones, setEspecificaciones] = useState("");
  const [procesandoOrden, setProcesandoOrden] = useState(false);

  // Cargar mesa desde parámetro URL si existe
  useEffect(() => {
    const mesaId = searchParams.get('mesa');
    if (mesaId) {
      const fetchMesa = async () => {
        try {
          const response = await fetch(`/api/mesas/${mesaId}`);
          const data = await response.json();
          if (data.success) {
            setMesaSeleccionada({
              id: data.mesa.id,
              numero: data.mesa.numero,
              capacidad: data.mesa.capacidad,
              disponible: data.mesa.disponible
            });
          }
        } catch (error) {
          console.error("Error al cargar mesa:", error);
        }
      };
      fetchMesa();
    }
  }, [searchParams]);

  // Cargar productos y categorías
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Categorías
        const resCategorias = await fetch("/api/categorias");
        const dataCategorias = await resCategorias.json();
        if (dataCategorias.success) {
          setCategorias(dataCategorias.categorias);
        }

        // Productos
        const params = new URLSearchParams();
        if (searchTerm) params.append("nombre", searchTerm);
        if (categoriaSeleccionada) params.append("categoriaId", categoriaSeleccionada);

        const resProductos = await fetch(`/api/productos?${params}`);
        const dataProductos = await resProductos.json();
        if (dataProductos.success) {
          setProductos(dataProductos.productos);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [searchTerm, categoriaSeleccionada]);

  const productosFiltrados = productos.filter((producto) => {
    const matchSearch = producto.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaSeleccionada
      ? producto.categoriaId === categoriaSeleccionada
      : true;
    return matchSearch && matchCategoria && producto.disponible;
  });

  // Funciones del carrito
  const agregarAlCarrito = (producto: Producto) => {
    const existente = carrito.find((item) => item.id === producto.id);
    if (existente) {
      setCarrito(
        carrito.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    setMostrarAside(true);
  };

  const incrementarCantidad = (id: string) => {
    setCarrito(
      carrito.map((item) =>
        item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item
      )
    );
  };

  const decrementarCantidad = (id: string) => {
    setCarrito((prevCarrito) => {
      return prevCarrito
        .map((item) =>
          item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item
        )
        .filter((item) => item.cantidad > 0);
    });
  };

  const eliminarDelCarrito = (productoId: string) => {
    setCarrito(carrito.filter((item) => item.id !== productoId));
  };

  const calcularTotal = () => {
    return carrito.reduce(
      (total, item) => total + Number(item.precio) * item.cantidad,
      0
    );
  };

  const obtenerMensajeTipoOrden = () => {
    switch (tipoOrden) {
      case "llevar":
        return "🥡 El cliente recogerá el pedido para llevar";
      case "local":
        return "🍽️ Pedido para consumir en el local";
      default:
        return "❓ Tipo de orden no especificado";
    }
  };

  const validarOrden = () => {
    if (carrito.length === 0) return false;
    if (tipoOrden === "local" && !mesaSeleccionada) return false;
    if (tipoOrden === "llevar" && !nombreCliente.trim()) return false;
    return true;
  };

  const crearOrden = async () => {
    if (!validarOrden()) {
      addToast({
        title: "Información incompleta",
        description: "Completa todos los campos requeridos",
        color: "danger",
      });
      return;
    }

    setProcesandoOrden(true);

    try {
      const orden = {
        sucursalId: sucursal?.id,
        meseroId: user?.id,
        tipoOrden: tipoOrden.toUpperCase(),
        mesaId: tipoOrden === "local" ? mesaSeleccionada?.id : null,
        nombreCliente: tipoOrden === "llevar" ? nombreCliente : null,
        items: carrito.map((item) => ({
          productoId: item.id,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
        })),
        subtotal: calcularTotal(),
        total: calcularTotal(),
        especificaciones,
      };

      const response = await fetch("/api/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orden),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      addToast({
        title: "Orden creada exitosamente",
        description: `Total: ${formatCOP(calcularTotal())}`,
        color: "success",
      });

      // Redirigir de vuelta al dashboard del mesero
      router.push("/mesero");
    } catch (error: unknown) {
      console.error(error);
      addToast({
        title: "Error al crear orden",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado",
        color: "danger",
      });
    } finally {
      setProcesandoOrden(false);
    }
  };

  const onSelectMesa = (mesa: Mesa | null) => {
    setMesaSeleccionada(mesa);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Overlay para mobile */}
      {mostrarAside && (
        <Button
          disableAnimation
          radius="none"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-default h-full w-full"
          onPress={() => setMostrarAside(false)}
          aria-label="Cerrar menú móvil"
        />
      )}

      {/* Panel Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b shadow-sm flex-shrink-0">
          <div className="px-4 lg:px-6 py-3 lg:py-4">
            <div className="flex items-center gap-4 mb-4">
              <Button
                isIconOnly
                variant="light"
                onPress={() => router.push("/mesero")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Nueva Orden
                </h1>
                <p className="text-sm text-gray-600">
                  {user?.nombreCompleto} - {sucursal?.nombre}
                </p>
              </div>
            </div>

            <div className="relative mb-3 lg:mb-4">
              <Search
                className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 lg:pl-12 pr-10 lg:pr-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm lg:text-base"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 lg:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-2 lg:gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                type="button"
                onClick={() => setCategoriaSeleccionada("")}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm lg:text-base ${
                  !categoriaSeleccionada
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() =>
                    setCategoriaSeleccionada(
                      categoria.id === categoriaSeleccionada ? "" : categoria.id
                    )
                  }
                  className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm lg:text-base ${
                    categoriaSeleccionada === categoria.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {categoria.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sección de productos */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Menú disponible
                </h2>
                <p className="text-xs lg:text-sm text-gray-500 mt-1">
                  {productosFiltrados.length} producto
                  {productosFiltrados.length !== 1 ? "s" : ""}
                </p>
              </div>

              {carrito.length > 0 && (
                <Button
                  onPress={() => setMostrarAside(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg shadow-lg transition-all"
                >
                  <ShoppingBag size={18} />
                  <span className="font-semibold">{carrito.length}</span>
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spinner size="lg" color="primary" />
                <p className="mt-4 text-gray-500 text-sm">Cargando productos...</p>
              </div>
            ) : productosFiltrados.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-5">
                {productosFiltrados.map((producto) => (
                  <Card
                    isPressable
                    key={producto.id}
                    onPress={() => agregarAlCarrito(producto)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-100 hover:border-blue-500/20"
                  >
                    <div className="relative bg-gray-100 aspect-square overflow-hidden">
                      <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                        <Image
                          fill
                          src={producto.imagen || "/placeholder-producto.png"}
                          alt={producto.nombre}
                          className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 ${
                            producto.imagen ? "" : "opacity-60"
                          }`}
                          loading="lazy"
                          draggable={false}
                        />
                        {!producto.imagen && (
                          <Package className="w-8 h-8 text-gray-400 absolute" />
                        )}
                      </div>
                      {producto.categoria && (
                        <div className="absolute top-2 left-2">
                          <Chip
                            size="sm"
                            color="primary"
                            variant="flat"
                            className="text-xs"
                          >
                            {producto.categoria.nombre}
                          </Chip>
                        </div>
                      )}
                    </div>
                    <div className="p-3 lg:p-4">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors text-sm lg:text-base">
                        {producto.nombre}
                      </h3>
                      <p className="text-base lg:text-xl font-bold text-blue-600">
                        {formatCOP(Number(producto.precio))}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-5xl lg:text-7xl mb-4">🍽️</div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-700 mb-2">
                  No se encontraron productos
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aside - Panel de Orden */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-96 lg:w-[30rem] bg-white border-l shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          mostrarAside ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                <ClipboardCheck className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-white">
                  Nueva orden
                </h2>
                <p className="text-xs text-white/80">
                  {carrito.length} productos
                </p>
              </div>
            </div>
            <Button
              onPress={() => setMostrarAside(false)}
              isIconOnly
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            >
              <X size={20} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
            {[
              { value: "local", label: "Local", icon: UtensilsCrossed },
              { value: "llevar", label: "Llevar", icon: Package },
            ].map((tipo) => (
              <Button
                key={tipo.value}
                onPress={() => setTipoOrden(tipo.value)}
                className={`py-2 lg:py-2.5 px-2 lg:px-3 rounded-lg font-medium text-xs lg:text-sm transition-all flex items-center gap-2 ${
                  tipoOrden === tipo.value
                    ? "bg-white text-blue-600 shadow-lg scale-105"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <tipo.icon size={16} />
                {tipo.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingBag size={48} className="mb-4 opacity-30" />
              <p className="text-base lg:text-lg font-medium">Carrito vacío</p>
              <p className="text-xs lg:text-sm">
                Agrega productos para empezar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {carrito.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex gap-3">
                    <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-lg flex-shrink-0 overflow-hidden bg-gray-100">
                      <Image
                        fill
                        src={item.imagen || "/placeholder-producto.png"}
                        alt={item.nombre}
                        className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
                          item.imagen ? "" : "opacity-60"
                        }`}
                      />
                      {!item.imagen && (
                        <Package className="w-6 h-6 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 line-clamp-1 text-sm lg:text-base">
                        {item.nombre}
                      </h3>
                      <p className="text-sm lg:text-base font-bold text-blue-600 mt-1">
                        {formatCOP(Number(item.precio))}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => decrementarCantidad(item.id)}
                          className="w-7 h-7 min-w-0"
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="font-semibold text-gray-900 min-w-[2rem] text-center">
                          {item.cantidad}
                        </span>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => incrementarCantidad(item.id)}
                          className="w-7 h-7 min-w-0"
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      aria-label={`Eliminar ${item.nombre} del carrito`}
                      onPress={() => eliminarDelCarrito(item.id)}
                      className="flex-shrink-0 w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center text-gray-400 hover:text-danger-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="mt-4">
                <label
                  htmlFor="notas"
                  className="block text-xs lg:text-sm font-medium text-gray-700 mb-2"
                >
                  Especificaciones de la orden
                </label>
                <Textarea
                  id="notas"
                  placeholder="Notas especiales para la cocina..."
                  value={especificaciones}
                  onChange={(e) => setEspecificaciones(e.target.value)}
                  minRows={2}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer del carrito */}
        {carrito.length > 0 && (
          <div className="border-t bg-white flex-shrink-0">
            <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
              <div className="p-2.5 lg:p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs lg:text-sm text-blue-800 font-medium">
                  {obtenerMensajeTipoOrden()}
                </p>
              </div>

              {tipoOrden === "llevar" && (
                <div>
                  <Input
                    label="Nombre del cliente"
                    placeholder="Ingresa el nombre del cliente"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    isRequired
                    variant="bordered"
                  />
                </div>
              )}

              {tipoOrden === "local" && (
                <div className="space-y-3">
                  {!mesaSeleccionada ? (
                    <ModalSeleccionarMesa
                      mesaSeleccionada={mesaSeleccionada}
                      onSelectMesa={onSelectMesa}
                    />
                  ) : (
                    <div className="flex items-center justify-between p-3 lg:p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-lg">
                          <UtensilsCrossed className="text-white" size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">
                            Mesa {mesaSeleccionada.numero}
                          </p>
                          <p className="text-xs text-green-700">
                            Capacidad: {mesaSeleccionada.capacidad} personas
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => setMesaSeleccionada(null)}
                      >
                        Cambiar
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 lg:space-y-3 p-3 lg:p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center pt-2 lg:pt-3 border-t border-gray-200">
                  <span className="font-bold text-base lg:text-lg text-gray-900">
                    Total
                  </span>
                  <span className="font-bold text-xl lg:text-2xl text-blue-600">
                    {formatCOP(calcularTotal())}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                onPress={crearOrden}
                disabled={!validarOrden() || procesandoOrden}
                className="w-full bg-blue-600 text-white py-3 lg:py-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
              >
                {procesandoOrden ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" color="white" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={20} />
                    <span>
                      {validarOrden()
                        ? `Crear orden - ${formatCOP(calcularTotal())}`
                        : "Completa la información"}
                    </span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}