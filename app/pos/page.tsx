"use client"

import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, X, ClipboardCheck, ArrowLeft, Plus, User } from 'lucide-react';
import { addToast, Button, Spinner } from '@heroui/react';
import { formatCOP } from '@/utils/formatCOP';
import ModalSeleccionarMesa from '@/components/orden/ModalSeleccionarMesa';
import { Categoria, Mesa, Producto } from '@prisma/client';
import SelectReact, { CSSObjectWithLabel } from 'react-select';
import { useSucursal } from '@/hooks/useSucursal';

interface Carrito extends Producto {
  cantidad: number;
}

type PasoOrden = 'carrito' | 'pago';

export default function OrderDashboard() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [carrito, setCarrito] = useState<Carrito[]>([]);
  const [tipoOrden, setTipoOrden] = useState('llevar');
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarAside, setMostrarAside] = useState(false);
  const [especificaciones, setEspecificaciones] = useState('');
  const [descuento, setDescuento] = useState<number>(0);
  const [costoAdicional, setCostoAdicional] = useState<number>(0);
  const [direccionEntrega, setDireccionEntrega] = useState('');

  // Estados para el paso de pago
  const [pasoActual, setPasoActual] = useState<PasoOrden>('carrito');
  const [montoPagado, setMontoPagado] = useState<number>(0);
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [procesandoOrden, setProcesandoOrden] = useState(false);

  // Obtener la sucursal
  const {sucursal} = useSucursal();

  // Meseros y hub
  const [hubMesero, setHubMesero] = useState(false);
  const [meseroSeleccionado, setMeseroSeleccionado] = useState<any>(null);
  const [meseros, setMeseros] = useState<any[]>([]);

  // Fetch meseros disponibles
  useEffect(() => {
    const fetchMeseros = async () => {
      try {
        const response = await fetch('/api/usuarios?rol=MESERO&activo=true');
        console.log(response)
        const data = await response.json();
        if (data.success) {
          setMeseros(data.usuarios);
        }
      } catch (error) {
        console.error('Error al cargar meseros:', error);
      }
    };

    if (hubMesero) {
      fetchMeseros();
    }
  }, [hubMesero]);

  // Fetch categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('/api/categorias');
        const data = await response.json();
        if (data.success) {
          setCategorias(data.categorias);
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };
    fetchCategorias();
  }, []);

  // Fetch productos
  const fetchProductos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('nombre', searchTerm);
      if (categoriaSeleccionada) params.append('categoriaId', categoriaSeleccionada);

      const response = await fetch(`/api/productos?${params}`);
      const data = await response.json();

      if (data.success) {
        setProductos(data.productos);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [searchTerm, categoriaSeleccionada]);

  const productosFiltrados = productos.filter((producto) => {
    const matchSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaSeleccionada ? producto.categoriaId === categoriaSeleccionada : true;
    return matchSearch && matchCategoria && producto.disponible;
  });

  // Funciones del carrito
  const agregarAlCarrito = (producto: Producto) => {
    const existente = carrito.find(item => item.id === producto.id);
    if (existente) {
      setCarrito(carrito.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    setMostrarAside(true);
  };

  const incrementarCantidad = (id: string) => {
    setCarrito(carrito.map(item =>
      item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item
    ));
  };

  const decrementarCantidad = (id: string) => {
    setCarrito(prevCarrito => {
      return prevCarrito
        .map(item =>
          item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item
        )
        .filter(item => item.cantidad > 0);
    });
  };

  const eliminarDelCarrito = (productoId: string) => {
    setCarrito(carrito.filter(item => item.id !== productoId));
  };

  const calcularSubtotal = () => {
    return carrito.reduce((total, item) => total + (Number(item.precio) * item.cantidad), 0);
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
      case 'llevar':
        return '🥡 El cliente recogerá el pedido para llevar';
      case 'domicilio':
        return '🚚 El pedido será entregado a domicilio';
      case 'local':
        return '🍽️ Pedido para consumir en el local';
      default:
        return '❓ Tipo de orden no especificado';
    }
  };

  const validarOrden = () => {
    if (carrito.length === 0) return false;
    if (tipoOrden === 'local' && !mesaSeleccionada) return false;
    if (tipoOrden === 'domicilio' && !direccionEntrega.trim()) return false;
    if (hubMesero && !meseroSeleccionado) return false; // Nueva validación
    return true;
  };

  const avanzarAPago = () => {
    if (!validarOrden()) return;
    setPasoActual('pago');
    setMontoPagado(calcularTotal()); // Pre-llenar con el total exacto
  };

  const volverAlCarrito = () => {
    setPasoActual('carrito');
  };

  const crearOrden = async () => {
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
        mesaId: tipoOrden === 'local' ? mesaSeleccionada?.id : null,
        clienteId: clienteSeleccionado?.id || null,
        meseroId: hubMesero ? meseroSeleccionado?.id : null, // Cambiar aquí
        direccionEntrega: tipoOrden === 'domicilio' ? direccionEntrega : null,
        costoAdicional: costoAdicional || null,
        items: carrito.map(item => ({
          productoId: item.id,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
        })),
        subtotal: calcularSubtotal(),
        descuento,
        total: calcularTotal(),
        especificaciones,
        notas: `Pago: ${formatCOP(montoPagado)} | Vueltas: ${formatCOP(calcularVueltas())}`,
      };

      console.log('Orden a crear:', orden);

      // TODO: Descomentar cuando el endpoint esté listo
      const response = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orden),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      console.log(data)

      addToast({
        title: "Orden creada exitosamente",
        description: `Total: ${formatCOP(calcularTotal())} | Vueltas: ${formatCOP(calcularVueltas())}`,
        color: "success",
      });

      // Resetear todo
      resetearOrden();
    } catch (error: any) {
      console.log(error)
      addToast({
        title: "Error al crear orden",
        description: error.message || "Ocurrió un error inesperado",
        color: "danger",
      });
    } finally {
      setProcesandoOrden(false);
    }
  };

  const resetearOrden = () => {
    setCarrito([]);
    setEspecificaciones('');
    setDescuento(0);
    setCostoAdicional(0);
    setDireccionEntrega('');
    setMesaSeleccionada(null);
    setMostrarAside(false);
    setPasoActual('carrito');
    setMontoPagado(0);
    setRequiereFactura(false);
    setClienteSeleccionado(null);
  };

  const onSelectMesa = (mesa: Mesa | null) => {
    setMesaSeleccionada(mesa);
  };

  const meserosOptions = meseros.map(mesero => ({
    value: mesero.id,
    label: mesero.nombreCompleto
  }));

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Overlay para mobile */}
      {mostrarAside && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMostrarAside(false)}
        />
      )}

      {/* Panel Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header con búsqueda y categorías */}
        <div className="bg-white border-b shadow-sm flex-shrink-0">
          <div className="px-4 lg:px-6 py-3 lg:py-4">
            <div className="relative mb-3 lg:mb-4">
              <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar comida..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 lg:pl-12 pr-10 lg:pr-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine transition-all text-sm lg:text-base"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 lg:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex gap-2 lg:gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setCategoriaSeleccionada('')}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm lg:text-base ${!categoriaSeleccionada ? 'bg-wine text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Todos
              </button>
              {categorias.map(categoria => (
                <button
                  key={categoria.id}
                  onClick={() => setCategoriaSeleccionada(categoria.id === categoriaSeleccionada ? '' : categoria.id)}
                  className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm lg:text-base ${categoriaSeleccionada === categoria.id ? 'bg-wine text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Menú disponible</h2>
                <p className="text-xs lg:text-sm text-gray-500 mt-1">
                  {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
                </p>
              </div>

              {carrito.length > 0 && (
                <button
                  onClick={() => setMostrarAside(true)}
                  className="flex items-center gap-2 bg-wine text-white px-3 lg:px-4 py-2 rounded-lg shadow-lg hover:bg-wine/90 transition-all"
                >
                  <ShoppingBag size={18} />
                  <span className="font-semibold">{carrito.length}</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spinner size="lg" color="primary" />
                <p className="mt-4 text-gray-500 text-sm">Cargando productos...</p>
              </div>
            ) : productosFiltrados.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-5">
                {productosFiltrados.map(producto => (
                  <div
                    key={producto.id}
                    onClick={() => agregarAlCarrito(producto)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-100 hover:border-wine/20"
                  >
                    <div className="relative bg-gray-100 aspect-square overflow-hidden">
                      <img
                        src={producto.imagen || '/placeholder-food.jpg'}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {producto.categoriaId && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-white/95 backdrop-blur-sm px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                            {categorias.find(c => c.id === producto.categoriaId)?.nombre}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 w-8 h-8 lg:w-11 lg:h-11 bg-wine rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl scale-90 group-hover:scale-100">
                        <span className="text-white text-lg lg:text-2xl font-bold">+</span>
                      </div>
                    </div>
                    <div className="p-3 lg:p-4">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-wine transition-colors text-sm lg:text-base">
                        {producto.nombre}
                      </h3>
                      <p className="text-base lg:text-xl font-bold text-wine">
                        {formatCOP(Number(producto.precio))}
                      </p>
                    </div>
                  </div>
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
        className={`fixed inset-y-0 right-0 w-full sm:w-96 lg:w-[30rem] bg-white border-l shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${mostrarAside ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b bg-gradient-to-r from-wine to-wine/90 flex-shrink-0">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="flex items-center gap-2 lg:gap-3">
              {pasoActual === 'pago' && (
                <button
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
                  {pasoActual === 'carrito' ? 'Nueva orden' : 'Pago y facturación'}
                </h2>
                <p className="text-xs text-white/80">
                  {pasoActual === 'carrito' ? `${carrito.length} productos` : 'Finalizar orden'}
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

          {pasoActual === 'carrito' && (
            <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
              {[
                { value: 'llevar', label: 'Llevar' },
                { value: 'domicilio', label: 'Domicilio' },
                { value: 'local', label: 'Local' }
              ].map(tipo => (
                <button
                  key={tipo.value}
                  onClick={() => setTipoOrden(tipo.value)}
                  className={`py-2 lg:py-2.5 px-2 lg:px-3 rounded-lg font-medium text-xs lg:text-sm transition-all ${tipoOrden === tipo.value
                    ? 'bg-white text-wine shadow-lg scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contenido según paso */}
        {pasoActual === 'carrito' ? (
          <>
            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
              {carrito.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingBag size={48} className="mb-4 opacity-30" />
                  <p className="text-base lg:text-lg font-medium">Carrito vacío</p>
                  <p className="text-xs lg:text-sm">Agrega productos para empezar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrito.map(item => (
                    <div key={item.id} className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-100">
                      <div className="flex gap-3">
                        <img
                          src={item.imagen || '/placeholder-food.jpg'}
                          alt={item.nombre}
                          className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 truncate text-sm lg:text-base">
                            {item.nombre}
                          </h4>
                          <p className="text-xs lg:text-sm text-gray-500 mb-2">
                            {formatCOP(Number(item.precio))} c/u
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 lg:gap-2 bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => decrementarCantidad(item.id)}
                                className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-white rounded-md hover:bg-gray-50 transition-colors text-sm"
                              >
                                -
                              </button>
                              <span className="w-6 lg:w-8 text-center font-semibold text-xs lg:text-sm">
                                {item.cantidad}
                              </span>
                              <button
                                onClick={() => incrementarCantidad(item.id)}
                                className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center bg-wine text-white rounded-md hover:bg-wine/90 transition-colors text-sm"
                              >
                                +
                              </button>
                            </div>
                            <p className="font-bold text-wine text-sm lg:text-base">
                              {formatCOP(Number(item.precio) * item.cantidad)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => eliminarDelCarrito(item.id)}
                          className="flex-shrink-0 w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4">
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                      Notas de la orden
                    </label>
                    <textarea
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

                  {tipoOrden === 'llevar' && (
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                        Costo adicional
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={costoAdicional || ''}
                          onChange={(e) => setCostoAdicional(Number(e.target.value) || 0)}
                          min="0"
                          className="w-full pl-7 lg:pl-8 pr-3 lg:pr-4 py-2.5 lg:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {tipoOrden === 'domicilio' && (
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                        Dirección de entrega *
                      </label>
                      <input
                        type="text"
                        placeholder="Dirección completa..."
                        value={direccionEntrega}
                        onChange={(e) => setDireccionEntrega(e.target.value)}
                        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  )}

                  {tipoOrden === 'local' && (
                    <div className='space-y-3'>
                      {!mesaSeleccionada ? (
                        <ModalSeleccionarMesa
                          mesaSeleccionada={mesaSeleccionada}
                          onSelectMesa={onSelectMesa}
                        />
                      ) : (
                        <div className="flex items-center justify-between p-3 lg:p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 lg:gap-3">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                              <span className="text-white font-bold text-base lg:text-lg">
                                {mesaSeleccionada.numero}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm lg:text-base">Mesa {mesaSeleccionada.numero}</p>
                              <p className="text-xs lg:text-sm text-gray-600">📍 {mesaSeleccionada.ubicacion || 'Principal'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setMesaSeleccionada(null)}
                            className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}

                      {/* Selector de mesero */}
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 text-sm">¿Un mesero atendió este pedido?</h3>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
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
                            <span className="text-sm font-medium text-gray-700">Sí</span>
                          </label>
                        </div>

                        {hubMesero && (
                          <div className="pt-3 border-t">
                            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                              Seleccionar mesero *
                            </label>
                            <SelectReact
                              className="basic-single"
                              classNamePrefix="select"
                              placeholder='Selecciona un mesero...'
                              isSearchable={true}
                              name="meseros"
                              options={meserosOptions}
                              styles={{
                                control: (base: CSSObjectWithLabel) => ({
                                  ...base,
                                  borderColor: '#E49F35', // Tailwind 'wine' color (primary)
                                  boxShadow: 'none',
                                  '&:hover': {
                                    borderColor: '#E49F35',
                                  },
                                }),
                                option: (base: CSSObjectWithLabel, state: any) => ({
                                  ...base,
                                  backgroundColor: state.isSelected ? '#FDE8D1' : state.isFocused ? '#E49F35' : 'white',
                                  color: state.isSelected ? '#E49F35' : state.isFocused ? 'white' : '#333',
                                  '&:hover': {
                                    backgroundColor: '#FDE8D1',
                                    color: '#E49F35',
                                  },
                                }),
                              }}
                              value={meseroSeleccionado ? { value: meseroSeleccionado.id, label: meseroSeleccionado.nombreCompleto } : null}
                              onChange={(option) => {
                                const seleccionado = meseros.find(m => m.id === option?.value);
                                setMeseroSeleccionado(seleccionado || null);
                              }}
                            />

                            {meseroSeleccionado && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-green-800">
                                  ✓ Mesero: <span className="font-semibold">{meseroSeleccionado.nombreCompleto}</span>
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
                      <span className="font-semibold">{formatCOP(calcularSubtotal())}</span>
                    </div>

                    {costoAdicional > 0 && (
                      <div className="flex justify-between items-center text-xs lg:text-sm">
                        <span className="text-gray-600">Costo adicional</span>
                        <span className="font-semibold text-green-600">+{formatCOP(costoAdicional)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <label className="text-xs lg:text-sm font-medium text-gray-600">Descuento</label>
                      <div className="relative w-28 lg:w-32">
                        <span className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs lg:text-sm">$</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={descuento || ''}
                          onChange={(e) => setDescuento(Number(e.target.value) || 0)}
                          min="0"
                          max={calcularSubtotal()}
                          className="w-full pl-6 lg:pl-7 pr-2 lg:pr-3 py-1.5 lg:py-2 border border-gray-200 rounded-lg text-right text-xs lg:text-sm focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 lg:pt-3 border-t border-gray-200">
                      <span className="font-bold text-base lg:text-lg text-gray-900">Total</span>
                      <span className="font-bold text-xl lg:text-2xl text-wine">
                        {formatCOP(calcularTotal())}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={avanzarAPago}
                    disabled={!validarOrden()}
                    className="w-full bg-wine text-white py-3 lg:py-4 rounded-xl font-semibold hover:bg-wine/90 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm lg:text-base"
                  >
                    {validarOrden() ? 'Continuar al pago →' : 'Completa la información'}
                  </button>
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
                  <h3 className="font-bold text-gray-900 mb-3">Resumen de la orden</h3>
                  {/* Productos en el carrito */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Productos:</h4>
                    <ul className="space-y-1">
                      {carrito.map(item => (
                        <li key={item.id} className="grid grid-cols-4 text-sm">
                          <span className="col-span-2 text-gray-800">{item.nombre}</span>
                          <span className="col-span-1 text-right text-gray-500">x{item.cantidad}</span>
                          <span className="col-span-1 text-right font-semibold text-wine">{formatCOP(Number(item.precio) * item.cantidad)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatCOP(calcularSubtotal())}</span>
                    </div>
                    {descuento > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Descuento</span>
                        <span className="font-semibold">-{formatCOP(descuento)}</span>
                      </div>
                    )}
                    {costoAdicional > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Costo adicional</span>
                        <span className="font-semibold">+{formatCOP(costoAdicional)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-bold text-base">
                      <span>Total a pagar</span>
                      <span className="text-wine">{formatCOP(calcularTotal())}</span>
                    </div>
                  </div>
                </div>

                {/* Información de pago */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3">Información de pago</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Con cuánto paga el cliente *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={montoPagado || ''}
                          onChange={(e) => setMontoPagado(Number(e.target.value) || 0)}
                          min={calcularTotal()}
                          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-lg font-semibold"
                        />
                      </div>
                    </div>

                    {/* Cálculo de vueltas */}
                    {montoPagado > 0 && (
                      <div className={`p-4 rounded-lg border-2 ${calcularVueltas() >= 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Devolver:</span>
                          <span className={`text-2xl font-bold ${calcularVueltas() >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {formatCOP(Math.abs(calcularVueltas()))}
                          </span>
                        </div>
                        {calcularVueltas() < 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            Falta {formatCOP(Math.abs(calcularVueltas()))} para completar el pago
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
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiereFactura}
                        onChange={(e) => setRequiereFactura(e.target.checked)}
                        className="w-4 h-4 text-wine border-gray-300 rounded focus:ring-wine"
                      />
                      <span className="text-sm font-medium text-gray-700">Requiere factura</span>
                    </label>
                  </div>

                  {requiereFactura && (
                    <div className="space-y-3 pt-3 border-t">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cliente *
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="text"
                              placeholder="Buscar o seleccionar cliente..."
                              value={clienteSeleccionado?.nombre || ''}
                              readOnly
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wine/20 focus:border-wine outline-none transition-all text-sm"
                            />
                          </div>
                          <button
                            onClick={() => console.log('Abrir modal de agregar cliente')}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-wine text-white rounded-lg hover:bg-wine/90 transition-all"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Haz clic en el botón + para agregar un nuevo cliente
                        </p>
                      </div>

                      {clienteSeleccionado && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{clienteSeleccionado.nombre}</p>
                              {clienteSeleccionado.numeroIdentificacion && (
                                <p className="text-sm text-gray-600">
                                  {clienteSeleccionado.tipoIdentificacion}: {clienteSeleccionado.numeroIdentificacion}
                                </p>
                              )}
                              {clienteSeleccionado.telefono && (
                                <p className="text-sm text-gray-600">Tel: {clienteSeleccionado.telefono}</p>
                              )}
                            </div>
                            <button
                              onClick={() => setClienteSeleccionado(null)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X size={16} />
                            </button>
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
                onClick={crearOrden}
                disabled={procesandoOrden || montoPagado < calcularTotal() || (requiereFactura && !clienteSeleccionado)}
                className="w-full bg-wine text-white py-4 rounded-xl font-semibold hover:bg-wine/90 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {procesandoOrden ? (
                  <>
                    <Spinner size="sm" color="white" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <ClipboardCheck size={20} />
                    <span>Confirmar orden</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}