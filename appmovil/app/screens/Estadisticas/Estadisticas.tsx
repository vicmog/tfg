import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import {
  DashboardStats,
  SalesStats,
  ReservaStats,
  ProductStats,
  ServiceStats,
  CompraStats,
} from "../types";
import { EstadisticasProps } from "./types";
import { StatCard, ChartCard, StatsFilter, FilterType } from "./components";

const Dashboard: React.FC<EstadisticasProps> = ({ route, navigation }) => {
  const { negocio } = route.params;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("month");

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);

  const [reservaStats, setReservaStats] = useState<ReservaStats | null>(null);
  const [reservaLoading, setReservaLoading] = useState(false);

  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [productLoading, setProductLoading] = useState(false);

  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null);
  const [serviceLoading, setServiceLoading] = useState(false);

  const [purchaseStats, setPurchaseStats] = useState<CompraStats | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const loadDashboardStats = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(API_ROUTES.estadisticasDashboard(negocio.id_negocio), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "No se pudieron obtener las estadísticas");
        return;
      }

      const data = await response.json();
      setDashboardStats(data.dashboard);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [negocio.id_negocio]);

  const loadSalesStats = useCallback(async () => {
    setSalesLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        API_ROUTES.estadisticasVentas(negocio.id_negocio, filter),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSalesStats(data.salesStats);
      }
    } catch {
      console.error("Error loading sales stats");
    } finally {
      setSalesLoading(false);
    }
  }, [negocio.id_negocio, filter]);

  const loadReservaStats = useCallback(async () => {
    setReservaLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        API_ROUTES.estadisticasReservas(negocio.id_negocio, filter),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReservaStats(data.reservaStats);
      }
    } catch {
      console.error("Error loading reserva stats");
    } finally {
      setReservaLoading(false);
    }
  }, [negocio.id_negocio, filter]);

  const loadProductStats = useCallback(async () => {
    setProductLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        API_ROUTES.estadisticasProductos(negocio.id_negocio, filter),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProductStats(data.productStats);
      }
    } catch {
      console.error("Error loading product stats");
    } finally {
      setProductLoading(false);
    }
  }, [negocio.id_negocio, filter]);

  const loadServiceStats = useCallback(async () => {
    setServiceLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        API_ROUTES.estadisticasServicios(negocio.id_negocio, filter),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setServiceStats(data.serviceStats);
      }
    } catch {
      console.error("Error loading service stats");
    } finally {
      setServiceLoading(false);
    }
  }, [negocio.id_negocio, filter]);

  const loadPurchaseStats = useCallback(async () => {
    setPurchaseLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        API_ROUTES.estadisticasCompras(negocio.id_negocio, filter),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPurchaseStats(data.purchaseStats);
      }
    } catch {
      console.error("Error loading purchase stats");
    } finally {
      setPurchaseLoading(false);
    }
  }, [negocio.id_negocio, filter]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardStats();
      loadSalesStats();
      loadReservaStats();
      loadProductStats();
      loadServiceStats();
      loadPurchaseStats();
    }, [
      loadDashboardStats,
      loadSalesStats,
      loadReservaStats,
      loadProductStats,
      loadServiceStats,
      loadPurchaseStats,
    ])
  );

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <View style={{ width: 40 }} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={20} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.filterContainer}>
        <StatsFilter currentFilter={filter} onFilterChange={handleFilterChange} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {dashboardStats && (
          <View>
            <Text style={styles.sectionTitle}>Resumen del Negocio</Text>

            <StatCard
              icon="trending-up"
              title="Ingresos Totales"
              value={formatCurrency(dashboardStats.ingresosTotales)}
              color="#10b981"
              backgroundColor="#d1fae5"
            />

            <StatCard
              icon="trending-down"
              title="Gastos Totales"
              value={formatCurrency(dashboardStats.gastosTotales)}
              color="#ef4444"
              backgroundColor="#fee2e2"
            />

            <StatCard
              icon="check-circle"
              title="Beneficio Neto"
              value={formatCurrency(dashboardStats.beneficioNeto)}
              color={dashboardStats.beneficioNeto >= 0 ? "#2563eb" : "#ef4444"}
              backgroundColor={
                dashboardStats.beneficioNeto >= 0 ? "#dbeafe" : "#fee2e2"
              }
            />

            <View style={styles.statsRow}>
              <View style={styles.statsCol}>
                <StatCard
                  icon="calendar-today"
                  title="Reservas"
                  value={dashboardStats.numReservas}
                  color="#8b5cf6"
                  backgroundColor="#ede9fe"
                />
              </View>
              <View style={styles.statsCol}>
                <StatCard
                  icon="shopping-cart"
                  title="Ventas"
                  value={dashboardStats.numVentas}
                  color="#f59e0b"
                  backgroundColor="#fef3c7"
                />
              </View>
            </View>

            <StatCard
              icon="people"
              title="Clientes"
              value={dashboardStats.numClientes}
              color="#06b6d4"
              backgroundColor="#cffafe"
            />
          </View>
        )}

        {salesStats && (
          <View>
            <Text style={styles.sectionTitle}>Estadísticas de Ventas</Text>

            <ChartCard
              title="Productos Más Vendidos"
              icon="inventory-2"
              loading={salesLoading}
              data={salesStats.productosMasVendidos.map((p) => ({
                label: p.nombre,
                value: `${p.cantidad} vtas`,
                secondary: `Ingresos: ${formatCurrency(p.ingresos)}`,
                color: "#2563eb",
                icon: "trending-up",
              }))}
            />

            <ChartCard
              title="Servicios Más Vendidos"
              icon="room-service"
              loading={salesLoading}
              data={salesStats.serviciosMasVendidos.map((s) => ({
                label: s.nombre,
                value: `${s.cantidad} vtas`,
                secondary: `Ingresos: ${formatCurrency(s.ingresos)}`,
                color: "#8b5cf6",
                icon: "trending-up",
              }))}
            />
          </View>
        )}

        {reservaStats && (
          <View>
            <Text style={styles.sectionTitle}>Estadísticas de Reservas</Text>

            <ChartCard
              title="Servicios Más Reservados"
              icon="room-service"
              loading={reservaLoading}
              data={reservaStats.serviciosMasReservados.map((s) => ({
                label: s.nombre,
                value: `${s.cantidad} res`,
                color: "#8b5cf6",
                icon: "calendar-today",
              }))}
            />

            <ChartCard
              title="Horarios con Más Reservas"
              icon="schedule"
              loading={reservaLoading}
              data={reservaStats.horasConMasReservas.map((h) => ({
                label: `${String(h.hora).padStart(2, "0")}:00 - ${String(h.hora + 1).padStart(
                  2,
                  "0"
                )}:00`,
                value: `${h.cantidad} res`,
                color: "#06b6d4",
                icon: "schedule",
              }))}
            />

            <ChartCard
              title="Estado de Reservas"
              icon="event-note"
              loading={reservaLoading}
              data={reservaStats.reservasPorEstado.map((r) => ({
                label: r.estado || "Sin estado",
                value: r.cantidad,
                color:
                  r.estado === "completada"
                    ? "#10b981"
                    : r.estado === "cancelada"
                      ? "#ef4444"
                      : "#2563eb",
                icon:
                  r.estado === "completada"
                    ? "check-circle"
                    : r.estado === "cancelada"
                      ? "cancel"
                      : "schedule",
              }))}
            />
          </View>
        )}

        {productStats && (
          <View>
            <Text style={styles.sectionTitle}>Estadísticas de Productos</Text>

            <ChartCard
              title="Productos Más Vendidos"
              icon="inventory-2"
              loading={productLoading}
              data={productStats.productosMasVendidos.map((p) => ({
                label: p.nombre,
                value: `${p.cantidad_vendida} u`,
                secondary: `Facturación: ${formatCurrency(p.facturacion)}`,
                color: "#2563eb",
                icon: "trending-up",
              }))}
            />

            <ChartCard
              title="Productos con Mayor Facturación"
              icon="trending-up"
              loading={productLoading}
              data={productStats.productosConMayorFacturacion.map((p) => ({
                label: p.nombre,
                value: formatCurrency(p.facturacion),
                secondary: `${p.cantidad_vendida} unidades vendidas`,
                color: "#10b981",
                icon: "paid",
              }))}
            />

            <ChartCard
              title="Productos con Stock Bajo"
              icon="warning"
              loading={productLoading}
              emptyMessage="¡Todos los productos tienen stock suficiente!"
              data={productStats.productosConStockBajo.map((p) => ({
                label: p.nombre,
                value: `${p.stock}/${p.stock_minimo}`,
                secondary: `Min: ${p.stock_minimo} | Precio: ${formatCurrency(p.precio_venta)}`,
                color: "#ef4444",
                icon: "warning",
              }))}
            />
          </View>
        )}

        {serviceStats && (
          <View>
            <Text style={styles.sectionTitle}>Estadísticas de Servicios</Text>

            <ChartCard
              title="Servicios Más Reservados"
              icon="room-service"
              loading={serviceLoading}
              data={serviceStats.serviciosMasReservados.map((s) => ({
                label: s.nombre,
                value: `${s.cantidad_reservas} res`,
                color: "#8b5cf6",
                icon: "calendar-today",
              }))}
            />

            <ChartCard
              title="Servicios con Mayor Facturación"
              icon="paid"
              loading={serviceLoading}
              data={serviceStats.serviciosConMayorFacturacion.map((s) => ({
                label: s.nombre,
                value: formatCurrency(s.facturacion_total),
                secondary: `${s.cantidad_ventas} ventas`,
                color: "#10b981",
                icon: "trending-up",
              }))}
            />

            <ChartCard
              title="Duración Promedio de Servicios"
              icon="schedule"
              loading={serviceLoading}
              data={serviceStats.duracionMediaServicios.map((s) => ({
                label: s.nombre,
                value: `${Math.round(s.duracion_promedio)} min`,
                secondary: `${s.total_reservas} reservas`,
                color: "#06b6d4",
                icon: "schedule",
              }))}
            />
          </View>
        )}

        {purchaseStats && (
          <View>
            <Text style={styles.sectionTitle}>Estadísticas de Compras</Text>

            <ChartCard
              title="Compras por Día"
              icon="shopping-cart"
              loading={purchaseLoading}
              data={purchaseStats.comprasPorDia.map((c) => ({
                label: new Date(c.fecha).toLocaleDateString("es-ES"),
                value: `${c.cantidad} compras`,
                secondary: `Total: ${formatCurrency(c.total)}`,
                color: "#f97316",
                icon: "shopping-cart",
              }))}
            />

            <ChartCard
              title="Estado de Compras"
              icon="fact-check"
              loading={purchaseLoading}
              data={purchaseStats.comprasPorEstado.map((c) => ({
                label: c.estado || "Sin estado",
                value: `${c.cantidad} compras`,
                secondary: `Total: ${formatCurrency(c.total)}`,
                color:
                  c.estado === "completada"
                    ? "#10b981"
                    : c.estado === "cancelada"
                      ? "#ef4444"
                      : "#f97316",
                icon:
                  c.estado === "completada"
                    ? "check-circle"
                    : c.estado === "cancelada"
                      ? "cancel"
                      : "shopping-cart",
              }))}
            />

            <ChartCard
              title="Productos Más Comprados"
              icon="inventory-2"
              loading={purchaseLoading}
              data={purchaseStats.productosMasComprados.map((p) => ({
                label: p.nombre,
                value: `${p.cantidad_esperada} u`,
                secondary: `Llegaron: ${p.cantidad_llegada} | Total: ${formatCurrency(p.importe_total)}`,
                color: "#f59e0b",
                icon: "local-shipping",
              }))}
            />
          </View>
        )}

        <View style={styles.padding} />
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    padding: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#dc2626",
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 20,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statsCol: {
    flex: 1,
  },
  padding: {
    height: 20,
  },
});

export default Dashboard;
