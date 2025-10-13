"use client";

import {
  Calendar,
  ChevronDown,
  DollarSign,
  Download,
  Filter,
  Loader2,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";

const COLORS = {
  primary: "#E49F35",
  wine: "#841339",
  secondary: "#967D69",
  accent: "#F4B9B2",
};

const CHART_COLORS = ["#E49F35", "#841339", "#967D69"];

interface TransformedOrder {
  id: string;
  fecha: Date;
  sucursal: string;
  sucursalId: string;
  mesero: string;
  tipoOrden: string;
  mesa: string | null;
  mesaNumero?: number;
  estado: string;
  total: number;
  descuento: number;
  itemsCount: number;
  cliente?: string;
}

export default function ReportsPage() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("mes-actual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [specificDate, setSpecificDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, _setSelectedYear] = useState("2025");
  const [selectedWeek, _setSelectedWeek] = useState("1");
  const [compareStartDate1, setCompareStartDate1] = useState("");
  const [compareEndDate1, setCompareEndDate1] = useState("");
  const [compareStartDate2, setCompareStartDate2] = useState("");
  const [compareEndDate2, setCompareEndDate2] = useState("");
  const [compareMonth1, setCompareMonth1] = useState("");
  const [compareMonth2, setCompareMonth2] = useState("");
  const [selectedSucursal, setSelectedSucursal] = useState("todas");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Define a type for the transformed order with 'fecha'
        type TransformedOrder = {
          id: string;
          fecha: Date;
          sucursal: string;
          sucursalId: string;
          mesero: string;
          tipoOrden: string;
          mesa: string | null;
          mesaNumero?: number;
          estado: string;
          total: number;
          descuento: number;
          itemsCount: number;
          cliente?: string;
        };

        let allFetchedOrders: TransformedOrder[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch(`/api/ordenes?page=${page}&limit=100`);
          const data = await response.json();

          if (data.success && data.ordenes.length > 0) {
            type OrdenWithRelations = {
              id: string;
              creadoEn: string;
              sucursalId: string;
              tipoOrden: string;
              estado: string;
              total: number;
              descuento?: number;
              sucursal?: { id: string; nombre: string };
              mesero?: { id: string; nombre_completo: string };
              mesa?: { id: string; numero: number };
              cliente?: { id: string; nombre: string };
              _count?: { items: number };
            };

            const transformedOrders: TransformedOrder[] = data.ordenes.map(
              (orden: OrdenWithRelations) => ({
                id: orden.id,
                fecha: new Date(orden.creadoEn),
                sucursal: orden.sucursal?.nombre || "Sin sucursal",
                sucursalId: orden.sucursal?.id || orden.sucursalId,
                mesero: orden.mesero?.nombre_completo || "Sin mesero",
                tipoOrden: orden.tipoOrden,
                mesa: orden.mesa ? `Mesa ${orden.mesa.numero}` : null,
                mesaNumero: orden.mesa?.numero,
                estado: orden.estado,
                total: Number(orden.total),
                descuento: Number(orden.descuento ?? 0),
                itemsCount: orden._count?.items ?? 0,
                cliente: orden.cliente?.nombre,
              }),
            );

            allFetchedOrders = [...allFetchedOrders, ...transformedOrders];

            if (data.pagination.page >= data.pagination.totalPages) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        setAllOrders(allFetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const sucursales = useMemo(() => {
    const uniqueSucursales = [
      "todas",
      ...new Set(allOrders.map((o) => o.sucursal).filter(Boolean)),
    ];
    return uniqueSucursales;
  }, [allOrders]);

  const filteredOrders = useMemo(() => {
    let filtered = allOrders.filter((order) => order.estado === "ENTREGADA");

    if (selectedSucursal !== "todas") {
      filtered = filtered.filter(
        (o) => (o.sucursal ?? o.sucursalId) === selectedSucursal,
      );
    }

    const now = new Date();

    switch (filterType) {
      case "dia-especifico":
        if (specificDate) {
          const targetDate = new Date(specificDate);
          filtered = filtered.filter(
            (o) => o.fecha.toDateString() === targetDate.toDateString(),
          );
        }
        break;

      case "rango-fechas":
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filtered = filtered.filter((o) => o.fecha >= start && o.fecha <= end);
        }
        break;

      case "semana-especifica": {
        const weekNum = parseInt(selectedWeek, 10);
        const monthForWeek = now.getMonth();
        const yearForWeek = parseInt(selectedYear, 10);
        filtered = filtered.filter((o) => {
          if (
            o.fecha.getMonth() !== monthForWeek ||
            o.fecha.getFullYear() !== yearForWeek
          )
            return false;
          const dayOfMonth = o.fecha.getDate();
          const weekStart = (weekNum - 1) * 7 + 1;
          const weekEnd = weekNum * 7;
          return dayOfMonth >= weekStart && dayOfMonth <= weekEnd;
        });
        break;
      }

      case "mes-actual":
        filtered = filtered.filter(
          (o) =>
            o.fecha.getMonth() === now.getMonth() &&
            o.fecha.getFullYear() === now.getFullYear(),
        );
        break;

      case "hace-un-mes": {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        );
        filtered = filtered.filter(
          (o) => o.fecha >= lastMonth && o.fecha <= lastMonthEnd,
        );
        break;
      }

      case "mes-especifico":
        if (selectedMonth) {
          const [year, month] = selectedMonth.split("-");
          filtered = filtered.filter(
            (o) =>
              o.fecha.getMonth() === parseInt(month, 10) - 1 &&
              o.fecha.getFullYear() === parseInt(year, 10),
          );
        }
        break;

      case "año-especifico":
        if (selectedYear) {
          filtered = filtered.filter(
            (o) => o.fecha.getFullYear() === parseInt(selectedYear, 10),
          );
        }
        break;
    }

    return filtered;
  }, [
    allOrders,
    filterType,
    startDate,
    endDate,
    specificDate,
    selectedMonth,
    selectedYear,
    selectedWeek,
    selectedSucursal,
  ]);

  const stats = useMemo(() => {
    const totalVentas = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalDescuentos = filteredOrders.reduce(
      (sum, o) => sum + o.descuento,
      0,
    );
    const totalCostos = totalVentas * 0.4;
    const gananciaBruta = totalVentas - totalCostos;
    const promedioTicket =
      filteredOrders.length > 0 ? totalVentas / filteredOrders.length : 0;

    return {
      totalVentas,
      totalCostos,
      totalDescuentos,
      gananciaBruta,
      margenGanancia:
        totalVentas > 0 ? ((gananciaBruta / totalVentas) * 100).toFixed(2) : 0,
      totalOrdenes: filteredOrders.length,
      promedioTicket,
    };
  }, [filteredOrders]);

  const ventasPorDia = useMemo(() => {
    type DiaVentas = { fecha: string; ventas: number; ordenes: number };
    const grouped: { [key: string]: DiaVentas } = {};
    filteredOrders.forEach((order) => {
      // Use 'fecha' if present, otherwise fallback to 'creadoEn'
      const orderDate = (order as any).fecha ?? (order as any).creadoEn;
      const dateObj =
        typeof orderDate === "string" ? new Date(orderDate) : orderDate;
      const dateKey = dateObj.toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = { fecha: dateKey, ventas: 0, ordenes: 0 };
      }
      grouped[dateKey].ventas +=
        typeof order.total === "object" && "toNumber" in order.total
          ? order.total.toNumber()
          : Number(order.total);
      grouped[dateKey].ordenes += 1;
    });
    return Object.values(grouped).sort((a, b) => {
      const dateA = new Date(a.fecha);
      const dateB = new Date(b.fecha);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });
  }, [filteredOrders]);

  type TipoOrdenStats = {
    tipo: string;
    ventas: number;
    ordenes: number;
    porcentaje: number | string;
  };

  const ventasPorTipo: TipoOrdenStats[] = useMemo(() => {
    const grouped: { [key: string]: TipoOrdenStats } = {};
    filteredOrders.forEach((order) => {
      if (!grouped[order.tipoOrden]) {
        grouped[order.tipoOrden] = {
          tipo: order.tipoOrden,
          ventas: 0,
          ordenes: 0,
          porcentaje: 0,
        };
      }
      grouped[order.tipoOrden].ventas +=
        typeof order.total === "object" && "toNumber" in order.total
          ? order.total.toNumber()
          : Number(order.total);
      grouped[order.tipoOrden].ordenes += 1;
    });
    const total = Object.values(grouped).reduce(
      (sum, item) => sum + item.ventas,
      0,
    );
    Object.values(grouped).forEach((item) => {
      item.porcentaje =
        total > 0 ? ((item.ventas / total) * 100).toFixed(1) : 0;
    });
    return Object.values(grouped);
  }, [filteredOrders]);

  const mesasMasActivas = useMemo(() => {
    const mesaCount: Record<
      string,
      { mesa: string; ordenes: number; ventas: number }
    > = {};
    filteredOrders.forEach((order) => {
      if (order.mesa) {
        if (!mesaCount[order.mesa]) {
          mesaCount[order.mesa] = { mesa: order.mesa, ordenes: 0, ventas: 0 };
        }
        mesaCount[order.mesa].ordenes += 1;
        mesaCount[order.mesa].ventas += order.total;
      }
    });

    return Object.values(mesaCount)
      .sort((a, b) => b.ordenes - a.ordenes)
      .slice(0, 5);
  }, [filteredOrders]);

  type MeseroActivo = {
    mesero: string;
    ordenes: number;
    ventas: number;
  };

  const meserosMasActivos: MeseroActivo[] = useMemo(() => {
    const meseroCount: { [key: string]: MeseroActivo } = {};
    filteredOrders.forEach((order) => {
      if (order.mesero && order.mesero !== "Sin mesero") {
        if (!meseroCount[order.mesero]) {
          meseroCount[order.mesero] = {
            mesero: order.mesero,
            ordenes: 0,
            ventas: 0,
          };
        }
        meseroCount[order.mesero].ordenes += 1;
        meseroCount[order.mesero].ventas += order.total;
      }
    });
    return Object.values(meseroCount)
      .sort((a, b) => b.ordenes - a.ordenes)
      .slice(0, 5);
  }, [filteredOrders]);

  // Nuevas métricas avanzadas
  const ventasPorHora = useMemo(() => {
    const horasVentas: {
      [key: string]: { hora: string; ventas: number; ordenes: number };
    } = {};

    filteredOrders.forEach((order) => {
      const hora = order.fecha.getHours();
      const horaFormatted = `${hora}:00`;

      if (!horasVentas[horaFormatted]) {
        horasVentas[horaFormatted] = {
          hora: horaFormatted,
          ventas: 0,
          ordenes: 0,
        };
      }

      horasVentas[horaFormatted].ventas += order.total;
      horasVentas[horaFormatted].ordenes += 1;
    });

    return Object.values(horasVentas).sort((a, b) => {
      const horaA = parseInt(a.hora.split(":")[0]);
      const horaB = parseInt(b.hora.split(":")[0]);
      return horaA - horaB;
    });
  }, [filteredOrders]);

  const ventasPorDiaSemana = useMemo(() => {
    const diasSemana = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const diasVentas: {
      [key: string]: { dia: string; ventas: number; ordenes: number };
    } = {};

    // Inicializar todos los días
    diasSemana.forEach((dia) => {
      diasVentas[dia] = { dia, ventas: 0, ordenes: 0 };
    });

    filteredOrders.forEach((order) => {
      const diaSemana = diasSemana[order.fecha.getDay()];
      diasVentas[diaSemana].ventas += order.total;
      diasVentas[diaSemana].ordenes += 1;
    });

    return Object.values(diasVentas);
  }, [filteredOrders]);

  const ticketPromedioEvolucion = useMemo(() => {
    const agrupado: {
      [key: string]: {
        fecha: string;
        ventas: number;
        ordenes: number;
        ticketPromedio: number;
      };
    } = {};

    filteredOrders.forEach((order) => {
      const fechaKey = order.fecha.toISOString().split("T")[0];
      if (!agrupado[fechaKey]) {
        agrupado[fechaKey] = {
          fecha: fechaKey,
          ventas: 0,
          ordenes: 0,
          ticketPromedio: 0,
        };
      }
      agrupado[fechaKey].ventas += order.total;
      agrupado[fechaKey].ordenes += 1;
    });

    return Object.values(agrupado)
      .map((item) => ({
        ...item,
        ticketPromedio: item.ordenes > 0 ? item.ventas / item.ordenes : 0,
      }))
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      );
  }, [filteredOrders]);

  const productosTopPorVentas = useMemo(() => {
    // Esta funcionalidad requeriría datos de items, por ahora simularemos
    return [
      { nombre: "Producto A", ventas: 150000, cantidad: 45 },
      { nombre: "Producto B", ventas: 120000, cantidad: 38 },
      { nombre: "Producto C", ventas: 98000, cantidad: 32 },
      { nombre: "Producto D", ventas: 85000, cantidad: 28 },
      { nombre: "Producto E", ventas: 72000, cantidad: 24 },
    ];
  }, []);

  const metricsComparativas = useMemo(() => {
    const periodoActual = filteredOrders;
    const fechaInicio =
      periodoActual.length > 0
        ? new Date(Math.min(...periodoActual.map((o) => o.fecha.getTime())))
        : new Date();
    const fechaFin =
      periodoActual.length > 0
        ? new Date(Math.max(...periodoActual.map((o) => o.fecha.getTime())))
        : new Date();

    // Calcular período anterior del mismo tamaño
    const diasPeriodo = Math.ceil(
      (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24),
    );
    const fechaInicioAnterior = new Date(
      fechaInicio.getTime() - diasPeriodo * 24 * 60 * 60 * 1000,
    );
    const fechaFinAnterior = new Date(
      fechaInicio.getTime() - 24 * 60 * 60 * 1000,
    );

    const periodoAnterior = allOrders.filter(
      (o) =>
        o.fecha >= fechaInicioAnterior &&
        o.fecha <= fechaFinAnterior &&
        o.estado === "ENTREGADA" &&
        (selectedSucursal === "todas" || o.sucursal === selectedSucursal),
    );

    const ventasActual = periodoActual.reduce((sum, o) => sum + o.total, 0);
    const ventasAnterior = periodoAnterior.reduce((sum, o) => sum + o.total, 0);
    const ordenesActual = periodoActual.length;
    const ordenesAnterior = periodoAnterior.length;

    return {
      ventas: {
        actual: ventasActual,
        anterior: ventasAnterior,
        cambio:
          ventasAnterior > 0
            ? ((ventasActual - ventasAnterior) / ventasAnterior) * 100
            : 0,
      },
      ordenes: {
        actual: ordenesActual,
        anterior: ordenesAnterior,
        cambio:
          ordenesAnterior > 0
            ? ((ordenesActual - ordenesAnterior) / ordenesAnterior) * 100
            : 0,
      },
      ticketPromedio: {
        actual: ordenesActual > 0 ? ventasActual / ordenesActual : 0,
        anterior: ordenesAnterior > 0 ? ventasAnterior / ordenesAnterior : 0,
        cambio:
          ordenesAnterior > 0 && ventasAnterior > 0
            ? ((ventasActual / ordenesActual -
                ventasAnterior / ordenesAnterior) /
                (ventasAnterior / ordenesAnterior)) *
              100
            : 0,
      },
    };
  }, [filteredOrders, allOrders, selectedSucursal]);

  const exportToCSV = useCallback(() => {
    const headers = [
      "Fecha",
      "Sucursal",
      "Mesero",
      "Tipo Orden",
      "Mesa",
      "Estado",
      "Total",
      "Descuento",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredOrders.map((order) =>
        [
          order.fecha.toISOString().split("T")[0],
          order.sucursal,
          order.mesero,
          order.tipoOrden,
          order.mesa || "N/A",
          order.estado,
          order.total,
          order.descuento,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte-ventas-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredOrders]);

  const sucursalesRanking = useMemo(() => {
    const sucursalCount: Record<
      string,
      {
        sucursal: string;
        ordenes: number;
        ventas: number;
        ticketPromedio: number;
      }
    > = {};
    filteredOrders.forEach((order) => {
      if (order.sucursal) {
        if (!sucursalCount[order.sucursal]) {
          sucursalCount[order.sucursal] = {
            sucursal: order.sucursal,
            ordenes: 0,
            ventas: 0,
            ticketPromedio: 0,
          };
        }
        sucursalCount[order.sucursal].ordenes += 1;
        sucursalCount[order.sucursal].ventas += order.total;
      }
    });

    Object.values(sucursalCount).forEach((s) => {
      s.ticketPromedio = s.ordenes > 0 ? s.ventas / s.ordenes : 0;
    });
    return Object.values(sucursalCount).sort((a, b) => b.ventas - a.ventas);
  }, [filteredOrders]);

  const comparacionFechas = useMemo(() => {
    if (
      filterType !== "comparar-fechas" ||
      !compareStartDate1 ||
      !compareEndDate1 ||
      !compareStartDate2 ||
      !compareEndDate2
    ) {
      return null;
    }

    const periodo1 = allOrders.filter((o) => {
      const date = o.fecha;
      const start = new Date(compareStartDate1);
      const end = new Date(compareEndDate1);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end && o.estado === "ENTREGADA";
    });

    const periodo2 = allOrders.filter((o) => {
      const date = o.fecha;
      const start = new Date(compareStartDate2);
      const end = new Date(compareEndDate2);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end && o.estado === "ENTREGADA";
    });

    const calcStats = (orders: TransformedOrder[]) => ({
      ventas: orders.reduce((s: number, o: TransformedOrder) => s + o.total, 0),
      ordenes: orders.length,
      ganancias: orders.reduce(
        (s: number, o: TransformedOrder) => s + o.total * 0.6,
        0,
      ),
    });

    return {
      periodo1: calcStats(periodo1),
      periodo2: calcStats(periodo2),
    };
  }, [
    filterType,
    compareStartDate1,
    compareEndDate1,
    compareStartDate2,
    compareEndDate2,
    allOrders,
  ]);

  const comparacionMeses = useMemo(() => {
    if (filterType !== "comparar-meses" || !compareMonth1 || !compareMonth2) {
      return null;
    }

    const [year1, month1] = compareMonth1.split("-");
    const [year2, month2] = compareMonth2.split("-");

    const mes1Orders = allOrders.filter(
      (o) =>
        o.fecha.getMonth() === parseInt(month1, 10) - 1 &&
        o.fecha.getFullYear() === parseInt(year1, 10) &&
        o.estado === "ENTREGADA",
    );

    const mes2Orders = allOrders.filter(
      (o) =>
        o.fecha.getMonth() === parseInt(month2, 10) - 1 &&
        o.fecha.getFullYear() === parseInt(year2, 10) &&
        o.estado === "ENTREGADA",
    );

    const calcStats = (orders: TransformedOrder[]) => ({
      ventas: orders.reduce((s: number, o: TransformedOrder) => s + o.total, 0),
      ordenes: orders.length,
      ganancias: orders.reduce(
        (s: number, o: TransformedOrder) => s + o.total * 0.6,
        0,
      ),
    });

    return {
      mes1: { ...calcStats(mes1Orders), nombre: compareMonth1 },
      mes2: { ...calcStats(mes2Orders), nombre: compareMonth2 },
    };
  }, [filterType, compareMonth1, compareMonth2, allOrders]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-wine animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                Reportes
              </h1>
              <p className="text-xs lg:text-sm text-gray-500">
                Análisis de ventas y rendimiento
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-wine hover:bg-wine/90 rounded-lg transition-colors"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">
                Filtros
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {showFilters && (
            <div className="p-4 border-t border-gray-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="periodo"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Período
                  </label>
                  <select
                    id="periodo"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine transition-all"
                  >
                    <option value="mes-actual">Mes Actual</option>
                    <option value="hace-un-mes">Mes Anterior</option>
                    <option value="dia-especifico">Día Específico</option>
                    <option value="rango-fechas">Rango de Fechas</option>
                    <option value="semana-especifica">Semana Específica</option>
                    <option value="mes-especifico">Mes Específico</option>
                    <option value="año-especifico">Año Específico</option>
                    <option value="comparar-fechas">Comparar Períodos</option>
                    <option value="comparar-meses">Comparar Meses</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sucursal"
                    className="block text-xs font-medium text-gray-700 mb-2"
                  >
                    Sucursal
                  </label>
                  <select
                    id="sucursal"
                    value={selectedSucursal}
                    onChange={(e) => setSelectedSucursal(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine transition-all"
                  >
                    {sucursales.map((suc) => (
                      <option key={suc} value={suc}>
                        {suc === "todas" ? "Todas las sucursales" : suc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filterType === "dia-especifico" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="fecha"
                      className="block text-xs font-medium text-gray-700 mb-2"
                    >
                      Fecha
                    </label>
                    <input
                      id="fecha"
                      type="date"
                      value={specificDate}
                      onChange={(e) => setSpecificDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
                    />
                  </div>
                </div>
              )}

              {filterType === "rango-fechas" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="desde"
                      className="block text-xs font-medium text-gray-700 mb-2"
                    >
                      Desde
                    </label>
                    <input
                      id="desde"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hasta"
                      className="block text-xs font-medium text-gray-700 mb-2"
                    >
                      Hasta
                    </label>
                    <input
                      id="hasta"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
                    />
                  </div>
                </div>
              )}

              {filterType === "mes-especifico" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="mes"
                      className="block text-xs font-medium text-gray-700 mb-2"
                    >
                      Mes
                    </label>
                    <input
                      id="mes"
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
                    />
                  </div>
                </div>
              )}

              {filterType === "comparar-fechas" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-700">
                      Período 1
                    </p>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={compareStartDate1}
                        onChange={(e) => setCompareStartDate1(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
                      />
                      <input
                        type="date"
                        value={compareEndDate1}
                        onChange={(e) => setCompareEndDate1(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-700">
                      Período 2
                    </p>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={compareStartDate2}
                        onChange={(e) => setCompareStartDate2(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
                      />
                      <input
                        type="date"
                        value={compareEndDate2}
                        onChange={(e) => setCompareEndDate2(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
                      />
                    </div>
                  </div>
                </div>
              )}

              {filterType === "comparar-meses" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="mes1"
                      className="block text-xs font-medium text-gray-700 mb-2"
                    >
                      Mes 1
                    </label>
                    <input
                      id="mes1"
                      type="month"
                      value={compareMonth1}
                      onChange={(e) => setCompareMonth1(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mes2"
                      className="block text-xs font-medium text-gray-700 mb-2"
                    >
                      Mes 2
                    </label>
                    <input
                      id="mes2"
                      type="month"
                      value={compareMonth2}
                      onChange={(e) => setCompareMonth2(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Ventas Totales</p>
            <p className="text-lg lg:text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalVentas)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500">
                {stats.margenGanancia}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Ganancias</p>
            <p className="text-lg lg:text-2xl font-bold text-wine">
              {formatCurrency(stats.gananciaBruta)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <ShoppingBag className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Órdenes</p>
            <p className="text-lg lg:text-2xl font-bold text-gray-900">
              {stats.totalOrdenes}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Ticket Promedio</p>
            <p className="text-lg lg:text-2xl font-bold text-gray-900">
              {formatCurrency(stats.promedioTicket)}
            </p>
          </div>
        </div>

        {/* Métricas Comparativas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-wine" />
            Comparación con Período Anterior
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Ventas</p>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {formatCurrency(metricsComparativas.ventas.actual)}
              </p>
              <div
                className={`flex items-center justify-center gap-1 text-sm ${
                  metricsComparativas.ventas.cambio >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <TrendingUp
                  size={14}
                  className={
                    metricsComparativas.ventas.cambio < 0 ? "rotate-180" : ""
                  }
                />
                <span>
                  {metricsComparativas.ventas.cambio >= 0 ? "+" : ""}
                  {metricsComparativas.ventas.cambio.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-center p-4 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Órdenes</p>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {metricsComparativas.ordenes.actual}
              </p>
              <div
                className={`flex items-center justify-center gap-1 text-sm ${
                  metricsComparativas.ordenes.cambio >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <TrendingUp
                  size={14}
                  className={
                    metricsComparativas.ordenes.cambio < 0 ? "rotate-180" : ""
                  }
                />
                <span>
                  {metricsComparativas.ordenes.cambio >= 0 ? "+" : ""}
                  {metricsComparativas.ordenes.cambio.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-center p-4 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Ticket Promedio</p>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {formatCurrency(metricsComparativas.ticketPromedio.actual)}
              </p>
              <div
                className={`flex items-center justify-center gap-1 text-sm ${
                  metricsComparativas.ticketPromedio.cambio >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <TrendingUp
                  size={14}
                  className={
                    metricsComparativas.ticketPromedio.cambio < 0
                      ? "rotate-180"
                      : ""
                  }
                />
                <span>
                  {metricsComparativas.ticketPromedio.cambio >= 0 ? "+" : ""}
                  {metricsComparativas.ticketPromedio.cambio.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparaciones */}
        {comparacionFechas && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-4 lg:mb-6">
              Comparación de Períodos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-medium">Diferencia</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Ventas</p>
                    <p
                      className={`text-lg lg:text-xl font-bold ${comparacionFechas.periodo2.ventas > comparacionFechas.periodo1.ventas ? "text-green-600" : "text-red-600"}`}
                    >
                      {comparacionFechas.periodo1.ventas > 0 ? (
                        <>
                          {comparacionFechas.periodo2.ventas >
                          comparacionFechas.periodo1.ventas
                            ? "+"
                            : ""}
                          {(
                            ((comparacionFechas.periodo2.ventas -
                              comparacionFechas.periodo1.ventas) /
                              comparacionFechas.periodo1.ventas) *
                            100
                          ).toFixed(1)}
                          %
                        </>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Órdenes</p>
                    <p
                      className={`text-lg lg:text-xl font-bold ${comparacionFechas.periodo2.ordenes > comparacionFechas.periodo1.ordenes ? "text-green-600" : "text-red-600"}`}
                    >
                      {comparacionFechas.periodo1.ordenes > 0 ? (
                        <>
                          {comparacionFechas.periodo2.ordenes >
                          comparacionFechas.periodo1.ordenes
                            ? "+"
                            : ""}
                          {(
                            ((comparacionFechas.periodo2.ordenes -
                              comparacionFechas.periodo1.ordenes) /
                              comparacionFechas.periodo1.ordenes) *
                            100
                          ).toFixed(1)}
                          %
                        </>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {comparacionMeses && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-4 lg:mb-6">
              Comparación de Meses
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[
                  {
                    name: comparacionMeses.mes1.nombre,
                    Ventas: comparacionMeses.mes1.ventas,
                    Órdenes: comparacionMeses.mes1.ordenes,
                  },
                  {
                    name: comparacionMeses.mes2.nombre,
                    Ventas: comparacionMeses.mes2.ventas,
                    Órdenes: comparacionMeses.mes2.ordenes,
                  },
                ]}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === "Ventas" ? formatCurrency(Number(value)) : value,
                    name,
                  ]}
                  contentStyle={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="Ventas"
                  fill={COLORS.primary}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Órdenes"
                  fill={COLORS.wine}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráficas principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Ventas por Día */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Ventas por Día
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ventasPorDia}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.primary}
                      stopOpacity={0.1}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="fecha"
                  stroke="#9ca3af"
                  style={{ fontSize: "11px" }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: "11px" }} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fill="url(#colorVentas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por Tipo */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Tipo de Orden
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ventasPorTipo}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="ventas"
                >
                  {ventasPorTipo.map((entry) => (
                    <Cell
                      key={entry.tipo}
                      fill={
                        CHART_COLORS[
                          ventasPorTipo.indexOf(entry) % CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {ventasPorTipo.map((tipo, idx) => (
                <div key={tipo.tipo} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[idx] }}
                    ></div>
                    <p className="text-xs text-gray-600">{tipo.tipo}</p>
                  </div>
                  <p className="text-base lg:text-lg font-bold text-gray-900">
                    {tipo.porcentaje}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {tipo.ordenes} órdenes
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráficos Adicionales de Análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Ventas por Hora */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Ventas por Hora del Día
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ventasPorHora}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="hora"
                  stroke="#9ca3af"
                  style={{ fontSize: "11px" }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: "11px" }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === "ventas" ? formatCurrency(Number(value)) : value,
                    name === "ventas" ? "Ventas" : "Órdenes",
                  ]}
                  contentStyle={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ventas"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Ventas por Día de la Semana */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              Ventas por Día de la Semana
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ventasPorDiaSemana}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="dia"
                  stroke="#9ca3af"
                  style={{ fontSize: "11px" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: "11px" }} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="ventas"
                  fill={COLORS.wine}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolución del Ticket Promedio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-400" />
            Evolución del Ticket Promedio
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ticketPromedioEvolucion}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="fecha"
                stroke="#9ca3af"
                style={{ fontSize: "11px" }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: "11px" }} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="ticketPromedio"
                stroke={COLORS.secondary}
                strokeWidth={3}
                dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Productos por Ventas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-gray-400" />
            Top Productos por Ventas
          </h2>
          {productosTopPorVentas.length > 0 ? (
            <div className="space-y-3">
              {productosTopPorVentas.map((producto, idx) => (
                <div
                  key={producto.nombre}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      <span className="text-white text-xs font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {producto.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {producto.cantidad} unidades vendidas
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: COLORS.primary }}
                  >
                    {formatCurrency(producto.ventas)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
              <BarChart3 size={40} className="mb-2 opacity-30" />
              <p className="text-sm">No hay datos de productos disponibles</p>
            </div>
          )}
        </div>

        {/* Mesas y Meseros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Mesas Más Activas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              Mesas Más Activas
            </h2>
            {mesasMasActivas.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mesasMasActivas} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="#9ca3af"
                    style={{ fontSize: "11px" }}
                  />
                  <YAxis
                    dataKey="mesa"
                    type="category"
                    stroke="#9ca3af"
                    style={{ fontSize: "11px" }}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "ordenes"
                        ? value
                        : formatCurrency(Number(value)),
                      name === "ordenes" ? "Órdenes" : "Ventas",
                    ]}
                    contentStyle={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="ordenes"
                    fill={COLORS.primary}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
                <MapPin size={40} className="mb-2 opacity-30" />
                <p className="text-sm">No hay datos disponibles</p>
              </div>
            )}
          </div>

          {/* Meseros Más Activos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Meseros Más Activos
            </h2>
            {meserosMasActivos.length > 0 ? (
              <div className="space-y-3">
                {meserosMasActivos.map((mesero, idx) => (
                  <div
                    key={mesero.mesero}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-wine rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          #{idx + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {mesero.mesero}
                        </p>
                        <p className="text-xs text-gray-500">
                          {mesero.ordenes} órdenes
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-wine">
                      {formatCurrency(mesero.ventas)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
                <Users size={40} className="mb-2 opacity-30" />
                <p className="text-sm">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Ranking de Sucursales */}
        {sucursalesRanking.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 lg:mb-6">
              Ranking de Sucursales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sucursalesRanking.map((sucursal, idx) => (
                <div
                  key={sucursal.sucursal}
                  className="border border-gray-200 rounded-xl p-4 hover:border-wine/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-gray-900">
                      {sucursal.sucursal}
                    </h3>
                    <span className="text-xs font-semibold text-gray-500">
                      #{idx + 1}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Ventas</span>
                      <span className="text-sm font-bold text-wine">
                        {formatCurrency(sucursal.ventas)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Órdenes</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {sucursal.ordenes}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">
                        Ticket Promedio
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(sucursal.ticketPromedio)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="bg-gradient-to-br from-wine to-wine/90 rounded-xl shadow-sm p-4 lg:p-6 text-white">
          <h2 className="text-base lg:text-lg font-bold mb-4">
            Resumen del Período
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div>
              <p className="text-xs text-white/80 mb-1">Ventas</p>
              <p className="text-xl lg:text-2xl font-bold">
                {formatCurrency(stats.totalVentas)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/80 mb-1">Ganancias</p>
              <p className="text-xl lg:text-2xl font-bold">
                {formatCurrency(stats.gananciaBruta)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/80 mb-1">Órdenes</p>
              <p className="text-xl lg:text-2xl font-bold">
                {stats.totalOrdenes}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/80 mb-1">Ticket Promedio</p>
              <p className="text-xl lg:text-2xl font-bold">
                {formatCurrency(stats.promedioTicket)}
              </p>
            </div>
          </div>

          {ventasPorTipo.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-xs font-semibold text-white/90 mb-3">
                Preferencia de Consumo
              </p>
              <div className="grid grid-cols-3 gap-4">
                {ventasPorTipo.map((tipo) => (
                  <div key={tipo.tipo}>
                    <p className="text-2xl lg:text-3xl font-bold">
                      {tipo.porcentaje}%
                    </p>
                    <p className="text-xs text-white/80 mt-0.5">{tipo.tipo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
