"use client";

import {
  addToast,
  Button,
  Card,
  Chip,
  Input,
  Select,
  SelectItem,
  Spinner,
  Textarea,
} from "@heroui/react";
import {
  ArrowLeft,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  Edit3,
  MapPin,
  Minus,
  Package,
  Plus,
  Save,
  Search,
  ShoppingBag,
  User,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ModalSeleccionarMesa from "@/components/orden/ModalSeleccionarMesa";
import { formatCOP } from "@/utils/formatCOP";

// Interfaces
interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  categoria_id: string;
  disponible: boolean;
  categorias: {
    id: string;
    nombre: string;
  };
}

interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
}

interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  ubicacion?: string;
  disponible: boolean;
  sucursal_id: string;
}

interface Mesero {
  id: string;
  nombre_completo: string;
  correo?: string;
}

interface OrdenItem {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  productos: Producto;
}

interface OrdenCompleta {
  id: string;
  tipo_orden: string;
  estado: string;
  subtotal: number;
  descuento: number;
  costo_adicional?: number;
  costo_envio?: number;
  total: number;
  direccion_entrega?: string;
  nombre_cliente?: string;
  telefono_cliente?: string;
  especificaciones?: string;
  notas?: string;
  creado_en: string;
  actualizado_en: string;
  sucursal_id: string;
  mesa_id?: string;
  mesero_id?: string;
  cliente_id?: string;
  orden_items: OrdenItem[];
  mesas?: Mesa;
  usuarios?: Mesero;
  sucursales: {
    id: string;
    nombre: string;
  };
}

interface ProductoCarrito extends Producto {
  cantidad: number;
  notas?: string;
}

