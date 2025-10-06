import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Spinner,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { formatCOP } from '@/utils/formatCOP';
import { MapPin, User, X, Phone, Home, Receipt } from 'lucide-react';
import { Orden } from "@prisma/client";

interface ModalDetalleOrdenProps {
  ordenId: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ModalDetalleOrden({ ordenId, isOpen, onOpenChange }: ModalDetalleOrdenProps) {
  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ordenId) {
      console.log("as")
      fetchOrdenDetalle();
    }
  }, [isOpen, ordenId]);

  const fetchOrdenDetalle = async () => {
    if (!ordenId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/ordenes/${ordenId}`);
      const data = await response.json();


      if (data.success) {
        setOrden(data.orden);
      }
    } catch (error) {
      console.error('Error al cargar detalle de orden:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, any> = {
      PENDIENTE: 'warning',
      EN_PREPARACION: 'primary',
      LISTA: 'success',
      ENTREGADA: 'default',
      CANCELADA: 'danger',
    };
    return colores[estado] || 'default';
  };

  const getTipoOrdenIcon = (tipo: string) => {
    const iconos: Record<string, string> = {
      LOCAL: '🍽️',
      LLEVAR: '🥡',
      DOMICILIO: '🚚',
    };
    return iconos[tipo] || '📋';
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      scrollBehavior="inside"
      hideCloseButton
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b">
              {loading ? (
                <div className="flex items-center gap-3">
                  <Spinner size="sm" />
                  <span>Cargando orden...</span>
                </div>
              ) : !orden ? (
                <h2 className="text-lg font-semibold text-gray-900">Orden no existente</h2>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Orden #{orden.id.slice(0, 8).toUpperCase()}
                    </h2>
                    <p className="text-sm text-gray-500 font-normal mt-1">
                      {formatearFecha(orden.creadoEn)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip
                      color={getEstadoColor(orden.estado)}
                      size="lg"
                      variant="flat"
                      className="font-semibold"
                    >
                      {orden.estado.replace('_', ' ')}
                    </Chip>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
            </ModalHeader>

            <ModalBody className="py-6">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Spinner size="lg" />
                </div>
              ) : !orden ? (
                <div className="text-center py-20">
                  <p className="text-gray-500">No se pudo cargar la orden</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Información general */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getTipoOrdenIcon(orden.tipoOrden)}</div>
                        <div>
                          <p className="text-sm text-gray-600">Tipo de orden</p>
                          <p className="font-semibold text-gray-900">{orden.tipoOrden}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-wine/10 rounded-full flex items-center justify-center">
                          <User className="text-wine" size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Atendido por</p>
                          <p className="font-semibold text-gray-900">{orden.mesero.nombreCompleto}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mesa (LOCAL) */}
                  {orden.tipoOrden === 'LOCAL' && orden.mesa && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <MapPin className="text-blue-600 mt-0.5" size={20} />
                        <div>
                          <p className="font-semibold text-blue-900">Mesa {orden.mesa.numero}</p>
                          <p className="text-sm text-blue-700">{orden.mesa.ubicacion}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Domicilio */}
                  {orden.tipoOrden === 'DOMICILIO' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
                      <div className="flex items-start gap-3">
                        <Home className="text-green-600 mt-0.5" size={20} />
                        <div className="flex-1">
                          <p className="font-semibold text-green-900">Dirección de entrega</p>
                          <p className="text-sm text-green-700">{orden.direccionEntrega}</p>
                        </div>
                      </div>
                      {(orden.nombreCliente || orden.telefonoCliente) && (
                        <div className="flex items-center gap-3 pl-8">
                          <Phone className="text-green-600" size={16} />
                          <div>
                            {orden.nombreCliente && (
                              <p className="text-sm text-green-900">{orden.nombreCliente}</p>
                            )}
                            {orden.telefonoCliente && (
                              <p className="text-sm text-green-700">{orden.telefonoCliente}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cliente */}
                  {orden.cliente && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Receipt className="text-purple-600 mt-0.5" size={20} />
                        <div>
                          <p className="font-semibold text-purple-900">Cliente registrado</p>
                          <p className="text-sm text-purple-700">{orden.cliente.nombre}</p>
                          {orden.cliente.numeroIdentificacion && (
                            <p className="text-xs text-purple-600">
                              {orden.cliente.tipoIdentificacion}: {orden.cliente.numeroIdentificacion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">
                      Productos ({orden.items.length})
                    </h3>
                    <div className="space-y-3">
                      {orden.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                        >
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.producto.imagen ? (
                              <img
                                src={item.producto.imagen}
                                alt={item.producto.nombre}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl">
                                🍽️
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {item.producto.nombre}
                            </h4>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Precio: </span>
                                <span className="font-semibold text-gray-900">
                                  {formatCOP(item.precioUnitario)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Cantidad: </span>
                                <span className="font-semibold text-gray-900">x{item.cantidad}</span>
                              </div>
                            </div>
                            {item.notas && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-xs text-yellow-800">
                                  <span className="font-semibold">Nota:</span> {item.notas}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-wine text-lg">
                              {formatCOP(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Especificaciones */}
                  {orden.especificaciones && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="font-semibold text-amber-900 mb-2">Especificaciones:</p>
                      <p className="text-sm text-amber-800">{orden.especificaciones}</p>
                    </div>
                  )}

                  {/* Notas */}
                  {orden.notas && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="font-semibold text-gray-900 mb-2">Notas:</p>
                      <p className="text-sm text-gray-700">{orden.notas}</p>
                    </div>
                  )}

                  {/* Totales */}
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-900 mb-4">Resumen de pago</h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-900">
                          {formatCOP(orden.subtotal)}
                        </span>
                      </div>

                      {orden.descuento > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Descuento</span>
                          <span className="font-semibold">-{formatCOP(orden.descuento)}</span>
                        </div>
                      )}

                      {orden.costoEnvio && orden.costoEnvio > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Costo de envío</span>
                          <span className="font-semibold">+{formatCOP(orden.costoEnvio)}</span>
                        </div>
                      )}

                      {orden.costoAdicional && orden.costoAdicional > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Costo adicional</span>
                          <span className="font-semibold">+{formatCOP(orden.costoAdicional)}</span>
                        </div>
                      )}

                      <div className="flex justify-between pt-3 border-t border-gray-300">
                        <span className="font-bold text-lg text-gray-900">Total</span>
                        <span className="font-bold text-2xl text-wine">
                          {formatCOP(orden.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="border-t">
              <Button color="danger" variant="light" onPress={onClose}>
                Cerrar
              </Button>
              <Button color="primary" className="bg-wine">
                Imprimir orden
              </Button>
            </ModalFooter>
          </>
        )
        }
      </ModalContent >
    </Modal >
  );
}