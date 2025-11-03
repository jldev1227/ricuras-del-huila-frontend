"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/react";
import { useState } from "react";
import { useAuthenticatedFetch } from "@/lib/api-client";

interface Producto {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  unidad_medida: string;
  disponible: boolean;
  controlar_stock: boolean;
}

interface ModalMovimientoStockProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  producto: Producto | null;
  onSuccess: () => void;
}

interface FormData {
  tipo_movimiento: "entrada" | "salida" | "ajuste";
  cantidad: number;
  motivo: string;
  referencia: string;
}

export default function ModalMovimientoStock({
  isOpen,
  onOpenChange,
  producto,
  onSuccess,
}: ModalMovimientoStockProps) {
  const authenticatedFetch = useAuthenticatedFetch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState<FormData>({
    tipo_movimiento: "entrada",
    cantidad: 0,
    motivo: "",
    referencia: "",
  });

  const resetForm = () => {
    setFormData({
      tipo_movimiento: "entrada",
      cantidad: 0,
      motivo: "",
      referencia: "",
    });
    setError("");
  };

  const handleSubmit = async () => {
    if (!producto) return;

    setError("");

    // Validaciones
    if (formData.cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (formData.tipo_movimiento === "salida" && formData.cantidad > producto.stock_actual) {
      setError(`No hay suficiente stock. Stock actual: ${producto.stock_actual}`);
      return;
    }

    if (!formData.motivo.trim()) {
      setError("El motivo es obligatorio");
      return;
    }

    setLoading(true);

    try {
      const response = await authenticatedFetch("/api/movimientos-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: producto.id,
          tipo_movimiento: formData.tipo_movimiento,
          cantidad: formData.cantidad,
          motivo: formData.motivo,
          referencia: formData.referencia || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear movimiento");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error("Error al crear movimiento:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const calcularNuevoStock = () => {
    if (!producto) return 0;
    
    const { stock_actual } = producto;
    const { tipo_movimiento, cantidad } = formData;

    if (tipo_movimiento === "entrada") {
      return stock_actual + cantidad;
    } else if (tipo_movimiento === "salida") {
      return Math.max(0, stock_actual - cantidad);
    } else if (tipo_movimiento === "ajuste") {
      return cantidad;
    }
    
    return stock_actual;
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!producto) return null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3>Movimiento de Stock</h3>
              <p className="text-sm text-gray-600">
                {producto.nombre} - Stock actual: {producto.stock_actual} {producto.unidad_medida}
              </p>
            </ModalHeader>

            <ModalBody>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Tipo de movimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de movimiento *
                  </label>
                  <select
                    value={formData.tipo_movimiento}
                    onChange={(e) => handleChange("tipo_movimiento", e.target.value as "entrada" | "salida" | "ajuste")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="entrada">Entrada (Aumentar stock)</option>
                    <option value="salida">Salida (Reducir stock)</option>
                    <option value="ajuste">Ajuste (Establecer cantidad exacta)</option>
                  </select>
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.tipo_movimiento === "ajuste" ? "Nuevo stock total *" : "Cantidad *"}
                  </label>
                  <input
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => handleChange("cantidad", parseInt(e.target.value) || 0)}
                    min="0"
                    max={formData.tipo_movimiento === "salida" ? producto.stock_actual : undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={formData.tipo_movimiento === "ajuste" ? "Stock total deseado" : "Cantidad de unidades"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unidad: {producto.unidad_medida}
                  </p>
                </div>

                {/* Preview del resultado */}
                {formData.cantidad > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">Resultado del movimiento:</h4>
                    <p className="text-sm text-blue-800">
                      Stock actual: <span className="font-bold">{producto.stock_actual}</span> → 
                      Nuevo stock: <span className="font-bold">{calcularNuevoStock()}</span>
                    </p>
                    {formData.tipo_movimiento === "salida" && formData.cantidad > producto.stock_actual && (
                      <p className="text-sm text-red-600 mt-1">
                        ⚠️ Cantidad mayor al stock disponible
                      </p>
                    )}
                  </div>
                )}

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo del movimiento *
                  </label>
                  <select
                    value={formData.motivo}
                    onChange={(e) => handleChange("motivo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-2"
                  >
                    <option value="">Seleccionar motivo...</option>
                    {formData.tipo_movimiento === "entrada" && (
                      <>
                        <option value="Compra de mercancía">Compra de mercancía</option>
                        <option value="Devolución de cliente">Devolución de cliente</option>
                        <option value="Corrección de inventario">Corrección de inventario</option>
                        <option value="Producción interna">Producción interna</option>
                        <option value="Otro">Otro</option>
                      </>
                    )}
                    {formData.tipo_movimiento === "salida" && (
                      <>
                        <option value="Venta realizada">Venta realizada</option>
                        <option value="Producto dañado">Producto dañado</option>
                        <option value="Producto vencido">Producto vencido</option>
                        <option value="Merma operacional">Merma operacional</option>
                        <option value="Otro">Otro</option>
                      </>
                    )}
                    {formData.tipo_movimiento === "ajuste" && (
                      <>
                        <option value="Inventario físico">Inventario físico</option>
                        <option value="Corrección de error">Corrección de error</option>
                        <option value="Ajuste por diferencia">Ajuste por diferencia</option>
                        <option value="Otro">Otro</option>
                      </>
                    )}
                  </select>
                  
                  {formData.motivo === "Otro" && (
                    <textarea
                      placeholder="Describir el motivo específico..."
                      onChange={(e) => handleChange("motivo", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={2}
                    />
                  )}
                </div>

                {/* Referencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.referencia}
                    onChange={(e) => handleChange("referencia", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ej: Factura #123, Orden #456"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Documento o referencia que respalda este movimiento
                  </p>
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                isDisabled={loading}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={loading}
                isDisabled={loading}
              >
                {loading ? "Creando..." : "Crear Movimiento"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}