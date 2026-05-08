import React, { useCallback, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { Venta, Cliente, Producto, Servicio, VentaItem } from "../types";
import { VentasProps } from "./types";

const normalizeSearchText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const createEmptyVentaItem = (ventaType: "producto" | "servicio") =>
  ventaType === "producto" ? { id_producto: 0, cantidad: 1 } : { id_servicio: 0 };

const Ventas: React.FC<VentasProps> = ({ route, navigation }) => {
  const { negocio } = route.params;
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingVenta, setSavingVenta] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalError, setModalError] = useState("");
  const [clienteSearchText, setClienteSearchText] = useState("");
  const [productoSearchText, setProductoSearchText] = useState("");
  const [servicioSearchText, setServicioSearchText] = useState("");

  const [ventaType, setVentaType] = useState<"producto" | "servicio">("producto");
  const [selectedCliente, setSelectedCliente] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<VentaItem[]>([]);
  const [clienteEmail, setClienteEmail] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [precioTotal, setPrecioTotal] = useState("");

  const normalizedRole = (negocio.rol || "").toLowerCase();
  const canManageVentas = normalizedRole === "jefe" || normalizedRole === "admin";

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
    return ventas.filter((v) => v.tipo === ventaType);
  }, [ventas, ventaType]);

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
    setModalError("");
  };

  const handleCloseVentaModal = () => {
    setModalVisible(false);
    setModalError("");
    setClienteSearchText("");
    setProductoSearchText("");
    setServicioSearchText("");
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
        fecha: new Date().toISOString().split("T")[0],
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ventas</Text>
        {canManageVentas && (
          <TouchableOpacity
            onPress={handleOpenVentaModal}
            style={styles.addButton}
          >
            <MaterialIcons name="add" size={24} color="#2563eb" />
          </TouchableOpacity>
        )}
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

      {/* Toggle */}
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

      {/* Loading */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
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
              <View key={venta.id_venta} style={styles.card}>
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
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseVentaModal}>
              <MaterialIcons name="close" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Nueva Venta
            </Text>
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

            {/* Cliente Selector */}
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

            {/* Items */}
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
                <MaterialIcons name="add-circle-outline" size={20} color="#2563eb" />
                <Text style={styles.addItemText}>
                  Agregar {ventaType === "producto" ? "Producto" : "Servicio"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Precio Total */}
            <Text style={styles.label}>Precio Total (€)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={precioTotalCalculado.toFixed(2)}
              editable={false}
            />

            {/* Email */}
            <Text style={styles.label}>Email Cliente</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              placeholder="email@ejemplo.com"
              value={clienteEmail}
              onChangeText={setClienteEmail}
              editable={false}
            />

            {/* Send Email Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setSendEmail(!sendEmail)}
            >
              <MaterialIcons
                name={sendEmail ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={sendEmail ? "#2563eb" : "#9ca3af"}
              />
              <Text style={styles.checkboxLabel}>Enviar ticket al email</Text>
            </TouchableOpacity>

            {/* Save Button */}
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
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
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
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1f2937" },
  addButton: { padding: 8 },
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
  amountText: { fontSize: 14, fontWeight: "600", color: "#0284c7" },
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
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#1f2937", marginTop: 12, marginBottom: 8 },
  pickerContainer: { marginBottom: 12 },
  clienteList: { flexGrow: 0 },
  clienteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    marginRight: 8,
  },
  clienteButtonActive: { backgroundColor: "#2563eb" },
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
  itemButtonActive: { backgroundColor: "#2563eb" },
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
  addItemText: { fontSize: 14, color: "#2563eb", fontWeight: "500" },
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
    backgroundColor: "#2563eb",
    borderRadius: 6,
    marginBottom: 20,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 14, color: "#fff", fontWeight: "600" },
});

export default Ventas;
