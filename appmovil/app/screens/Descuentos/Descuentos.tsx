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
import { Descuento, Producto } from "../types";
import {
    ADMIN_ROLE,
    CONNECTION_ERROR,
    CONFIRM_DELETE_ACCEPT,
    CONFIRM_DELETE_CANCEL,
    CONFIRM_DELETE_MESSAGE,
    CONFIRM_DELETE_TITLE,
    DATE_END_PLACEHOLDER,
    DATE_START_PLACEHOLDER,
    DELETE_BUTTON_TEXT,
    DELETE_SUCCESS_MESSAGE,
    DELETING_BUTTON_TEXT,
    DEFAULT_CREATE_ERROR,
    DEFAULT_DELETE_ERROR,
    DEFAULT_DESCUENTOS_ERROR,
    DEFAULT_PRODUCTS_ERROR,
    EMPTY_DESCUENTOS_MESSAGE,
    EMPTY_PORCENTAJE_ERROR,
    EMPTY_PRODUCTO_ERROR,
    EMPTY_PRODUCTS_MESSAGE,
    FORM_TITLE,
    INVALID_DATE_ERROR,
    INVALID_PORCENTAJE_ERROR,
    JEFE_ROLE,
    NO_ACCESS_MESSAGE,
    PERCENTAGE_PLACEHOLDER,
    SAVE_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SCREEN_TITLE,
    SEARCH_PRODUCT,
    SUCCESS_MESSAGE,
    deleteDescuentoByIdRoute,
    descuentosByNegocioRoute,
    descuentosRoute,
    productosByNegocioRoute,
} from "./constants";
import { DescuentosProps } from "./types";

const PERCENTAGE_REGEX = /^\d+(?:[.,]\d{1,2})?$/;

type DescuentoWithProducto = Descuento & {
    producto_nombre: string;
    producto_referencia: string;
};

