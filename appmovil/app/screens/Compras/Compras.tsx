import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { CompraListItem } from "../types";
import {
    ADD_COMPRA_BUTTON,
    compraByIdRoute,
    comprasListRoute,
    CONNECTION_ERROR,
    DATE_FILTER_INVALID_ERROR,
    DEFAULT_FETCH_COMPRA_DETAIL_ERROR,
    DEFAULT_FETCH_COMPRAS_ERROR,
    DETAIL_CLOSE_BUTTON,
    DETAIL_PRODUCTS_TITLE,
    DETAIL_TITLE,
    EMPTY_COMPRAS_MESSAGE,
    FILTER_DATE_PLACEHOLDER,
    LIST_SCREEN_TITLE,
    LOADING_MORE_TEXT,
    NO_PROVIDER_MESSAGE,
} from "./constants";
import { ComprasProps } from "./types";

const DATE_FILTER_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PAGE_SIZE = 20;

type CompraDetailResponse = {
    id_compra: number;
    id_negocio: number;
    descripcion?: string | null;
    fecha: string;
    importe_total: number;
    estado: string;
    proveedor?: string | null;
    proveedores?: string[];
    productos: Array<{
        id_producto: number;
        nombre?: string | null;
        cantidad_esperada: number;
        cantidad_llegada: number;
        proveedor_nombre?: string | null;
    }>;
};

const formatDate = (value: string) => {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString("es-ES");
};

const formatAmount = (value: number) => `${Number(value || 0).toFixed(2)} EUR`;

