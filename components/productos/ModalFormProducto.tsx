"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/react";
import { Upload, X } from "lucide-react";
import Image from "next/image";
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
  costo_produccion: number;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState<ProductoForm>({
    nombre: "",
    descripcion: "",
    precio: 0,
    costo_produccion: 0,
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
      costo_produccion: 0,
      categoriaId: "",
      imagen: "",
      disponible: true,
      destacado: false,
    });
    setError("");
    setImageFile(null);
    setImagePreview(null);
  }, []);

  // Función para manejar la selección de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP");
        return;
      }

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("El archivo es demasiado grande. Máximo 5MB");
        return;
      }

      setImageFile(file);
      setError("");

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para subir imagen
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/productos/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Error al subir imagen");
    }

    return data.imagePath;
  };

  // Función para eliminar imagen
  const deleteImage = async (imagePath: string) => {
    try {
      await fetch(
        `/api/productos/upload-image?path=${encodeURIComponent(imagePath)}`,
        {
          method: "DELETE",
        },
      );
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
    }
  };

  // Función para limpiar imagen seleccionada
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imagen: "" }));
  };

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
        costo_produccion: Number(producto.costo_produccion),
        categoriaId: producto.categorias.id, // ✅ Extraer el ID
        imagen: producto.imagen || "",
        disponible: producto.disponible,
        destacado: producto.destacado,
      });

      // Si el producto tiene imagen, establecer preview
      if (producto.imagen) {
        setImagePreview(producto.imagen);
      } else {
        setImagePreview(null);
      }
      setImageFile(null);
    } else {
      resetForm();
    }
  }, [producto, resetForm]);

  const handleSubmit = async () => {
    setError("");

    // Validaciones de campos requeridos
    const nombreValido = formData.nombre.trim().length > 0;
    const categoriaValida = formData.categoriaId.trim().length > 0;
    const precioValido =
      typeof formData.precio === "number" && formData.precio > 0;
    const costoValido =
      typeof formData.costo_produccion === "number" &&
      formData.costo_produccion > 0;

    if (!nombreValido) {
      setError("El nombre del producto es obligatorio.");
      return;
    }
    if (!categoriaValida) {
      setError("La categoría es obligatoria.");
      return;
    }
    if (!precioValido) {
      setError("El precio de venta debe ser mayor a 0.");
      return;
    }
    if (!costoValido) {
      setError("El costo de producción debe ser mayor a 0.");
      return;
    }

    setLoading(true);

    try {
      const finalFormData = { ...formData };

      // Si hay una nueva imagen seleccionada, subirla primero
      if (imageFile) {
        setUploadingImage(true);
        try {
          const imagePath = await uploadImage(imageFile);

          // Si estamos editando y tenía imagen anterior, eliminarla
          if (producto?.imagen && producto.imagen !== imagePath) {
            await deleteImage(producto.imagen);
          }

          finalFormData.imagen = imagePath;
        } catch (imageError) {
          throw new Error(
            `Error al subir imagen: ${imageError instanceof Error ? imageError.message : "Error desconocido"}`,
          );
        } finally {
          setUploadingImage(false);
        }
      }

      const url = producto?.id
        ? `/api/productos/${producto.id}`
        : "/api/productos";

      const method = producto?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalFormData),
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
              {producto?.id ? "Editar Producto" : "Nuevo Producto"}
            </ModalHeader>

            <ModalBody>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
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
                  <div className="md:col-span-2">
                    <label
                      htmlFor="imagen"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Imagen del producto
                    </label>

                    {/* Preview de imagen */}
                    {imagePreview && (
                      <div className="mb-4 relative inline-block">
                        <Image
                          id="imagen"
                          src={imagePreview}
                          alt="Preview"
                          width={200}
                          height={150}
                          className="rounded-lg object-cover border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Input de archivo */}
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="imageUpload"
                      />
                      <label
                        htmlFor="imageUpload"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {imagePreview ? "Cambiar imagen" : "Subir imagen"}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG o WebP. Máximo 5MB.
                      </p>
                    </div>
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
                      htmlFor="costo_produccion"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Costo de producción *
                    </label>
                    <input
                      id="costo_produccion"
                      type="number"
                      value={formData.costo_produccion}
                      onChange={(e) =>
                        handleChange(
                          "costo_produccion",
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
                {formData.precio > 0 && formData.costo_produccion > 0 && (
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
                            formData.precio - formData.costo_produccion
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Margen:</span>
                        <p className="font-bold text-green-700">
                          {(
                            ((formData.precio - formData.costo_produccion) /
                              formData.precio) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                isDisabled={loading || uploadingImage}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={loading || uploadingImage}
                isDisabled={loading || uploadingImage}
              >
                {uploadingImage
                  ? "Subiendo imagen..."
                  : loading
                    ? "Guardando..."
                    : `${producto?.id ? "Actualizar" : "Crear"} Producto`}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
