import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Proveedor } from "../types";
import {
    ADMIN_ROLE,
    CONNECTION_ERROR,
    createProductoRoute,
    DEFAULT_CREATE_ERROR,
    DEFAULT_PROVIDERS_ERROR,
    EMPTY_CATEGORIA_ERROR,
    EMPTY_NOMBRE_ERROR,
    EMPTY_PRECIO_COMPRA_ERROR,
    EMPTY_PRECIO_VENTA_ERROR,
    EMPTY_PROVEEDOR_ERROR,
    EMPTY_REFERENCIA_ERROR,
    EMPTY_STOCK_ERROR,
    FORM_TITLE,
    INVALID_PRECIO_COMPRA_ERROR,
    INVALID_PRECIO_VENTA_ERROR,
    INVALID_STOCK_ERROR,
    INVALID_STOCK_MINIMO_ERROR,
    JEFE_ROLE,
    NO_ACCESS_MESSAGE,
    SAVE_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SCREEN_TITLE,
    SUCCESS_MESSAGE,
    proveedoresByNegocioRoute,
} from "./constants";
import { ProductosProps } from "./types";

const PRICE_REGEX = /^\d+(?:[.,]\d{1,2})?$/;
const INTEGER_REGEX = /^\d+$/;

const Productos: React.FC<ProductosProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [nombre, setNombre] = useState("");
    const [referencia, setReferencia] = useState("");
    const [categoria, setCategoria] = useState("");
    const [precioCompra, setPrecioCompra] = useState("");
    const [precioVenta, setPrecioVenta] = useState("");
    const [stock, setStock] = useState("");
    const [stockMinimo, setStockMinimo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [selectedProveedorId, setSelectedProveedorId] = useState<number | null>(null);

    const [loadingProviders, setLoadingProviders] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageProductos = normalizedRole === JEFE_ROLE || normalizedRole === ADMIN_ROLE;

    const selectedProveedor = useMemo(
        () => proveedores.find((proveedor) => proveedor.id_proveedor === selectedProveedorId) || null,
        [proveedores, selectedProveedorId]
    );

    const resetForm = () => {
        setNombre("");
        setReferencia("");
        setCategoria("");
        setPrecioCompra("");
        setPrecioVenta("");
        setStock("");
        setStockMinimo("");
        setDescripcion("");
        setSelectedProveedorId(null);
    };

    const fetchProveedores = useCallback(async () => {
        if (!canManageProductos) {
            setProveedores([]);
            setError(NO_ACCESS_MESSAGE);
            return;
        }

        setLoadingProviders(true);
        setError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(proveedoresByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_PROVIDERS_ERROR);
                setProveedores([]);
                return;
            }

            const data = await response.json();
            setProveedores(data.proveedores || []);
        } catch (fetchError) {
            setError(CONNECTION_ERROR);
            setProveedores([]);
        } finally {
            setLoadingProviders(false);
        }
    }, [canManageProductos, negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchProveedores();
        }, [fetchProveedores])
    );

    const validateForm = () => {
        if (!nombre.trim()) {
            setError(EMPTY_NOMBRE_ERROR);
            return false;
        }

        if (!referencia.trim()) {
            setError(EMPTY_REFERENCIA_ERROR);
            return false;
        }

        if (!selectedProveedorId) {
            setError(EMPTY_PROVEEDOR_ERROR);
            return false;
        }

        if (!categoria.trim()) {
            setError(EMPTY_CATEGORIA_ERROR);
            return false;
        }

        const precioCompraValue = precioCompra.trim();

        if (!precioCompraValue) {
            setError(EMPTY_PRECIO_COMPRA_ERROR);
            return false;
        }

        if (!PRICE_REGEX.test(precioCompraValue) || Number.parseFloat(precioCompraValue.replace(",", ".")) <= 0) {
            setError(INVALID_PRECIO_COMPRA_ERROR);
            return false;
        }

        const precioVentaValue = precioVenta.trim();

        if (!precioVentaValue) {
            setError(EMPTY_PRECIO_VENTA_ERROR);
            return false;
        }

        if (!PRICE_REGEX.test(precioVentaValue) || Number.parseFloat(precioVentaValue.replace(",", ".")) <= 0) {
            setError(INVALID_PRECIO_VENTA_ERROR);
            return false;
        }

        const stockValue = stock.trim();

        if (!stockValue) {
            setError(EMPTY_STOCK_ERROR);
            return false;
        }

        if (!INTEGER_REGEX.test(stockValue)) {
            setError(INVALID_STOCK_ERROR);
            return false;
        }

        if (stockMinimo.trim() && !INTEGER_REGEX.test(stockMinimo.trim())) {
            setError(INVALID_STOCK_MINIMO_ERROR);
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(createProductoRoute, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_negocio: negocio.id_negocio,
                    id_proveedor: selectedProveedorId,
                    nombre: nombre.trim(),
                    referencia: referencia.trim(),
                    categoria: categoria.trim(),
                    precio_compra: precioCompra.trim(),
                    precio_venta: precioVenta.trim(),
                    stock: stock.trim(),
                    stock_minimo: stockMinimo.trim() || "0",
                    descripcion: descripcion.trim(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_CREATE_ERROR);
                return;
            }

            setSuccess(SUCCESS_MESSAGE);
            resetForm();
        } catch (saveError) {
            setError(CONNECTION_ERROR);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.goBack()}
                    testID="back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.title}>{SCREEN_TITLE}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {!canManageProductos ? (
                    <Text style={styles.errorText} testID="productos-no-access-message">
                        {NO_ACCESS_MESSAGE}
                    </Text>
                ) : (
                    <>
                        <Text style={styles.formTitle}>{FORM_TITLE}</Text>

                        {loadingProviders ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#1976D2" testID="productos-loading-proveedores" />
                                <Text style={styles.loadingText}>Cargando proveedores...</Text>
                            </View>
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Nombre"
                            value={nombre}
                            onChangeText={setNombre}
                            testID="producto-nombre-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Referencia"
                            value={referencia}
                            onChangeText={setReferencia}
                            testID="producto-referencia-input"
                        />

                        <Text style={styles.label}>Proveedor</Text>
                        <View style={styles.providersContainer}>
                            {proveedores.map((proveedor) => (
                                <TouchableOpacity
                                    key={proveedor.id_proveedor}
                                    style={[
                                        styles.providerChip,
                                        selectedProveedorId === proveedor.id_proveedor && styles.providerChipSelected,
                                    ]}
                                    onPress={() => setSelectedProveedorId(proveedor.id_proveedor)}
                                    testID={`producto-proveedor-option-${proveedor.id_proveedor}`}
                                >
                                    <Text
                                        style={[
                                            styles.providerChipText,
                                            selectedProveedorId === proveedor.id_proveedor && styles.providerChipTextSelected,
                                        ]}
                                    >
                                        {proveedor.nombre}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {selectedProveedor ? (
                            <Text style={styles.helperText} testID="producto-proveedor-selected">
                                Seleccionado: {selectedProveedor.nombre}
                            </Text>
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Categoria"
                            value={categoria}
                            onChangeText={setCategoria}
                            testID="producto-categoria-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Precio compra"
                            value={precioCompra}
                            onChangeText={setPrecioCompra}
                            keyboardType="decimal-pad"
                            testID="producto-precio-compra-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Precio venta"
                            value={precioVenta}
                            onChangeText={setPrecioVenta}
                            keyboardType="decimal-pad"
                            testID="producto-precio-venta-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Stock"
                            value={stock}
                            onChangeText={setStock}
                            keyboardType="number-pad"
                            testID="producto-stock-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Stock minimo (opcional)"
                            value={stockMinimo}
                            onChangeText={setStockMinimo}
                            keyboardType="number-pad"
                            testID="producto-stock-minimo-input"
                        />

                        <TextInput
                            style={[styles.input, styles.descriptionInput]}
                            placeholder="Descripcion (opcional)"
                            value={descripcion}
                            onChangeText={setDescripcion}
                            multiline
                            testID="producto-descripcion-input"
                        />

                        {error ? (
                            <Text style={styles.errorText} testID="producto-error-message">
                                {error}
                            </Text>
                        ) : null}

                        {success ? (
                            <Text style={styles.successText} testID="producto-success-message">
                                {success}
                            </Text>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                            testID="producto-save-button"
                        >
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                            <Text style={styles.saveButtonText}>{saving ? SAVING_BUTTON_TEXT : SAVE_BUTTON_TEXT}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

export default Productos;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
        paddingTop: 10,
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
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0D47A1",
    },
    content: {
        padding: 16,
        gap: 10,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 6,
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    loadingText: {
        marginLeft: 8,
        color: "#4b5563",
    },
    label: {
        fontSize: 14,
        color: "#374151",
        marginBottom: 4,
        fontWeight: "600",
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    descriptionInput: {
        minHeight: 72,
        textAlignVertical: "top",
    },
    providersContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 2,
    },
    providerChip: {
        borderWidth: 1,
        borderColor: "#93c5fd",
        backgroundColor: "#eff6ff",
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    providerChipSelected: {
        backgroundColor: "#1976D2",
        borderColor: "#1976D2",
    },
    providerChipText: {
        color: "#1d4ed8",
        fontWeight: "600",
    },
    providerChipTextSelected: {
        color: "#fff",
    },
    helperText: {
        color: "#4b5563",
        marginBottom: 8,
    },
    errorText: {
        color: "#b91c1c",
        fontWeight: "600",
    },
    successText: {
        color: "#166534",
        fontWeight: "600",
    },
    saveButton: {
        marginTop: 8,
        backgroundColor: "#1976D2",
        borderRadius: 10,
        paddingVertical: 12,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
