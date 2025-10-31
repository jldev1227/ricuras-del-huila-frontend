import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";

interface ModalConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function ModalConfirm({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmColor = "danger",
  isLoading = false,
  icon,
}: ModalConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            {icon || (
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
            )}
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          </div>
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-600">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            color={confirmColor}
            onPress={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
