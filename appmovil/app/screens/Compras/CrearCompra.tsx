import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
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
    EMPTY_FECHA_ERROR,
    EMPTY_PRODUCT_ID_ERROR,
    EMPTY_PRODUCTS_MESSAGE,
    FORM_TITLE,
    INVALID_CANTIDAD_ESPERADA_ERROR,
    INVALID_CANTIDAD_LLEGADA_ERROR,
    INVALID_FECHA_ERROR,
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
const getTodayDate = () => new Date().toISOString().slice(0, 10);

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
    const [fecha, setFecha] = useState(getTodayDate);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerSearch, setPickerSearch] = useState("");
    const [pickerRowId, setPickerRowId] = useState<string | null>(null);
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

    const selectedProductIds = useMemo(
        () => rows
            .map((row) => row.id_producto)
            .filter((idProducto): idProducto is number => idProducto !== null),
        [rows]
    );

    const pickerProducts = useMemo(() => {
        const search = pickerSearch.trim().toLowerCase();
        const activeRow = rows.find((row) => row.localId === pickerRowId);
        const activeProductId = activeRow?.id_producto ?? null;

        return productos.filter((producto) => {
            const alreadySelected = selectedProductIds.includes(producto.id_producto)
                && producto.id_producto !== activeProductId;

            if (alreadySelected) {
                return false;
            }

            if (!search) {
                return true;
            }

            return (
                producto.nombre.toLowerCase().includes(search)
                || producto.referencia.toLowerCase().includes(search)
                || producto.categoria.toLowerCase().includes(search)
            );
        });
    }, [pickerSearch, pickerRowId, productos, rows, selectedProductIds]);

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

    const openProductPicker = (localId: string) => {
        setPickerRowId(localId);
        setPickerSearch("");
        setPickerVisible(true);
    };

    const closeProductPicker = () => {
        setPickerVisible(false);
        setPickerRowId(null);
        setPickerSearch("");
    };

    const selectProductFromPicker = (idProducto: number) => {
        if (!pickerRowId) {
            return;
        }

        updateRow(pickerRowId, { id_producto: idProducto });
        closeProductPicker();
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
        const fechaValue = fecha.trim();

        if (!fechaValue) {
            setError(EMPTY_FECHA_ERROR);
            return false;
        }

        const parsedFecha = new Date(fechaValue);

        if (Number.isNaN(parsedFecha.getTime())) {
            setError(INVALID_FECHA_ERROR);
            return false;
        }

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
            const fechaIso = new Date(fecha.trim()).toISOString();
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
            setFecha(getTodayDate());
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
                            placeholder="Fecha (YYYY-MM-DD)"
                            value={fecha}
                            onChangeText={setFecha}
                            testID="compras-fecha-input"
                        />

                        <Text style={styles.sectionTitle}>{PRODUCTS_SECTION_TITLE}</Text>

                        {rowsWithProductData.map((row, index) => (
                            <View key={row.localId} style={styles.rowCard} testID={`compras-row-${index}`}>
                                <Text style={styles.rowLabel}>Producto</Text>
                                <TouchableOpacity
                                    style={styles.productSelectButton}
                                    onPress={() => openProductPicker(row.localId)}
                                    testID={`compras-row-${index}-open-product-picker`}
                                >
                                    <MaterialIcons name="search" size={18} color="#1d4ed8" />
                                    <Text style={styles.productSelectButtonText}>
                                        {row.producto ? `${row.producto.nombre} (${row.producto.referencia})` : "Seleccionar producto"}
                                    </Text>
                                </TouchableOpacity>

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
                                    <Text style={styles.removeButtonText}>Quitar producto</Text>
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

            <Modal
                visible={pickerVisible}
                transparent
                animationType="slide"
                onRequestClose={closeProductPicker}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Selecciona un producto</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Buscar por nombre, referencia o categoria"
                            value={pickerSearch}
                            onChangeText={setPickerSearch}
                            testID="compras-product-picker-search-input"
                        />

                        <FlatList
                            data={pickerProducts}
                            keyExtractor={(item) => `${item.id_producto}`}
                            style={styles.modalList}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalListItem}
                                    onPress={() => selectProductFromPicker(item.id_producto)}
                                    testID={`compras-picker-product-${item.id_producto}`}
                                >
                                    <Text style={styles.modalListItemTitle}>{item.nombre}</Text>
                                    <Text style={styles.modalListItemSubtitle}>
                                        Ref: {item.referencia} | Cat: {item.categoria}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={(
                                <Text style={styles.modalEmptyText} testID="compras-picker-empty-message">
                                    No hay productos para mostrar con ese filtro
                                </Text>
                            )}
                        />

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={closeProductPicker}
                            testID="compras-close-product-picker"
                        >
                            <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    productSelectButton: {
        borderWidth: 1,
        borderColor: "#93c5fd",
        backgroundColor: "#eff6ff",
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    productSelectButtonText: {
        color: "#1d4ed8",
        fontWeight: "600",
        flexShrink: 1,
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
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-end",
    },
    modalCard: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        maxHeight: "72%",
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 10,
    },
    modalList: {
        marginTop: 10,
    },
    modalListItem: {
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        paddingVertical: 10,
    },
    modalListItemTitle: {
        fontWeight: "700",
        color: "#111827",
    },
    modalListItemSubtitle: {
        color: "#4b5563",
        fontSize: 12,
        marginTop: 2,
    },
    modalEmptyText: {
        textAlign: "center",
        color: "#6b7280",
        marginTop: 24,
    },
    modalCloseButton: {
        marginTop: 14,
        alignSelf: "flex-end",
        backgroundColor: "#e5e7eb",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    modalCloseButtonText: {
        fontWeight: "700",
        color: "#374151",
    },
});

export default CrearCompra;
