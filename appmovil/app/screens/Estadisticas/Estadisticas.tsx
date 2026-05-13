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

    const daysInMonth = new Date(selectedYear, month, 0).getDate();
    if (selectedDay && selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
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
      const url = API_ROUTES.estadisticasClientes(negocio.id_negocio);
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
  }, [negocio.id_negocio]);

  

  const loadServiceStats = useCallback(async () => {
    setLoadingServices(true);
    setServiceError("");

    try {
      const token = await AsyncStorage.getItem("token");
      const { start, end } = buildRangeForProducts(selectedYear, selectedMonth, selectedDay);
      const url = API_ROUTES.estadisticasServicios(negocio.id_negocio, undefined, start, end);
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
      const url = API_ROUTES.estadisticasProductos(negocio.id_negocio, undefined, start, end);
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
      const url = API_ROUTES.estadisticasRecursos(negocio.id_negocio, undefined, start, end);
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
    }, [loadDashboard, loadProductStats, loadServiceStats, loadResourceStats, loadGastoStats, loadCompraStats, loadClientStats])
  );

  useEffect(() => {
    loadDashboard();
    loadProductStats();
    loadServiceStats();
    loadResourceStats();
    loadGastoStats();
    loadCompraStats();
    loadClientStats();
  }, [loadDashboard, loadProductStats, loadServiceStats, loadResourceStats, loadGastoStats, loadCompraStats, loadClientStats]);

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Resumen General</Text>
        <Text style={styles.sectionDescription}>Mes requiere año y día requiere mes + año.</Text>

        <View style={styles.filtersRow}>
          <Pressable
            style={[styles.filterChip, styles.filterChipGrow]}
            onPress={() => setActivePicker("year")}
            testID="estadisticas-filter-year"
          >
            <Text style={styles.filterLabel}>Año</Text>
            <Text style={styles.filterValue}>{yearLabel}</Text>
          </Pressable>

          <Pressable
            style={[styles.filterChip, styles.filterChipGrow]}
            onPress={() => setActivePicker("month")}
            testID="estadisticas-filter-month"
          >
            <Text style={styles.filterLabel}>Mes</Text>
            <Text style={styles.filterValue}>{monthLabel}</Text>
          </Pressable>

          <Pressable
            style={[styles.filterChip, !selectedMonth && styles.filterCardDisabled]}
            onPress={() => selectedMonth && setActivePicker("day")}
            disabled={!selectedMonth}
            testID="estadisticas-filter-day"
          >
            <Text style={styles.filterLabel}>Día</Text>
            <Text style={styles.filterValue}>{dayLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Periodo activo</Text>
          <Text style={styles.summaryValue}>{summary || "Sin especificar"}</Text>
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
              <ActivityIndicator size="large" color="#0f766e" />
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
                <Text style={styles.chartTitle}>Top 5 más vendidos</Text>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingProducts ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : (
                <BarChart
                  data={productosMasVendidos.slice(0, 5).map((p) => ({ value: Number(p.cantidad_vendida || p.cantidad || 0), label: p.nombre }))}
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
                <Text style={styles.chartTitle}>Top 5 menos vendidos</Text>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingProducts ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : (
                <BarChart
                  data={productosMenosVendidos.slice(0, 5).map((p) => ({ value: Number(p.cantidad_vendida || p.cantidad || 0), label: p.nombre }))}
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
                <Text style={styles.chartTitle}>Top 5 servicios más vendidos</Text>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingServices ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : (
                <BarChart
                  data={serviciosMasVendidos.slice(0, 5).map((s) => ({ value: Number(s.cantidad_ventas || 0), label: s.nombre }))}
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
                <Text style={styles.chartTitle}>Top 5 servicios menos vendidos</Text>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingServices ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : (
                <BarChart
                  data={serviciosMenosVendidos.slice(0, 5).map((s) => ({ value: Number(s.cantidad_ventas || 0), label: s.nombre }))}
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
                <Text style={styles.chartTitle}>Top 3 recursos más usados</Text>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingResources ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : (
                <BarChart
                  data={recursosMasUsados.slice(0, 3).map((r) => ({ value: Number(r.cantidad || 0), label: r.nombre }))}
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
                <Text style={styles.chartTitle}>Top 3 recursos menos usados</Text>
                <Text style={styles.chartSubtitle}>Periodo seleccionado</Text>
              </View>

              {loadingResources ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : (
                <BarChart
                  data={recursosMenosUsados.slice(0, 3).map((r) => ({ value: Number(r.cantidad || 0), label: r.nombre }))}
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
              <Text style={styles.chartTitle}>Gastos</Text>
              <Text style={styles.chartSubtitle}>{selectedMonth ? "Últimos 5 meses" : "Últimos 5 años"}</Text>
            </View>

            {loadingGastos ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator size="large" color="#0f766e" />
              </View>
            ) : gastoError ? (
              <Text style={styles.errorText}>{gastoError}</Text>
            ) : (
              <>
                <BarChart
                  data={gastosChart.map((g) => ({ value: Number(g.gastos || 0), label: g.label }))}
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
                <Text style={styles.chartTitle}>Gasto en compras</Text>
                <Text style={styles.chartSubtitle}>{selectedMonth ? "Últimos 5 meses" : "Últimos 5 años"}</Text>
              </View>

              {loadingCompras ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : compraError ? (
                <Text style={styles.errorText}>{compraError}</Text>
              ) : (
                <>
                  <BarChart
                    data={compraChart.map((c) => ({ value: Number(c.compras || 0), label: c.label }))}
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
                <Text style={styles.chartTitle}>Top 3 proveedores</Text>
                <Text style={styles.chartSubtitle}>Proveedores con más compras en el periodo</Text>
              </View>

              {loadingCompras ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : compraError ? (
                <Text style={styles.errorText}>{compraError}</Text>
              ) : (
                <>
                  <BarChart
                    data={proveedoresTop.map((p) => ({ value: Number(p.cantidad || p.total || 0), label: p.nombre }))}
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
                <Text style={styles.chartTitle}>Top 3 clientes por gasto</Text>
                <Text style={styles.chartSubtitle}>Dinero total gastado (ventas + reservas)</Text>
              </View>

              {loadingClientes ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : clienteError ? (
                <Text style={styles.errorText}>{clienteError}</Text>
              ) : (
                <>
                  <BarChart
                    data={clientesPorGasto.map((c) => ({ value: Number(c.total_gastado || 0), label: `${c.nombre}` }))}
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
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : clienteError ? (
                <Text style={styles.errorText}>{clienteError}</Text>
              ) : (
                <>
                  <BarChart
                    data={clientesPorReservas.map((c) => ({ value: Number(c.num_reservas || 0), label: `${c.nombre}` }))}
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
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : clienteError ? (
                <Text style={styles.errorText}>{clienteError}</Text>
              ) : (
                <>
                  <BarChart
                    data={clientesPorVentas.map((c) => ({ value: Number(c.num_productos_vendidos || 0), label: `${c.nombre}` }))}
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
                  <ActivityIndicator size="large" color="#0f766e" />
                </View>
              ) : clienteError ? (
                <Text style={styles.errorText}>{clienteError}</Text>
              ) : (
                <>
                  <BarChart
                    data={clientesPorCanceladas.map((c) => ({ value: Number(c.num_canceladas || 0), label: `${c.nombre}` }))}
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
                  style={styles.modalOption}
                  onPress={() => selectOption(option.value)}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
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
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionDescription: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 56,
    justifyContent: "center",
  },
  filterChipGrow: {
    flex: 1,
  },
  filterCardDisabled: {
    opacity: 0.45,
  },
  filterLabel: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
  filterValue: {
    marginTop: 2,
    fontSize: 13,
    color: "#0f766e",
    fontWeight: "700",
  },
  summaryCard: {
    marginTop: 8,
    backgroundColor: "#ecfeff",
    borderWidth: 1,
    borderColor: "#a5f3fc",
    borderRadius: 14,
    padding: 14,
  },
  summaryTitle: {
    fontSize: 13,
    color: "#155e75",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    color: "#0c4a6e",
    fontWeight: "700",
  },
  chartCard: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
  },
  chartHeader: {
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  chartSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  collapsibleHeader: {
    marginTop: 8,
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
  },
  listItemLabel: {
    color: "#111827",
    fontSize: 13,
    flex: 1,
  },
  listItemValue: {
    color: "#6b7280",
    fontSize: 13,
    marginLeft: 8,
    width: 56,
    textAlign: "right",
  },
  yAxisText: {
    color: "#6b7280",
    fontSize: 11,
  },
  xAxisText: {
    color: "#6b7280",
    fontSize: 10,
  },
  errorText: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  metricPositive: {
    color: "#166534",
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
    maxWidth: 420,
    maxHeight: "75%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
  modalOptionText: {
    fontSize: 15,
    color: "#1f2937",
  },
});

export default Dashboard;
