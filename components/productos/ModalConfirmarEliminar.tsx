"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getProductImageUrl } from "@/lib/supabase";
import type { ProductoConCategoria } from "@/types/producto";

interface ModalConfirmarEliminarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: ProductoConCategoria | null;
  onSuccess?: () => void;
}

export default function ModalConfirmarEliminar({
  isOpen,
  onOpenChange,
  producto,
  onSuccess,
}: ModalConfirmarEliminarProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Limpiar errores cuando se abra o cierre el modal
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Función para cerrar el modal y limpiar estados
  const handleClose = () => {
    setErrorMessage(null);
    setIsDeleting(false);
    onOpenChange(false);
  };

  if (!producto) return null;

  const handleDelete = async () => {
    if (!producto?.id) return;
    
    setIsDeleting(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/productos/${producto.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error("Error al eliminar producto:", data.message);
        
        // Manejar diferentes tipos de errores
        if (data.error === "CONSTRAINT_VIOLATION") {
          setErrorMessage(data.message);
        } else {
          setErrorMessage(data.message || "Error desconocido al eliminar el producto");
        }
      }
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      setErrorMessage("Error de conexión al eliminar el producto");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      isDismissable={!isDeleting}
      hideCloseButton={isDeleting}
    >
      <ModalContent>
        {(_onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24} />
              <span>Confirmar eliminación</span>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.
                </p>

                {/* Información del producto */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex gap-4">
                    {/* Imagen del producto */}
                    <div className="flex-shrink-0">
                      <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        {producto.imagen ? (
                          <Image
                            src={getProductImageUrl(producto.imagen)}
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
                              className="w-8 h-8"
                              aria-label="Imagen no disponible"
                              role="img"
                            >
                              <title>Imagen no disponible</title>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {producto.nombre}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {producto.categorias.icono} {producto.categorias.nombre}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Precio: <strong>${Number(producto.precio).toLocaleString("es-CO")}</strong>
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            producto.disponible
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {producto.disponible ? "Disponible" : "Agotado"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advertencia sobre la imagen */}
                {producto.imagen && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                      <div className="text-sm text-yellow-800">
                        <strong>Atención:</strong> La imagen asociada a este producto también será eliminada de Supabase Storage.
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje de error */}
                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-semibold text-red-800 mb-2">
                          No se puede eliminar el producto
                        </h4>
                        <p className="text-sm text-red-700 leading-relaxed">
                          {errorMessage}
                        </p>
                        <div className="mt-3 p-3 bg-red-100 rounded-lg">
                          <p className="text-xs text-red-600">
                            <strong>Sugerencia:</strong> Vaya a la sección de órdenes y elimine todas las órdenes que incluyen este producto antes de intentar eliminarlo nuevamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={handleClose}
                isDisabled={isDeleting}
              >
                {errorMessage ? "Cerrar" : "Cancelar"}
              </Button>
              {!errorMessage && (
                <Button
                  color="danger"
                  onPress={handleDelete}
                  isLoading={isDeleting}
                >
                  {isDeleting ? "Eliminando..." : "Eliminar producto"}
                </Button>
              )}
              {errorMessage && (
                <Button
                  color="primary"
                  onPress={() => setErrorMessage(null)}
                  variant="flat"
                  className="text-primary"
                >
                  Reintentar
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}