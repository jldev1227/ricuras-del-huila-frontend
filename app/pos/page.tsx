"use client";

import { addToast, Button, Card, Spinner } from "@heroui/react";
import type { categorias, mesas, productos } from "@prisma/client";
import {
  ArrowLeft,
  ClipboardCheck,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import SelectReact, { type CSSObjectWithLabel } from "react-select";
import ModalSeleccionarMesa from "@/components/orden/ModalSeleccionarMesa";
import ModalCrearCliente from "@/components/cliente/ModalCrearCliente";
import ModalEntregarOrden from "@/components/orden/ModalEntregarOrden";
import ProductImage from "@/components/productos/ProductImage";
import { useAuth } from "@/hooks/useAuth";
import { useSucursal } from "@/hooks/useSucursal";
import { useAuthenticatedFetch } from "@/lib/api-client";
import { formatCOP } from "@/utils/formatCOP";
import { useSearchParams } from "next/navigation"; // si no estás recibiendo searchParams como prop

interface Carrito extends productos {
  cantidad: number;
}

type PasoOrden = "carrito" | "pago";

export default function OrderDashboard() {
  const [productos, setProductos] = useState<productos[]>([]);
  const [categorias, setCategorias] = useState<categorias[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [carrito, setCarrito] = useState<Carrito[]>([]);
  const [tipoOrden, setTipoOrden] = useState("llevar");
  const [mesaSeleccionada, setMesaSeleccionada] = useState<mesas | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarAside, setMostrarAside] = useState(false);
  const [especificaciones, setEspecificaciones] = useState("");
  const [descuento, setDescuento] = useState<number>(0);
  const [costoAdicional, setCostoAdicional] = useState<number>(0);
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const searchParams = useSearchParams();
  const ordenId = searchParams.get("ordenId"); // Simplicado - no necesita useMemo aquí

  // Estados para el paso de pago
  const [pasoActual, setPasoActual] = useState<PasoOrden>("carrito");
  const [montoPagado, setMontoPagado] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{
    id: string;
    nombre: string;
    telefono?: string;
    correo?: string;
    tipo_identificacion?: string;
    numero_identificacion?: string;
  } | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState<{
    id: string;
    nombre: string;
    apellido?: string;
    telefono?: string;
    correo?: string;
    tipo_identificacion?: string;
    numero_identificacion?: string;
  }[]>([]);
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [procesandoOrden, setProcesandoOrden] = useState(false);

  // Estados para el modo de edición
  const [modoEdicion, _setModoEdicion] = useState(!!ordenId);
  const [ordenExistente, setOrdenExistente] = useState<{
    id: string;
    tipo_orden: string;
    especificaciones?: string;
    descuento?: number;
    costo_adicional?: number;
    direccion_entrega?: string;
    mesas?: { id: string; numero: number; ubicacion?: string };
    mesero?: { id: string; nombre_completo: string; correo?: string };
    cliente?: {
      id: string;
      nombre: string;
      telefono?: string;
      correo?: string;
      tipo_identificacion?: string;
      numero_identificacion?: string;
    };
    orden_items?: Array<{
      cantidad: number;
      notas?: string;
      productos: productos;
    }>;
  } | null>(null);
  const [cargandoOrden, setCargandoOrden] = useState(!!ordenId);
  const [ordenCargada, setOrdenCargada] = useState(false); // ✅ Nuevo estado para evitar re-loads

  // Obtener la sucursal y usuario autenticado
  const { sucursal } = useSucursal();
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  // Meseros y hub
  const [hubMesero, setHubMesero] = useState(false);
  const [meseroSeleccionado, setMeseroSeleccionado] = useState<{
    id: string;
    nombre_completo: string;
    email?: string;
  } | null>(null);
  const [meseros, setMeseros] = useState<
    Array<{
      id: string;
      nombre_completo: string;
      email?: string;
    }>
  >([]);

  // Cargar datos básicos (categorías y productos) - separado de meseros
  useEffect(() => {
    const fetchBasicData = async () => {
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
        if (categoriaSeleccionada)
          params.append("categoria_id", categoriaSeleccionada);

        const resProductos = await fetch(`/api/productos?${params}`);
        const dataProductos = await resProductos.json();
        if (dataProductos.success) {
          setProductos(dataProductos.productos);
        }
      } catch (error) {
        console.error("Error al cargar datos básicos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBasicData();
  }, [searchTerm, categoriaSeleccionada]); // ✅ Solo re-ejecutar cuando cambie búsqueda o categoría

  // Cargar meseros solo cuando sea necesario
  useEffect(() => {
    const fetchMeseros = async () => {
      if (!hubMesero) {
        setMeseros([]);
        return;
      }

      try {
        const resMeseros = await fetch("/api/usuarios?rol=MESERO&activo=true");
        const dataMeseros = await resMeseros.json();

        if (dataMeseros.success) {
          setMeseros(dataMeseros.data);
        }
      } catch (error) {
        console.error("Error al cargar meseros:", error);
      }
    };

    fetchMeseros();
  }, [hubMesero]); // ✅ Solo cargar meseros cuando se active la opción

  const cargarOrdenExistente = useCallback(async () => {
    if (!ordenId || ordenCargada) return; // ✅ Evitar recargas innecesarias

    setCargandoOrden(true);
    try {
      const response = await authenticatedFetch(`/api/ordenes/${ordenId}`);
      if (!response.ok) throw new Error("Error al cargar la orden");

      const data = await response.json();
      if (data.success && data.orden) {
        const orden = data.orden;

        console.log('📦 Datos completos de la orden recibida:', {
          ordenId: orden.id,
          tipoOrden: orden.tipo_orden,
          mesaCompleta: orden.mesas,
          mesaId: orden.mesa_id,
          estructura: Object.keys(orden)
        });

        setOrdenExistente(orden);

        setTipoOrden(orden.tipo_orden.toLowerCase() || "llevar");
        setEspecificaciones(orden.especificaciones || "");
        setDescuento(orden.descuento || 0);
        setCostoAdicional(orden.costo_adicional || 0);
        setDireccionEntrega(orden.direccion_entrega || "");

        if (orden.mesas) {
          console.log('🏠 Orden tiene mesa asignada:', {
            mesaId: orden.mesas.id,
            mesaNumero: orden.mesas.numero,
            modoEdicion,
            mesaCompleta: orden.mesas
          });
          setMesaSeleccionada(orden.mesas);
        }

        if (orden.mesero) {
          setMeseroSeleccionado({
            id: orden.mesero.id,
            nombre_completo: orden.mesero.nombre_completo,
            email: orden.mesero.correo,
          });
          setHubMesero(true);
        }

        if (orden.orden_items?.length > 0) {
          const productosCarrito = orden.orden_items.map((item: {
            cantidad: number;
            notas?: string;
            productos: productos;
          }) => ({
            ...item.productos,
            cantidad: item.cantidad,
            notas: item.notas || "",
          }));
          setCarrito(productosCarrito);
          setMostrarAside(true);
        }

        if (orden.cliente) {
          setClienteSeleccionado({
            id: orden.cliente.id,
            nombre: orden.cliente.nombre,
            telefono: orden.cliente.telefono,
            correo: orden.cliente.correo,
            tipo_identificacion: orden.cliente.tipo_identificacion,
            numero_identificacion: orden.cliente.numero_identificacion,
          });
        }

        setOrdenCargada(true); // ✅ Marcar como cargada
      }
    } catch (error) {
      console.error("Error al cargar la orden:", error);
    } finally {
      setCargandoOrden(false);
    }
  }, [authenticatedFetch, ordenId, ordenCargada]); // ✅ Dependencias estables

  useEffect(() => {
    if (ordenId && !ordenCargada) {
      cargarOrdenExistente();
    }
  }, [ordenId, ordenCargada, cargarOrdenExistente]); // ✅ Solo se ejecuta cuando sea necesario

  useEffect(() => {
    // Abort controller para cancelar peticiones pendientes
    const abortController = new AbortController();

    const buscarClientes = async (busqueda: string) => {
      if (busqueda.length < 2) {
        setClientesEncontrados([]);
        setMostrarDropdownClientes(false);
        return;
      }

      setBuscandoClientes(true);

      try {
        const response = await fetch(
          `/api/clientes?busqueda=${encodeURIComponent(busqueda)}`,
          { signal: abortController.signal }
        );

        if (!response.ok) throw new Error("Error al buscar clientes");

        const data = await response.json();
        setClientesEncontrados(data.clientes || []);
        setMostrarDropdownClientes(true);
      } catch (error) {
        // Ignorar errores de cancelación
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error("Error al buscar clientes:", error);
      } finally {
        setBuscandoClientes(false);
      }
    };

    // Debounce de 300ms
    const timeoutId = setTimeout(() => {
      buscarClientes(busquedaCliente);
    }, 300);

    // Cleanup: cancelar timeout y petición pendiente
    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [busquedaCliente]); // ✅ Solo dependencia necesaria

  // useEffect para cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#cliente') && !target.closest('.dropdown-clientes')) {
        setMostrarDropdownClientes(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const productosFiltrados = productos.filter((producto) => {
    const matchSearch = producto.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaSeleccionada
      ? producto.categoria_id === categoriaSeleccionada
      : true;
    return matchSearch && matchCategoria && producto.disponible;
  });

  // Función para seleccionar un cliente
  const seleccionarCliente = (cliente: {
    id: string;
    nombre: string;
    apellido?: string;
    telefono?: string;
    correo?: string;
    tipo_identificacion?: string;
    numero_identificacion?: string;
  }) => {
    setClienteSeleccionado({
      id: cliente.id,
      nombre: cliente.nombre + (cliente.apellido ? ` ${cliente.apellido}` : ''),
      telefono: cliente.telefono,
      correo: cliente.correo,
      tipo_identificacion: cliente.tipo_identificacion,
      numero_identificacion: cliente.numero_identificacion,
    });
    setBusquedaCliente(cliente.nombre + (cliente.apellido ? ` ${cliente.apellido}` : ''));
    setMostrarDropdownClientes(false);
  };

  // Función para limpiar la búsqueda de cliente
  const limpiarBusquedaCliente = () => {
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setClientesEncontrados([]);
    setMostrarDropdownClientes(false);
  };

  // Funciones del carrito
  const agregarAlCarrito = (producto: productos) => {
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
    setMostrarAside(true);
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

  const calcularSubtotal = () => {
    return carrito.reduce(
      (total, item) => total + Number(item.precio) * item.cantidad,
      0,
    );
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    return subtotal + costoAdicional - descuento;
  };

  const calcularVueltas = () => {
    return montoPagado - calcularTotal();
  };

  const obtenerMensajeTipoOrden = () => {
    switch (tipoOrden) {
      case "llevar":
        return "🥡 El cliente recogerá el pedido para llevar";
      case "domicilio":
        return "🚚 El pedido será entregado a domicilio";
      case "local":
        return "🍽️ Pedido para consumir en el local";
      default:
        return "❓ Tipo de orden no especificado";
    }
  };

  const validarOrden = () => {
    if (carrito.length === 0) return false;
    if (tipoOrden === "local" && !mesaSeleccionada) return false;
    if (tipoOrden === "domicilio" && !direccionEntrega.trim()) return false;
    if (hubMesero && !meseroSeleccionado) return false; // Nueva validación
    return true;
  };

  const avanzarAPago = () => {
    if (!validarOrden()) return;
    setPasoActual("pago");
    setMontoPagado(calcularTotal()); // Pre-llenar con el total exacto
  };

  const volverAlCarrito = () => {
    setPasoActual("carrito");
  };

  const guardarOrden = async () => {
    if (montoPagado < calcularTotal()) {
      addToast({
        title: "Monto insuficiente",
        description: "El monto pagado debe ser mayor o igual al total",
        color: "danger",
      });
      return;
    }

    if (requiereFactura && !clienteSeleccionado) {
      addToast({
        title: "Cliente requerido",
        description: "Debe seleccionar un cliente para facturar",
        color: "danger",
      });
      return;
    }

    setProcesandoOrden(true);

    try {
      const orden = {
        sucursalId: sucursal?.id,
        tipoOrden: tipoOrden.toUpperCase(),
        mesaId: tipoOrden === "local" ? mesaSeleccionada?.id : null,
        clienteId: clienteSeleccionado?.id || null,
        meseroId: hubMesero ? meseroSeleccionado?.id : null,
        direccionEntrega: tipoOrden === "domicilio" ? direccionEntrega : null,
        costoAdicional: costoAdicional || null,
        items: carrito.map((item) => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
        })),
        subtotal: calcularSubtotal(),
        descuento,
        total: calcularTotal(),
        especificaciones,
        metodoPago: metodoPago,
        notas: `Pago: ${formatCOP(montoPagado)} | Vueltas: ${formatCOP(calcularVueltas())}`,
        userId: user?.id, // ID del usuario que crea/actualiza la orden
      };

      let response: Response;
      let successMessage: string;

      if (modoEdicion && ordenExistente) {
        // Actualizar orden existente
        response = await authenticatedFetch(`/api/ordenes/${ordenExistente.id}`, {
          method: "PUT",
          body: JSON.stringify(orden),
        });
        successMessage = "Orden actualizada exitosamente";
      } else {
        // Crear nueva orden
        response = await authenticatedFetch("/api/ordenes", {
          method: "POST",
          body: JSON.stringify(orden),
        });
        successMessage = "Orden creada exitosamente";
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      // Verificar si se debe mostrar el modal de entrega
      const debeEntregarImmediatamente = 
        !modoEdicion && // Solo para órdenes nuevas
        requiereFactura; // Que requieran factura (para cualquier tipo de orden)

      if (debeEntregarImmediatamente && data.orden?.id) {
        // Mostrar modal de entrega en lugar de toast
        setOrdenCreadaId(data.orden.id);
        setModalEntregarOrdenAbierto(true);
      } else {
        // Comportamiento normal con toast
        addToast({
          title: successMessage,
          description: `Total: ${formatCOP(calcularTotal())} | Vueltas: ${formatCOP(calcularVueltas())}`,
          color: "success",
        });
      }

      // En modo edición, redirigir a la lista de órdenes, sino resetear
      if (modoEdicion) {
        window.location.href = "/pos/ordenes";
      } else if (!debeEntregarImmediatamente) {
        // Solo resetear si no se va a mostrar el modal
        resetearOrden();
      }
    } catch (error: unknown) {
      console.log(error);
      addToast({
        title: `Error al ${modoEdicion ? 'actualizar' : 'crear'} orden`,
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

  const resetearOrden = () => {
    setCarrito([]);
    setEspecificaciones("");
    setDescuento(0);
    setCostoAdicional(0);
    setDireccionEntrega("");
    setMesaSeleccionada(null);
    setMostrarAside(false);
    setPasoActual("carrito");
    setMontoPagado(0);
    setMetodoPago("EFECTIVO");
    setRequiereFactura(false);
    setClienteSeleccionado(null);
  };

  const onOrdenEntregada = () => {
    // Resetear la orden después de entregarla
    resetearOrden();
    
    // Cerrar el modal
    setModalEntregarOrdenAbierto(false);
    setOrdenCreadaId(null);
    
    // Mostrar toast de confirmación
    addToast({
      title: "🎉 Orden completada",
      description: "La orden ha sido entregada exitosamente",
      color: "success",
    });
  };

  const onCerrarModalEntrega = () => {
    // Solo resetear si el usuario cierra el modal sin entregar (para órdenes que no son LLEVAR)
    resetearOrden();
    setModalEntregarOrdenAbierto(false);
    setOrdenCreadaId(null);
  };

  const onSelectMesa = (mesa: { id: string; numero: number; ubicacion?: string | null }) => {
    setMesaSeleccionada(mesa as mesas);
  };

  const meserosOptions = meseros?.map((mesero) => ({
    value: mesero.id,
    label: mesero.nombre_completo,
  }));

  const [modalCrearClienteAbierto, setModalCrearClienteAbierto] = useState(false);

  // Estados para el modal de entrega
  const [modalEntregarOrdenAbierto, setModalEntregarOrdenAbierto] = useState(false);
  const [ordenCreadaId, setOrdenCreadaId] = useState<string | null>(null);

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
      <div className="flex-1 flex flex-col">
        {/* Header con búsqueda y categorías */}
        <div className="bg-white border-b shadow-sm flex-shrink-0">
          <div className="px-4 lg:px-6 py-3 lg:py-4">
            <div className="relative mb-3 lg:mb-4">
              <Search
                className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar comida..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 lg:pl-12 pr-10 lg:pr-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine transition-all text-sm lg:text-base text-black"
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
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm lg:text-base ${!categoriaSeleccionada
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
                  className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm lg:text-base ${categoriaSeleccionada === categoria.id
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

        {/* Indicador de modo edición */}
        {modoEdicion && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardCheck className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-amber-800">
                  Modo edición - Orden #{ordenExistente?.id?.slice(-8)}
                </p>
                <p className="text-xs text-amber-600">
                  Modificando orden existente. Los cambios se guardarán al confirmar.
                </p>
              </div>
              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="light"
                  color="warning"
                  onPress={() => {
                    window.location.href = "/pos/ordenes";
                  }}
                >
                  Cancelar edición
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sección de productos */}
        <div className="flex-1">
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
                  className="flex items-center gap-2 bg-wine text-white px-3 lg:px-4 py-2 rounded-lg shadow-lg transition-all"
                >
                  <ShoppingBag size={18} />
                  <span className="font-semibold">{carrito.length}</span>
                </Button>
              )}
            </div>

            {loading || cargandoOrden ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spinner size="lg" color="primary" />
                <p className="mt-4 text-gray-500 text-sm">
                  {cargandoOrden ? "Cargando orden..." : "Cargando productos..."}
                </p>
              </div>
            ) : productosFiltrados.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-5">
                {productosFiltrados.map((producto) => (
                  <Card
                    isPressable
                    key={producto.id}
                    onPress={() => agregarAlCarrito(producto)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-100 hover:border-wine/20"
                  >
                    <div className="relative bg-gray-100 aspect-square overflow-hidden">
                      <ProductImage
                        imagePath={producto.imagen}
                        productName={producto.nombre}
                        className="rounded-xl"
                        fill
                      />
                      {producto.categoria_id && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-white/95 backdrop-blur-sm px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                            {
                              categorias.find(
                                (c) => c.id === producto.categoria_id,
                              )?.nombre
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 lg:p-4">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-wine transition-colors text-sm lg:text-base">
                        {producto.nombre}
                      </h3>
                      <p className="text-base lg:text-xl font-bold text-wine">
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
        className={`fixed inset-y-0 right-0 w-full sm:w-96 lg:w-[30rem] bg-white border-l shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${mostrarAside ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b bg-gradient-to-r from-wine to-wine/90 flex-shrink-0">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="flex items-center gap-2 lg:gap-3">
              {pasoActual === "pago" && (
                <button
                  type="button"
                  onClick={volverAlCarrito}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="text-white" size={20} />
                </button>
              )}
              <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                <ClipboardCheck className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-white">
                  {pasoActual === "carrito"
                    ? modoEdicion ? "Editar orden" : "Nueva orden"
                    : "Pago y facturación"}
                </h2>
                <p className="text-xs text-white/80">
                  {pasoActual === "carrito"
                    ? modoEdicion 
                      ? `Orden #${ordenExistente?.id?.slice(-8)} - ${carrito.length} productos`
                      : `${carrito.length} productos`
                    : "Finalizar orden"}
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

          {pasoActual === "carrito" && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "llevar", label: "Llevar" },
                { value: "domicilio", label: "Domicilio" },
                { value: "local", label: "Local" },
              ].map((tipo) => (
                <Button
                  key={tipo.value}
                  onPress={() => setTipoOrden(tipo.value)}
                  className={`py-2 lg:py-2.5 px-2 lg:px-3 rounded-lg font-medium text-xs lg:text-sm transition-all ${tipoOrden === tipo.value
                    ? "bg-white text-wine shadow-lg scale-105"
                    : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                >
                  {tipo.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Contenido según paso */}
        {pasoActual === "carrito" ? (
          <>
            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
              {carrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingBag size={48} className="mb-4 opacity-30" />
                  <p className="text-base lg:text-lg font-medium">
                    Carrito vacío
                  </p>
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
                          <ProductImage
                            imagePath={item.imagen}
                            productName={item.nombre}
                            className="rounded-lg"
                            fill
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 truncate text-sm lg:text-base">
                            {item.nombre}
                          </h4>
                          <p className="text-xs lg:text-sm text-gray-500 mb-2">
                            {formatCOP(Number(item.precio))} c/u
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 lg:gap-2 bg-gray-100 rounded-lg p-1">
                              <Button
                                isIconOnly
                                size="sm"
                                onPress={() => decrementarCantidad(item.id)}
                                aria-label={`Quitar una unidad de ${item.nombre}`}
                                className="h-7 w-7 flex items-center justify-center bg-white text-gray-700 rounded-md hover:scale-105 hover:bg-gray-100 transition-all shadow focus:outline-none focus:ring-2 focus:ring-gray-300"
                              >
                                <Minus size={16} />
                              </Button>
                              <span className="w-6 lg:w-8 text-center font-semibold text-xs lg:text-sm">
                                {item.cantidad}
                              </span>
                              <Button
                                isIconOnly
                                size="sm"
                                onPress={() => incrementarCantidad(item.id)}
                                aria-label={`Agregar una unidad de ${item.nombre}`}
                                className="h-7 w-7 flex items-center justify-center bg-wine text-white rounded-md hover:scale-105 transition-all shadow focus:outline-none focus:ring-2 focus:ring-wine/40"
                              >
                                <Plus size={16} />
                              </Button>
                            </div>
                            <p className="font-bold text-wine text-sm lg:text-base">
                              {formatCOP(Number(item.precio) * item.cantidad)}
                            </p>
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
                      Notas de la orden
                    </label>
                    <textarea
                      id="notas"
                      placeholder="Especificaciones..."
                      value={especificaciones}
                      onChange={(e) => setEspecificaciones(e.target.value)}
                      rows={2}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all resize-none text-sm"
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
                      <label
                        htmlFor="costoAdicional"
                        className="block text-xs lg:text-sm font-medium text-gray-700 mb-2"
                      >
                        Costo adicional
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          $
                        </span>
                        <input
                          id="costoAdicional"
                          type="number"
                          placeholder="0"
                          value={costoAdicional || ""}
                          onChange={(e) =>
                            setCostoAdicional(Number(e.target.value) || 0)
                          }
                          min="0"
                          className="w-full pl-7 lg:pl-8 pr-3 lg:pr-4 py-2.5 lg:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-sm text-black"
                        />
                      </div>
                    </div>
                  )}

                  {tipoOrden === "domicilio" && (
                    <div>
                      <label
                        htmlFor="direccion"
                        className="block text-xs lg:text-sm font-medium text-gray-700 mb-2"
                      >
                        Dirección de entrega *
                      </label>
                      <input
                        id="direccion"
                        type="text"
                        placeholder="Dirección completa..."
                        value={direccionEntrega}
                        onChange={(e) => setDireccionEntrega(e.target.value)}
                        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-sm text-black"
                        required
                      />
                    </div>
                  )}

                  {tipoOrden === "local" && (
                    <div className="space-y-3">
                      {!mesaSeleccionada ? (
                        <div>
                          {modoEdicion && (
                            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm text-amber-800">
                                <span className="font-medium">Editando orden:</span> Selecciona una mesa para continuar
                              </p>
                            </div>
                          )}
                          <ModalSeleccionarMesa
                            mesaSeleccionada={null}
                            onSelectMesa={onSelectMesa}
                            mesaActualId={modoEdicion && ordenExistente?.mesas?.id ? ordenExistente.mesas.id : null}
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 lg:p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 lg:gap-3">
                              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-base lg:text-lg">
                                  {mesaSeleccionada.numero}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm lg:text-base">
                                  Mesa {mesaSeleccionada.numero}
                                  {modoEdicion ? (
                                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                      Editando
                                    </span>
                                  ) : (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      Nueva orden
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs lg:text-sm text-gray-600">
                                  📍 {mesaSeleccionada.ubicacion || "Principal"}
                                </p>
                              </div>
                            </div>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => setMesaSeleccionada(null)}
                              className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center text-gray-400 hover:text-danger-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                          
                          {/* Botón para cambiar mesa */}
                          <div className="flex gap-2">
                            <ModalSeleccionarMesa
                              mesaSeleccionada={mesaSeleccionada.id}
                              onSelectMesa={onSelectMesa}
                              mesaActualId={modoEdicion && ordenExistente?.mesas?.id ? ordenExistente.mesas.id : null}
                              buttonText="🔄 Cambiar mesa"
                            />
                          </div>
                        </div>
                      )}

                      {/* Selector de mesero */}
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            ¿Un mesero atendió este pedido?
                          </h3>
                          <label
                            htmlFor="hayMesero"
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              id="hayMesero"
                              type="checkbox"
                              checked={hubMesero}
                              onChange={(e) => {
                                setHubMesero(e.target.checked);
                                if (!e.target.checked) {
                                  setMeseroSeleccionado(null);
                                }
                              }}
                              className="w-4 h-4 text-wine border-gray-300 rounded focus:ring-wine"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Sí
                            </span>
                          </label>
                        </div>

                        {hubMesero && (
                          <div className="pt-3 border-t">
                            <label
                              htmlFor="mesero"
                              className="block text-xs lg:text-sm font-medium text-gray-700 mb-2"
                            >
                              Seleccionar mesero *
                            </label>
                            <SelectReact
                              id="mesero"
                              className="basic-single"
                              classNamePrefix="select"
                              placeholder="Selecciona un mesero..."
                              isSearchable={true}
                              name="meseros"
                              options={meserosOptions}
                              styles={{
                                control: (base: CSSObjectWithLabel) => ({
                                  ...base,
                                  borderColor: "#E49F35", // Tailwind 'wine' color (primary)
                                  boxShadow: "none",
                                  "&:hover": {
                                    borderColor: "#E49F35",
                                  },
                                }),
                                option: (
                                  base: CSSObjectWithLabel,
                                  state: {
                                    isSelected: boolean;
                                    isFocused: boolean;
                                  },
                                ) => ({
                                  ...base,
                                  backgroundColor: state.isSelected
                                    ? "#FDE8D1"
                                    : state.isFocused
                                      ? "#E49F35"
                                      : "white",
                                  color: state.isSelected
                                    ? "#E49F35"
                                    : state.isFocused
                                      ? "white"
                                      : "#333",
                                  "&:hover": {
                                    backgroundColor: "#FDE8D1",
                                    color: "#E49F35",
                                  },
                                }),
                              }}
                              value={
                                meseroSeleccionado
                                  ? {
                                    value: meseroSeleccionado.id,
                                    label: meseroSeleccionado.nombre_completo,
                                  }
                                  : null
                              }
                              onChange={(option) => {
                                const seleccionado = meseros.find(
                                  (m) => m.id === option?.value,
                                );
                                setMeseroSeleccionado(seleccionado || null);
                              }}
                            />

                            {meseroSeleccionado && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-green-800">
                                  ✓ Mesero:{" "}
                                  <span className="font-semibold">
                                    {meseroSeleccionado.nombre_completo}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 lg:space-y-3 p-3 lg:p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center text-xs lg:text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">
                        {formatCOP(calcularSubtotal())}
                      </span>
                    </div>

                    {costoAdicional > 0 && (
                      <div className="flex justify-between items-center text-xs lg:text-sm">
                        <span className="text-gray-600">Costo adicional</span>
                        <span className="font-semibold text-green-600">
                          +{formatCOP(costoAdicional)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="descuento"
                        className="text-xs lg:text-sm font-medium text-gray-600"
                      >
                        Descuento
                      </label>
                      <div className="relative w-28 lg:w-32">
                        <span className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs lg:text-sm">
                          $
                        </span>
                        <input
                          id="descuento"
                          type="number"
                          placeholder="0"
                          value={descuento || ""}
                          onChange={(e) =>
                            setDescuento(Number(e.target.value) || 0)
                          }
                          min="0"
                          max={calcularSubtotal()}
                          className="w-full pl-6 lg:pl-7 pr-2 lg:pr-3 py-1.5 lg:py-2 border border-gray-200 rounded-lg text-right text-xs lg:text-sm focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-black"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 lg:pt-3 border-t border-gray-200">
                      <span className="font-bold text-base lg:text-lg text-gray-900">
                        Total
                      </span>
                      <span className="font-bold text-xl lg:text-2xl text-wine">
                        {formatCOP(calcularTotal())}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onPress={avanzarAPago}
                    disabled={!validarOrden()}
                    className="w-full bg-wine text-white py-3 lg:py-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                  >
                    {validarOrden()
                      ? modoEdicion ? "Continuar a actualizar →" : "Continuar al pago →"
                      : "Completa la información"}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Pantalla de Pago y Facturación */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
              <div className="space-y-4">
                {/* Resumen de la orden */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3">
                    Resumen de la orden
                  </h3>
                  {/* Productos en el carrito */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Productos:
                    </h4>
                    <ul className="space-y-1">
                      {carrito.map((item) => (
                        <li key={item.id} className="grid grid-cols-4 text-sm">
                          <span className="col-span-2 text-gray-800">
                            {item.nombre}
                          </span>
                          <span className="col-span-1 text-right text-gray-500">
                            x{item.cantidad}
                          </span>
                          <span className="col-span-1 text-right font-semibold text-wine">
                            {formatCOP(Number(item.precio) * item.cantidad)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">
                        {formatCOP(calcularSubtotal())}
                      </span>
                    </div>
                    {descuento > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Descuento</span>
                        <span className="font-semibold">
                          -{formatCOP(descuento)}
                        </span>
                      </div>
                    )}
                    {costoAdicional > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Costo adicional</span>
                        <span className="font-semibold">
                          +{formatCOP(costoAdicional)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-bold text-base">
                      <span>Total a pagar</span>
                      <span className="text-wine">
                        {formatCOP(calcularTotal())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de pago */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3">
                    Información de pago
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="metodoPago"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Método de pago *
                      </label>
                      <select
                        id="metodoPago"
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-black bg-white"
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="NEQUI">Nequi</option>
                        <option value="DAVIPLATA">Daviplata</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="montoPagado"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Con cuánto paga el cliente *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          id="montoPagado"
                          type="number"
                          placeholder="0"
                          value={montoPagado || ""}
                          onChange={(e) =>
                            setMontoPagado(Number(e.target.value) || 0)
                          }
                          min={calcularTotal()}
                          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-lg font-semibold text-black"
                        />
                      </div>
                    </div>

                    {/* Cálculo de vueltas */}
                    {montoPagado > 0 && (
                      <div
                        className={`p-4 rounded-lg border-2 ${calcularVueltas() >= 0
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">
                            Devolver:
                          </span>
                          <span
                            className={`text-2xl font-bold ${calcularVueltas() >= 0
                              ? "text-green-600"
                              : "text-red-600"
                              }`}
                          >
                            {formatCOP(Math.abs(calcularVueltas()))}
                          </span>
                        </div>
                        {calcularVueltas() < 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            Falta {formatCOP(Math.abs(calcularVueltas()))} para
                            completar el pago
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Facturación */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Facturación</h3>
                    <label
                      htmlFor="requiereFactura"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        id="requiereFactura"
                        type="checkbox"
                        checked={requiereFactura}
                        onChange={(e) => setRequiereFactura(e.target.checked)}
                        className="w-4 h-4 text-wine border-gray-300 rounded focus:ring-wine"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Requiere factura
                      </span>
                    </label>
                  </div>

                  {requiereFactura && (
                    <div className="space-y-3 pt-3 border-t">
                      <div>
                        <label
                          htmlFor="cliente"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Cliente *
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <User
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                            <input
                              id="cliente"
                              type="text"
                              placeholder="Buscar cliente por nombre, identificación..."
                              value={busquedaCliente}
                              onChange={(e) => setBusquedaCliente(e.target.value)}
                              onFocus={() => {
                                if (clientesEncontrados.length > 0) {
                                  setMostrarDropdownClientes(true);
                                }
                              }}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-sm text-black"
                            />
                            {buscandoClientes && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Spinner size="sm" />
                              </div>
                            )}

                            {/* Dropdown de clientes */}
                            {mostrarDropdownClientes && clientesEncontrados.length > 0 && (
                              <div className="dropdown-clientes absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                {clientesEncontrados.map((cliente) => (
                                  <button
                                    key={cliente.id}
                                    type="button"
                                    onClick={() => seleccionarCliente(cliente)}
                                    className="w-full text-left p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {cliente.nombre} {cliente.apellido}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      {cliente.numero_identificacion && (
                                        <div>{cliente.tipo_identificacion}: {cliente.numero_identificacion}</div>
                                      )}
                                      {cliente.telefono && <div>Tel: {cliente.telefono}</div>}
                                      {cliente.correo && <div>Email: {cliente.correo}</div>}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Mensaje cuando no hay resultados */}
                            {mostrarDropdownClientes && busquedaCliente.length >= 2 && clientesEncontrados.length === 0 && !buscandoClientes && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
                                <div className="text-sm text-gray-600 text-center">
                                  No se encontraron clientes con ese criterio
                                </div>
                              </div>
                            )}
                          </div>
                          {clienteSeleccionado && (
                            <Button
                              isIconOnly
                              size="sm"
                              aria-label="Limpiar cliente seleccionado"
                              onPress={limpiarBusquedaCliente}
                              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-500 text-white rounded-lg transition-all hover:bg-gray-600"
                            >
                              <X size={16} />
                            </Button>
                          )}
                          <Button
                            isIconOnly
                            size="sm"
                            aria-label="Agregar nuevo cliente"
                            onPress={() => setModalCrearClienteAbierto(true)}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-wine text-white rounded-lg transition-all"
                          >
                            <Plus size={20} />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {clienteSeleccionado
                            ? "Cliente seleccionado. Usa la X para limpiar la selección."
                            : "Escribe para buscar clientes existentes o usa el + para crear uno nuevo"}
                        </p>
                      </div>

                      {clienteSeleccionado && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {clienteSeleccionado.nombre}
                              </p>
                              {clienteSeleccionado.numero_identificacion && (
                                <p className="text-sm text-gray-600">
                                  {clienteSeleccionado.tipo_identificacion}:{" "}
                                  {clienteSeleccionado.numero_identificacion}
                                </p>
                              )}
                              {clienteSeleccionado.telefono && (
                                <p className="text-sm text-gray-600">
                                  Tel: {clienteSeleccionado.telefono}
                                </p>
                              )}
                            </div>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label="Quitar cliente seleccionado"
                              onPress={() => setClienteSeleccionado(null)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer de pago */}
            <div className="border-t bg-white p-4 lg:p-6 flex-shrink-0">
              <button
                type="button"
                onClick={guardarOrden}
                disabled={
                  procesandoOrden ||
                  montoPagado < calcularTotal() ||
                  (requiereFactura && !clienteSeleccionado)
                }
                className="w-full bg-wine text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {procesandoOrden ? (
                  <>
                    <Spinner size="sm" color="white" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <ClipboardCheck size={20} />
                    <span>{modoEdicion ? "Actualizar orden" : "Confirmar orden"}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <ModalCrearCliente
        isOpen={modalCrearClienteAbierto}
        onClose={() => setModalCrearClienteAbierto(false)}
        onClienteCreado={cliente => {
          seleccionarCliente(cliente);
          setModalCrearClienteAbierto(false);
        }}
      />

      <ModalEntregarOrden
        ordenId={ordenCreadaId}
        isOpen={modalEntregarOrdenAbierto}
        onOpenChange={(open) => {
          if (!open) {
            onCerrarModalEntrega();
          }
        }}
        onOrdenEntregada={onOrdenEntregada}
      />
    </div>
  );
}
