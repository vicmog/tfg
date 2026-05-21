import React, { useCallback, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Pressable,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { Venta, Cliente, Producto, Servicio, VentaItem } from "../types";
import { VentasProps } from "./types";
import {
  CONFIRM_DELETE_TITLE,
  CONFIRM_DELETE_MESSAGE,
  CONFIRM_DELETE_CANCEL,
  CONFIRM_DELETE_ACCEPT,
  DEFAULT_DELETE_ERROR,
  DELETE_SUCCESS_MESSAGE,
  CONNECTION_ERROR,
  REESTRABLERCER_FILTROS,
} from "./constants";

const normalizeSearchText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const createEmptyVentaItem = (ventaType: "producto" | "servicio") =>
  ventaType === "producto" ? { id_producto: 0, cantidad: 1 } : { id_servicio: 0 };

const toLocalDateKey = (value: string | Date) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateOnlyDisplay = (value: string | Date) => {
  const date = new Date(value);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const dateFromKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const buildCalendarMatrix = (cursor: Date) => {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];

  for (let i = 0; i < startWeekDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

const Ventas: React.FC<VentasProps> = ({ route, navigation }) => {
  const { negocio } = route.params;
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingVenta, setSavingVenta] = useState(false);
  const [deletingVentaId, setDeletingVentaId] = useState<number | null>(null);
  const [confirmDeleteVentaId, setConfirmDeleteVentaId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalError, setModalError] = useState("");
  const [searchVentasClienteText, setSearchVentasClienteText] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [editingWhichDate, setEditingWhichDate] = useState<"desde" | "hasta" | null>(null);
  const [clienteSearchText, setClienteSearchText] = useState("");
  const [productoSearchText, setProductoSearchText] = useState("");
  const [servicioSearchText, setServicioSearchText] = useState("");

  const [ventaType, setVentaType] = useState<"producto" | "servicio">("producto");
  const [selectedCliente, setSelectedCliente] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<VentaItem[]>([]);
  const [clienteEmail, setClienteEmail] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [precioTotal, setPrecioTotal] = useState("");
  const [fecha, setFecha] = useState<string>(toLocalDateKey(new Date()));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerCursor, setDatePickerCursor] = useState<Date>(new Date());
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [viewVentaModalVisible, setViewVentaModalVisible] = useState(false);
  const [viewVentaLoading, setViewVentaLoading] = useState(false);
  const [viewVentaError, setViewVentaError] = useState("");

  const normalizedRole = (negocio.rol || "").toLowerCase();
  const canManageVentas = normalizedRole === "jefe" || normalizedRole === "admin";
  const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
  const webCalendarCells = buildCalendarMatrix(datePickerCursor);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await AsyncStorage.getItem("token");

      // Cargar ventas
      const ventasResponse = await fetch(API_ROUTES.ventasByNegocio(negocio.id_negocio), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (ventasResponse.ok) {
        const ventasData = await ventasResponse.json();
        setVentas((ventasData.ventas || []) as Venta[]);
      } else {
        const data = await ventasResponse.json();
        setError(data.message || "No se pudieron obtener las ventas");
      }

      // Cargar clientes
      const clientesResponse = await fetch(API_ROUTES.clientesByNegocio(negocio.id_negocio), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (clientesResponse.ok) {
        const clientesData = await clientesResponse.json();
        setClientes((clientesData.clientes || []) as Cliente[]);
      }

      // Cargar productos
      const productosResponse = await fetch(API_ROUTES.productosByNegocio(negocio.id_negocio), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (productosResponse.ok) {
        const productosData = await productosResponse.json();
        setProductos((productosData.productos || []) as Producto[]);
      }

      // Cargar servicios
      const serviciosResponse = await fetch(API_ROUTES.serviciosByNegocio(negocio.id_negocio), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (serviciosResponse.ok) {
        const serviciosData = await serviciosResponse.json();
        setServicios((serviciosData.servicios || []) as Servicio[]);
      }
    } catch {
      setError("Error de conexion. Intentalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [negocio.id_negocio]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredVentas = useMemo(() => {
    return ventas.filter((v) => {
      if (v.tipo !== ventaType) return false;

      if (searchVentasClienteText.trim()) {
        const query = normalizeSearchText(searchVentasClienteText.trim());
        const cliente = clientes.find((c) => c.id_cliente === v.id_cliente);
        if (!cliente) return false;
        const clienteText = normalizeSearchText(
          `${cliente.nombre || ""} ${cliente.apellido1 || ""} ${cliente.apellido2 || ""} ${cliente.email || ""}`
        );
        if (!clienteText.includes(query)) return false;
      }

      if (fechaDesde || fechaHasta) {
        const ventaDate = new Date(v.fecha);
        if (fechaDesde) {
          const desdeDate = new Date(fechaDesde);
          if (ventaDate < desdeDate) return false;
        }
        if (fechaHasta) {
          const hastaDate = new Date(fechaHasta);
          hastaDate.setHours(23, 59, 59, 999);
          if (ventaDate > hastaDate) return false;
        }
      }

      return true;
    });
  }, [ventas, ventaType, clientes, searchVentasClienteText, fechaDesde, fechaHasta]);

  const filteredClientes = useMemo(() => {
    const query = normalizeSearchText(clienteSearchText.trim());

    if (!query) {
      return clientes;
    }

    return clientes.filter((cliente) => {
      const searchableText = normalizeSearchText(
        [cliente.nombre, cliente.apellido1, cliente.apellido2, cliente.email, cliente.numero_telefono]
          .filter(Boolean)
          .join(" ")
      );

      return searchableText.includes(query);
    });
  }, [clienteSearchText, clientes]);

  const filteredProductos = useMemo(() => {
    const query = normalizeSearchText(productoSearchText.trim());

    if (!query) {
      return productos;
    }

    return productos.filter((producto) => {
      const searchableText = normalizeSearchText(
        [producto.nombre, producto.referencia, producto.categoria, producto.proveedor_nombre]
          .filter(Boolean)
          .join(" ")
      );

      return searchableText.includes(query);
    });
  }, [productoSearchText, productos]);

  const filteredServicios = useMemo(() => {
    const query = normalizeSearchText(servicioSearchText.trim());

    if (!query) {
      return servicios;
    }

    return servicios.filter((servicio) => {
      const searchableText = normalizeSearchText([servicio.nombre, servicio.descripcion].filter(Boolean).join(" "));

      return searchableText.includes(query);
    });
  }, [servicioSearchText, servicios]);

  const precioTotalCalculado = useMemo(() => {
    if (ventaType === "producto") {
      return selectedItems.reduce((acc, item) => {
        const producto = productos.find((entry) => entry.id_producto === item.id_producto);
        const cantidad = Number.isFinite(item.cantidad) && item.cantidad && item.cantidad > 0 ? item.cantidad : 1;

        if (!producto) {
          return acc;
        }

        return acc + producto.precio_venta * cantidad;
      }, 0);
    }

    return selectedItems.reduce((acc, item) => {
      const servicio = servicios.find((entry) => entry.id_servicio === item.id_servicio);

      if (!servicio) {
        return acc;
      }

      return acc + servicio.precio;
    }, 0);
  }, [productos, selectedItems, servicios, ventaType]);

  const handleOpenVentaModal = () => {
    setModalVisible(true);
    setVentaType("producto");
    setSelectedCliente(null);
    setSelectedItems([createEmptyVentaItem("producto")]);
    setPrecioTotal("");
    setSendEmail(false);
    setClienteEmail("");
    setClienteSearchText("");
    setProductoSearchText("");
    setServicioSearchText("");
    setFecha(toLocalDateKey(new Date()));
    setDatePickerCursor(new Date());
    setDatePickerVisible(false);
    setModalError("");
  };

  const handleClearFilters = () => {
    setVentaType("producto");
    setSearchVentasClienteText("");
    setFechaDesde("");
    setFechaHasta("");
  };

  const handleSelectFecha = (date: Date) => {
    if (editingWhichDate === "desde") {
      setFechaDesde(toLocalDateKey(date));
    } else if (editingWhichDate === "hasta") {
      setFechaHasta(toLocalDateKey(date));
    }
    setDatePickerVisible(false);
    setEditingWhichDate(null);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    if (Platform.OS !== "ios") {
      setDatePickerVisible(false);
    }

    if (event.type === "dismissed" || !selectedDateValue) {
      return;
    }

    setFecha(toLocalDateKey(selectedDateValue));
  };

  const handleOpenDatePicker = () => {
    const selectedDate = dateFromKey(fecha);
    setDatePickerCursor(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    setDatePickerVisible(true);
  };

  const handleSelectDateFromCalendar = (day: number) => {
    const pickedDate = new Date(datePickerCursor.getFullYear(), datePickerCursor.getMonth(), day);
    setFecha(toLocalDateKey(pickedDate));
    setDatePickerVisible(false);
  };

  const handleCloseVentaModal = () => {
    setModalVisible(false);
    setModalError("");
    setClienteSearchText("");
    setProductoSearchText("");
    setServicioSearchText("");
  };

  const handleOpenViewVentaModal = async (venta: Venta) => {
    setSelectedVenta(venta);
    setViewVentaModalVisible(true);
    setViewVentaLoading(true);
    setViewVentaError("");

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(API_ROUTES.ventaById(venta.id_venta), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        setViewVentaError(data.message || "No se pudieron cargar los detalles de la venta");
        return;
      }

      const data = await response.json();
      if (data.venta) {
        setSelectedVenta(data.venta as Venta);
      }
    } catch {
      setViewVentaError("Error de conexion. Intentalo de nuevo.");
    } finally {
      setViewVentaLoading(false);
    }
  };

  const handleCloseViewVentaModal = () => {
    setViewVentaModalVisible(false);
    setSelectedVenta(null);
  };

  const handleChangeVentaType = (nextType: "producto" | "servicio") => {
    setVentaType(nextType);
    setSelectedItems([createEmptyVentaItem(nextType)]);
  };

  const handleAddItem = () => {
    if (ventaType === "producto") {
      setSelectedItems([...selectedItems, { id_producto: 0, cantidad: 1 }]);
    } else {
      setSelectedItems([...selectedItems, { id_servicio: 0 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const nextItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(nextItems.length > 0 ? nextItems : [createEmptyVentaItem(ventaType)]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  const handleCreateVenta = async () => {
    if (!selectedCliente) {
      setModalError("Debe seleccionar un cliente");
      return;
    }

    if (selectedItems.length === 0) {
      setModalError("Debe seleccionar al menos un producto o servicio");
      return;
    }

    if (precioTotalCalculado <= 0) {
      setModalError("Debe seleccionar al menos un producto o servicio válido");
      return;
    }

    setSavingVenta(true);
    setModalError("");
    setSuccess("");

    try {
      const token = await AsyncStorage.getItem("token");
      const cliente = clientes.find((c) => c.id_cliente === selectedCliente);

      const ventaPayload = {
        id_negocio: negocio.id_negocio,
        id_cliente: selectedCliente,
        tipo: ventaType,
        items: selectedItems,
        precio_total: precioTotalCalculado,
        fecha: fecha,
      };

      const response = await fetch(API_ROUTES.ventas, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ventaPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        setModalError(data.message || "No se pudo crear la venta");
        return;
      }

      // Enviar email si está activado
      if (sendEmail && data.venta?.id_venta) {
        try {
          await fetch(API_ROUTES.sendVentaEmailById(data.venta.id_venta), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (emailError) {
          // Email no crítico, continuar
          console.log("Email no enviado:", emailError);
        }
      }

      setSuccess(data.message || "Venta creada correctamente");
      setSelectedCliente(null);
      setSelectedItems([]);
      setPrecioTotal("");
      setSendEmail(false);
      setClienteEmail("");
      setModalVisible(false);
      await loadData();
    } catch {
      setModalError("Error de conexion. Intentalo de nuevo.");
    } finally {
      setSavingVenta(false);
    }
  };

  const handleDeleteVenta = async (ventaId: number) => {
    setError("");
    setSuccess("");
    setDeletingVentaId(ventaId);

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(API_ROUTES.deleteVentaById(ventaId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || DEFAULT_DELETE_ERROR);
        return;
      }

      setSuccess(DELETE_SUCCESS_MESSAGE);
      setConfirmDeleteVentaId(null);
      await loadData();
    } catch {
      setError(CONNECTION_ERROR);
    } finally {
      setDeletingVentaId(null);
    }
  };

  const handleAskDeleteVenta = (ventaId: number) => {
    setError("");
    setSuccess("");
    setConfirmDeleteVentaId(ventaId);
  };

  const handleCancelDeleteVenta = () => {
    setConfirmDeleteVentaId(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const getVentaItemLabel = (item: VentaItem) => {
    if (selectedVenta?.tipo === "producto") {
      const producto = productos.find((entry) => entry.id_producto === item.id_producto);
      return producto?.nombre || `Producto #${item.id_producto ?? "?"}`;
    }

    const servicio = servicios.find((entry) => entry.id_servicio === item.id_servicio);
    return servicio?.nombre || `Servicio #${item.id_servicio ?? "?"}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity style={styles.heroBackButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          {canManageVentas && (
            <TouchableOpacity style={styles.addButton} onPress={handleOpenVentaModal}>
              <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.addButtonText}>Añadir Venta</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.heroBody}>
          <Text style={styles.headerTitle}>Ventas</Text>
          <Text style={styles.subtitle}>{normalizedRole === 'admin' ? 'Administrador' : normalizedRole === 'jefe' ? 'Jefe' : 'Trabajador'} · {ventas.length} ventas</Text>

          <View style={styles.heroSearchBox}>
            <MaterialIcons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.heroSearchInput}
              placeholder="Buscar por cliente..."
              value={searchVentasClienteText}
              onChangeText={setSearchVentasClienteText}
              placeholderTextColor="#94a3b8"
            />
            {searchVentasClienteText ? (
              <TouchableOpacity onPress={() => setSearchVentasClienteText("")} style={styles.heroSearchClearButton}>
                <MaterialIcons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* Error Box */}
      {error ? (
        <View style={styles.feedbackBox}>
          <MaterialIcons name="error-outline" size={20} color="#dc2626" />
          <Text style={styles.feedbackText}>{error}</Text>
        </View>
      ) : null}

      {/* Success Box */}
      {success ? (
        <View style={[styles.feedbackBox, styles.successBox]}>
          <MaterialIcons name="check-circle-outline" size={20} color="#16a34a" />
          <Text style={[styles.feedbackText, styles.successText]}>{success}</Text>
        </View>
      ) : null}

      <View style={styles.filterCard}>
        <TouchableOpacity style={styles.filterHeader} onPress={() => setFiltersExpanded((value) => !value)}>
          <View style={styles.filterHeaderLeft}>
            <View style={styles.filterHeaderIcon}>
              <MaterialIcons name="tune" size={18} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.filterTitle}>Filtros</Text>
              <Text style={styles.filterSubtitle}>Producto o servicio y rango de fechas</Text>
            </View>
          </View>
          <MaterialIcons name={filtersExpanded ? "expand-less" : "expand-more"} size={26} color="#475569" />
        </TouchableOpacity>

        {filtersExpanded ? (
          <View style={styles.filterBody}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, ventaType === "producto" && styles.toggleButtonActive]}
                onPress={() => setVentaType("producto")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    ventaType === "producto" && styles.toggleTextActive,
                  ]}
                >
                  Productos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, ventaType === "servicio" && styles.toggleButtonActive]}
                onPress={() => setVentaType("servicio")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    ventaType === "servicio" && styles.toggleTextActive,
                  ]}
                >
                  Servicios
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateFilterRow}>
              <TouchableOpacity
                style={[styles.filterButton, fechaDesde && styles.filterButtonActive]}
                onPress={() => {
                  const date = fechaDesde ? new Date(fechaDesde) : new Date();
                  setDatePickerCursor(date);
                  setEditingWhichDate("desde");
                  setDatePickerVisible(true);
                }}
              >
                <MaterialIcons name="date-range" size={16} color={fechaDesde ? "#fff" : "#64748b"} />
                <Text style={[styles.filterButtonText, fechaDesde && styles.filterButtonTextActive]}>
                  {fechaDesde ? toDateOnlyDisplay(fechaDesde) : "Desde"}
                </Text>
                {fechaDesde && (
                  <TouchableOpacity onPress={() => setFechaDesde("")}>
                    <MaterialIcons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, fechaHasta && styles.filterButtonActive]}
                onPress={() => {
                  const date = fechaHasta ? new Date(fechaHasta) : new Date();
                  setDatePickerCursor(date);
                  setEditingWhichDate("hasta");
                  setDatePickerVisible(true);
                }}
              >
                <MaterialIcons name="date-range" size={16} color={fechaHasta ? "#fff" : "#64748b"} />
                <Text style={[styles.filterButtonText, fechaHasta && styles.filterButtonTextActive]}>
                  {fechaHasta ? toDateOnlyDisplay(fechaHasta) : "Hasta"}
                </Text>
                {fechaHasta && (
                  <TouchableOpacity onPress={() => setFechaHasta("")}>
                    <MaterialIcons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {(ventaType !== "producto" || fechaDesde || fechaHasta) && (
              <TouchableOpacity style={styles.filterClearButton} onPress={handleClearFilters}>
                <MaterialIcons name="clear-all" size={16} color="#64748b" />
                <Text style={styles.filterClearText}>{REESTRABLERCER_FILTROS}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>

      {}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
        </View>
      ) : filteredVentas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>
            No hay ventas de {ventaType}s registradas
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {filteredVentas.map((venta) => {
            const cliente = clientes.find((c) => c.id_cliente === venta.id_cliente);
            return (
              <Pressable 
                key={venta.id_venta} 
                style={styles.card}
                onPress={() => handleOpenViewVentaModal(venta)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>
                      {cliente?.nombre || "Cliente desconocido"}
                    </Text>
                    <View style={styles.amountBadge}>
                      <Text style={styles.amountText}>
                        {formatPrice(venta.precio_total)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <MaterialIcons name="event" size={16} color="#6b7280" />
                  <Text style={styles.metaText}>{formatDate(venta.fecha)}</Text>
                </View>
                {canManageVentas && (
                  <View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate("EditarVenta", { negocio, venta })}
                      >
                        <MaterialIcons name="edit" size={18} color="#1976D2" />
                        <Text style={styles.editButtonText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deleteButton, deletingVentaId === venta.id_venta && styles.deleteButtonDisabled]}
                        disabled={deletingVentaId === venta.id_venta}
                        onPress={() => handleAskDeleteVenta(venta.id_venta)}
                      >
                        {deletingVentaId === venta.id_venta ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <MaterialIcons name="delete" size={18} color="#fff" />
                        )}
                        <Text style={styles.deleteButtonText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>

                    {confirmDeleteVentaId === venta.id_venta ? (
                      <View style={styles.confirmBox}>
                        <Text style={styles.confirmTitle}>{CONFIRM_DELETE_TITLE}</Text>
                        <Text style={styles.confirmMessage}>{CONFIRM_DELETE_MESSAGE}</Text>
                        <View style={styles.confirmActions}>
                          <TouchableOpacity
                            style={styles.confirmCancelButton}
                            onPress={handleCancelDeleteVenta}
                          >
                            <Text style={styles.confirmCancelText}>{CONFIRM_DELETE_CANCEL}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.confirmDeleteButton}
                            onPress={() => handleDeleteVenta(venta.id_venta)}
                            disabled={deletingVentaId === venta.id_venta}
                          >
                            <Text style={styles.confirmDeleteText}>{CONFIRM_DELETE_ACCEPT}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleCloseVentaModal}>
        <View style={[styles.modalOverlay, styles.modalOverlayBottom]}>
          <View style={[styles.modalCard, styles.modalCardBottom]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseVentaModal}>
                <MaterialIcons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nueva Venta</Text>
              <View style={{ width: 24 }} />
            </View>

          {modalError ? (
            <View style={[styles.feedbackBox, styles.modalError]}>
              <MaterialIcons name="error-outline" size={20} color="#dc2626" />
              <Text style={styles.feedbackText}>{modalError}</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Tipo Toggle */}
            <Text style={styles.label}>Tipo de Venta</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  ventaType === "producto" && styles.toggleButtonActive,
                ]}
                onPress={() => handleChangeVentaType("producto")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    ventaType === "producto" && styles.toggleTextActive,
                  ]}
                >
                  Productos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  ventaType === "servicio" && styles.toggleButtonActive,
                ]}
                onPress={() => handleChangeVentaType("servicio")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    ventaType === "servicio" && styles.toggleTextActive,
                  ]}
                >
                  Servicios
                </Text>
              </TouchableOpacity>
            </View>

            {}
            <Text style={styles.label}>Cliente</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cliente por nombre, email o teléfono"
              value={clienteSearchText}
              onChangeText={setClienteSearchText}
            />
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clienteList}>
                {filteredClientes.length === 0 ? (
                  <Text style={styles.emptyPickerText}>No hay clientes que coincidan</Text>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TouchableOpacity
                      key={cliente.id_cliente}
                      style={[
                        styles.clienteButton,
                        selectedCliente === cliente.id_cliente && styles.clienteButtonActive,
                      ]}
                      onPress={() => {
                        setSelectedCliente(cliente.id_cliente);
                        setClienteEmail(cliente.email || "");
                      }}
                    >
                      <Text
                        style={[
                          styles.clienteButtonText,
                          selectedCliente === cliente.id_cliente && styles.clienteButtonTextActive,
                        ]}
                      >
                        {cliente.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>

            {}
            <View style={styles.itemsSection}>
              <Text style={styles.label}>
                {ventaType === "producto" ? "Productos" : "Servicios"}
              </Text>
              <TextInput
                style={styles.searchInput}
                placeholder={
                  ventaType === "producto"
                    ? "Buscar producto por nombre, referencia o categoría"
                    : "Buscar servicio por nombre o descripción"
                }
                value={ventaType === "producto" ? productoSearchText : servicioSearchText}
                onChangeText={ventaType === "producto" ? setProductoSearchText : setServicioSearchText}
              />
              {selectedItems.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.itemSelect}>
                      {ventaType === "producto" && (
                        <>
                          {filteredProductos.map((prod) => (
                            <TouchableOpacity
                              key={prod.id_producto}
                              style={[
                                styles.itemButton,
                                item.id_producto === prod.id_producto &&
                                  styles.itemButtonActive,
                              ]}
                              onPress={() =>
                                handleUpdateItem(
                                  index,
                                  "id_producto",
                                  prod.id_producto
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.itemButtonText,
                                  item.id_producto === prod.id_producto &&
                                    styles.itemButtonTextActive,
                                ]}
                              >
                                {prod.nombre}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </>
                      )}
                      {ventaType === "servicio" && (
                        <>
                          {filteredServicios.map((serv) => (
                            <TouchableOpacity
                              key={serv.id_servicio}
                              style={[
                                styles.itemButton,
                                item.id_servicio === serv.id_servicio &&
                                  styles.itemButtonActive,
                              ]}
                              onPress={() =>
                                handleUpdateItem(
                                  index,
                                  "id_servicio",
                                  serv.id_servicio
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.itemButtonText,
                                  item.id_servicio === serv.id_servicio &&
                                    styles.itemButtonTextActive,
                                ]}
                              >
                                {serv.nombre}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </>
                      )}
                    </View>
                  </ScrollView>

                  {ventaType === "producto" && (
                    <View style={styles.cantidadContainer}>
                      <Text style={styles.cantidadLabel}>Cant:</Text>
                      <TextInput
                        style={styles.cantidadInput}
                        keyboardType="number-pad"
                        placeholder="1"
                        value={`${item.cantidad || 1}`}
                        onChangeText={(text) =>
                          handleUpdateItem(
                            index,
                            "cantidad",
                            text ? parseInt(text) : 1
                          )
                        }
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.deleteItemButton}
                    onPress={() => handleRemoveItem(index)}
                  >
                    <MaterialIcons name="delete" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}

                <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={handleAddItem}
                  >
                    <MaterialIcons name="add-circle-outline" size={20} color="#1976D2" />
                    <Text style={styles.addItemText}>
                      Agregar {ventaType === "producto" ? "Producto" : "Servicio"}
                    </Text>
                  </TouchableOpacity>
            </View>

            {}
            <Text style={styles.label}>Precio Total (€)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={precioTotalCalculado.toFixed(2)}
              editable={false}
            />

            {/* Fecha */}
            <Text style={styles.label}>Fecha</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={handleOpenDatePicker}
            >
              <Text style={styles.selectorValue}>{toDateOnlyDisplay(fecha)}</Text>
              <MaterialIcons name="event" size={20} color="#6b7280" />
            </TouchableOpacity>

            {datePickerVisible ? (
              Platform.OS === "web" ? (
                <View style={styles.inlineCalendarCard}>
                  <View style={styles.inlineCalendarHeader}>
                    <TouchableOpacity
                      onPress={() =>
                        setDatePickerCursor(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                        )
                      }
                    >
                      <MaterialIcons name="chevron-left" size={20} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.inlineCalendarTitle}>
                      {datePickerCursor.toLocaleDateString("es-ES", {
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setDatePickerCursor(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                        )
                      }
                    >
                      <MaterialIcons name="chevron-right" size={20} color="#374151" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inlineWeekRow}>
                    {WEEK_LABELS.map((label) => (
                      <Text key={label} style={styles.inlineWeekLabel}>
                        {label}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.inlineDaysGrid}>
                    {webCalendarCells.map((day, index) => {
                      if (day === null) {
                        return <View key={`empty-${index}`} style={styles.inlineDayCell} />;
                      }

                      const dayKey = toLocalDateKey(
                        new Date(datePickerCursor.getFullYear(), datePickerCursor.getMonth(), day)
                      );
                      const isSelected = dayKey === fecha;

                      return (
                        <TouchableOpacity
                          key={`calendar-day-${day}`}
                          style={[styles.inlineDayCell, isSelected && styles.inlineDayCellSelected]}
                          onPress={() => handleSelectDateFromCalendar(day)}
                        >
                          <Text
                            style={[
                              styles.inlineDayText,
                              isSelected && styles.inlineDayTextSelected,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <DateTimePicker
                  value={dateFromKey(fecha)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                />
              )
            ) : null}

            {}
            <Text style={styles.label}>Email Cliente</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              placeholder="email@ejemplo.com"
              value={clienteEmail}
              onChangeText={setClienteEmail}
              editable={false}
            />

            {}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setSendEmail(!sendEmail)}
            >
              <MaterialIcons
                name={sendEmail ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={sendEmail ? "#1976D2" : "#9ca3af"}
              />
              <Text style={styles.checkboxLabel}>Enviar ticket al email</Text>
            </TouchableOpacity>

            {}
            <TouchableOpacity
              style={[
                styles.saveButton,
                savingVenta && styles.saveButtonDisabled,
              ]}
              onPress={handleCreateVenta}
              disabled={savingVenta}
            >
              {savingVenta ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Guardar Venta</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      </Modal>

      {}
      <Modal
        visible={viewVentaModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseViewVentaModal}
      >
        <View style={[styles.modalOverlay, styles.modalOverlayBottom]}>
          <View style={[styles.modalCard, styles.modalCardBottom]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Venta</Text>
              <TouchableOpacity onPress={handleCloseViewVentaModal}>
                <MaterialIcons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

          {viewVentaLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : selectedVenta ? (
            <ScrollView style={styles.modalContent}>
              {viewVentaError ? (
                <View style={[styles.feedbackBox, styles.modalFeedbackBox]}>
                  <MaterialIcons name="error-outline" size={20} color="#dc2626" />
                  <Text style={styles.feedbackText}>{viewVentaError}</Text>
                </View>
              ) : null}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Cliente</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="person" size={20} color="#2563eb" />
                    <Text style={styles.detailValue}>
                      {clientes.find((c) => c.id_cliente === selectedVenta.id_cliente)?.nombre || "Desconocido"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Fecha</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={20} color="#2563eb" />
                    <Text style={styles.detailValue}>{formatDate(selectedVenta.fecha)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Precio Total</Text>
                <View style={[styles.detailCard, styles.priceCard]}>
                  <Text style={styles.priceText}>{formatPrice(selectedVenta.precio_total)}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Información</Text>
                <View style={styles.detailCard}>
                  <View style={[styles.detailRow, { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }]}>
                    <MaterialIcons name="shopping-cart" size={20} color="#2563eb" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.detailLabel}>Tipo</Text>
                      <Text style={styles.detailValue}>
                        {selectedVenta.tipo === "producto" ? "Productos" : "Servicios"}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.detailRow, { paddingTop: 12 }]}>
                    <MaterialIcons name="info" size={20} color="#2563eb" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.detailLabel}>Estado</Text>
                      <Text style={styles.detailValue}>{selectedVenta.estado || "Completado"}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  {selectedVenta.tipo === "producto" ? "Productos" : "Servicios"}
                </Text>
                <View style={styles.detailCard}>
                  {selectedVenta.items && selectedVenta.items.length > 0 ? (
                    selectedVenta.items.map((item, index) => (
                      <View key={`${selectedVenta.id_venta}-${index}`} style={styles.ventaItemRow}>
                        <View style={styles.ventaItemTextBlock}>
                          <Text style={styles.ventaItemName}>{getVentaItemLabel(item)}</Text>
                          {selectedVenta.tipo === "producto" ? (
                            <Text style={styles.ventaItemMeta}>
                              Cantidad: {item.cantidad ?? 1}
                            </Text>
                          ) : null}
                        </View>
                        <MaterialIcons
                          name={selectedVenta.tipo === "producto" ? "inventory-2" : "room-service"}
                          size={20}
                          color="#2563eb"
                        />
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No hay ítems disponibles para esta venta</Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseViewVentaModal}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </View>
      </View>
      </Modal>

      {datePickerVisible && editingWhichDate && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={true}
          onRequestClose={() => {
            setDatePickerVisible(false);
            setEditingWhichDate(null);
          }}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerCard}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>
                  {editingWhichDate === "desde" ? "Fecha desde" : "Fecha hasta"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setDatePickerVisible(false);
                    setEditingWhichDate(null);
                  }}
                >
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {Platform.OS === "web" ? (
                <View style={styles.inlineCalendarCard}>
                  <View style={styles.inlineCalendarHeader}>
                    <TouchableOpacity
                      onPress={() =>
                        setDatePickerCursor(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                        )
                      }
                    >
                      <MaterialIcons name="chevron-left" size={20} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.inlineCalendarTitle}>
                      {datePickerCursor.toLocaleDateString("es-ES", {
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setDatePickerCursor(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                        )
                      }
                    >
                      <MaterialIcons name="chevron-right" size={20} color="#374151" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inlineWeekRow}>
                    {WEEK_LABELS.map((label) => (
                      <Text key={label} style={styles.inlineWeekLabel}>
                        {label}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.inlineDaysGrid}>
                    {webCalendarCells.map((day, index) => {
                      if (day === null) {
                        return <View key={`empty-${index}`} style={styles.inlineDayCell} />;
                      }

                      const dayKey = toLocalDateKey(
                        new Date(datePickerCursor.getFullYear(), datePickerCursor.getMonth(), day)
                      );
                      const isSelectedFilter =
                        (editingWhichDate === "desde" && dayKey === fechaDesde) ||
                        (editingWhichDate === "hasta" && dayKey === fechaHasta);

                      return (
                        <TouchableOpacity
                          key={`filter-calendar-day-${day}`}
                          style={[
                            styles.inlineDayCell,
                            isSelectedFilter && styles.inlineDayCellSelected,
                          ]}
                          onPress={() => {
                            const pickedDate = new Date(
                              datePickerCursor.getFullYear(),
                              datePickerCursor.getMonth(),
                              day
                            );
                            handleSelectFecha(pickedDate);
                          }}
                        >
                          <Text
                            style={[
                              styles.inlineDayText,
                              isSelectedFilter && styles.inlineDayTextSelected,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <DateTimePicker
                  value={
                    editingWhichDate === "desde" && fechaDesde
                      ? new Date(fechaDesde)
                      : editingWhichDate === "hasta" && fechaHasta
                        ? new Date(fechaHasta)
                        : new Date()
                  }
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate && event.type !== "dismissed") {
                      handleSelectFecha(selectedDate);
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={styles.datePickerConfirmButton}
                onPress={() => {
                  setDatePickerVisible(false);
                  setEditingWhichDate(null);
                }}
              >
                <Text style={styles.datePickerConfirmText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7fafc" },
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
  iconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f0f7ff",
    marginRight: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a", letterSpacing: -0.3 },
  addPrimaryButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#1d4ed8", borderRadius: 10 },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroBody: {
    marginTop: 14,
    marginBottom: 14,
  },
  heroSearchBox: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  heroSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    paddingVertical: 0,
  },
  heroSearchClearButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eef4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: { color: "#fff", fontSize: 14, fontWeight: "600", marginLeft: 6 },
  subtitle: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  modalOverlayBottom: {
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingHorizontal: 0,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 12,
    padding: 18,
    width: "90%",
    maxWidth: 720,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    gap: 12,
  },
  modalCardBottom: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    width: "100%",
    maxWidth: undefined,
    marginHorizontal: 0,
    borderWidth: 0,
    borderColor: "#e5e7eb",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    padding: 18,
    height: "100%",
    paddingTop: 40,
  },
  feedbackBox: {
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
  successBox: { backgroundColor: "#dcfce7", borderColor: "#bbf7d0" },
  feedbackText: { flex: 1, fontSize: 14, color: "#dc2626" },
  successText: { color: "#16a34a" },
  toggleContainer: {
    flexDirection: "row",
    margin: 12,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    alignItems: "center",
  },
  toggleButtonActive: { backgroundColor: "#2563eb" },
  toggleText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  toggleTextActive: { color: "#fff" },
  filterCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  filterHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  filterHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#1976D2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  filterSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
  },
  filterBody: {
    marginTop: 14,
    gap: 12,
  },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 16, color: "#9ca3af" },
  listContainer: { flex: 1 },
  listContent: { padding: 12, gap: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: { marginBottom: 8 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1f2937", flex: 1 },
  amountBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  amountText: { fontSize: 14, fontWeight: "600", color: "#1976D2" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, color: "#6b7280" },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#1f2937" },
  modalError: { margin: 12 },
  modalContent: { flex: 1, padding: 16 },
  modalFeedbackBox: { marginHorizontal: 0, marginBottom: 16 },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#1f2937", marginTop: 12, marginBottom: 8 },
  dateFilterRow: {
    flexDirection: "row",
    gap: 10,
  },
  pickerContainer: { marginBottom: 12 },
  clienteList: { flexGrow: 0 },
  clienteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    marginRight: 8,
  },
  clienteButtonActive: { backgroundColor: "#1976D2" },
  clienteButtonText: { fontSize: 14, color: "#6b7280" },
  clienteButtonTextActive: { color: "#fff" },
  emptyPickerText: { fontSize: 13, color: "#6b7280", paddingVertical: 8 },
  itemsSection: { marginBottom: 12 },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
  },
  itemSelect: { flexDirection: "row", gap: 6 },
  itemButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
  },
  itemButtonActive: { backgroundColor: "#1976D2" },
  itemButtonText: { fontSize: 12, color: "#6b7280" },
  itemButtonTextActive: { color: "#fff" },
  cantidadContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  cantidadLabel: { fontSize: 12, color: "#6b7280" },
  cantidadInput: {
    width: 50,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 12,
  },
  deleteItemButton: { padding: 6 },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    backgroundColor: "#dbeafe",
    borderRadius: 6,
    marginTop: 8,
  },
  addItemText: { fontSize: 14, color: "#1976D2", fontWeight: "500" },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  checkboxLabel: { fontSize: 14, color: "#1f2937" },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#1976D2",
    borderRadius: 6,
    marginBottom: 20,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    backgroundColor: "#dbeafe",
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1976D2",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    backgroundColor: "#dc2626",
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  confirmBox: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  confirmMessage: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    alignItems: "center",
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#dc2626",
    borderRadius: 4,
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    marginBottom: 12,
  },
  selectorValue: {
    fontSize: 14,
    color: "#1f2937",
  },
  inlineCalendarCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inlineCalendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  inlineCalendarTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    textTransform: "capitalize",
  },
  inlineWeekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  inlineWeekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  inlineDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  inlineDayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderRadius: 4,
  },
  inlineDayCellSelected: {
    backgroundColor: "#1976D2",
  },
  inlineDayText: {
    fontSize: 13,
    color: "#6b7280",
  },
  inlineDayTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  filtersContainer: {
    flexGrow: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f7fafc",
  },
  filtersContent: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  filterSection: {
    flex: 1,
    minWidth: 200,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: 90,
  },
  filterButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  filterClearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterClearText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  datePickerConfirmButton: {
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: "#2563eb",
    borderRadius: 6,
    alignItems: "center",
  },
  datePickerConfirmText: {
    color: "#fff",
    fontWeight: "600",
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  detailCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
  },
  ventaItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  ventaItemTextBlock: {
    flex: 1,
  },
  ventaItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  ventaItemMeta: {
    fontSize: 12,
    color: "#6b7280",
  },
  priceCard: {
    backgroundColor: "#f0f9ff",
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  priceText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2563eb",
  },
  closeButton: {
    marginTop: 24,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default Ventas;
