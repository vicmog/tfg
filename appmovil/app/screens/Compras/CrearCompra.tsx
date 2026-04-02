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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { Producto } from "../types";
import {
    ADD_PRODUCT_ROW_TEXT,
    CANTIDAD_LLEGADA_EXCEEDS_ERROR,
    CONNECTION_ERROR,
    DEFAULT_CREATE_ERROR,
    DEFAULT_PRODUCTS_ERROR,
    DUPLICATED_PRODUCT_ERROR,
    EMPTY_PRODUCT_ID_ERROR,
    EMPTY_PRODUCTS_MESSAGE,
    FORM_TITLE,
    INVALID_CANTIDAD_ESPERADA_ERROR,
    INVALID_CANTIDAD_LLEGADA_ERROR,
    NO_ACCESS_MESSAGE,
    PRODUCTS_SECTION_TITLE,
    SAVE_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SCREEN_TITLE,
    SUCCESS_MESSAGE,
    comprasRoute,
    productosByNegocioRoute,
} from "./constants";
import { CrearCompraProps } from "./types";

type CompraProductoRow = {
    localId: string;
    id_producto: number | null;
    cantidad_esperada: string;
    cantidad_llegada: string;
};

const INTEGER_REGEX = /^\d+$/;

const newProductRow = (id: number): CompraProductoRow => ({
    localId: `compra-row-${id}`,
    id_producto: null,
    cantidad_esperada: "",
    cantidad_llegada: "0",
});

