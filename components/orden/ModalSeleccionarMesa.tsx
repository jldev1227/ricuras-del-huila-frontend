import {
  Button,
  Card,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Spinner,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
  Checkbox,
} from "@heroui/react";
import { Plus, Search, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// Interfaces
interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  disponible: boolean;
  sucursal_id: string;
  ubicacion?: string | null;
  notas?: string | null;
  ultima_limpieza?: Date | null;
  creado_en: Date;
  actualizado_en: Date;
}

interface Sucursal {
  id: string;
  nombre: string;
}

// Interface para formulario de mesa
interface FormMesa {
  numero: number;
  capacidad: number;
  disponible: boolean;
  ubicacion: string;
  notas: string;
  sucursal_id: string;
}

interface ModalSeleccionarMesaProps {
  mesaSeleccionada: string | null;
  onSelectMesa: (mesa: Mesa) => void;
}

interface MesaIlustracionProps {
  numero: number;
  estado: boolean;
  onClick: (mesa: Mesa) => void;
  isSelected: boolean;
}

// Componente de mesa con imagen
const MesaIlustracion = ({
  numero,
  estado,
  onClick,
  isSelected,
}: MesaIlustracionProps) => {
  const isDisabled = !estado;

  return (
    <Card
      isPressable
      onPress={() => {
        if (!isDisabled) {
          onClick({
            id: "",
            numero,
            capacidad: 0,
            disponible: estado,
            sucursal_id: "",
            ubicacion: null,
            notas: null,
            ultima_limpieza: null,
            creado_en: new Date(),
            actualizado_en: new Date(),
          });
        }
      }}
      className={`
                relative rounded-2xl border-1 bg-[#f2f2f2] p-2 py-5
                ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}
            `}
    >
      {isDisabled && (
        <div className="absolute border-wine border-1 inset-0 w-full h-full bg-wine/20 rounded-2xl"></div>
      )}

      {isSelected && (
        <div className="absolute border-success border-1 inset-0 w-full h-full bg-success/20 rounded-2xl"></div>
      )}

      <div className="flex flex-col items-center justify-center">
        {/* Imagen de la mesa */}
        <Image
          width={112}
          height={112}
          src="/mesa.png"
          alt={`Mesa ${numero}`}
          className="w-28 h-28 object-contain"
        />

        {/* Overlay con información superpuesta */}
        <div className="absolute bottom-1 flex flex-col items-center justify-center">
          {/* Número de mesa */}
          <div className="bg-white/95 rounded-lg px-3 py-1.5 shadow-md mb-1">
            <span className="text-xl font-bold text-gray-800">{numero}</span>
          </div>
        </div>

        {/* Badge de estado (solo si está ocupada) */}
        {!estado ? (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
            Ocupada
          </div>
        ) : (
          !isSelected && (
            <div className="absolute top-0 right-0 bg-default-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
              Disponible
            </div>
          )
        )}
      </div>
    </Card>
  );
};

