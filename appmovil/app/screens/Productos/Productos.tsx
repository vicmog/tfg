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
import { Producto, Descuento } from "../types";
import {
    ADD_PRODUCT_BUTTON,
    ADMIN_ROLE,
    CONNECTION_ERROR,
    DEFAULT_DELETE_ERROR,
    DEFAULT_DETAIL_ERROR,
    DEFAULT_PRODUCTS_ERROR,
    DETAIL_BUY_PRICE_LABEL,
    DETAIL_CATEGORY_LABEL,
    DETAIL_DESCRIPTION_LABEL,
    DETAIL_DISCOUNT_END_DATE_LABEL,
    DETAIL_DISCOUNT_PERCENTAGE_LABEL,
    DETAIL_DISCOUNT_START_DATE_LABEL,
    DETAIL_DISCOUNT_TYPE_LABEL,
    DETAIL_DISCOUNTS_ERROR,
    DETAIL_DISCOUNTS_LOADING,
    DETAIL_DISCOUNTS_SECTION_TITLE,
    DETAIL_EMPTY_DESCRIPTION,
    DETAIL_MIN_STOCK_LABEL,
    DETAIL_NAME_LABEL,
    DETAIL_NO_DISCOUNTS_MESSAGE,
    DETAIL_PROVIDER_LABEL,
    DETAIL_REFERENCE_LABEL,
    DETAIL_SELL_PRICE_LABEL,
    DETAIL_STOCK_LABEL,
    DETAIL_TITLE,
    DELETE_BUTTON_TEXT,
    DELETE_CONFIRM_MESSAGE,
    DELETE_CONFIRM_TITLE,
    DELETE_SUCCESS_MESSAGE,
    EMPTY_PRODUCTS_MESSAGE,
    JEFE_ROLE,
    NO_ACCESS_MESSAGE,
    SCREEN_TITLE,
    SEARCH_PRODUCT,
    deleteProductoByIdRoute,
    descuentosByProductoRoute,
    productoByIdRoute,
    productosByNegocioRoute,
} from "./constants";
import { ProductosProps } from "./types";

