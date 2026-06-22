import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { EstadisticasProps } from "./types";

type PickerType = "year" | "month" | "day";

type PickerOption = {
  label: string;
  value: number | null;
};

const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type DashboardSummary = {
  ingresosTotales: number;
  gastosTotales: number;
  comprasTotales: number;
  beneficioNeto: number;
  numReservas: number;
  numVentas: number;
};

type DashboardChartPoint = {
  key: string;
  label: string;
  ingresos: number;
  gastos: number;
  compras: number;
  beneficio: number;
};

type DashboardResponse = {
  dashboard: DashboardSummary;
  chart: {
    mode: "month" | "year";
    netProfit: DashboardChartPoint[];
  };
  filter: {
    year: number;
    month: number | null;
    day: number | null;
    summaryMode: "day" | "month" | "year";
  };
};

const Dashboard: React.FC<EstadisticasProps> = ({ route, navigation }) => {
  const { negocio } = route.params;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<DashboardChartPoint[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState("");
  const [productosMasVendidos, setProductosMasVendidos] = useState<any[]>([]);
  const [productosMenosVendidos, setProductosMenosVendidos] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [serviciosMasVendidos, setServiciosMasVendidos] = useState<any[]>([]);
  const [serviciosMenosVendidos, setServiciosMenosVendidos] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resourceError, setResourceError] = useState("");
  const [recursosMasUsados, setRecursosMasUsados] = useState<any[]>([]);
  const [recursosMenosUsados, setRecursosMenosUsados] = useState<any[]>([]);
  const [productsExpanded, setProductsExpanded] = useState<boolean>(false);
  const [servicesExpanded, setServicesExpanded] = useState<boolean>(false);
  const [resourcesExpanded, setResourcesExpanded] = useState<boolean>(false);
  const [gastosExpanded, setGastosExpanded] = useState<boolean>(false);
  const [comprasExpanded, setComprasExpanded] = useState<boolean>(false);
  const [clientesExpanded, setClientesExpanded] = useState<boolean>(false);
  const [loadingGastos, setLoadingGastos] = useState(false);
  const [gastoError, setGastoError] = useState("");
  const [gastosChart, setGastosChart] = useState<any[]>([]);
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [compraError, setCompraError] = useState("");
  const [compraChart, setCompraChart] = useState<any[]>([]);
  const [proveedoresTop, setProveedoresTop] = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteError, setClienteError] = useState("");
  const [clientesPorGasto, setClientesPorGasto] = useState<any[]>([]);
  const [clientesPorReservas, setClientesPorReservas] = useState<any[]>([]);
  const [clientesPorVentas, setClientesPorVentas] = useState<any[]>([]);
  const [clientesPorCanceladas, setClientesPorCanceladas] = useState<any[]>([]);
  const [reservasExpanded, setReservasExpanded] = useState<boolean>(false);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [reservaError, setReservaError] = useState("");
  const [serviciosMasReservados, setServiciosMasReservados] = useState<any[]>([]);
  const [mesesMasReservados, setMesesMasReservados] = useState<any[]>([]);

  const yearOptions = useMemo<PickerOption[]>(() => {
    const years = Array.from({ length: 8 }, (_, index) => currentYear - 5 + index).reverse();
    return years.map((year) => ({ label: String(year), value: year }));
  }, [currentYear]);

  const monthOptions = useMemo<PickerOption[]>(() => {
    return [
      { label: "Sin especificar", value: null },
      ...MONTH_LABELS.map((label, index) => ({ label, value: index + 1 })),
    ];
  }, []);

  const dayOptions = useMemo<PickerOption[]>(() => {
    if (!selectedYear || !selectedMonth) {
      return [{ label: "Sin especificar", value: null }];
    }

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

    return [
      { label: "Sin especificar", value: null },
      ...days.map((day) => ({ label: String(day), value: day })),
    ];
  }, [selectedMonth, selectedYear]);

  const applyYear = (year: number | null) => {
    if (!year) {
      return;
    }

    setSelectedYear(year);
    if (!selectedMonth) {
      setSelectedDay(null);
      return;
    }

    const daysInMonth = new Date(year, selectedMonth, 0).getDate();
    if (selectedDay && selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  };

  const applyMonth = (month: number | null) => {
    setSelectedMonth(month);

    if (!month) {
      setSelectedDay(null);
      return;
    }

    setSelectedDay(null);
  };

  const applyDay = (day: number | null) => {
    setSelectedDay(day);
  };

  const selectOption = (value: number | null) => {
    if (activePicker === "year") {
      applyYear(value);
    }

    if (activePicker === "month") {
      applyMonth(value);
    }

    if (activePicker === "day") {
      applyDay(value);
    }

    setActivePicker(null);
  };

  const yearLabel = selectedYear ? String(selectedYear) : "Sin especificar";
  const monthLabel = selectedMonth ? MONTH_LABELS[selectedMonth - 1] : "Sin especificar";
  const dayLabel = selectedDay ? String(selectedDay) : "Sin especificar";

  const summary = [selectedDay, selectedMonth, selectedYear]
    .filter((value) => value !== null)
    .join("/");

  const pickerOptions = activePicker === "year" ? yearOptions : activePicker === "month" ? monthOptions : dayOptions;
  const selectedPickerValue =
    activePicker === "year" ? selectedYear : activePicker === "month" ? selectedMonth : selectedDay;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const buildBarData = <T,>(
    items: T[],
    valueGetter: (item: T) => number,
    labelGetter: (item: T, index: number) => string,
    palette: string[]
  ) => {
    return items.map((item, index) => ({
      value: valueGetter(item),
      label: labelGetter(item, index),
      frontColor: palette[index % palette.length],
    }));
  };

  const getClientChartLabel = (client: { nombre?: string; apellido1?: string }) => {
    const firstName = (client.nombre || "").trim().split(/\s+/)[0] || "Cliente";
    const firstSurname = (client.apellido1 || "").trim();

    if (!firstSurname) {
      return firstName;
    }

    return `${firstName} ${firstSurname.charAt(0)}.`;
  };

  const chartPalettes = {
    green: ["#22c55e", "#16a34a", "#15803d"],
    red: ["#fb7185", "#ef4444", "#dc2626"],
    blue: ["#60a5fa", "#3b82f6", "#2563eb"],
    orange: ["#fbbf24", "#f59e0b", "#d97706"],
    teal: ["#2dd4bf", "#14b8a6", "#0f766e"],
    violet: ["#c084fc", "#a855f7", "#7c3aed"],
    indigo: ["#818cf8", "#6366f1", "#4f46e5"],
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        API_ROUTES.estadisticasDashboard(
          negocio.id_negocio,
          selectedYear,
          selectedMonth,
          selectedDay
        ),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = (await response.json()) as Partial<DashboardResponse> & {
        message?: string;
      };

      if (!response.ok) {
        setError(data.message || "No se pudo cargar el resumen general");
        return;
      }

      if (!data.dashboard || !data.chart?.netProfit) {
        setError("La respuesta de estadísticas no tiene el formato esperado");
        return;
      }

      setDashboard(data.dashboard);
      setChartData(data.chart.netProfit);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [negocio.id_negocio, selectedDay, selectedMonth, selectedYear]);

  const loadGastoStats = useCallback(async () => {
    setLoadingGastos(true);
    setGastoError("");

    try {
      const token = await AsyncStorage.getItem("token");
      const url = API_ROUTES.estadisticasGastos(negocio.id_negocio, selectedYear, selectedMonth || undefined);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      if (!response.ok) {
        setGastoError(data.message || "No se pudieron cargar las estadísticas de gastos");
        return;
      }

      setGastosChart(data.gastoChart?.gastos || []);
    } catch (e) {
      setGastoError("Error de conexión al cargar gastos");
    } finally {
      setLoadingGastos(false);
    }
  }, [negocio.id_negocio, selectedMonth, selectedYear]);

  const loadCompraStats = useCallback(async () => {
    setLoadingCompras(true);
    setCompraError("");

    try {
      const token = await AsyncStorage.getItem("token");
      const url = API_ROUTES.estadisticasComprasChart(negocio.id_negocio, selectedYear, selectedMonth || undefined);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      if (!response.ok) {
        setCompraError(data.message || "No se pudieron cargar las estadísticas de compras");
        return;
      }

      setCompraChart(data.compraChart?.compras || []);
      setProveedoresTop(data.proveedoresTop || []);
    } catch (e) {
      setCompraError("Error de conexión al cargar compras");
    } finally {
      setLoadingCompras(false);
    }
  }, [negocio.id_negocio, selectedMonth, selectedYear]);

  const loadClientStats = useCallback(async () => {
    setLoadingClientes(true);
    setClienteError("");

    try {
      const token = await AsyncStorage.getItem("token");
      const { start, end } = buildRangeForProducts(selectedYear, selectedMonth, selectedDay);
      const url = API_ROUTES.estadisticasClientes(negocio.id_negocio, "custom", start, end);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      if (!response.ok) {
        setClienteError(data.message || "No se pudieron cargar las estadísticas de clientes");
        return;
      }

      setClientesPorGasto(data.clientStats?.clientesPorGasto || []);
      setClientesPorReservas(data.clientStats?.clientesPorReservas || []);
      setClientesPorVentas(data.clientStats?.clientesPorVentas || []);
      setClientesPorCanceladas(data.clientStats?.clientesPorCanceladas || []);
    } catch (e) {
      setClienteError("Error de conexión al cargar clientes");
    } finally {
      setLoadingClientes(false);
    }
  }, [negocio.id_negocio, selectedDay, selectedMonth, selectedYear]);

  const loadReservaStats = useCallback(async () => {
    setLoadingReservas(true);
    setReservaError("");

    try {
      const token = await AsyncStorage.getItem("token");
      const url = API_ROUTES.estadisticasReservas(negocio.id_negocio, selectedYear, selectedMonth, selectedDay);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      if (!response.ok) {
        setReservaError(data.message || "No se pudieron cargar las estadísticas de reservas");
        return;
      }

      setServiciosMasReservados(data.reservaStats?.serviciosMasReservados || []);
      setMesesMasReservados(data.reservaStats?.mesesMasReservados || []);
    } catch (e) {
      setReservaError("Error de conexión al cargar reservas");
    } finally {
      setLoadingReservas(false);
    }
  }, [negocio.id_negocio, selectedDay, selectedMonth, selectedYear]);

  const loadServiceStats = useCallback(async () => {
    setLoadingServices(true);
    setServiceError("");

    try {
      const token = await AsyncStorage.getItem("token");
      const { start, end } = buildRangeForProducts(selectedYear, selectedMonth, selectedDay);
      const url = API_ROUTES.estadisticasServicios(negocio.id_negocio, "custom", start, end);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      if (!response.ok) {
        setServiceError(data.message || "No se pudieron cargar las estadísticas de servicios");
        return;
      }

      setServiciosMasVendidos(data.serviceStats?.serviciosMasVendidos || []);
      setServiciosMenosVendidos(data.serviceStats?.serviciosMenosVendidos || []);
    } catch (e) {
      setServiceError("Error de conexión al cargar servicios");
    } finally {
      setLoadingServices(false);
    }
  }, [negocio.id_negocio, selectedDay, selectedMonth, selectedYear]);

  

  const buildRangeForProducts = (year: number, month: number | null, day: number | null) => {
    if (day !== null && month !== null) {
      const start = new Date(year, month - 1, day);
      const end = new Date(year, month - 1, day + 1);
      return { start: start.toISOString(), end: end.toISOString() };
    }

    if (month !== null) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      return { start: start.toISOString(), end: end.toISOString() };
    }

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const loadProductStats = useCallback(async () => {
    setLoadingProducts(true);
    setProductError("");

    try {
      const token = await AsyncStorage.getItem("token");
      const { start, end } = buildRangeForProducts(selectedYear, selectedMonth, selectedDay);
      const url = API_ROUTES.estadisticasProductos(negocio.id_negocio, "custom", start, end);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      if (!response.ok) {
        setProductError(data.message || "No se pudieron cargar las estadísticas de productos");
        return;
      }

      setProductosMasVendidos(data.productStats?.productosMasVendidos || []);
      setProductosMenosVendidos(data.productStats?.productosMenosVendidos || []);
    } catch (e) {
      setProductError("Error de conexión al cargar productos");
    } finally {
      setLoadingProducts(false);
    }
  }, [negocio.id_negocio, selectedDay, selectedMonth, selectedYear]);

  const loadResourceStats = useCallback(async () => {
    setLoadingResources(true);
    setResourceError("");

    try {
      const token = await AsyncStorage.getItem("token");
      const { start, end } = buildRangeForProducts(selectedYear, selectedMonth, selectedDay);
      const url = API_ROUTES.estadisticasRecursos(negocio.id_negocio, "custom", start, end);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      if (!response.ok) {
        setResourceError(data.message || "No se pudieron cargar las estadísticas de recursos");
        return;
      }

      setRecursosMasUsados(data.resourceStats?.recursosMasUsados || []);
      setRecursosMenosUsados(data.resourceStats?.recursosMenosUsados || []);
    } catch (e) {
      setResourceError("Error de conexión al cargar recursos");
    } finally {
      setLoadingResources(false);
    }
  }, [negocio.id_negocio, selectedDay, selectedMonth, selectedYear]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      loadProductStats();
      loadServiceStats();
      loadResourceStats();
      loadGastoStats();
      loadCompraStats();
      loadClientStats();
        loadReservaStats();
      }, [loadDashboard, loadProductStats, loadServiceStats, loadResourceStats, loadGastoStats, loadCompraStats, loadClientStats, loadReservaStats])
  );

  useEffect(() => {
    loadDashboard();
    loadProductStats();
    loadServiceStats();
    loadResourceStats();
    loadGastoStats();
    loadCompraStats();
    loadClientStats();
      loadReservaStats();
    }, [loadDashboard, loadProductStats, loadServiceStats, loadResourceStats, loadGastoStats, loadCompraStats, loadClientStats, loadReservaStats]);

  const barData = useMemo(() => {
    return chartData.map((item) => ({
      value: item.beneficio,
      label: item.label,
      frontColor: item.beneficio >= 0 ? "#16a34a" : "#dc2626",
    }));
  }, [chartData]);

  const mostNegativeValue = useMemo(() => {
    if (!chartData.length) {
      return 0;
    }

    const minBenefit = Math.min(...chartData.map((item) => item.beneficio));
    return Math.min(0, minBenefit);
  }, [chartData]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.filterCard}>
          <View style={styles.filterCardHeader}>
            <View style={styles.filterCardTitleRow}>
              <View style={styles.filterCardIcon}>
                <MaterialIcons name="tune" size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Filtros</Text>
              </View>
            </View>

            <View style={styles.filterActiveBadge}>
              <Text style={styles.filterActiveBadgeText}>Periodo activo</Text>
            </View>
          </View>

          <View style={styles.filtersRow}>
            <Pressable
              style={[
                styles.filterChip,
                styles.filterChipGrow,
                activePicker === "year" && styles.filterChipActive,
              ]}
              onPress={() => setActivePicker("year")}
              testID="estadisticas-filter-year"
            >
              <View style={styles.filterChipTopRow}>
                <MaterialIcons name="event" size={16} color={activePicker === "year" ? "#0f172a" : "#6b7280"} />
                <Text style={[styles.filterBadge, activePicker === "year" && styles.filterBadgeActive]}>Año</Text>
              </View>
              <Text style={styles.filterValue}>{yearLabel}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                styles.filterChipGrow,
                activePicker === "month" && styles.filterChipActive,
              ]}
              onPress={() => setActivePicker("month")}
              testID="estadisticas-filter-month"
            >
              <View style={styles.filterChipTopRow}>
                <MaterialIcons name="date-range" size={16} color={activePicker === "month" ? "#0f172a" : "#6b7280"} />
                <Text style={[styles.filterBadge, activePicker === "month" && styles.filterBadgeActive]}>Mes</Text>
              </View>
              <Text style={styles.filterValue}>{monthLabel}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                !selectedMonth && styles.filterCardDisabled,
                activePicker === "day" && styles.filterChipActive,
              ]}
              onPress={() => selectedMonth && setActivePicker("day")}
              disabled={!selectedMonth}
              testID="estadisticas-filter-day"
            >
              <View style={styles.filterChipTopRow}>
                <MaterialIcons name="today" size={16} color={selectedMonth ? (activePicker === "day" ? "#0f172a" : "#6b7280") : "#9ca3af"} />
                <Text style={[styles.filterBadge, activePicker === "day" && styles.filterBadgeActive]}>Día</Text>
              </View>
              <Text style={styles.filterValue}>{dayLabel}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Beneficio neto</Text>
            <Text style={styles.chartSubtitle}>
              {selectedMonth ? "Últimos 5 meses" : "Últimos 5 años"}
            </Text>
          </View>

          {loading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator size="large" color="#1976D2" />
            </View>
          ) : (
            <BarChart
              data={barData}
              barWidth={24}
              spacing={18}
              roundedTop
              roundedBottom
              hideRules
              noOfSections={5}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor="#d1d5db"
              isAnimated
              disablePress
              yAxisTextStyle={styles.yAxisText}
              xAxisLabelTextStyle={styles.xAxisText}
              mostNegativeValue={mostNegativeValue}
              negativeStepValue={Math.max(1, Math.ceil(Math.abs(mostNegativeValue) / 5))}
              hideOrigin={false}
            />
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {dashboard && !loading ? (
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Ingresos</Text>
              <Text style={styles.metricValue}>{formatCurrency(dashboard.ingresosTotales)}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Gastos (gastos+compras)</Text>
              <Text style={styles.metricValue}>{formatCurrency(dashboard.gastosTotales)}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Beneficio neto</Text>
              <Text
                style={[
                  styles.metricValue,
                  dashboard.beneficioNeto >= 0 ? styles.metricPositive : styles.metricNegative,
                ]}
              >
                {formatCurrency(dashboard.beneficioNeto)}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Nº de reservas</Text>
              <Text style={styles.metricValue}>{dashboard.numReservas}</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Nº de ventas</Text>
              <Text style={styles.metricValue}>{dashboard.numVentas}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setProductsExpanded((v) => !v)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <Text style={styles.sectionDescription}>Top 5 productos más vendidos y menos vendidos (periodo seleccionado).</Text>
          </View>
          <MaterialIcons name={productsExpanded ? "expand-less" : "expand-more"} size={26} color="#374151" />
        </TouchableOpacity>

        {productsExpanded ? (
          <>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderTitleWrap}>
                  <View style={[styles.chartIconWrap, styles.chartIconGreen]}>
                    <MaterialIcons name="inventory-2" size={16} color="#ffffff" />
                  </View>
                <Text style={styles.chartTitle}>Top 5 más vendidos</Text>
                </View>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingProducts ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : (
                <BarChart
                  data={buildBarData(
                    productosMasVendidos.slice(0, 5),
                    (p) => Number(p.cantidad_vendida || p.cantidad || 0),
                    (p) => p.nombre,
                    chartPalettes.green
                  )}
                  barWidth={24}
                  spacing={18}
                  roundedTop
                  roundedBottom
                  hideRules
                  noOfSections={5}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor="#d1d5db"
                  isAnimated
                  disablePress
                  yAxisTextStyle={styles.yAxisText}
                  xAxisLabelTextStyle={styles.xAxisText}
                />
              )}

              <View style={styles.listContainer}>
                {productosMasVendidos.slice(0, 5).map((p, idx) => (
                  <View key={`more-${p.id_producto ?? idx}`} style={styles.listItem}>
                    <Text style={styles.listItemLabel}>{idx + 1}. {p.nombre}</Text>
                    <Text style={styles.listItemValue}>{Number(p.cantidad_vendida || p.cantidad || 0)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderTitleWrap}>
                  <View style={[styles.chartIconWrap, styles.chartIconRed]}>
                    <MaterialIcons name="inventory-2" size={16} color="#ffffff" />
                  </View>
                <Text style={styles.chartTitle}>Top 5 menos vendidos</Text>
                </View>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingProducts ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : (
                <BarChart
                  data={buildBarData(
                    productosMenosVendidos.slice(0, 5),
                    (p) => Number(p.cantidad_vendida || p.cantidad || 0),
                    (p) => p.nombre,
                    chartPalettes.red
                  )}
                  barWidth={24}
                  spacing={18}
                  roundedTop
                  roundedBottom
                  hideRules
                  noOfSections={5}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor="#d1d5db"
                  isAnimated
                  disablePress
                  yAxisTextStyle={styles.yAxisText}
                  xAxisLabelTextStyle={styles.xAxisText}
                />
              )}

              <View style={styles.listContainer}>
                {productosMenosVendidos.slice(0, 5).map((p, idx) => (
                  <View key={`less-${p.id_producto ?? idx}`} style={styles.listItem}>
                    <Text style={styles.listItemLabel}>{idx + 1}. {p.nombre}</Text>
                    <Text style={styles.listItemValue}>{Number(p.cantidad_vendida || p.cantidad || 0)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setServicesExpanded((v) => !v)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Servicios</Text>
            <Text style={styles.sectionDescription}>Top 5 servicios vendidos (ventas directas).</Text>
          </View>
          <MaterialIcons name={servicesExpanded ? "expand-less" : "expand-more"} size={26} color="#374151" />
        </TouchableOpacity>

        {servicesExpanded ? (
          <>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderTitleWrap}>
                  <View style={[styles.chartIconWrap, styles.chartIconBlue]}>
                    <MaterialIcons name="spa" size={16} color="#ffffff" />
                  </View>
                <Text style={styles.chartTitle}>Top 5 servicios más vendidos</Text>
                </View>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingServices ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : (
                <BarChart
                  data={buildBarData(
                    serviciosMasVendidos.slice(0, 5),
                    (s) => Number(s.cantidad_ventas || 0),
                    (s) => s.nombre,
                    chartPalettes.blue
                  )}
                  barWidth={24}
                  spacing={18}
                  roundedTop
                  roundedBottom
                  hideRules
                  noOfSections={5}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor="#d1d5db"
                  isAnimated
                  disablePress
                  yAxisTextStyle={styles.yAxisText}
                  xAxisLabelTextStyle={styles.xAxisText}
                />
              )}

              <View style={styles.listContainer}>
                {serviciosMasVendidos.slice(0, 5).map((s, idx) => (
                  <View key={`svc-more-${s.id_servicio ?? idx}`} style={styles.listItem}>
                    <Text style={styles.listItemLabel}>{idx + 1}. {s.nombre}</Text>
                    <Text style={styles.listItemValue}>{Number(s.cantidad_ventas || 0)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderTitleWrap}>
                  <View style={[styles.chartIconWrap, styles.chartIconOrange]}>
                    <MaterialIcons name="spa" size={16} color="#ffffff" />
                  </View>
                <Text style={styles.chartTitle}>Top 5 servicios menos vendidos</Text>
                </View>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingServices ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : (
                <BarChart
                  data={buildBarData(
                    serviciosMenosVendidos.slice(0, 5),
                    (s) => Number(s.cantidad_ventas || 0),
                    (s) => s.nombre,
                    chartPalettes.orange
                  )}
                  barWidth={24}
                  spacing={18}
                  roundedTop
                  roundedBottom
                  hideRules
                  noOfSections={5}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor="#d1d5db"
                  isAnimated
                  disablePress
                  yAxisTextStyle={styles.yAxisText}
                  xAxisLabelTextStyle={styles.xAxisText}
                />
              )}

              <View style={styles.listContainer}>
                {serviciosMenosVendidos.slice(0, 5).map((s, idx) => (
                  <View key={`svc-less-${s.id_servicio ?? idx}`} style={styles.listItem}>
                    <Text style={styles.listItemLabel}>{idx + 1}. {s.nombre}</Text>
                    <Text style={styles.listItemValue}>{Number(s.cantidad_ventas || 0)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setResourcesExpanded((v) => !v)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Recursos</Text>
            <Text style={styles.sectionDescription}>Recursos más y menos utilizados (periodo seleccionado).</Text>
          </View>
          <MaterialIcons name={resourcesExpanded ? "expand-less" : "expand-more"} size={26} color="#374151" />
        </TouchableOpacity>

        {resourcesExpanded ? (
          <>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderTitleWrap}>
                  <View style={[styles.chartIconWrap, styles.chartIconTeal]}>
                    <MaterialIcons name="build" size={16} color="#ffffff" />
                  </View>
                <Text style={styles.chartTitle}>Top 3 recursos más usados</Text>
                </View>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingResources ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : (
                <BarChart
                  data={buildBarData(
                    recursosMasUsados.slice(0, 3),
                    (r) => Number(r.cantidad || 0),
                    (r) => r.nombre,
                    chartPalettes.teal
                  )}
                  barWidth={24}
                  spacing={18}
                  roundedTop
                  roundedBottom
                  hideRules
                  noOfSections={5}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor="#d1d5db"
                  isAnimated
                  disablePress
                  yAxisTextStyle={styles.yAxisText}
                  xAxisLabelTextStyle={styles.xAxisText}
                />
              )}

              <View style={styles.listContainer}>
                {recursosMasUsados.slice(0, 3).map((r, idx) => (
                  <View key={`res-more-${r.id_recurso ?? idx}`} style={styles.listItem}>
                    <Text style={styles.listItemLabel}>{idx + 1}. {r.nombre}</Text>
                    <Text style={styles.listItemValue}>{Number(r.cantidad || 0)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderTitleWrap}>
                  <View style={[styles.chartIconWrap, styles.chartIconViolet]}>
                    <MaterialIcons name="build" size={16} color="#ffffff" />
                  </View>
                <Text style={styles.chartTitle}>Top 3 recursos menos usados</Text>
                </View>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingResources ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : (
                <BarChart
                  data={buildBarData(
                    recursosMenosUsados.slice(0, 3),
                    (r) => Number(r.cantidad || 0),
                    (r) => r.nombre,
                    chartPalettes.violet
                  )}
                  barWidth={24}
                  spacing={18}
                  roundedTop
                  roundedBottom
                  hideRules
                  noOfSections={5}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor="#d1d5db"
                  isAnimated
                  disablePress
                  yAxisTextStyle={styles.yAxisText}
                  xAxisLabelTextStyle={styles.xAxisText}
                />
              )}

              <View style={styles.listContainer}>
                {recursosMenosUsados.slice(0, 3).map((r, idx) => (
                  <View key={`res-less-${r.id_recurso ?? idx}`} style={styles.listItem}>
                    <Text style={styles.listItemLabel}>{idx + 1}. {r.nombre}</Text>
                    <Text style={styles.listItemValue}>{Number(r.cantidad || 0)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setGastosExpanded((v) => !v)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Gastos</Text>
            <Text style={styles.sectionDescription}>Gastos del periodo seleccionado (últimos 5 periodos).</Text>
          </View>
          <MaterialIcons name={gastosExpanded ? "expand-less" : "expand-more"} size={26} color="#374151" />
        </TouchableOpacity>

        {gastosExpanded ? (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartHeaderTitleWrap}>
                <View style={[styles.chartIconWrap, styles.chartIconRed]}>
                  <MaterialIcons name="trending-down" size={16} color="#ffffff" />
                </View>
              <Text style={styles.chartTitle}>Gastos</Text>
              </View>
              <Text style={styles.chartSubtitle}>{selectedMonth ? "Últimos 5 meses" : "Últimos 5 años"}</Text>
            </View>

              {loadingGastos ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : gastoError ? (
              <Text style={styles.errorText}>{gastoError}</Text>
            ) : (
              <>
                <BarChart
                  data={buildBarData(
                    gastosChart,
                    (g) => Number(g.gastos || 0),
                    (g) => g.label,
                    chartPalettes.red
                  )}
                  barWidth={24}
                  spacing={18}
                  roundedTop
                  roundedBottom
                  hideRules
                  noOfSections={5}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor="#d1d5db"
                  isAnimated
                  disablePress
                  yAxisTextStyle={styles.yAxisText}
                  xAxisLabelTextStyle={styles.xAxisText}
                />

                <View style={styles.listContainer}>
                  {gastosChart.map((g, idx) => (
                    <View key={`gasto-${g.key ?? idx}`} style={styles.listItem}>
                      <Text style={styles.listItemLabel}>{g.label}</Text>
                      <Text style={styles.listItemValue}>{formatCurrency(Number(g.gastos || 0))}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        ) : null}

        <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setComprasExpanded((v) => !v)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Compras</Text>
            <Text style={styles.sectionDescription}>Gasto en compras y top 3 proveedores (periodo seleccionado).</Text>
          </View>
          <MaterialIcons name={comprasExpanded ? "expand-less" : "expand-more"} size={26} color="#374151" />
        </TouchableOpacity>

        {comprasExpanded ? (
          <>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderTitleWrap}>
                  <View style={[styles.chartIconWrap, styles.chartIconOrange]}>
                    <MaterialIcons name="shopping-cart" size={16} color="#ffffff" />
                  </View>
                <Text style={styles.chartTitle}>Gasto en compras</Text>
                </View>
                <Text style={styles.chartSubtitle}>{selectedMonth ? "Últimos 5 meses" : "Últimos 5 años"}</Text>
              </View>

              {loadingCompras ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : compraError ? (
                <Text style={styles.errorText}>{compraError}</Text>
              ) : (
                <>
                  <BarChart
                    data={buildBarData(
                      compraChart,
                      (c) => Number(c.compras || 0),
                      (c) => c.label,
                      chartPalettes.orange
                    )}
                    barWidth={24}
                    spacing={18}
                    roundedTop
                    roundedBottom
                    hideRules
                    noOfSections={5}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor="#d1d5db"
                    isAnimated
                    disablePress
                    yAxisTextStyle={styles.yAxisText}
                    xAxisLabelTextStyle={styles.xAxisText}
                  />

                  <View style={styles.listContainer}>
                    {compraChart.map((c, idx) => (
                      <View key={`compra-${c.key ?? idx}`} style={styles.listItem}>
                        <Text style={styles.listItemLabel}>{c.label}</Text>
                        <Text style={styles.listItemValue}>{formatCurrency(Number(c.compras || 0))}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderTitleWrap}>
                  <View style={[styles.chartIconWrap, styles.chartIconGreen]}>
                    <MaterialIcons name="local-shipping" size={16} color="#ffffff" />
                  </View>
                <Text style={styles.chartTitle}>Top 3 proveedores</Text>
                </View>
                <Text style={styles.chartSubtitle}>Proveedores con más compras</Text>
              </View>

              {loadingCompras ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : compraError ? (
                <Text style={styles.errorText}>{compraError}</Text>
              ) : (
                <>
                  <BarChart
                    data={buildBarData(
                      proveedoresTop,
                      (p) => Number(p.cantidad || p.total || 0),
                      (p) => p.nombre,
                      chartPalettes.green
                    )}
                    barWidth={28}
                    spacing={18}
                    roundedTop
                    roundedBottom
                    hideRules
                    noOfSections={5}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor="#d1d5db"
                    isAnimated
                    disablePress
                    yAxisTextStyle={styles.yAxisText}
                    xAxisLabelTextStyle={styles.xAxisText}
                  />

                  <View style={styles.listContainer}>
                    {proveedoresTop.map((p, idx) => (
                      <View key={`prov-${p.id_proveedor ?? idx}`} style={styles.listItem}>
                        <Text style={styles.listItemLabel}>{idx + 1}. {p.nombre}</Text>
                        <Text style={styles.listItemValue}>{Number(p.cantidad || 0)} compras — {formatCurrency(Number(p.total || 0))}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </>
        ) : null}

        <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setClientesExpanded((v) => !v)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Clientes</Text>
            <Text style={styles.sectionDescription}>Análisis de clientes: gasto, reservas, ventas y cancelaciones.</Text>
          </View>
          <MaterialIcons name={clientesExpanded ? "expand-less" : "expand-more"} size={26} color="#374151" />
        </TouchableOpacity>

        {clientesExpanded ? (
          <>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderTitleWrap}>
                  <View style={[styles.chartIconWrap, styles.chartIconIndigo]}>
                    <MaterialIcons name="groups" size={16} color="#ffffff" />
                  </View>
                <Text style={styles.chartTitle}>Top 3 clientes por gasto</Text>
                </View>
                <Text style={styles.chartSubtitle}>Dinero total gastado</Text>
              </View>

              {loadingClientes ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : clienteError ? (
                <Text style={styles.errorText}>{clienteError}</Text>
              ) : (
                <>
                  <BarChart
                    data={buildBarData(
                      clientesPorGasto,
                      (c) => Number(c.total_gastado || 0),
                      (_c, index) => String(index + 1),
                      chartPalettes.indigo
                    )}
                    barWidth={28}
                    spacing={18}
                    roundedTop
                    roundedBottom
                    hideRules
                    noOfSections={5}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor="#d1d5db"
                    isAnimated
                    disablePress
                    yAxisTextStyle={styles.yAxisText}
                    xAxisLabelTextStyle={styles.clientXAxisText}
                  />

                  <View style={styles.listContainer}>
                    {clientesPorGasto.map((c, idx) => (
                      <View key={`gasto-${c.id_cliente ?? idx}`} style={styles.listItem}>
                        <Text style={styles.listItemLabel}>{idx + 1}. {c.nombre} {c.apellido1}</Text>
                        <Text style={styles.listItemValue}>{formatCurrency(Number(c.total_gastado || 0))}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Top 3 clientes por reservas</Text>
                <Text style={styles.chartSubtitle}>Número de reservas realizadas</Text>
              </View>

              {loadingClientes ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : clienteError ? (
                <Text style={styles.errorText}>{clienteError}</Text>
              ) : (
                <>
                  <BarChart
                    data={buildBarData(
                      clientesPorReservas,
                      (c) => Number(c.num_reservas || 0),
                      (c) => getClientChartLabel(c),
                      chartPalettes.blue
                    )}
                    barWidth={28}
                    spacing={18}
                    roundedTop
                    roundedBottom
                    hideRules
                    noOfSections={5}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor="#d1d5db"
                    isAnimated
                    disablePress
                    yAxisTextStyle={styles.yAxisText}
                    xAxisLabelTextStyle={styles.clientXAxisText}
                  />

                  <View style={styles.listContainer}>
                    {clientesPorReservas.map((c, idx) => (
                      <View key={`res-${c.id_cliente ?? idx}`} style={styles.listItem}>
                        <Text style={styles.listItemLabel}>{idx + 1}. {c.nombre} {c.apellido1}</Text>
                        <Text style={styles.listItemValue}>{Number(c.num_reservas || 0)} reservas</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Top 3 clientes por ventas</Text>
                <Text style={styles.chartSubtitle}>Número de productos comprados</Text>
              </View>

              {loadingClientes ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : clienteError ? (
                <Text style={styles.errorText}>{clienteError}</Text>
              ) : (
                <>
                  <BarChart
                    data={buildBarData(
                      clientesPorVentas,
                      (c) => Number(c.num_productos_vendidos || 0),
                      (c) => getClientChartLabel(c),
                      chartPalettes.teal
                    )}
                    barWidth={28}
                    spacing={18}
                    roundedTop
                    roundedBottom
                    hideRules
                    noOfSections={5}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor="#d1d5db"
                    isAnimated
                    disablePress
                    yAxisTextStyle={styles.yAxisText}
                    xAxisLabelTextStyle={styles.clientXAxisText}
                  />

                  <View style={styles.listContainer}>
                    {clientesPorVentas.map((c, idx) => (
                      <View key={`vent-${c.id_cliente ?? idx}`} style={styles.listItem}>
                        <Text style={styles.listItemLabel}>{idx + 1}. {c.nombre} {c.apellido1}</Text>
                        <Text style={styles.listItemValue}>{Number(c.num_productos_vendidos || 0)} productos</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Top 3 clientes por cancelaciones</Text>
                <Text style={styles.chartSubtitle}>Número de reservas canceladas</Text>
              </View>

              {loadingClientes ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#1976D2" />
                </View>
              ) : clienteError ? (
                <Text style={styles.errorText}>{clienteError}</Text>
              ) : (
                <>
                  <BarChart
                    data={buildBarData(
                      clientesPorCanceladas,
                      (c) => Number(c.num_canceladas || 0),
                      (c) => getClientChartLabel(c),
                      chartPalettes.orange
                    )}
                    barWidth={28}
                    spacing={18}
                    roundedTop
                    roundedBottom
                    hideRules
                    noOfSections={5}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor="#d1d5db"
                    isAnimated
                    disablePress
                    yAxisTextStyle={styles.yAxisText}
                    xAxisLabelTextStyle={styles.clientXAxisText}
                  />

                  <View style={styles.listContainer}>
                    {clientesPorCanceladas.map((c, idx) => (
                      <View key={`canc-${c.id_cliente ?? idx}`} style={styles.listItem}>
                        <Text style={styles.listItemLabel}>{idx + 1}. {c.nombre} {c.apellido1}</Text>
                        <Text style={styles.listItemValue}>{Number(c.num_canceladas || 0)} canceladas</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </>
        ) : null}

          <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setReservasExpanded((v) => !v)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Reservas</Text>
              <Text style={styles.sectionDescription}>Servicios más reservados y meses más activos del año.</Text>
            </View>
            <MaterialIcons name={reservasExpanded ? "expand-less" : "expand-more"} size={26} color="#374151" />
          </TouchableOpacity>

          {reservasExpanded ? (
            <>
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderTitleWrap}>
                    <View style={[styles.chartIconWrap, styles.chartIconBlue]}>
                      <MaterialIcons name="event-available" size={16} color="#ffffff" />
                    </View>
                  <Text style={styles.chartTitle}>Top 3 servicios más reservados</Text>
                  </View>
                  <Text style={styles.chartSubtitle}>Total en el negocio</Text>
                </View>

                {loadingReservas ? (
                  <View style={styles.chartLoading}>
                    <ActivityIndicator size="large" color="#1976D2" />
                  </View>
                ) : reservaError ? (
                  <Text style={styles.errorText}>{reservaError}</Text>
                ) : (
                  <>
                    <BarChart
                      data={buildBarData(
                        serviciosMasReservados,
                        (s) => Number(s.cantidad || 0),
                        (s) => s.nombre,
                        chartPalettes.blue
                      )}
                      barWidth={28}
                      spacing={18}
                      roundedTop
                      roundedBottom
                      hideRules
                      noOfSections={5}
                      yAxisThickness={0}
                      xAxisThickness={1}
                      xAxisColor="#d1d5db"
                      isAnimated
                      disablePress
                      yAxisTextStyle={styles.yAxisText}
                      xAxisLabelTextStyle={styles.xAxisText}
                    />

                    <View style={styles.listContainer}>
                      {serviciosMasReservados.map((s, idx) => (
                        <View key={`srv-${s.id_servicio ?? idx}`} style={styles.listItem}>
                          <Text style={styles.listItemLabel}>{idx + 1}. {s.nombre}</Text>
                          <Text style={styles.listItemValue}>{Number(s.cantidad || 0)} reservas</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>

              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderTitleWrap}>
                    <View style={[styles.chartIconWrap, styles.chartIconViolet]}>
                      <MaterialIcons name="calendar-today" size={16} color="#ffffff" />
                    </View>
                  <Text style={styles.chartTitle}>Top 3 meses más reservados</Text>
                  </View>
                  <Text style={styles.chartSubtitle}>Año seleccionado</Text>
                </View>

                {loadingReservas ? (
                  <View style={styles.chartLoading}>
                    <ActivityIndicator size="large" color="#1976D2" />
                  </View>
                ) : reservaError ? (
                  <Text style={styles.errorText}>{reservaError}</Text>
                ) : (
                  <>
                    <BarChart
                      data={buildBarData(
                        mesesMasReservados,
                        (m) => Number(m.cantidad || 0),
                        (m) => m.label,
                        chartPalettes.violet
                      )}
                      barWidth={28}
                      spacing={18}
                      roundedTop
                      roundedBottom
                      hideRules
                      noOfSections={5}
                      yAxisThickness={0}
                      xAxisThickness={1}
                      xAxisColor="#d1d5db"
                      isAnimated
                      disablePress
                      yAxisTextStyle={styles.yAxisText}
                      xAxisLabelTextStyle={styles.xAxisText}
                    />

                    <View style={styles.listContainer}>
                      {mesesMasReservados.map((m, idx) => (
                        <View key={`mes-${m.key ?? idx}`} style={styles.listItem}>
                          <Text style={styles.listItemLabel}>{idx + 1}. {m.label}</Text>
                          <Text style={styles.listItemValue}>{Number(m.cantidad || 0)} reservas</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </>
          ) : null}
      </ScrollView>

      <Modal transparent visible={activePicker !== null} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setActivePicker(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>
              {activePicker === "year" ? "Seleccionar año" : activePicker === "month" ? "Seleccionar mes" : "Seleccionar día"}
            </Text>

            <ScrollView style={styles.modalOptionsList} showsVerticalScrollIndicator>
              {pickerOptions.map((option) => (
                <Pressable
                  key={`${activePicker}-${option.label}`}
                  style={[styles.modalOption, option.value === selectedPickerValue && styles.modalOptionSelected]}
                  onPress={() => selectOption(option.value)}
                >
                  <View style={styles.modalOptionRow}>
                    <Text style={styles.modalOptionText}>{option.label}</Text>
                    {option.value === selectedPickerValue ? (
                      <MaterialIcons name="check" size={18} color="#1976D2" />
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    marginRight: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 14,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#0f172a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 32,
    color: "#ffffff",
    fontWeight: "800",
  },
  heroDescription: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  heroMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  heroMetaText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "700",
  },
  filterCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  filterCardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  filterCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  filterActiveBadge: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
  },
  filterActiveBadgeText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionDescription: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  filterChip: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  filterChipGrow: {
    flex: 1,
  },
  filterChipActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
    shadowOpacity: 0.08,
    elevation: 2,
  },
  filterCardDisabled: {
    opacity: 0.5,
  },
  filterChipTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterBadge: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  filterBadgeActive: {
    color: "#1d4ed8",
  },
  filterLabel: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  filterValue: {
    marginTop: 2,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "800",
  },
  summaryCard: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
    borderWidth: 0,
  },
  summaryTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    color: "#0f172a",
    fontWeight: "700",
  },
  chartCard: {
    marginTop: 14,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  chartHeader: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  chartHeaderTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  chartIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chartIconGreen: {
    backgroundColor: "#16a34a",
  },
  chartIconRed: {
    backgroundColor: "#dc2626",
  },
  chartIconBlue: {
    backgroundColor: "#2563eb",
  },
  chartIconOrange: {
    backgroundColor: "#d97706",
  },
  chartIconTeal: {
    backgroundColor: "#0f766e",
  },
  chartIconViolet: {
    backgroundColor: "#7c3aed",
  },
  chartIconIndigo: {
    backgroundColor: "#4f46e5",
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    flexShrink: 1,
  },
  chartSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
    textAlign: "right",
  },
  collapsibleHeader: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  chartLoading: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  listItemLabel: {
    color: "#0f172a",
    fontSize: 14,
    flex: 1,
  },
  listItemValue: {
    color: "#374151",
    fontSize: 13,
    marginLeft: 8,
    width: 72,
    textAlign: "right",
    fontWeight: "600",
  },
  yAxisText: {
    color: "#64748b",
    fontSize: 11,
  },
  xAxisText: {
    color: "#64748b",
    fontSize: 11,
  },
  clientXAxisText: {
    color: "#64748b",
    fontSize: 9,
  },
  errorText: {
    color: "#b91c1c",
    backgroundColor: "#fff7f7",
    borderColor: "#fee2e2",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  metricPositive: {
    color: "#16a34a",
  },
  metricNegative: {
    color: "#b91c1c",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "75%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  modalOptionsList: {
    maxHeight: 420,
  },
  modalTitle: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "700",
    marginBottom: 8,
  },
  modalOption: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  modalOptionSelected: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: -8,
  },
  modalOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalOptionText: {
    fontSize: 15,
    color: "#1f2937",
    flex: 1,
  },
});

export default Dashboard;
