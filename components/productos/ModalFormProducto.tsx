"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import type { ProductoConCategoria } from "@/types/producto";

interface Categoria {
  id: string;
  nombre: string;
  icono: string | null;
}

// ✅ Tipo separado para el formulario
interface ProductoForm {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  costoProduccion: number;
  categoriaId: string; // ← String, no objeto
  imagen: string;
  disponible: boolean;
  destacado: boolean;
}

interface ModalFormProductoProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: ProductoConCategoria | null;
  onSuccess: () => void;
}

export default function ModalFormProducto({
  isOpen,
  onOpenChange,
  producto,
  onSuccess,
}: ModalFormProductoProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<ProductoForm>({
    nombre: "",
    descripcion: "",
    precio: 0,
    costoProduccion: 0,
    categoriaId: "",
    imagen: "",
    disponible: true,
    destacado: false,
  });

  const resetForm = useCallback(() => {
    setFormData({
      nombre: "",
      descripcion: "",
      precio: 0,
      costoProduccion: 0,
      categoriaId: "",
      imagen: "",
      disponible: true,
      destacado: false,
    });
    setError("");
  }, []);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch("/api/categorias");
        const data = await response.json();
        if (data.success) {
          setCategorias(data.categorias);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };

    fetchCategorias();
  }, []);

  useEffect(() => {
    if (producto) {
      setFormData({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion || "",
        precio: Number(producto.precio),
        costoProduccion: Number(producto.costoProduccion),
        categoriaId: producto.categoria.id, // ✅ Extraer el ID
        imagen: producto.imagen || "",
        disponible: producto.disponible,
        destacado: producto.destacado,
      });
    } else {
      resetForm();
    }
  }, [producto, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = producto?.id
        ? `/api/productos/${producto.id}`
        : "/api/productos";

      const method = producto?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar producto");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof ProductoForm,
    value: string | number | boolean | File | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              {producto?.id ? "Editar Producto" : "Nuevo Producto"}
            </ModalHeader>

            <ModalBody>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="nombreProducto"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombre del producto *
                  </label>
                  <input
                    id="nombreProducto"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ej: Lechona Completa"
                  />
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    value={formData.descripcion}
                    onChange={(e) =>
                      handleChange("descripcion", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Descripción del producto..."
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label
                    htmlFor="categoria"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Categoría *
                  </label>
                  <select
                    id="categoria"
                    value={formData.categoriaId}
                    onChange={(e) =>
                      handleChange("categoriaId", e.target.value)
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icono} {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Imagen */}
                <div>
                  <label
                    htmlFor="imagen"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Imagen (ruta)
                  </label>
                  <input
                    id="imagen"
                    type="text"
                    value={formData.imagen}
                    onChange={(e) => handleChange("imagen", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="/productos/lechona.jpg"
                  />
                </div>

                {/* Precio de venta */}
                <div>
                  <label
                    htmlFor="precioVenta"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Precio de venta *
                  </label>
                  <input
                    id="precioVenta"
                    type="number"
                    value={formData.precio}
                    onChange={(e) =>
                      handleChange("precio", parseFloat(e.target.value) || 0)
                    }
                    required
                    min="0"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="25000"
                  />
                </div>

                {/* Costo de producción */}
                <div>
                  <label
                    htmlFor="costoProduccion"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Costo de producción *
                  </label>
                  <input
                    id="costoProduccion"
                    type="number"
                    value={formData.costoProduccion}
                    onChange={(e) =>
                      handleChange(
                        "costoProduccion",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    required
                    min="0"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="12000"
                  />
                </div>

                {/* Disponible */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="disponible"
                    checked={formData.disponible}
                    onChange={(e) =>
                      handleChange("disponible", e.target.checked)
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label
                    htmlFor="disponible"
                    className="text-sm font-medium text-gray-700"
                  >
                    Producto disponible
                  </label>
                </div>

                {/* Destacado */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="destacado"
                    checked={formData.destacado}
                    onChange={(e) =>
                      handleChange("destacado", e.target.checked)
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label
                    htmlFor="destacado"
                    className="text-sm font-medium text-gray-700"
                  >
                    Producto destacado
                  </label>
                </div>
              </div>

              {/* Resumen de ganancia */}
              {formData.precio > 0 && formData.costoProduccion > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Análisis de ganancia
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">
                        Ganancia por unidad:
                      </span>
                      <p className="font-bold text-green-700">
                        $
                        {(
                          formData.precio - formData.costoProduccion
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Margen:</span>
                      <p className="font-bold text-green-700">
                        {(
                          ((formData.precio - formData.costoProduccion) /
                            formData.precio) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
              <Button color="primary" type="submit" isLoading={loading}>
                {producto?.id ? "Actualizar" : "Crear"} Producto
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
