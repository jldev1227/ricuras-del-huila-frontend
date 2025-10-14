import { useState } from "react";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Textarea } from "@heroui/react";

interface ClienteForm {
  nombre: string;
  apellido?: string;
  telefono?: string;
  correo?: string;
  tipo_identificacion?: string;
  numero_identificacion?: string;
  digito_verificacion?: string;
  tipo_persona?: string;
  regimen_fiscal?: string;
  responsabilidad_fiscal?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  codigo_postal?: string;
  notas_especiales?: string;
  frecuente?: boolean;
}

interface ModalCrearClienteProps {
  isOpen: boolean;
  onClose: () => void;
  onClienteCreado: (cliente: {
    id: string;
    nombre: string;
    apellido?: string;
    telefono?: string;
    correo?: string;
    tipo_identificacion?: string;
    numero_identificacion?: string;
  }) => void;
}

const ModalCrearCliente = ({ isOpen, onClose, onClienteCreado }: ModalCrearClienteProps) => {
  const [form, setForm] = useState<ClienteForm>({ nombre: "" });
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  const validar = () => {
    const errs: { [key: string]: string } = {};
    
    // Validar nombre (requerido)
    if (!form.nombre || form.nombre.trim().length < 2) {
      errs.nombre = "El nombre es obligatorio y debe tener al menos 2 caracteres";
    }
    
    // Validar correo si se proporciona
    if (form.correo?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.correo)) {
        errs.correo = "El formato del correo electrónico no es válido";
      }
    }
    
    // Validar teléfono si se proporciona
    if (form.telefono?.trim()) {
      const telefonoRegex = /^[0-9+\-\s()]+$/;
      if (!telefonoRegex.test(form.telefono)) {
        errs.telefono = "El teléfono solo puede contener números, espacios y los símbolos +, -, ()";
      }
    }
    
    // Validar número de identificación si se proporciona
    if (form.numero_identificacion?.trim()) {
      if (form.numero_identificacion.trim().length < 6) {
        errs.numero_identificacion = "La identificación debe tener al menos 6 caracteres";
      }
    }
    
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) return;
    setGuardando(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear cliente");
      onClienteCreado(data.cliente);
      onClose();
      setForm({ nombre: "" });
      setErrores({});
    } catch (err) {
      setErrores({ general: err instanceof Error ? err.message : "Error desconocido" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="lg">
      <ModalContent>
        <ModalHeader>Nuevo Cliente</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Nombre *"
              placeholder="Ej: Juan Carlos"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              isRequired
              isInvalid={!!errores.nombre}
              errorMessage={errores.nombre}
              className="text-black"
            />
            <Input
              label="Apellido"
              placeholder="Ej: Pérez González"
              value={form.apellido || ""}
              onChange={e => setForm(f => ({ ...f, apellido: e.target.value || undefined }))}
              className="text-black"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                placeholder="Ej: +57 300 123 4567"
                value={form.telefono || ""}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value || undefined }))}
                isInvalid={!!errores.telefono}
                errorMessage={errores.telefono}
                className="text-black"
              />
              <Input
                label="Correo electrónico"
                placeholder="Ej: cliente@ejemplo.com"
                value={form.correo || ""}
                onChange={e => setForm(f => ({ ...f, correo: e.target.value || undefined }))}
                type="email"
                isInvalid={!!errores.correo}
                errorMessage={errores.correo}
                className="text-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de identificación"
                placeholder="Seleccionar tipo"
                selectedKeys={form.tipo_identificacion ? [form.tipo_identificacion] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setForm(f => ({ ...f, tipo_identificacion: value || undefined }));
                }}
              >
                <SelectItem key="CC">Cédula de Ciudadanía</SelectItem>
                <SelectItem key="CE">Cédula de Extranjería</SelectItem>
                <SelectItem key="NIT">NIT</SelectItem>
                <SelectItem key="TI">Tarjeta de Identidad</SelectItem>
                <SelectItem key="RC">Registro Civil</SelectItem>
                <SelectItem key="PA">Pasaporte</SelectItem>
              </Select>
              <Input
                label="Número de identificación"
                placeholder="Ej: 12345678"
                value={form.numero_identificacion || ""}
                onChange={e => setForm(f => ({ ...f, numero_identificacion: e.target.value || undefined }))}
                isInvalid={!!errores.numero_identificacion}
                errorMessage={errores.numero_identificacion}
                className="text-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de persona"
                placeholder="Seleccionar tipo"
                selectedKeys={form.tipo_persona ? [form.tipo_persona] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setForm(f => ({ ...f, tipo_persona: value || undefined }));
                }}
              >
                <SelectItem key="NATURAL">Persona Natural</SelectItem>
                <SelectItem key="JURIDICA">Persona Jurídica</SelectItem>
              </Select>
              <Input
                label="Dígito de verificación"
                placeholder="Ej: 9"
                value={form.digito_verificacion || ""}
                onChange={e => setForm(f => ({ ...f, digito_verificacion: e.target.value || undefined }))}
                maxLength={1}
                className="text-black"
              />
            </div>

            <Textarea
              label="Dirección"
              placeholder="Ej: Carrera 15 #23-45, Barrio Centro"
              value={form.direccion || ""}
              onChange={e => setForm(f => ({ ...f, direccion: e.target.value || undefined }))}
              minRows={2}
              maxRows={3}
              className="text-black"
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Ciudad"
                placeholder="Ej: Neiva"
                value={form.ciudad || ""}
                onChange={e => setForm(f => ({ ...f, ciudad: e.target.value || undefined }))}
                className="text-black"
              />
              <Input
                label="Departamento"
                placeholder="Ej: Huila"
                value={form.departamento || ""}
                onChange={e => setForm(f => ({ ...f, departamento: e.target.value || undefined }))}
                className="text-black"
              />
              <Input
                label="Código postal"
                placeholder="Ej: 410001"
                value={form.codigo_postal || ""}
                onChange={e => setForm(f => ({ ...f, codigo_postal: e.target.value || undefined }))}
                className="text-black"
              />
            </div>

            <Textarea
              label="Notas especiales"
              placeholder="Observaciones adicionales sobre el cliente..."
              value={form.notas_especiales || ""}
              onChange={e => setForm(f => ({ ...f, notas_especiales: e.target.value || undefined }))}
              minRows={2}
              maxRows={3}
              className="text-black"
            />

            {errores.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errores.general}</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancelar</Button>
          <Button color="primary" onPress={handleSubmit} isLoading={guardando}>Crear</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalCrearCliente;