const CrearCompra: React.FC<CrearCompraProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [productos, setProductos] = useState<Producto[]>([]);
    const [rows, setRows] = useState<CompraProductoRow[]>([newProductRow(1)]);
    const [descripcion, setDescripcion] = useState("");
    const [fecha, setFecha] = useState("");
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageCompras = normalizedRole === "jefe" || normalizedRole === "admin";

    const rowsWithProductData = useMemo(
        () => rows.map((row) => ({
            ...row,
            producto: productos.find((producto) => producto.id_producto === row.id_producto) || null,
        })),
        [productos, rows]
    );

    const totalEstimado = useMemo(() => rowsWithProductData.reduce((acc, row) => {
        if (!row.producto || !INTEGER_REGEX.test(row.cantidad_esperada.trim())) {
            return acc;
        }

        return acc + (row.producto.precio_compra * Number.parseInt(row.cantidad_esperada, 10));
    }, 0), [rowsWithProductData]);

    const fetchProductos = useCallback(async () => {
        if (!canManageCompras) {
            setError(NO_ACCESS_MESSAGE);
            return;
        }

        setLoadingProductos(true);
        setError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(productosByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_PRODUCTS_ERROR);
                setProductos([]);
                return;
            }

            const data = await response.json();
            setProductos(data.productos || []);
        } catch (fetchError) {
            setError(CONNECTION_ERROR);
            setProductos([]);
        } finally {
            setLoadingProductos(false);
        }
    }, [canManageCompras, negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchProductos();
        }, [fetchProductos])
    );

    const updateRow = (localId: string, changes: Partial<CompraProductoRow>) => {
        setRows((previousRows) => previousRows.map((row) => {
            if (row.localId !== localId) {
                return row;
            }

            return {
                ...row,
                ...changes,
            };
        }));
    };

    const addRow = () => {
        setRows((previousRows) => [...previousRows, newProductRow(previousRows.length + 1)]);
    };

    const removeRow = (localId: string) => {
        setRows((previousRows) => {
            if (previousRows.length === 1) {
                return previousRows;
            }

            return previousRows.filter((row) => row.localId !== localId);
        });
    };

    const validateForm = () => {
        if (!rows.length) {
            setError(EMPTY_PRODUCTS_MESSAGE);
            return false;
        }

        const selectedProductIds = new Set<number>();

        for (const row of rows) {
            if (!row.id_producto) {
                setError(EMPTY_PRODUCT_ID_ERROR);
                return false;
            }

            if (selectedProductIds.has(row.id_producto)) {
                setError(DUPLICATED_PRODUCT_ERROR);
                return false;
            }

            selectedProductIds.add(row.id_producto);

            if (!INTEGER_REGEX.test(row.cantidad_esperada.trim()) || Number.parseInt(row.cantidad_esperada, 10) <= 0) {
                setError(INVALID_CANTIDAD_ESPERADA_ERROR);
                return false;
            }

            if (!INTEGER_REGEX.test(row.cantidad_llegada.trim()) || Number.parseInt(row.cantidad_llegada, 10) < 0) {
                setError(INVALID_CANTIDAD_LLEGADA_ERROR);
                return false;
            }

            if (Number.parseInt(row.cantidad_llegada, 10) > Number.parseInt(row.cantidad_esperada, 10)) {
                setError(CANTIDAD_LLEGADA_EXCEEDS_ERROR);
                return false;
            }
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
            const fechaIso = fecha.trim() ? new Date(fecha.trim()).toISOString() : new Date().toISOString();
            const response = await fetch(comprasRoute, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_negocio: negocio.id_negocio,
                    descripcion: descripcion.trim(),
                    fecha: fechaIso,
                    productos: rows.map((row) => ({
                        id_producto: row.id_producto,
                        cantidad_esperada: row.cantidad_esperada.trim(),
                        cantidad_llegada: row.cantidad_llegada.trim(),
                    })),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_CREATE_ERROR);
                return;
            }

            setSuccess(SUCCESS_MESSAGE);
            setRows([newProductRow(1)]);
            setDescripcion("");
            setFecha("");
            navigation.goBack();
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
                    testID="compras-back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.title}>{SCREEN_TITLE}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {!canManageCompras ? (
                    <Text style={styles.errorText} testID="compras-no-access-message">
                        {NO_ACCESS_MESSAGE}
                    </Text>
                ) : (
                    <>
                        <Text style={styles.formTitle}>{FORM_TITLE}</Text>

                        {loadingProductos ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#1976D2" testID="compras-loading-productos" />
                                <Text style={styles.loadingText}>Cargando productos...</Text>
                            </View>
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Descripcion (opcional)"
                            value={descripcion}
                            onChangeText={setDescripcion}
                            testID="compras-descripcion-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Fecha ISO (opcional)"
                            value={fecha}
                            onChangeText={setFecha}
                            testID="compras-fecha-input"
                        />

                        <Text style={styles.sectionTitle}>{PRODUCTS_SECTION_TITLE}</Text>

                        {rowsWithProductData.map((row, index) => (
                            <View key={row.localId} style={styles.rowCard} testID={`compras-row-${index}`}>
                                <Text style={styles.rowLabel}>Producto</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productOptionsScroll}>
                                    {productos.map((producto) => (
                                        <TouchableOpacity
                                            key={`${row.localId}-${producto.id_producto}`}
                                            style={[
                                                styles.productChip,
                                                row.id_producto === producto.id_producto && styles.productChipSelected,
                                            ]}
                                            onPress={() => updateRow(row.localId, { id_producto: producto.id_producto })}
                                            testID={`compras-row-${index}-producto-${producto.id_producto}`}
                                        >
                                            <Text
                                                style={[
                                                    styles.productChipText,
                                                    row.id_producto === producto.id_producto && styles.productChipTextSelected,
                                                ]}
                                            >
                                                {producto.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Cantidad esperada"
                                    value={row.cantidad_esperada}
                                    onChangeText={(value) => updateRow(row.localId, { cantidad_esperada: value })}
                                    keyboardType="number-pad"
                                    testID={`compras-row-${index}-cantidad-esperada-input`}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Cantidad llegada"
                                    value={row.cantidad_llegada}
                                    onChangeText={(value) => updateRow(row.localId, { cantidad_llegada: value })}
                                    keyboardType="number-pad"
                                    testID={`compras-row-${index}-cantidad-llegada-input`}
                                />

                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeRow(row.localId)}
                                    testID={`compras-row-${index}-remove-button`}
                                >
                                    <MaterialIcons name="delete" size={18} color="#b91c1c" />
                                    <Text style={styles.removeButtonText}>Quitar linea</Text>
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.addRowButton}
                            onPress={addRow}
                            testID="compras-add-row-button"
                        >
                            <MaterialIcons name="add-circle-outline" size={20} color="#1976D2" />
                            <Text style={styles.addRowButtonText}>{ADD_PRODUCT_ROW_TEXT}</Text>
                        </TouchableOpacity>

                        <Text style={styles.totalText} testID="compras-total-estimado">
                            Total estimado: {totalEstimado.toFixed(2)} EUR
                        </Text>

                        {error ? (
                            <Text style={styles.errorText} testID="compras-error-message">
                                {error}
                            </Text>
                        ) : null}

                        {success ? (
                            <Text style={styles.successText} testID="compras-success-message">
                                {success}
                            </Text>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                            testID="compras-save-button"
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
    input: {
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1f2937",
        marginTop: 8,
    },
    rowCard: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        backgroundColor: "#fff",
        padding: 10,
        gap: 8,
    },
    rowLabel: {
        fontWeight: "600",
        color: "#374151",
    },
    productOptionsScroll: {
        marginBottom: 2,
    },
    productChip: {
        borderWidth: 1,
        borderColor: "#93c5fd",
        backgroundColor: "#eff6ff",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    productChipSelected: {
        backgroundColor: "#1976D2",
        borderColor: "#1976D2",
    },
    productChipText: {
        color: "#1d4ed8",
        fontWeight: "600",
    },
    productChipTextSelected: {
        color: "#fff",
    },
    addRowButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        backgroundColor: "#f0f7ff",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginTop: 4,
    },
    addRowButtonText: {
        color: "#1976D2",
        fontWeight: "600",
    },
    removeButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
    },
    removeButtonText: {
        color: "#b91c1c",
        fontWeight: "600",
    },
    totalText: {
        color: "#111827",
        fontWeight: "700",
        marginTop: 4,
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

export default CrearCompra;
