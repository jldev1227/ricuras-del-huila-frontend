"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/react";
import Image from "next/image";
import type { ProductoConCategoria } from "@/types/producto";

interface ModalDetallesProductoProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: ProductoConCategoria | null;
  onEdit?: (producto: ProductoConCategoria) => void;
}

export default function ModalDetallesProducto({
  isOpen,
  onOpenChange,
  producto,
  onEdit,
}: ModalDetallesProductoProps) {
  if (!producto) return null;

  const ganancia = Number(producto.precio) - Number(producto.costo_produccion);
  const margen = ((ganancia / Number(producto.precio)) * 100).toFixed(1);

  const formatDate = (date?: string | Date | null) => {
    if (!date) return "Sin fecha disponible";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(dateObj.getTime())) return "Fecha inválida";
    return dateObj.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = () => {
    onOpenChange(false);
    if (onEdit) {
      onEdit(producto);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Detalles del Producto
            </ModalHeader>

            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda - Imagen */}
                <div className="space-y-4">
                  <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
                    {producto.imagen ? (
                      <Image
                        src={producto.imagen}
                        alt={producto.nombre}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-24 h-24"
                          aria-label="Sin imagen"
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

                    {/* Badges sobre la imagen */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {producto.destacado && (
                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                          ⭐ Destacado
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                          producto.disponible
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {producto.disponible ? "✓ Disponible" : "✗ Agotado"}
                      </span>
                    </div>
                  </div>

                  {/* Análisis financiero */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-3">
                      Análisis Financiero
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Ganancia por unidad:
                        </span>
                        <span className="font-bold text-green-700">
                          ${ganancia.toLocaleString("es-CO")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Margen de ganancia:
                        </span>
                        <span className="font-bold text-green-700">
                          {margen}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna derecha - Información */}
                <div className="space-y-4">
                  {/* Nombre y categoría */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {producto.nombre}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-lg">
                        {producto.categorias.icono}
                      </span>
                      <span className="text-sm font-medium">
                        {producto.categorias.nombre}
                      </span>
                    </div>
                  </div>

                  {/* Descripción */}
                  {producto.descripcion && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Descripción
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {producto.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Precios */}
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Precio de venta
                        </span>
                        <span className="text-2xl font-bold text-blue-700">
                          ${Number(producto.precio).toLocaleString("es-CO")}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Costo de producción
                        </span>
                        <span className="text-xl font-bold text-orange-700">
                          $
                          {Number(producto.costo_produccion).toLocaleString(
                            "es-CO",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Creado el:</span>
                      <span className="text-gray-800">
                        {formatDate(producto.creado_en)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Última actualización:
                      </span>
                      <span className="text-gray-800">
                        {formatDate(producto.actualizado_en)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ID del producto:</span>
                      <span className="text-gray-400 font-mono text-xs">
                        {producto.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cerrar
              </Button>
              {onEdit && (
                <Button color="primary" onPress={handleEdit}>
                  Editar Producto
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