const Productos: React.FC<ProductosProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [productos, setProductos] = useState<Producto[]>([]);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(false);
    const [listError, setListError] = useState("");
    const [listSuccess, setListSuccess] = useState("");
    const [deletingProductoId, setDeletingProductoId] = useState<number | null>(null);
    const [confirmDeleteProductoId, setConfirmDeleteProductoId] = useState<number | null>(null);
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [descuentos, setDescuentos] = useState<Descuento[]>([]);
    const [loadingDescuentos, setLoadingDescuentos] = useState(false);
    const [descuentosError, setDescuentosError] = useState("");

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageProductos = normalizedRole === JEFE_ROLE || normalizedRole === ADMIN_ROLE;

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

    const fetchProductos = useCallback(async () => {
        if (!canManageProductos) {
            setProductos([]);
            setListError(NO_ACCESS_MESSAGE);
            return;
        }

        setLoading(true);
        setListError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(productosByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_PRODUCTS_ERROR);
                setProductos([]);
                return;
            }

            const data = await response.json();
            setProductos(data.productos || []);
        } catch (error) {
            setListError(CONNECTION_ERROR);
            setProductos([]);
        } finally {
            setLoading(false);
        }
    }, [canManageProductos, negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchProductos();
        }, [fetchProductos])
    );

    const handleAskDeleteProducto = (idProducto: number) => {
        setListError("");
        setListSuccess("");
        setConfirmDeleteProductoId(idProducto);
    };

    const handleCancelDeleteProducto = () => {
        setConfirmDeleteProductoId(null);
    };

    const handleDeleteProducto = async (idProducto: number) => {
        setListError("");
        setListSuccess("");
        setDeletingProductoId(idProducto);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(deleteProductoByIdRoute(idProducto), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_DELETE_ERROR);
                return;
            }

            setListSuccess(DELETE_SUCCESS_MESSAGE);
            setConfirmDeleteProductoId(null);
            await fetchProductos();
        } catch (error) {
            setListError(CONNECTION_ERROR);
        } finally {
            setDeletingProductoId(null);
        }
    };

    const handleCloseProductoDetail = () => {
        setSelectedProducto(null);
        setDetailError("");
        setLoadingDetail(false);
        setDescuentos([]);
        setDescuentosError("");
        setLoadingDescuentos(false);
    };

    const fetchDescuentos = async (idProducto: number) => {
        setLoadingDescuentos(true);
        setDescuentosError("");
        setDescuentos([]);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(descuentosByProductoRoute(idProducto), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setDescuentosError(data.message || DETAIL_DISCOUNTS_ERROR);
                return;
            }

            const data = await response.json();
            if (data.descuentos) {
                setDescuentos(data.descuentos);
            }
        } catch (error) {
            setDescuentosError(CONNECTION_ERROR);
        } finally {
            setLoadingDescuentos(false);
        }
    };

    const handleOpenProductoDetail = async (producto: Producto) => {
        setSelectedProducto(producto);
        setDetailError("");
        setLoadingDetail(true);
        setDescuentos([]);
        setDescuentosError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(productoByIdRoute(producto.id_producto), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setDetailError(data.message || DEFAULT_DETAIL_ERROR);
                return;
            }

            const data = await response.json();
            if (data.producto) {
                setSelectedProducto(data.producto);
                await fetchDescuentos(data.producto.id_producto);
            }
        } catch (error) {
            setDetailError(CONNECTION_ERROR);
        } finally {
            setLoadingDetail(false);
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
                {canManageProductos ? (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate("CrearProducto", { negocio })}
                        testID="productos-add-button"
                    >
                        <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.addButtonText}>{ADD_PRODUCT_BUTTON}</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {canManageProductos ? (
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                    <TextInput
                        placeholder={SEARCH_PRODUCT}
                        placeholderTextColor="#000000"
                        value={searchText}
                        onChangeText={setSearchText}
                        style={styles.searchInput}
                        autoCapitalize="none"
                        testID="productos-search-input"
                    />
                </View>
            ) : null}

            {listError ? (
                <View style={styles.feedbackError} testID="productos-list-error-message">
                    <Text style={styles.feedbackErrorText}>{listError}</Text>
                </View>
            ) : null}

            {listSuccess ? (
                <View style={styles.feedbackSuccess} testID="productos-list-success-message">
                    <Text style={styles.feedbackSuccessText}>{listSuccess}</Text>
                </View>
            ) : null}

            <Modal
                visible={!!selectedProducto}
                transparent
                animationType="none"
                onRequestClose={handleCloseProductoDetail}
                testID="producto-detail-modal"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.formContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{DETAIL_TITLE}</Text>
                            <TouchableOpacity onPress={handleCloseProductoDetail} testID="producto-detail-close-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {loadingDetail ? (
                            <View style={styles.loadingContainer} testID="producto-detail-loading">
                                <ActivityIndicator size="small" color="#1976D2" />
                            </View>
                        ) : null}

                        {detailError ? (
                            <View style={styles.feedbackError} testID="producto-detail-error-message">
                                <Text style={styles.feedbackErrorText}>{detailError}</Text>
                            </View>
                        ) : null}

                        {selectedProducto ? (
                            <>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_NAME_LABEL}</Text>
                                    <Text style={styles.detailValue}>{selectedProducto.nombre}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_REFERENCE_LABEL}</Text>
                                    <Text style={styles.detailValue}>{selectedProducto.referencia}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_CATEGORY_LABEL}</Text>
                                    <Text style={styles.detailValue}>{selectedProducto.categoria}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_PROVIDER_LABEL}</Text>
                                    <Text style={styles.detailValue}>{selectedProducto.proveedor_nombre || "-"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_BUY_PRICE_LABEL}</Text>
                                    <Text style={styles.detailValue}>{Number(selectedProducto.precio_compra).toFixed(2)} EUR</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_SELL_PRICE_LABEL}</Text>
                                    <Text style={styles.detailValue}>{Number(selectedProducto.precio_venta).toFixed(2)} EUR</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_STOCK_LABEL}</Text>
                                    <Text style={styles.detailValue}>{selectedProducto.stock}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_MIN_STOCK_LABEL}</Text>
                                    <Text style={styles.detailValue}>{selectedProducto.stock_minimo}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_DESCRIPTION_LABEL}</Text>
                                    <Text style={styles.detailValue}>{selectedProducto.descripcion || DETAIL_EMPTY_DESCRIPTION}</Text>
                                </View>

                                <View style={styles.discountsSectionDivider} />
                                <Text style={styles.discountsSectionTitle}>{DETAIL_DISCOUNTS_SECTION_TITLE}</Text>

                                {loadingDescuentos ? (
                                    <View style={styles.discountsLoadingContainer} testID="descuentos-loading">
                                        <ActivityIndicator size="small" color="#1976D2" />
                                        <Text style={styles.discountsLoadingText}>{DETAIL_DISCOUNTS_LOADING}</Text>
                                    </View>
                                ) : null}

                                {descuentosError ? (
                                    <View style={styles.feedbackError} testID="descuentos-error-message">
                                        <Text style={styles.feedbackErrorText}>{descuentosError}</Text>
                                    </View>
                                ) : null}

                                {!loadingDescuentos && !descuentosError && descuentos.length === 0 ? (
                                    <Text style={styles.noDiscountsText} testID="no-descuentos-message">{DETAIL_NO_DISCOUNTS_MESSAGE}</Text>
                                ) : null}

                                {!loadingDescuentos && !descuentosError && descuentos.length > 0 ? (
                                    descuentos.map((descuento) => {
                                        const formatDate = (dateStr: string | null | undefined) => {
                                            if (!dateStr) return "-";
                                            try {
                                                const date = new Date(dateStr);
                                                return date.toLocaleDateString("es-ES");
                                            } catch {
                                                return "-";
                                            }
                                        };

                                        return (
                                            <View key={descuento.id_descuento} style={styles.discountCard} testID={`descuento-card-${descuento.id_descuento}`}>
                                                <View style={styles.discountRow}>
                                                    <Text style={styles.discountLabel}>{DETAIL_DISCOUNT_PERCENTAGE_LABEL}:</Text>
                                                    <Text style={styles.discountValue}>{descuento.porcentaje_descuento}%</Text>
                                                </View>
                                                <View style={styles.discountRow}>
                                                    <Text style={styles.discountLabel}>{DETAIL_DISCOUNT_TYPE_LABEL}:</Text>
                                                    <Text style={styles.discountValue}>{descuento.tipo_descuento || "porcentaje"}</Text>
                                                </View>
                                                <View style={styles.discountRow}>
                                                    <Text style={styles.discountLabel}>{DETAIL_DISCOUNT_START_DATE_LABEL}:</Text>
                                                    <Text style={styles.discountValue}>{formatDate(descuento.fecha_inicio)}</Text>
                                                </View>
                                                <View style={styles.discountRow}>
                                                    <Text style={styles.discountLabel}>{DETAIL_DISCOUNT_END_DATE_LABEL}:</Text>
                                                    <Text style={styles.discountValue}>{formatDate(descuento.fecha_fin)}</Text>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : null}
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {!filteredProductos.length && !listError ? (
                        <Text style={styles.emptyText}>{EMPTY_PRODUCTS_MESSAGE}</Text>
                    ) : null}

                    {filteredProductos.map((producto) => {
                        const isDeleting = deletingProductoId === producto.id_producto;

                        return (
                            <View key={producto.id_producto} style={styles.productCard} testID={`producto-card-${producto.id_producto}`}>
                                <TouchableOpacity
                                    onPress={() => handleOpenProductoDetail(producto)}
                                    testID={`producto-open-detail-${producto.id_producto}`}
                                >
                                    <View style={styles.cardTopRow}>
                                        <Text style={styles.productName}>{producto.nombre}</Text>
                                        <Text style={styles.productPrice}>{Number(producto.precio_venta).toFixed(2)} EUR</Text>
                                    </View>
                                    <Text style={styles.productMeta}>Ref: {producto.referencia}</Text>
                                    <Text style={styles.productMeta}>Categoria: {producto.categoria}</Text>
                                    <Text style={styles.productMeta}>Proveedor: {producto.proveedor_nombre || "-"}</Text>
                                    <Text style={styles.productMeta}>Stock: {producto.stock}</Text>
                                </TouchableOpacity>

                                <View style={styles.actionsRow}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.editButton]}
                                        onPress={() => navigation.navigate("EditarProducto", { negocio, producto })}
                                        testID={`producto-edit-button-${producto.id_producto}`}
                                    >
                                        <MaterialIcons name="edit" size={16} color="#fff" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleAskDeleteProducto(producto.id_producto)}
                                        disabled={isDeleting}
                                        testID={`producto-delete-button-${producto.id_producto}`}
                                    >
                                        {isDeleting ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <MaterialIcons name="delete" size={16} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {confirmDeleteProductoId === producto.id_producto ? (
                                    <View style={styles.confirmBox} testID={`producto-delete-confirm-${producto.id_producto}`}>
                                        <Text style={styles.confirmTitle}>{DELETE_CONFIRM_TITLE}</Text>
                                        <Text style={styles.confirmMessage}>{DELETE_CONFIRM_MESSAGE}</Text>
                                        <View style={styles.confirmActions}>
                                            <TouchableOpacity
                                                style={styles.confirmCancelButton}
                                                onPress={handleCancelDeleteProducto}
                                                testID={`producto-delete-cancel-${producto.id_producto}`}
                                            >
                                                <Text style={styles.confirmCancelText}>Cancelar</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.confirmDeleteButton}
                                                onPress={() => handleDeleteProducto(producto.id_producto)}
                                                disabled={isDeleting}
                                                testID={`producto-delete-confirm-button-${producto.id_producto}`}
                                            >
                                                <Text style={styles.confirmDeleteText}>{DELETE_BUTTON_TEXT}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        );
                    })}
                </ScrollView>
            )}
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
        flex: 1,
    },
    addButton: {
        backgroundColor: "#1976D2",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        paddingHorizontal: 10,
    },
    searchIcon: {
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        height: 42,
        color: "#111827",
    },
    feedbackError: {
        backgroundColor: "#fee2e2",
        borderColor: "#fecaca",
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginHorizontal: 16,
        marginBottom: 8,
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
        marginHorizontal: 16,
        marginBottom: 8,
    },
    feedbackSuccessText: {
        color: "#166534",
        fontWeight: "600",
    },
    formContainer: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginHorizontal: 12,
        padding: 12,
        width: "90%",
        maxWidth: 420,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    modalTitle: {
        color: "#0D47A1",
        fontSize: 18,
        fontWeight: "700",
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 10,
    },
    listContainer: {
        padding: 16,
    },
    emptyText: {
        textAlign: "center",
        color: "#6b7280",
        marginTop: 20,
    },
    productCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    productName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        flex: 1,
        marginRight: 8,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1d4ed8",
    },
    productMeta: {
        color: "#4b5563",
        marginTop: 2,
    },
    actionsRow: {
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    actionButton: {
        height: 34,
        width: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    editButton: {
        backgroundColor: "#2563eb",
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: "#dc2626",
    },
    confirmBox: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#fecaca",
        backgroundColor: "#fff1f2",
        borderRadius: 8,
        padding: 10,
    },
    confirmTitle: {
        color: "#03045E",
        fontWeight: "700",
        marginBottom: 4,
    },
    confirmMessage: {
        color: "#03045E",
        marginBottom: 8,
    },
    confirmActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    confirmCancelButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 8,
    },
    confirmCancelText: {
        color: "#6b7280",
        fontWeight: "600",
    },
    confirmDeleteButton: {
        backgroundColor: "#dc2626",
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    confirmDeleteText: {
        color: "#fff",
        fontWeight: "700",
    },
    detailRow: {
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6b7280",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    detailValue: {
        fontSize: 15,
        color: "#111827",
    },
    discountsSectionDivider: {
        height: 1,
        backgroundColor: "#e5e7eb",
        marginVertical: 12,
    },
    discountsSectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0D47A1",
        marginBottom: 10,
        textTransform: "uppercase",
    },
    discountsLoadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },
    discountsLoadingText: {
        marginLeft: 8,
        color: "#6b7280",
        fontSize: 13,
    },
    noDiscountsText: {
        color: "#6b7280",
        fontStyle: "italic",
        fontSize: 13,
        marginBottom: 8,
    },
    discountCard: {
        backgroundColor: "#f0f7ff",
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#bfdbfe",
    },
    discountRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    discountLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
    },
    discountValue: {
        fontSize: 12,
        color: "#111827",
        fontWeight: "600",
    },
});