export default function EditarOrdenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [ordenId, setOrdenId] = useState<string>("");

  // Estados principales
  const [orden, setOrden] = useState<OrdenCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados para productos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);

  // Estados para la orden
  const [tipoOrden, setTipoOrden] = useState("LLEVAR");
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [meseroSeleccionado, setMeseroSeleccionado] = useState<Mesero | null>(
    null,
  );
  const [meseros, setMeseros] = useState<Mesero[]>([]);

  // Estados de datos de orden
  const [especificaciones, setEspecificaciones] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [costoAdicional, setCostoAdicional] = useState(0);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");

  // Estados de pago
  const [montoPagado, setMontoPagado] = useState(0);
  const [metodoPago, setMetodoPago] = useState("efectivo");

  // Obtener ID de la orden
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setOrdenId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchAll = async () => {
      if (!ordenId) return;

      setLoading(true);
      try {
        const [ordenRes, productosRes, categoriasRes, meserosRes] =
          await Promise.all([
            fetch(`/api/ordenes/${ordenId}`),
            fetch("/api/productos"),
            fetch("/api/categorias"),
            fetch("/api/usuarios?rol=MESERO&activo=true"),
          ]);

        // Cargar orden
        const ordenData = await ordenRes.json();
        if (ordenData.success) {
          const orden = ordenData.orden;
          setOrden(orden);

          // Mapear orden items a carrito
          const carritoItems: ProductoCarrito[] = orden.orden_items.map(
            (item: OrdenItem) => ({
              ...item.productos,
              cantidad: item.cantidad,
              notas: item.notas,
            }),
          );
          setCarrito(carritoItems);

          // Establecer estados de la orden
          setTipoOrden(orden.tipo_orden);
          setEspecificaciones(orden.especificaciones || "");
          setDescuento(Number(orden.descuento) || 0);
          setCostoAdicional(Number(orden.costo_adicional) || 0);
          setCostoEnvio(Number(orden.costo_envio) || 0);
          setDireccionEntrega(orden.direccion_entrega || "");
          setNombreCliente(orden.nombre_cliente || "");
          setTelefonoCliente(orden.telefono_cliente || "");
          setMesaSeleccionada(orden.mesas || null);
          setMeseroSeleccionado(orden.usuarios || null);
          setMontoPagado(Number(orden.total));
        }

        // Cargar productos
        const productosData = await productosRes.json();
        if (productosData.success) {
          setProductos(productosData.productos);
        }

        // Cargar categorías
        const categoriasData = await categoriasRes.json();
        if (categoriasData.success) {
          setCategorias(categoriasData.categorias);
        }

        // Cargar meseros
        const meserosData = await meserosRes.json();
        if (meserosData.success) {
          setMeseros(meserosData.usuarios);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        addToast({
          title: "Error",
          description: "No se pudo cargar la información de la orden",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [ordenId]);

  // Funciones del carrito
  const agregarAlCarrito = (producto: Producto) => {
    const existente = carrito.find((item) => item.id === producto.id);
    if (existente) {
      setCarrito(
        carrito.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        ),
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const incrementarCantidad = (id: string) => {
    setCarrito(
      carrito.map((item) =>
        item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item,
      ),
    );
  };

  const decrementarCantidad = (id: string) => {
    setCarrito((prevCarrito) => {
      return prevCarrito
        .map((item) =>
          item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item,
        )
        .filter((item) => item.cantidad > 0);
    });
  };

  const eliminarDelCarrito = (productoId: string) => {
    setCarrito(carrito.filter((item) => item.id !== productoId));
  };

  const actualizarNotasItem = (productoId: string, notas: string) => {
    setCarrito(
      carrito.map((item) =>
        item.id === productoId ? { ...item, notas } : item,
      ),
    );
  };

  // Cálculos
  const calcularSubtotal = () => {
    return carrito.reduce(
      (total, item) => total + Number(item.precio) * item.cantidad,
      0,
    );
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    return subtotal + costoAdicional + costoEnvio - descuento;
  };

  const calcularVueltas = () => {
    return montoPagado - calcularTotal();
  };

  // Filtrado de productos
  const productosFiltrados = productos.filter((producto) => {
    const matchSearch = producto.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaSeleccionada
      ? producto.categoria_id === categoriaSeleccionada
      : true;
    return matchSearch && matchCategoria && producto.disponible;
  });

  // Validaciones
  const validarOrden = () => {
    if (carrito.length === 0) return false;
    if (tipoOrden === "LOCAL" && !mesaSeleccionada) return false;
    if (tipoOrden === "DOMICILIO" && !direccionEntrega.trim()) return false;
    return true;
  };

  // Guardar orden
  const guardarOrden = async () => {
    if (!validarOrden()) {
      addToast({
        title: "Error de validación",
        description: "Por favor completa todos los campos requeridos",
        color: "danger",
      });
      return;
    }

    setGuardando(true);
    try {
      const ordenActualizada = {
        tipo_orden: tipoOrden,
        mesa_id: tipoOrden === "LOCAL" ? mesaSeleccionada?.id : null,
        mesero_id: meseroSeleccionado?.id || null,
        direccion_entrega: tipoOrden === "DOMICILIO" ? direccionEntrega : null,
        nombre_cliente: nombreCliente || null,
        telefono_cliente: telefonoCliente || null,
        costo_adicional: costoAdicional || null,
        costo_envio: costoEnvio || null,
        descuento,
        especificaciones: especificaciones || null,
        notas: `Método de pago: ${metodoPago} | Monto pagado: ${formatCOP(montoPagado)}`,
        items: carrito.map((item) => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          notas: item.notas || null,
        })),
        subtotal: calcularSubtotal(),
        total: calcularTotal(),
      };

      const response = await fetch(`/api/ordenes/${ordenId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenActualizada),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      addToast({
        title: "Orden actualizada",
        description: "La orden se ha actualizado exitosamente",
        color: "success",
      });

      router.push("/pos/ordenes");
    } catch (error) {
      console.error("Error al actualizar orden:", error);
      addToast({
        title: "Error al actualizar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la orden",
        color: "danger",
      });
    } finally {
      setGuardando(false);
    }
  };

  const onSelectMesa = (mesa: Mesa | null) => {
    setMesaSeleccionada(mesa);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-600">Cargando orden...</p>
        </div>
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Orden no encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            La orden que buscas no existe o no se pudo cargar
          </p>
          <Button
            color="primary"
            onPress={() => router.push("/pos/ordenes")}
            startContent={<ArrowLeft size={16} />}
          >
            Volver a órdenes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Panel Principal - Productos */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b shadow-sm flex-shrink-0">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={() => router.push("/pos/ordenes")}
                  startContent={<ArrowLeft size={20} />}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Editar Orden #{orden.id.slice(-8)}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Creada el{" "}
                    {new Date(orden.creado_en).toLocaleString("es-CO")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Chip
                  color={
                    orden.estado === "PENDIENTE"
                      ? "warning"
                      : orden.estado === "EN_PREPARACION"
                        ? "primary"
                        : orden.estado === "LISTA"
                          ? "success"
                          : "default"
                  }
                  variant="flat"
                  size="sm"
                >
                  {orden.estado}
                </Chip>
              </div>
            </div>

            {/* Búsqueda de productos */}
            <div className="relative mb-4">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar productos para agregar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Categorías */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                type="button"
                onClick={() => setCategoriaSeleccionada("")}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  !categoriaSeleccionada
                    ? "bg-wine text-white shadow-md"
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
                      categoria.id === categoriaSeleccionada
                        ? ""
                        : categoria.id,
                    )
                  }
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    categoriaSeleccionada === categoria.id
                      ? "bg-wine text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {categoria.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Productos disponibles
          </h2>
          {productosFiltrados.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {productosFiltrados.map((producto) => (
                <Card
                  isPressable
                  key={producto.id}
                  onPress={() => agregarAlCarrito(producto)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-100 hover:border-wine/20"
                >
                  <div className="relative bg-gray-100 aspect-square overflow-hidden">
                    <Image
                      fill
                      src={producto.imagen || "/placeholder-producto.png"}
                      alt={producto.nombre}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      loading="lazy"
                    />
                    {!producto.imagen && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="text-gray-400" size={48} />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-wine transition-colors text-sm">
                      {producto.nombre}
                    </h3>
                    <p className="text-base font-bold text-wine">
                      {formatCOP(Number(producto.precio))}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron productos
              </h3>
            </div>
          )}
        </div>
      </div>

      {/* Panel Lateral - Orden */}
      <div className="w-full lg:w-[32rem] bg-white border-l shadow-xl flex flex-col">
        {/* Header del panel */}
        <div className="p-6 border-b bg-gradient-to-r from-wine to-wine/90">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl">
              <Edit3 className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Editar Orden</h2>
              <p className="text-sm text-white/80">
                {carrito.length} productos en la orden
              </p>
            </div>
          </div>

          {/* Selector de tipo de orden */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "LLEVAR", label: "Llevar", icon: "🥡" },
              { value: "DOMICILIO", label: "Domicilio", icon: "🚚" },
              { value: "LOCAL", label: "Local", icon: "🍽️" },
            ].map((tipo) => (
              <Button
                key={tipo.value}
                onPress={() => setTipoOrden(tipo.value)}
                className={`py-2.5 px-3 rounded-lg font-medium text-sm transition-all ${
                  tipoOrden === tipo.value
                    ? "bg-white text-wine shadow-lg scale-105"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <span className="mr-1">{tipo.icon}</span>
                {tipo.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Contenido del panel */}
        <div className="flex-1 overflow-y-auto">
          {/* Lista de productos en la orden */}
          <div className="p-6 border-b">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag size={16} />
              Productos de la orden
            </h3>
            {carrito.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay productos</p>
                <p className="text-sm">Agrega productos para editar la orden</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrito.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl p-4 border"
                  >
                    <div className="flex gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          fill
                          src={item.imagen || "/placeholder-producto.png"}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                          {item.nombre}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatCOP(Number(item.precio))} c/u
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => decrementarCantidad(item.id)}
                            className="w-8 h-8"
                          >
                            <Minus size={14} />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.cantidad}
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => incrementarCantidad(item.id)}
                            className="w-8 h-8"
                          >
                            <Plus size={14} />
                          </Button>
                          <div className="ml-auto">
                            <p className="font-bold text-wine">
                              {formatCOP(Number(item.precio) * item.cantidad)}
                            </p>
                          </div>
                        </div>
                        <Input
                          size="sm"
                          placeholder="Notas especiales..."
                          value={item.notas || ""}
                          onChange={(e) =>
                            actualizarNotasItem(item.id, e.target.value)
                          }
                          className="text-xs"
                        />
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => eliminarDelCarrito(item.id)}
                        className="flex-shrink-0"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configuración de la orden */}
          <div className="p-6 space-y-6">
            {/* Información según tipo de orden */}
            {tipoOrden === "LOCAL" && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin size={16} />
                  Mesa
                </h4>
                {!mesaSeleccionada ? (
                  <ModalSeleccionarMesa
                    mesaSeleccionada={mesaSeleccionada}
                    onSelectMesa={onSelectMesa}
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="text-green-600" size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900">
                          Mesa {mesaSeleccionada.numero}
                        </p>
                        <p className="text-xs text-green-700">
                          {mesaSeleccionada.ubicacion}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => setMesaSeleccionada(null)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {tipoOrden === "DOMICILIO" && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin size={16} />
                  Dirección de entrega
                </h4>
                <Textarea
                  placeholder="Dirección completa de entrega..."
                  value={direccionEntrega}
                  onChange={(e) => setDireccionEntrega(e.target.value)}
                  minRows={2}
                />
              </div>
            )}

            {/* Mesero */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users size={16} />
                Mesero
              </h4>
              <Select
                placeholder="Seleccionar mesero"
                selectedKeys={meseroSeleccionado ? [meseroSeleccionado.id] : []}
                onSelectionChange={(keys) => {
                  const meseroId = Array.from(keys)[0] as string;
                  const mesero = meseros.find((m) => m.id === meseroId);
                  setMeseroSeleccionado(mesero || null);
                }}
              >
                {meseros.map((mesero) => (
                  <SelectItem key={mesero.id}>
                    {mesero.nombre_completo}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Cliente */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User size={16} />
                Cliente
              </h4>
              <div className="space-y-3">
                <Input
                  placeholder="Nombre del cliente"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                />
                <Input
                  placeholder="Teléfono del cliente"
                  value={telefonoCliente}
                  onChange={(e) => setTelefonoCliente(e.target.value)}
                />
              </div>
            </div>

            {/* Costos adicionales */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign size={16} />
                Costos adicionales
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Costo adicional"
                  value={costoAdicional.toString()}
                  onChange={(e) =>
                    setCostoAdicional(Number(e.target.value) || 0)
                  }
                  startContent={<span className="text-gray-500">$</span>}
                />
                <Input
                  type="number"
                  placeholder="Costo de envío"
                  value={costoEnvio.toString()}
                  onChange={(e) => setCostoEnvio(Number(e.target.value) || 0)}
                  startContent={<span className="text-gray-500">$</span>}
                />
              </div>
              <Input
                type="number"
                placeholder="Descuento"
                value={descuento.toString()}
                onChange={(e) => setDescuento(Number(e.target.value) || 0)}
                startContent={<span className="text-gray-500">$</span>}
                className="mt-3"
              />
            </div>

            {/* Especificaciones */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ClipboardCheck size={16} />
                Especificaciones
              </h4>
              <Textarea
                placeholder="Especificaciones de la orden..."
                value={especificaciones}
                onChange={(e) => setEspecificaciones(e.target.value)}
                minRows={3}
              />
            </div>

            {/* Información de pago */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard size={16} />
                Información de pago
              </h4>
              <div className="space-y-3">
                <Select
                  placeholder="Método de pago"
                  selectedKeys={[metodoPago]}
                  onSelectionChange={(keys) => {
                    const metodo = Array.from(keys)[0] as string;
                    setMetodoPago(metodo);
                  }}
                >
                  <SelectItem key="efectivo">Efectivo</SelectItem>
                  <SelectItem key="tarjeta">Tarjeta</SelectItem>
                  <SelectItem key="transferencia">Transferencia</SelectItem>
                </Select>
                <Input
                  type="number"
                  placeholder="Monto pagado"
                  value={montoPagado.toString()}
                  onChange={(e) => setMontoPagado(Number(e.target.value) || 0)}
                  startContent={<span className="text-gray-500">$</span>}
                />
                {montoPagado > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-700">Vueltas:</span>
                      <span
                        className={`font-bold ${
                          calcularVueltas() >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCOP(calcularVueltas())}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer del panel */}
        {carrito.length > 0 && (
          <div className="border-t bg-white p-6">
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">
                  {formatCOP(calcularSubtotal())}
                </span>
              </div>
              {costoAdicional > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Costo adicional:</span>
                  <span className="font-semibold">
                    {formatCOP(costoAdicional)}
                  </span>
                </div>
              )}
              {costoEnvio > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Costo de envío:</span>
                  <span className="font-semibold">{formatCOP(costoEnvio)}</span>
                </div>
              )}
              {descuento > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Descuento:</span>
                  <span className="font-semibold text-red-600">
                    -{formatCOP(descuento)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t font-bold text-lg">
                <span className="text-gray-900">Total:</span>
                <span className="text-wine text-xl">
                  {formatCOP(calcularTotal())}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              color="primary"
              onPress={guardarOrden}
              isLoading={guardando}
              disabled={!validarOrden()}
              className="w-full bg-wine text-white font-semibold"
              startContent={!guardando && <Save size={20} />}
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
