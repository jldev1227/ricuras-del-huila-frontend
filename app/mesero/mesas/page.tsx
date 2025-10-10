"use client";

import { Button, Card, CardBody, Chip, Spinner } from "@heroui/react";
import { Users, CheckCircle, AlertCircle, Plus, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSucursal } from "@/hooks/useSucursal";

interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  disponible: boolean;
  activa: boolean;
  ordenActual?: {
    id: string;
    numeroOrden: string;
    estado: string;
    total: number;
    creadoEn: string;
    meseroId: string;
    mesero: {
      nombreCompleto: string;
    };
  };
}

export default function MeseroMesasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { sucursal } = useSucursal();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener mesas de la sucursal
  const fetchMesas = useCallback(async () => {
    try {
      if (!sucursal?.id) return;

      const response = await fetch(`/api/mesas?sucursalId=${sucursal.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setMesas(data.mesas || []);
      }
    } catch (error) {
      console.error("Error al cargar mesas:", error);
    } finally {
      setLoading(false);
    }
  }, [sucursal?.id]);

  useEffect(() => {
    fetchMesas();
  }, [fetchMesas]);  const _getEstadoMesa = (mesa: Mesa) => {
    if (!mesa.activa) return { text: "Inactiva", color: "default" };
    if (mesa.ordenActual) {
      if (mesa.ordenActual.meseroId === user?.id) {
        return { text: "Mi Mesa", color: "primary" };
      } else {
        return { text: "Ocupada", color: "danger" };
      }
    }
    return { text: "Disponible", color: "success" };
  };

  const getMisMesas = () => {
    return mesas.filter(
      (mesa) => mesa.ordenActual && mesa.ordenActual.meseroId === user?.id,
    );
  };

  const getMesasDisponibles = () => {
    return mesas.filter((mesa) => mesa.activa && !mesa.ordenActual);
  };

  const getMesasOcupadas = () => {
    return mesas.filter(
      (mesa) => mesa.ordenActual && mesa.ordenActual.meseroId !== user?.id,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const misMesas = getMisMesas();
  const mesasDisponibles = getMesasDisponibles();
  const mesasOcupadas = getMesasOcupadas();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Estado de Mesas
          </h1>
          <p className="text-gray-600">{sucursal?.nombre} - Vista del mesero</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Mis Mesas</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {misMesas.length}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Disponibles</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {mesasDisponibles.length}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Ocupadas</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {mesasOcupadas.length}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-600">{mesas.length}</p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Mis Mesas */}
      {misMesas.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Mis Mesas Activas ({misMesas.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {misMesas.map((mesa) => (
              <Card key={mesa.id} className="border-l-4 border-blue-500">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        Mesa {mesa.numero}
                      </h3>
                      <Chip size="sm" color="primary" variant="flat">
                        Mi Mesa
                      </Chip>
                    </div>
                    <div className="text-sm text-gray-500">
                      {mesa.capacidad} personas
                    </div>
                  </div>

                  {mesa.ordenActual && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Orden:</span>
                        <span className="font-medium">
                          #
                          {mesa.ordenActual.numeroOrden ||
                            mesa.ordenActual.id.slice(-6)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estado:</span>
                        <Chip
                          size="sm"
                          color={
                            mesa.ordenActual.estado === "PENDIENTE"
                              ? "warning"
                              : mesa.ordenActual.estado === "EN_PREPARACION"
                                ? "primary"
                                : mesa.ordenActual.estado === "LISTA"
                                  ? "success"
                                  : "default"
                          }
                          variant="flat"
                        >
                          {mesa.ordenActual.estado.replace("_", " ")}
                        </Chip>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Hora:</span>
                        <span className="text-sm">
                          {new Date(
                            mesa.ordenActual.creadoEn,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="pt-2">
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          fullWidth
                          startContent={<Eye className="w-4 h-4" />}
                          onClick={() =>
                            router.push(
                              `/pos/ordenes?orden=${mesa.ordenActual?.id}`,
                            )
                          }
                        >
                          Ver Orden
                        </Button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mesas Disponibles */}
      {mesasDisponibles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Mesas Disponibles ({mesasDisponibles.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {mesasDisponibles.map((mesa) => (
              <Card key={mesa.id} className="border-l-4 border-green-500">
                <CardBody className="p-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      Mesa {mesa.numero}
                    </h3>
                    <Chip size="sm" color="success" variant="flat">
                      Disponible
                    </Chip>
                    <p className="text-sm text-gray-500">
                      {mesa.capacidad} personas
                    </p>
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      fullWidth
                      startContent={<Plus className="w-4 h-4" />}
                      onClick={() => router.push(`/pos?mesa=${mesa.id}`)}
                    >
                      Tomar Mesa
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mesas Ocupadas por Otros */}
      {mesasOcupadas.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Mesas Ocupadas ({mesasOcupadas.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mesasOcupadas.map((mesa) => (
              <Card key={mesa.id} className="border-l-4 border-red-500">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        Mesa {mesa.numero}
                      </h3>
                      <Chip size="sm" color="danger" variant="flat">
                        Ocupada
                      </Chip>
                    </div>
                    <div className="text-sm text-gray-500">
                      {mesa.capacidad} personas
                    </div>
                  </div>

                  {mesa.ordenActual && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Mesero:</span>
                        <span className="text-sm font-medium">
                          {mesa.ordenActual.mesero.nombreCompleto}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estado:</span>
                        <Chip
                          size="sm"
                          color={
                            mesa.ordenActual.estado === "PENDIENTE"
                              ? "warning"
                              : mesa.ordenActual.estado === "EN_PREPARACION"
                                ? "primary"
                                : mesa.ordenActual.estado === "LISTA"
                                  ? "success"
                                  : "default"
                          }
                          variant="flat"
                        >
                          {mesa.ordenActual.estado.replace("_", " ")}
                        </Chip>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Hora:</span>
                        <span className="text-sm">
                          {new Date(
                            mesa.ordenActual.creadoEn,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {mesas.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay mesas configuradas
          </h3>
          <p className="text-gray-500">
            Contacta al administrador para configurar las mesas de esta
            sucursal.
          </p>
        </div>
      )}
    </div>
  );
}