const Descuentos: React.FC<DescuentosProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [productos, setProductos] = useState<Producto[]>([]);
    const [descuentos, setDescuentos] = useState<DescuentoWithProducto[]>([]);
    const [searchText, setSearchText] = useState("");
    const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
    const [porcentaje, setPorcentaje] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingDescuentos, setLoadingDescuentos] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingDescuentoId, setDeletingDescuentoId] = useState<number | null>(null);
    const [confirmDeleteDescuentoId, setConfirmDeleteDescuentoId] = useState<number | null>(null);
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
        setFechaInicio("");
        setFechaFin("");
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

    const fetchDescuentos = useCallback(async () => {
        if (!canManageDescuentos) {
            return;
        }

        setLoadingDescuentos(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(descuentosByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_DESCUENTOS_ERROR);
                setDescuentos([]);
                return;
            }

            const data = await response.json();
            setDescuentos(data.descuentos || []);
        } catch (fetchError) {
            setError(CONNECTION_ERROR);
            setDescuentos([]);
        } finally {
            setLoadingDescuentos(false);
        }
    }, [canManageDescuentos, negocio.id_negocio]);

    const fetchProductos = useCallback(async () => {
        if (!canManageDescuentos) {
            setError("");
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
            fetchDescuentos();
        }, [fetchProductos, fetchDescuentos])
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

        if (fechaInicio && fechaFin) {
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            
            if (fin <= inicio) {
                setError(INVALID_DATE_ERROR);
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
            
            const body: any = {
                id_producto: selectedProductoId,
                porcentaje_descuento: porcentaje.trim(),
            };

            if (fechaInicio) {
                body.fecha_inicio = fechaInicio;
            }

            if (fechaFin) {
                body.fecha_fin = fechaFin;
            }

            const response = await fetch(descuentosRoute, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_CREATE_ERROR);
                return;
            }

            setSuccess(SUCCESS_MESSAGE);
            setPorcentaje("");
            setFechaInicio("");
            setFechaFin("");
            setSelectedProductoId(null);
            setSearchText("");
            setConfirmDeleteDescuentoId(null);
            fetchDescuentos();
            setTimeout(() => {
                handleCloseModal();
            }, 1500);
        } catch (saveError) {
            setError(CONNECTION_ERROR);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDescuento = async (idDescuento: number) => {
        setError("");
        setSuccess("");
        setDeletingDescuentoId(idDescuento);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(deleteDescuentoByIdRoute(idDescuento), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_DELETE_ERROR);
                return;
            }

            setSuccess(DELETE_SUCCESS_MESSAGE);
            setConfirmDeleteDescuentoId(null);
            await fetchDescuentos();
        } catch (deleteError) {
            setError(CONNECTION_ERROR);
        } finally {
            setDeletingDescuentoId(null);
        }
    };

    const handleAskDeleteDescuento = (idDescuento: number) => {
        setError("");
        setSuccess("");
        setConfirmDeleteDescuentoId(idDescuento);
    };

    const handleCancelDeleteDescuento = () => {
        setConfirmDeleteDescuentoId(null);
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

                {!canManageDescuentos ? (
                    <Text style={styles.errorText} testID="descuentos-no-access-message">
                        {NO_ACCESS_MESSAGE}
                    </Text>
                ) : loadingDescuentos ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1976D2" />
                        <Text style={styles.loadingText}>Cargando descuentos...</Text>
                    </View>
                ) : descuentos.length === 0 ? (
                    <Text style={styles.emptyStateText}>{EMPTY_DESCUENTOS_MESSAGE}</Text>
                ) : (
                    <View style={styles.descuentosList}>
                        {descuentos.map((descuento) => (
                            <View key={descuento.id_descuento} style={styles.descuentoCard}>
                                <View style={styles.descuentoHeader}>
                                    <MaterialIcons name="local-offer" size={24} color="#795548" />
                                    <Text style={styles.descuentoPorcentaje}>
                                        {descuento.porcentaje_descuento}% OFF
                                    </Text>
                                </View>
                                <View style={styles.descuentoBody}>
                                    <Text style={styles.descuentoProducto}>
                                        {descuento.producto_nombre}
                                    </Text>
                                    <Text style={styles.descuentoReferencia}>
                                        Ref: {descuento.producto_referencia}
                                    </Text>
                                    {descuento.fecha_inicio && (
                                        <Text style={styles.descuentoFechaInicio}>
                                            Desde: {new Date(descuento.fecha_inicio).toLocaleDateString()}
                                        </Text>
                                    )}
                                    {descuento.fecha_fin && (
                                        <Text style={styles.descuentoFecha}>
                                            Hasta: {new Date(descuento.fecha_fin).toLocaleDateString()}
                                        </Text>
                                    )}
                                    {!descuento.fecha_fin && (
                                        <Text style={styles.descuentoSinFecha}>
                                            Sin fecha de caducidad
                                        </Text>
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[styles.deleteButton, deletingDescuentoId === descuento.id_descuento && styles.deleteButtonDisabled]}
                                    onPress={() => handleAskDeleteDescuento(descuento.id_descuento)}
                                    disabled={deletingDescuentoId === descuento.id_descuento}
                                    testID={`descuento-delete-button-${descuento.id_descuento}`}
                                >
                                    <Text style={styles.deleteButtonText}>
                                        {deletingDescuentoId === descuento.id_descuento ? DELETING_BUTTON_TEXT : DELETE_BUTTON_TEXT}
                                    </Text>
                                </TouchableOpacity>

                                {confirmDeleteDescuentoId === descuento.id_descuento ? (
                                    <View style={styles.confirmBox} testID={`descuento-delete-confirm-${descuento.id_descuento}`}>
                                        <Text style={styles.confirmTitle}>{CONFIRM_DELETE_TITLE}</Text>
                                        <Text style={styles.confirmMessage}>{CONFIRM_DELETE_MESSAGE}</Text>
                                        <View style={styles.confirmActions}>
                                            <TouchableOpacity
                                                style={styles.confirmCancelButton}
                                                onPress={handleCancelDeleteDescuento}
                                                testID={`descuento-delete-cancel-${descuento.id_descuento}`}
                                            >
                                                <Text style={styles.confirmCancelText}>{CONFIRM_DELETE_CANCEL}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.confirmDeleteButton}
                                                onPress={() => handleDeleteDescuento(descuento.id_descuento)}
                                                disabled={deletingDescuentoId === descuento.id_descuento}
                                                testID={`descuento-delete-confirm-button-${descuento.id_descuento}`}
                                            >
                                                <Text style={styles.confirmDeleteText}>{CONFIRM_DELETE_ACCEPT}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        ))}
                    </View>
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

                        <Text style={styles.sectionLabel}>Vigencia del descuento (opcional)</Text>

                        <TextInput
                            style={styles.input}
                            placeholder={DATE_START_PLACEHOLDER}
                            value={fechaInicio}
                            onChangeText={setFechaInicio}
                            testID="descuento-fecha-inicio-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder={DATE_END_PLACEHOLDER}
                            value={fechaFin}
                            onChangeText={setFechaFin}
                            testID="descuento-fecha-fin-input"
                        />

                        <Text style={styles.helperTextSmall}>Formato de fecha: YYYY-MM-DD (Ejemplo: 2026-12-31)</Text>

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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
    },
    descuentosList: {
        width: "100%",
        gap: 12,
    },
    descuentoCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    descuentoHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    descuentoPorcentaje: {
        fontSize: 20,
        fontWeight: "700",
        color: "#795548",
    },
    descuentoBody: {
        gap: 4,
    },
    descuentoProducto: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
    },
    descuentoReferencia: {
        fontSize: 14,
        color: "#6b7280",
    },
    descuentoFecha: {
        fontSize: 13,
        color: "#059669",
        marginTop: 4,
    },
    descuentoFechaInicio: {
        fontSize: 13,
        color: "#0284c7",
        marginTop: 4,
    },
    descuentoSinFecha: {
        fontSize: 13,
        color: "#9ca3af",
        marginTop: 4,
        fontStyle: "italic",
    },
    emptyStateText: {
        fontSize: 16,
        color: "#6b7280",
        fontWeight: "500",
        textAlign: "center",
        marginTop: 40,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: "#111827",
        marginBottom: 12,
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
        padding: 22,
        maxHeight: "90%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
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
        marginVertical: 12,
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
        marginBottom: 12,
    },
    helperTextSmall: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: -4,
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginTop: 16,
        marginBottom: 10,
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
        marginTop: 16,
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
    deleteButton: {
        marginTop: 12,
        alignSelf: "flex-end",
        backgroundColor: "#dc2626",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    deleteButtonDisabled: {
        opacity: 0.7,
    },
    deleteButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    confirmBox: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#fecaca",
        backgroundColor: "#fef2f2",
        borderRadius: 10,
        padding: 10,
    },
    confirmTitle: {
        fontWeight: "700",
        color: "#991b1b",
        marginBottom: 4,
    },
    confirmMessage: {
        color: "#7f1d1d",
        marginBottom: 8,
    },
    confirmActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
    },
    confirmCancelButton: {
        backgroundColor: "#e5e7eb",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    confirmCancelText: {
        color: "#374151",
        fontWeight: "600",
    },
    confirmDeleteButton: {
        backgroundColor: "#dc2626",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    confirmDeleteText: {
        color: "#fff",
        fontWeight: "700",
    },
});
