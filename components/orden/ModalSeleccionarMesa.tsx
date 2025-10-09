import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import type { Mesa } from "@prisma/client";
import { Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

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
    <button
      onClick={onClick}
      disabled={isDisabled}
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
        <img
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
    </button>
  );
};

export default function ModalSeleccionarMesa({
  mesaSeleccionada,
  onSelectMesa,
}: ModalSeleccionarMesaProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [searchNumero, setSearchNumero] = useState("");
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [tempMesa, setTempMesa] = useState<Mesa | null>(null);

  useEffect(() => {
    const fetchMesas = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchNumero) params.append("numero", searchNumero);

        const response = await fetch(`/api/mesas?${params}`);
        const data = await response.json();

        if (data.success) {
          console.log(data);
          setMesas(data.mesas);
        }
      } catch (error) {
        console.error("Error al cargar mesas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchMesas();
    }
  }, [isOpen, searchNumero]);

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
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
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
    </>
  );
}