export default function ModalSeleccionarMesa({
  onSelectMesa,
}: ModalSeleccionarMesaProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isNewMesaOpen,
    onOpen: onNewMesaOpen,
    onClose: onNewMesaClose,
  } = useDisclosure();
  
  const [loading, setLoading] = useState(true);
  const [searchNumero, setSearchNumero] = useState("");
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [tempMesa, setTempMesa] = useState<Mesa | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Estados para el formulario de nueva mesa
  const [formData, setFormData] = useState<FormMesa>({
    numero: 0,
    capacidad: 4,
    disponible: true,
    ubicacion: "",
    notas: "",
    sucursal_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormMesa>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar sucursales
        const sucursalesRes = await fetch("/api/sucursales");
        const sucursalesData = await sucursalesRes.json();
        if (sucursalesData.success) {
          setSucursales(sucursalesData.sucursales);
          // Establecer sucursal por defecto si no hay una seleccionada
          if (sucursalesData.sucursales.length > 0 && !formData.sucursal_id) {
            setFormData(prev => ({ 
              ...prev, 
              sucursal_id: sucursalesData.sucursales[0].id 
            }));
          }
        }

        // Cargar mesas
        const params = new URLSearchParams();
        if (searchNumero) params.append("numero", searchNumero);

        const response = await fetch(`/api/mesas?${params}`);
        const data = await response.json();

        if (data.success) {
          console.log(data);
          setMesas(data.mesas);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, searchNumero, formData.sucursal_id]);

  const onSelectTemp = (mesa: Mesa) => {
    if (mesa) {
      setTempMesa(mesa);
    }
  };

  const handleConfirmar = (onClose: () => void) => {
    if (tempMesa) {
      onSelectMesa(tempMesa);
      onClose();
    }
  };

  // Funciones para el formulario de nueva mesa
  const resetForm = () => {
    setFormData({
      numero: 0,
      capacidad: 4,
      disponible: true,
      ubicacion: "",
      notas: "",
      sucursal_id: sucursales.length > 0 ? sucursales[0].id : "",
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormMesa> = {};

    if (!formData.numero || formData.numero <= 0) {
      newErrors.numero = 1; // Usar number como mock de error
    }

    if (!formData.capacidad || formData.capacidad <= 0) {
      newErrors.capacidad = 1;
    }

    if (!formData.sucursal_id) {
      newErrors.sucursal_id = "";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitNewMesa = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/mesas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Recargar mesas para mostrar la nueva mesa
        const mesasRes = await fetch(`/api/mesas`);
        const mesasData = await mesasRes.json();
        if (mesasData.success) {
          setMesas(mesasData.mesas);
        }

        // Cerrar modal de nueva mesa y resetear formulario
        onNewMesaClose();
        resetForm();

        // Auto-seleccionar la mesa recién creada
        if (data.mesa) {
          setTempMesa(data.mesa);
        }
      } else {
        console.error("Error al crear mesa:", data.message);
        alert(`Error al crear mesa: ${data.message}`);
      }
    } catch (error) {
      console.error("Error al crear mesa:", error);
      alert("Error al crear mesa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewMesa = () => {
    resetForm();
    onNewMesaOpen();
  };

  return (
    <>
      <Button fullWidth color="primary" onPress={onOpen}>
        📍 Escoger mesa
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        scrollBehavior="inside"
        hideCloseButton
        classNames={{
          base: "bg-gray-50",
          header: "border-b border-gray-200",
          body: "py-6",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Selecciona una mesa
                </h2>
                <Button isIconOnly size="sm" variant="light" onPress={onClose}>
                  <X className="w-5 h-5 text-gray-400" />
                </Button>
              </ModalHeader>

              <ModalBody>
                {/* Search y botón agregar */}
                <div className="flex gap-3 mb-6">
                  <Input
                    placeholder="Busca # de mesa"
                    value={searchNumero}
                    onValueChange={setSearchNumero}
                    startContent={<Search className="w-4 h-4 text-gray-400" />}
                    classNames={{
                      base: "flex-1",
                      input: "text-sm",
                    }}
                  />
                  <Button
                    isIconOnly
                    color="warning"
                    variant="flat"
                    className="bg-amber-100"
                    onPress={handleNewMesa}
                    title="Crear nueva mesa"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>

                {/* Loading State */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : mesas.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {mesas.map((mesa) => (
                      <MesaIlustracion
                        key={mesa.id}
                        numero={mesa.numero}
                        estado={mesa.disponible}
                        onClick={() => onSelectTemp(mesa)}
                        isSelected={tempMesa?.id === mesa.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No se encontraron mesas</p>
                  </div>
                )}

                {/* Botón de confirmar flotante */}
                {tempMesa && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <Button
                      color="primary"
                      size="lg"
                      className="shadow-xl"
                      onPress={() => handleConfirmar(onClose)}
                    >
                      Confirmar Mesa #{tempMesa.numero}
                    </Button>
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Nueva Mesa */}
      <Modal
        isOpen={isNewMesaOpen}
        onClose={onNewMesaClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <>
            <ModalHeader>
              <h3 className="text-xl font-semibold text-gray-900">
                Nueva Mesa
              </h3>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Número de Mesa"
                  type="number"
                  min={1}
                  value={formData.numero.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      numero: parseInt(value, 10) || 0,
                    }))
                  }
                  isInvalid={!!errors.numero}
                  errorMessage={errors.numero ? "Número de mesa requerido" : ""}
                  isRequired
                />

                <Input
                  label="Capacidad"
                  type="number"
                  value={formData.capacidad.toString()}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      capacidad: parseInt(e.target.value) || 0,
                    }))
                  }
                  isInvalid={!!errors.capacidad}
                  errorMessage={
                    errors.capacidad
                      ? "Capacidad requerida y debe ser mayor a 0"
                      : ""
                  }
                  isRequired
                />
              </div>

              <Select
                label="Sucursal"
                selectedKeys={formData.sucursal_id ? [formData.sucursal_id] : []}
                onSelectionChange={(keys) => {
                  const sucursalId = Array.from(keys)[0] as string;
                  setFormData((prev) => ({
                    ...prev,
                    sucursal_id: sucursalId,
                  }));
                }}
                isInvalid={!!errors.sucursal_id}
                placeholder="Selecciona una sucursal"
                errorMessage={
                  errors.sucursal_id !== undefined ? "Sucursal requerida" : ""
                }
                isRequired
              >
                {sucursales.map((sucursal) => (
                  <SelectItem key={sucursal.id}>{sucursal.nombre}</SelectItem>
                ))}
              </Select>

              <Input
                label="Ubicación"
                value={formData.ubicacion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ubicacion: e.target.value,
                  }))
                }
                placeholder="Ej: Terraza, Salón principal, etc."
              />

              <Textarea
                label="Notas"
                value={formData.notas}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notas: e.target.value }))
                }
                placeholder="Notas adicionales sobre la mesa..."
                minRows={3}
              />

              <Checkbox
                isSelected={formData.disponible}
                onValueChange={(checked) =>
                  setFormData((prev) => ({ ...prev, disponible: checked }))
                }
              >
                Mesa disponible
              </Checkbox>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={onNewMesaClose}
                isDisabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={handleSubmitNewMesa}
                isLoading={isSubmitting}
                className="bg-wine"
              >
                Crear Mesa
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
}
