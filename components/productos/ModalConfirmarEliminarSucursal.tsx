"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/react";
import { AlertTriangle, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";

interface Sucursal {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  ciudad?: string;
}

interface ModalConfirmarEliminarSucursalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sucursal?: Sucursal | null;
  onSuccess?: () => void;
}

export default function ModalConfirmarEliminarSucursal({
  isOpen,
  onOpenChange,
  sucursal,
  onSuccess,
}: ModalConfirmarEliminarSucursalProps) {
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

  if (!sucursal) return null;

  const handleDelete = async () => {
    if (!sucursal?.id) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/sucursales/${sucursal.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success || response.ok) {
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error("Error al eliminar sucursal:", data.message);

        if (data.error === "CONSTRAINT_VIOLATION") {
          setErrorMessage(data.message);
        } else {
          setErrorMessage(
            data.message || "Error desconocido al eliminar la sucursal"
          );
        }
      }
    } catch (error) {
      console.error("Error al eliminar sucursal:", error);
      setErrorMessage("Error de conexión al eliminar la sucursal");
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
              <span>Confirmar eliminación de sucursal</span>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ¿Estás seguro de que quieres eliminar esta sucursal? Esta acción no se puede deshacer.
                </p>

                {/* Información de la sucursal */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {sucursal.nombre}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ID: {sucursal.id}
                      </p>
                    </div>

                    {sucursal.ciudad && (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Ciudad</p>
                          <p className="text-gray-600">{sucursal.ciudad}</p>
                        </div>
                      </div>
                    )}

                    {sucursal.direccion && (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Dirección</p>
                          <p className="text-gray-600">{sucursal.direccion}</p>
                        </div>
                      </div>
                    )}

                    {sucursal.telefono && (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Phone size={16} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Teléfono</p>
                          <p className="text-gray-600">{sucursal.telefono}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mensaje de error */}
                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-semibold text-red-800 mb-2">
                          No se puede eliminar la sucursal
                        </h4>
                        <p className="text-sm text-red-700 leading-relaxed">
                          {errorMessage}
                        </p>
                        <div className="mt-3 p-3 bg-red-100 rounded-lg">
                          <p className="text-xs text-red-600">
                            <strong>Sugerencia:</strong> Verifique que no haya órdenes o registros asociados a esta sucursal antes de intentar eliminarla.
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
                  {isDeleting ? "Eliminando..." : "Eliminar sucursal"}
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