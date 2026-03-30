import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
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
import { Producto } from "../types";
import {
    ADMIN_ROLE,
    CONNECTION_ERROR,
    DEFAULT_CREATE_ERROR,
    DEFAULT_PRODUCTS_ERROR,
    EMPTY_PORCENTAJE_ERROR,
    EMPTY_PRODUCTO_ERROR,
    EMPTY_PRODUCTS_MESSAGE,
    FORM_TITLE,
    INVALID_PORCENTAJE_ERROR,
    JEFE_ROLE,
    NO_ACCESS_MESSAGE,
    PERCENTAGE_PLACEHOLDER,
    SAVE_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SCREEN_TITLE,
    SEARCH_PRODUCT,
    SUCCESS_MESSAGE,
    descuentosRoute,
    productosByNegocioRoute,
} from "./constants";
import { DescuentosProps } from "./types";

const PERCENTAGE_REGEX = /^\d+(?:[.,]\d{1,2})?$/;

const Descuentos: React.FC<DescuentosProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [productos, setProductos] = useState<Producto[]>([]);
    const [searchText, setSearchText] = useState("");
    const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
    const [porcentaje, setPorcentaje] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [modalVisible, setModalVisible] = useState(false);

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageDescuentos = normalizedRole === JEFE_ROLE || normalizedRole === ADMIN_ROLE;

    const handleOpenModal = useCallback(() => {
        setModalVisible(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalVisible(false);
        setSearchText("");
        setSelectedProductoId(null);
        setPorcentaje("");
        setError("");
        setSuccess("");
    }, []);

    const handleToggleModal = useCallback(() => {
        if (modalVisible) {
            handleCloseModal();
        } else {
            handleOpenModal();
        }
    }, [modalVisible, handleCloseModal, handleOpenModal]);

    const filteredProductos = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        if (!query) {
            return productos;
        }

        return productos.filter((producto) =>
            producto.nombre.toLowerCase().includes(query)
            || producto.referencia.toLowerCase().includes(query)
            || producto.categoria.toLowerCase().includes(query)
            || (producto.proveedor_nombre || "").toLowerCase().includes(query)
        );
    }, [productos, searchText]);

    const selectedProducto = useMemo(
        () => productos.find((producto) => producto.id_producto === selectedProductoId) || null,
        [productos, selectedProductoId]
    );

    const fetchProductos = useCallback(async () => {
        if (!canManageDescuentos) {
            setError(NO_ACCESS_MESSAGE);
            setProductos([]);
            return;
        }

        setLoading(true);
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
            setLoading(false);
        }
    }, [canManageDescuentos, negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchProductos();
        }, [fetchProductos])
    );

    const validateForm = () => {
        if (!selectedProductoId) {
            setError(EMPTY_PRODUCTO_ERROR);
            return false;
        }

        const porcentajeValue = porcentaje.trim();

        if (!porcentajeValue) {
            setError(EMPTY_PORCENTAJE_ERROR);
            return false;
        }

        if (!PERCENTAGE_REGEX.test(porcentajeValue)) {
            setError(INVALID_PORCENTAJE_ERROR);
            return false;
        }

        const porcentajeNumber = Number.parseFloat(porcentajeValue.replace(",", "."));

        if (!Number.isFinite(porcentajeNumber) || porcentajeNumber <= 0 || porcentajeNumber > 100) {
            setError(INVALID_PORCENTAJE_ERROR);
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
            const response = await fetch(descuentosRoute, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_producto: selectedProductoId,
                    porcentaje_descuento: porcentaje.trim(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_CREATE_ERROR);
                return;
            }

            setSuccess(SUCCESS_MESSAGE);
            setPorcentaje("");
            setSelectedProductoId(null);
            setSearchText("");
            setTimeout(() => {
                handleCloseModal();
            }, 1500);
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
                {canManageDescuentos ? (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleOpenModal}
                        testID="toggle-descuento-form-button"
                    >
                        <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.addButtonText}>Añadir</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {!canManageDescuentos ? (
                    <Text style={styles.errorText} testID="descuentos-no-access-message">
                        {NO_ACCESS_MESSAGE}
                    </Text>
                ) : (
                    <Text style={styles.emptyStateText}>Pulsa "Añadir" para crear un descuento</Text>
                )}
            </ScrollView>

            <Modal
                visible={modalVisible}
                transparent
                animationType="none"
                onRequestClose={handleToggleModal}
                testID="descuento-form-modal"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.formContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{FORM_TITLE}</Text>
                            <TouchableOpacity onPress={handleToggleModal} testID="close-descuento-form-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#1976D2" testID="descuentos-loading-productos" />
                                <Text style={styles.loadingText}>Cargando productos...</Text>
                            </View>
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder={SEARCH_PRODUCT}
                            value={searchText}
                            onChangeText={setSearchText}
                            testID="descuentos-search-product-input"
                        />

                        <View style={styles.productList} testID="descuentos-product-list">
                            {filteredProductos.map((producto) => (
                                <TouchableOpacity
                                    key={producto.id_producto}
                                    style={[
                                        styles.productChip,
                                        selectedProductoId === producto.id_producto && styles.productChipSelected,
                                    ]}
                                    onPress={() => setSelectedProductoId(producto.id_producto)}
                                    testID={`descuento-producto-option-${producto.id_producto}`}
                                >
                                    <Text
                                        style={[
                                            styles.productChipText,
                                            selectedProductoId === producto.id_producto && styles.productChipTextSelected,
                                        ]}
                                    >
                                        {producto.nombre} ({producto.referencia})
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {!filteredProductos.length && !loading ? (
                                <Text style={styles.emptyText}>{EMPTY_PRODUCTS_MESSAGE}</Text>
                            ) : null}
                        </View>

                        {selectedProducto ? (
                            <Text style={styles.helperText} testID="descuento-producto-selected">
                                Seleccionado: {selectedProducto.nombre}
                            </Text>
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder={PERCENTAGE_PLACEHOLDER}
                            value={porcentaje}
                            onChangeText={setPorcentaje}
                            keyboardType="decimal-pad"
                            testID="descuento-porcentaje-input"
                        />

                        {error ? (
                            <View style={styles.feedbackError} testID="descuento-error-message">
                                <Text style={styles.feedbackErrorText}>{error}</Text>
                            </View>
                        ) : null}

                        {success ? (
                            <View style={styles.feedbackSuccess} testID="descuento-success-message">
                                <Text style={styles.feedbackSuccessText}>{success}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                            testID="descuento-save-button"
                        >
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                            <Text style={styles.saveButtonText}>{saving ? SAVING_BUTTON_TEXT : SAVE_BUTTON_TEXT}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Descuentos;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
        paddingTop: 10,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1976D2",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0D47A1",
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyStateText: {
        fontSize: 16,
        color: "#6b7280",
        fontWeight: "500",
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: "#111827",
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
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    formContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: "90%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1f2937",
    },
    productList: {
        maxHeight: 220,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        padding: 8,
        marginVertical: 10,
    },
    productChip: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
        alignSelf: "flex-start",
        backgroundColor: "#fff",
    },
    productChipSelected: {
        backgroundColor: "#e0f2fe",
        borderColor: "#0284c7",
    },
    productChipText: {
        color: "#374151",
    },
    productChipTextSelected: {
        color: "#0c4a6e",
        fontWeight: "700",
    },
    helperText: {
        fontSize: 13,
        color: "#0f766e",
    },
    emptyText: {
        color: "#6b7280",
        marginTop: 4,
    },
    feedbackError: {
        backgroundColor: "#fee2e2",
        borderColor: "#fecaca",
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginVertical: 8,
    },
    feedbackErrorText: {
        color: "#b91c1c",
        fontWeight: "600",
    },
    feedbackSuccess: {
        backgroundColor: "#dcfce7",
        borderColor: "#86efac",
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginVertical: 8,
    },
    feedbackSuccessText: {
        color: "#166534",
        fontWeight: "600",
    },
    errorText: {
        color: "#b91c1c",
        fontWeight: "600",
    },
    saveButton: {
        marginTop: 12,
        backgroundColor: "#1976D2",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
});