const Compras: React.FC<ComprasProps> = ({ route, navigation }) => {
    const { negocio } = route.params;
    const [compras, setCompras] = useState<CompraListItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [listError, setListError] = useState("");

    const [fechaFilter, setFechaFilter] = useState("");
    const [filtersModalVisible, setFiltersModalVisible] = useState(false);

    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [selectedCompra, setSelectedCompra] = useState<CompraDetailResponse | null>(null);

    const appliedFilters = useMemo(() => ({
        fecha: fechaFilter.trim(),
    }), [fechaFilter]);

    const canFilterByDate = useMemo(() => {
        if (!appliedFilters.fecha) {
            return true;
        }

        return DATE_FILTER_REGEX.test(appliedFilters.fecha);
    }, [appliedFilters.fecha]);

    const fetchCompras = useCallback(async (options?: { nextPage?: number; append?: boolean; refresh?: boolean }) => {
        const nextPage = options?.nextPage ?? 1;
        const append = !!options?.append;

        if (!canFilterByDate) {
            setListError(DATE_FILTER_INVALID_ERROR);
            return;
        }

        if (append) {
            setLoadingMore(true);
        } else if (options?.refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setListError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(comprasListRoute({
                idNegocio: negocio.id_negocio,
                page: nextPage,
                limit: PAGE_SIZE,
                fecha: appliedFilters.fecha,
                sortBy: "fecha",
                sortOrder: "desc",
            }), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_FETCH_COMPRAS_ERROR);
                if (!append) {
                    setCompras([]);
                }
                return;
            }

            const data = await response.json();
            const comprasData = data.compras || [];
            const pagination = data.pagination || {};

            setCompras((previous) => (append ? [...previous, ...comprasData] : comprasData));
            setPage(nextPage);
            setHasMore(!!pagination.has_more);
        } catch (error) {
            setListError(CONNECTION_ERROR);
            if (!append) {
                setCompras([]);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [appliedFilters, canFilterByDate, negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchCompras();
        }, [fetchCompras])
    );

    const handleRefresh = () => {
        fetchCompras({ refresh: true });
    };

    const handleLoadMore = () => {
        if (loading || loadingMore || !hasMore) {
            return;
        }

        fetchCompras({ nextPage: page + 1, append: true });
    };

    const handleApplyFilters = () => {
        setFiltersModalVisible(false);
        fetchCompras();
    };

    const handleClearFilters = () => {
        setFechaFilter("");
        setListError("");
        setFiltersModalVisible(false);
        fetchCompras();
    };

    const handleOpenDetail = async (idCompra: number) => {
        setDetailVisible(true);
        setDetailLoading(true);
        setDetailError("");
        setSelectedCompra(null);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(compraByIdRoute(idCompra), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setDetailError(data.message || DEFAULT_FETCH_COMPRA_DETAIL_ERROR);
                return;
            }

            const data = await response.json();
            setSelectedCompra(data.compra || null);
        } catch (error) {
            setDetailError(CONNECTION_ERROR);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setDetailVisible(false);
        setDetailError("");
        setSelectedCompra(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.goBack()}
                    testID="compras-list-back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.title}>{LIST_SCREEN_TITLE}</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate("CrearCompra", { negocio })}
                    testID="compras-go-create-button"
                >
                    <MaterialIcons name="add-shopping-cart" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.addButtonText}>{ADD_COMPRA_BUTTON}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filtersContainer}>
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setFiltersModalVisible(true)}
                        testID="compras-open-filters-button"
                    >
                        <MaterialIcons name="filter-list" size={18} color="#1f2937" />
                        <Text style={styles.secondaryButtonText}>Filtros</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {listError ? (
                <Text style={styles.errorText} testID="compras-list-error-message">{listError}</Text>
            ) : null}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1976D2" testID="compras-list-loading" />
                </View>
            ) : (
                <FlatList
                    data={compras}
                    keyExtractor={(item) => `${item.id_compra}`}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onEndReachedThreshold={0.3}
                    onEndReached={handleLoadMore}
                    ListEmptyComponent={(
                        <Text style={styles.emptyText} testID="compras-list-empty-message">{EMPTY_COMPRAS_MESSAGE}</Text>
                    )}
                    ListFooterComponent={loadingMore ? (
                        <View style={styles.footerLoading}>
                            <ActivityIndicator size="small" color="#1976D2" />
                            <Text style={styles.footerLoadingText}>{LOADING_MORE_TEXT}</Text>
                        </View>
                    ) : null}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            style={styles.compraCard}
                            onPress={() => handleOpenDetail(item.id_compra)}
                            testID={`compras-item-${index}`}
                        >
                            <Text style={styles.compraDate}>Fecha: {formatDate(item.fecha)}</Text>
                            <Text style={styles.compraAmount}>Importe: {formatAmount(item.importe_total)}</Text>
                            <Text style={styles.compraProvider}>Proveedor: {item.proveedor || NO_PROVIDER_MESSAGE}</Text>
                            <Text style={styles.compraStatus}>Estado: {item.estado}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            <Modal
                visible={filtersModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setFiltersModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Filtros de compras</Text>

                        <TextInput
                            style={styles.input}
                            value={fechaFilter}
                            onChangeText={setFechaFilter}
                            placeholder={FILTER_DATE_PLACEHOLDER}
                            testID="compras-filter-fecha-input"
                        />

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleApplyFilters}
                                testID="compras-apply-filters-button"
                            >
                                <Text style={styles.primaryButtonText}>Aplicar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleClearFilters}
                                testID="compras-clear-filters-button"
                            >
                                <Text style={styles.secondaryButtonText}>Limpiar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => setFiltersModalVisible(false)}
                                testID="compras-close-filters-button"
                            >
                                <Text style={styles.secondaryButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={detailVisible}
                transparent
                animationType="slide"
                onRequestClose={handleCloseDetail}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{DETAIL_TITLE}</Text>

                        {detailLoading ? (
                            <ActivityIndicator size="small" color="#1976D2" testID="compras-detail-loading" />
                        ) : null}

                        {detailError ? (
                            <Text style={styles.errorText} testID="compras-detail-error-message">{detailError}</Text>
                        ) : null}

                        {selectedCompra ? (
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLine}>Fecha: {formatDate(selectedCompra.fecha)}</Text>
                                <Text style={styles.detailLine}>Importe: {formatAmount(selectedCompra.importe_total)}</Text>
                                <Text style={styles.detailLine}>Estado: {selectedCompra.estado}</Text>
                                <Text style={styles.detailLine}>Proveedor: {selectedCompra.proveedor || NO_PROVIDER_MESSAGE}</Text>
                                {selectedCompra.descripcion ? (
                                    <Text style={styles.detailLine}>Descripcion: {selectedCompra.descripcion}</Text>
                                ) : null}

                                <Text style={styles.productsTitle}>{DETAIL_PRODUCTS_TITLE}</Text>
                                {selectedCompra.productos?.length ? selectedCompra.productos.map((producto) => (
                                    <View key={`${producto.id_producto}`} style={styles.productRow}>
                                        <Text style={styles.productName}>{producto.nombre || `Producto ${producto.id_producto}`}</Text>
                                        <Text style={styles.productMeta}>Esperada: {producto.cantidad_esperada} | Llegada: {producto.cantidad_llegada}</Text>
                                        <Text style={styles.productMeta}>Proveedor: {producto.proveedor_nombre || NO_PROVIDER_MESSAGE}</Text>
                                    </View>
                                )) : (
                                    <Text style={styles.emptyText}>No hay productos en la compra</Text>
                                )}
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleCloseDetail}
                            testID="compras-detail-close-button"
                        >
                            <Text style={styles.closeButtonText}>{DETAIL_CLOSE_BUTTON}</Text>
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
        flex: 1,
        marginLeft: 12,
        fontSize: 20,
        fontWeight: "700",
        color: "#0D47A1",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1976D2",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 8,
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    actionRow: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    primaryButton: {
        backgroundColor: "#1976D2",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    secondaryButton: {
        backgroundColor: "#e5e7eb",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    secondaryButtonText: {
        color: "#1f2937",
        fontWeight: "700",
    },
    loadingContainer: {
        marginTop: 30,
        alignItems: "center",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 10,
    },
    compraCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 12,
        gap: 4,
    },
    compraDate: {
        color: "#111827",
        fontWeight: "700",
    },
    compraAmount: {
        color: "#1e3a8a",
        fontWeight: "700",
    },
    compraProvider: {
        color: "#374151",
    },
    compraStatus: {
        color: "#374151",
        textTransform: "capitalize",
    },
    errorText: {
        color: "#b91c1c",
        fontWeight: "600",
        marginHorizontal: 16,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: "center",
        color: "#6b7280",
        marginTop: 20,
    },
    footerLoading: {
        marginTop: 10,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    footerLoadingText: {
        color: "#4b5563",
    },
    modalActionRow: {
        marginTop: 10,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
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
        maxHeight: "78%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 10,
    },
    detailContent: {
        gap: 6,
    },
    detailLine: {
        color: "#1f2937",
    },
    productsTitle: {
        marginTop: 8,
        color: "#111827",
        fontWeight: "700",
    },
    productRow: {
        backgroundColor: "#f8fafc",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 8,
        gap: 2,
    },
    productName: {
        fontWeight: "700",
        color: "#111827",
    },
    productMeta: {
        color: "#4b5563",
        fontSize: 12,
    },
    closeButton: {
        marginTop: 14,
        alignSelf: "flex-end",
        backgroundColor: "#e5e7eb",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    closeButtonText: {
        fontWeight: "700",
        color: "#374151",
    },
});

export default Compras;
