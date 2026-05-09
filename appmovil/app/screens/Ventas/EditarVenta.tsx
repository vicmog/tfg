import React, { useCallback, useState } from "react";
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
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { Cliente, Producto, Servicio, Venta, VentaItem } from "../types";
import { EditarVentaProps } from "./types";

const normalizeSearchText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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
};

const EditarVenta: React.FC<EditarVentaProps> = ({ route, navigation }) => {
  const { negocio, venta } = route.params;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [ventaType, setVentaType] = useState<"producto" | "servicio">(venta.tipo);
  const [selectedCliente, setSelectedCliente] = useState<number | null>(venta.id_cliente);
  const [selectedItems, setSelectedItems] = useState<VentaItem[]>([]);
  const [precioTotal, setPrecioTotal] = useState<string>(venta.precio_total.toString());
  const [fecha, setFecha] = useState<string>(toLocalDateKey(venta.fecha));

  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [clienteSearchText, setClienteSearchText] = useState("");
  const [productoSearchText, setProductoSearchText] = useState("");
  const [servicioSearchText, setServicioSearchText] = useState("");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerCursor, setDatePickerCursor] = useState<Date>(
    dateFromKey(toLocalDateKey(venta.fecha))
  );

  const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
  const webCalendarCells = buildCalendarMatrix(datePickerCursor);

  const filteredClientes = React.useMemo(() => {
    const query = normalizeSearchText(clienteSearchText.trim());
    if (!query) return clientes;
    return clientes.filter((cliente) => {
      const searchableText = normalizeSearchText(
        [cliente.nombre, cliente.apellido1, cliente.apellido2, cliente.email]
          .filter(Boolean)
          .join(" ")
      );
      return searchableText.includes(query);
    });
  }, [clienteSearchText, clientes]);

  const filteredProductos = React.useMemo(() => {
    const query = normalizeSearchText(productoSearchText.trim());
    if (!query) return productos;
    return productos.filter((producto) => {
      const searchableText = normalizeSearchText(
        [producto.nombre, producto.referencia, producto.categoria]
          .filter(Boolean)
          .join(" ")
      );
      return searchableText.includes(query);
    });
  }, [productoSearchText, productos]);

  const filteredServicios = React.useMemo(() => {
    const query = normalizeSearchText(servicioSearchText.trim());
    if (!query) return servicios;
    return servicios.filter((servicio) => {
      const searchableText = normalizeSearchText(
        [servicio.nombre, servicio.descripcion].filter(Boolean).join(" ")
      );
      return searchableText.includes(query);
    });
  }, [servicioSearchText, servicios]);

  const precioTotalCalculado = React.useMemo(() => {
    if (ventaType === "producto") {
      return selectedItems.reduce((acc, item) => {
        const producto = productos.find((p) => p.id_producto === item.id_producto);
        const cantidad = item.cantidad && item.cantidad > 0 ? item.cantidad : 1;
        return acc + (producto?.precio_venta || 0) * cantidad;
      }, 0);
    }

    return selectedItems.reduce((acc, item) => {
      const servicio = servicios.find((s) => s.id_servicio === item.id_servicio);
      return acc + (servicio?.precio || 0);
    }, 0);
  }, [productos, selectedItems, servicios, ventaType]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoadingData(true);
        setError("");

        try {
          const token = await AsyncStorage.getItem("token");

          // Cargar detalles de la venta con sus items
          const ventaResponse = await fetch(API_ROUTES.ventaById(venta.id_venta), {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!ventaResponse.ok) {
            const data = await ventaResponse.json();
            setError(data.message || "No se pudieron cargar los detalles de la venta");
            setLoadingData(false);
            return;
          }

          const ventaData = await ventaResponse.json();
          const ventaCompleta = ventaData.venta;

          const [clientesResponse, productosResponse, serviciosResponse] = await Promise.all([
            fetch(API_ROUTES.clientesByNegocio(negocio.id_negocio), {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(API_ROUTES.productosByNegocio(negocio.id_negocio), {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(API_ROUTES.serviciosByNegocio(negocio.id_negocio), {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          if (!clientesResponse.ok) {
            const data = await clientesResponse.json();
            setError(data.message || "No se pudieron cargar los clientes");
            setLoadingData(false);
            return;
          }

          if (!productosResponse.ok) {
            const data = await productosResponse.json();
            setError(data.message || "No se pudieron cargar los productos");
            setLoadingData(false);
            return;
          }

          if (!serviciosResponse.ok) {
            const data = await serviciosResponse.json();
            setError(data.message || "No se pudieron cargar los servicios");
            setLoadingData(false);
            return;
          }

          const clientesData = await clientesResponse.json();
          const productosData = await productosResponse.json();
          const serviciosData = await serviciosResponse.json();

          setClientes(clientesData.clientes || []);
          setProductos(productosData.productos || []);
          setServicios(serviciosData.servicios || []);

          // Inicializar items con los que estaban en la venta
          if (ventaCompleta.items && ventaCompleta.items.length > 0) {
            setSelectedItems(ventaCompleta.items);
          } else {
            setSelectedItems([createEmptyVentaItem(ventaType)]);
          }
        } catch {
          setError("Error de conexión. Intenta de nuevo.");
        } finally {
          setLoadingData(false);
        }
      };

      loadData();
    }, [negocio.id_negocio, ventaType, venta.id_venta])
  );

  const handleChangeVentaType = (nextType: "producto" | "servicio") => {
    // En EditarVenta, no permitimos cambiar el tipo de venta
    // ya que cambiaría la estructura de los items
    if (ventaType !== nextType) {
      setError("No se puede cambiar el tipo de venta después de crearla");
    }
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

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!selectedCliente) {
      setError("Debes seleccionar un cliente");
      return;
    }

    if (selectedItems.length === 0 || precioTotalCalculado <= 0) {
      setError("Debes seleccionar al menos un producto o servicio válido");
      return;
    }

    setSaving(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const ventaPayload = {
        id_cliente: selectedCliente,
        tipo: ventaType,
        items: selectedItems,
        precio_total: precioTotalCalculado,
        fecha: fecha,
      };

      const response = await fetch(API_ROUTES.updateVentaById(venta.id_venta), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ventaPayload),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "No se pudo actualizar la venta");
        return;
      }

      setSuccess("Venta actualizada correctamente");
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar venta</Text>
      </View>

      {error ? (
        <View style={styles.feedbackError}>
          <Text style={styles.feedbackErrorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.feedbackSuccess}>
          <Text style={styles.feedbackSuccessText}>{success}</Text>
        </View>
      ) : null}

      {loadingData ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Tipo Toggle - Deshabilitado en edición */}
          <Text style={styles.label}>Tipo de Venta</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                ventaType === "producto" && styles.toggleButtonActive,
                styles.toggleButtonDisabled,
              ]}
              disabled
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
                styles.toggleButtonDisabled,
              ]}
              disabled
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

          {/* Cliente Selector */}
          <Text style={styles.label}>Cliente</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente..."
            value={clienteSearchText}
            onChangeText={setClienteSearchText}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.clienteListContainer}
          >
            {filteredClientes.length === 0 ? (
              <Text style={styles.emptyPickerText}>No hay clientes</Text>
            ) : (
              filteredClientes.map((cliente) => (
                <TouchableOpacity
                  key={cliente.id_cliente}
                  style={[
                    styles.clienteButton,
                    selectedCliente === cliente.id_cliente && styles.clienteButtonActive,
                  ]}
                  onPress={() => setSelectedCliente(cliente.id_cliente)}
                >
                  <Text
                    style={[
                      styles.clienteButtonText,
                      selectedCliente === cliente.id_cliente &&
                        styles.clienteButtonTextActive,
                    ]}
                  >
                    {cliente.nombre}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Items */}
          <Text style={styles.label}>
            {ventaType === "producto" ? "Productos" : "Servicios"}
          </Text>
          <TextInput
            style={styles.searchInput}
            placeholder={ventaType === "producto" ? "Buscar producto..." : "Buscar servicio..."}
            value={ventaType === "producto" ? productoSearchText : servicioSearchText}
            onChangeText={ventaType === "producto" ? setProductoSearchText : setServicioSearchText}
          />

          {selectedItems.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.itemSelect}>
                  {ventaType === "producto" &&
                    filteredProductos.map((prod) => (
                      <TouchableOpacity
                        key={prod.id_producto}
                        style={[
                          styles.itemButton,
                          item.id_producto === prod.id_producto && styles.itemButtonActive,
                        ]}
                        onPress={() =>
                          handleUpdateItem(index, "id_producto", prod.id_producto)
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

                  {ventaType === "servicio" &&
                    filteredServicios.map((serv) => (
                      <TouchableOpacity
                        key={serv.id_servicio}
                        style={[
                          styles.itemButton,
                          item.id_servicio === serv.id_servicio && styles.itemButtonActive,
                        ]}
                        onPress={() =>
                          handleUpdateItem(index, "id_servicio", serv.id_servicio)
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
                      handleUpdateItem(index, "cantidad", text ? parseInt(text) : 1)
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

          <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
            <MaterialIcons name="add-circle-outline" size={20} color="#2563eb" />
            <Text style={styles.addItemText}>
              Agregar {ventaType === "producto" ? "Producto" : "Servicio"}
            </Text>
          </TouchableOpacity>

          {/* Precio Total */}
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

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <MaterialIcons name={saving ? "hourglass-empty" : "check"} size={20} color="#fff" />
            <Text style={styles.saveButtonText}>{saving ? "Guardando..." : "Guardar cambios"}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  iconButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    marginLeft: 12,
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#2563eb",
  },
  toggleButtonDisabled: {
    opacity: 0.7,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  toggleTextActive: {
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
    backgroundColor: "#2563eb",
  },
  inlineDayText: {
    fontSize: 13,
    color: "#6b7280",
  },
  inlineDayTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 12,
  },
  clienteListContainer: {
    marginBottom: 16,
  },
  clienteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    marginRight: 8,
  },
  clienteButtonActive: {
    backgroundColor: "#2563eb",
  },
  clienteButtonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  clienteButtonTextActive: {
    color: "#fff",
  },
  emptyPickerText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
  },
  itemSelect: {
    flexDirection: "row",
    gap: 6,
  },
  itemButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
  },
  itemButtonActive: {
    backgroundColor: "#2563eb",
  },
  itemButtonText: {
    fontSize: 12,
    color: "#6b7280",
  },
  itemButtonTextActive: {
    color: "#fff",
  },
  cantidadContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cantidadLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
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
  deleteItemButton: {
    padding: 6,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    backgroundColor: "#dbeafe",
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  addItemText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 12,
  },
  feedbackError: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    margin: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedbackErrorText: {
    fontSize: 14,
    color: "#dc2626",
    flex: 1,
  },
  feedbackSuccess: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 8,
    margin: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedbackSuccessText: {
    fontSize: 14,
    color: "#16a34a",
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    borderRadius: 6,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default EditarVenta;
