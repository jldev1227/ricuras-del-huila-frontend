"use client";

import { Button, Input, Select, SelectItem } from "@heroui/react";
import { useState, useEffect } from "react";
import { formatCOP } from "@/utils/formatCOP";
import type { ChangeEvent } from "react";
import Image from "next/image";

export interface PagoItem {
  id: string;
  metodo_pago: string;
  monto: number;
  referencia?: string;
  notas?: string;
}

interface GestionPagosProps {
  totalOrden: number;
  onPagosChange: (pagos: PagoItem[]) => void;
  pagosIniciales?: PagoItem[];
}

const METODOS_PAGO = [
  { 
    value: "EFECTIVO", 
    label: "Efectivo",
    icon: "/assets/metodos_pago/efectivo.svg"
  },
  { 
    value: "NEQUI", 
    label: "Nequi",
    icon: "/assets/metodos_pago/nequi.svg"
  },
  { 
    value: "DAVIPLATA", 
    label: "Daviplata",
    icon: "/assets/metodos_pago/daviplata.svg"
  },
];

export default function GestionPagos({ 
  totalOrden, 
  onPagosChange,
  pagosIniciales = []
}: GestionPagosProps) {
  const [pagos, setPagos] = useState<PagoItem[]>(pagosIniciales);

  // Inicializar con un pago si no hay pagos iniciales
  useEffect(() => {
    if (pagosIniciales.length === 0 && pagos.length === 0) {
      const pagoInicial: PagoItem = {
        id: crypto.randomUUID(),
        metodo_pago: "EFECTIVO",
        monto: totalOrden,
        referencia: "",
        notas: "",
      };
      setPagos([pagoInicial]);
      onPagosChange([pagoInicial]);
    }
  }, []);

  // Notificar cambios al padre
  useEffect(() => {
    onPagosChange(pagos);
  }, [pagos, onPagosChange]);

  const agregarPago = () => {
    if (pagos.length >= 3) {
      return; // Máximo 3 pagos
    }

    const restante = calcularRestante();
    const nuevoPago: PagoItem = {
      id: crypto.randomUUID(),
      metodo_pago: "EFECTIVO",
      monto: restante > 0 ? restante : 0,
      referencia: "",
      notas: "",
    };
    setPagos([...pagos, nuevoPago]);
  };

  const eliminarPago = (id: string) => {
    if (pagos.length === 1) {
      return; // Debe haber al menos un pago
    }
    setPagos(pagos.filter(p => p.id !== id));
  };

  const actualizarPago = (id: string, campo: keyof PagoItem, valor: string | number) => {
    setPagos(pagos.map(pago => 
      pago.id === id ? { ...pago, [campo]: valor } : pago
    ));
  };

  const calcularTotalPagado = () => {
    return pagos.reduce((sum, pago) => sum + Number(pago.monto || 0), 0);
  };

  const calcularRestante = () => {
    return totalOrden - calcularTotalPagado();
  };

  const calcularVueltas = () => {
    return calcularTotalPagado() - totalOrden;
  };

  const totalPagado = calcularTotalPagado();
  const restante = calcularRestante();
  const vueltas = calcularVueltas();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">💳 Métodos de Pago</h3>
        <Button
          size="sm"
          color="primary"
          variant="flat"
          onPress={agregarPago}
          isDisabled={pagos.length >= 3}
        >
          + Agregar Pago
        </Button>
      </div>

      {/* Lista de Pagos */}
      <div className="space-y-3">
        {pagos.map((pago, index) => (
          <div key={pago.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Pago #{index + 1}
              </span>
              {pagos.length > 1 && (
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => eliminarPago(pago.id)}
                >
                  🗑️ Eliminar
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Método de Pago */}
              <Select
                label="Método"
                labelPlacement="outside"
                placeholder="Selecciona método"
                selectedKeys={[pago.metodo_pago]}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => actualizarPago(pago.id, "metodo_pago", e.target.value)}
                classNames={{
                  label: "text-xs font-medium",
                }}
                renderValue={(items) => {
                  return items.map((item) => {
                    const metodo = METODOS_PAGO.find(m => m.value === item.key);
                    return (
                      <div key={item.key} className="flex items-center gap-2">
                        {metodo && (
                          <Image 
                            src={metodo.icon} 
                            alt={metodo.label}
                            width={16}
                            height={16}
                            className="w-4 h-4"
                          />
                        )}
                        <span>{item.textValue}</span>
                      </div>
                    );
                  });
                }}
              >
                {METODOS_PAGO.map((metodo) => (
                  <SelectItem 
                    key={metodo.value}
                    textValue={metodo.label}
                    startContent={
                      <Image 
                        src={metodo.icon} 
                        alt={metodo.label}
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span>{metodo.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              {/* Monto */}
              <Input
                type="number"
                label="Monto"
                labelPlacement="outside"
                placeholder="0"
                value={pago.monto?.toString() || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => actualizarPago(pago.id, "monto", Number(e.target.value))}
                startContent={
                  <span className="text-default-400 text-small">$</span>
                }
                classNames={{
                  label: "text-xs font-medium",
                }}
              />
            </div>

            {/* Referencia (opcional) */}
            {pago.metodo_pago !== "EFECTIVO" && (
                <div className="flex">
                    <Input
                      type="text"
                      label="Referencia / No. Transacción"
                      labelPlacement="outside"
                      placeholder="Ej: 123456789"
                      value={pago.referencia || ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => actualizarPago(pago.id, "referencia", e.target.value)}
                      classNames={{
                        label: "text-xs font-medium",
                      }}
                    />
                </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Orden:</span>
          <span className="font-semibold">{formatCOP(totalOrden)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Pagado:</span>
          <span className={`font-semibold ${totalPagado >= totalOrden ? 'text-green-600' : 'text-orange-600'}`}>
            {formatCOP(totalPagado)}
          </span>
        </div>
        {restante > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-orange-600 font-medium">Falta por pagar:</span>
            <span className="font-bold text-orange-600">{formatCOP(restante)}</span>
          </div>
        )}
        {vueltas > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-blue-600 font-medium">Vueltas:</span>
            <span className="font-bold text-blue-600">{formatCOP(vueltas)}</span>
          </div>
        )}
      </div>

      {/* Validación */}
      {restante > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            ⚠️ El monto total pagado debe cubrir el total de la orden
          </p>
        </div>
      )}

      {pagos.length === 3 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ℹ️ Máximo 3 métodos de pago alcanzado
          </p>
        </div>
      )}
    </div>
  );
}
