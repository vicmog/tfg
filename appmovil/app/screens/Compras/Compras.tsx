import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { CompraListItem } from "../types";
import {
    ADD_COMPRA_BUTTON,
    compraByIdRoute,
    comprasListRoute,
    CONNECTION_ERROR,
    CONFIRM_DELETE_ACCEPT,
    CONFIRM_DELETE_CANCEL,
    DATE_FILTER_INVALID_ERROR,
    DEFAULT_DELETE_ERROR,
    DEFAULT_FETCH_COMPRA_DETAIL_ERROR,
    DEFAULT_FETCH_COMPRAS_ERROR,
    DELETE_BUTTON_TEXT,
    DELETE_CONFIRM_MESSAGE,
    DELETE_CONFIRM_TITLE,
    DELETE_SUCCESS_MESSAGE,
    deleteCompraByIdRoute,
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

const toApiDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseApiDate = (dateString: string) => {
    if (!DATE_FILTER_REGEX.test(dateString)) {
        return null;
    }

    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
};

const buildCalendarMatrix = (cursor: Date) => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<number | null> = [];

    for (let i = 0; i < startWeekDay; i += 1) {
        cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push(day);
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return cells;
};

const Compras: React.FC<ComprasProps> = ({ route, navigation }) => {
    const { negocio } = route.params;
    const [compras, setCompras] = useState<CompraListItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [listError, setListError] = useState("");
    const [listSuccess, setListSuccess] = useState("");

    const [fechaFilterDraft, setFechaFilterDraft] = useState("");
    const [fechaFilterApplied, setFechaFilterApplied] = useState("");
    const [filtersModalVisible, setFiltersModalVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [calendarCursor, setCalendarCursor] = useState<Date>(new Date());

    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [deletingCompraId, setDeletingCompraId] = useState<number | null>(null);
    const [confirmDeleteCompraId, setConfirmDeleteCompraId] = useState<number | null>(null);
    const [selectedCompra, setSelectedCompra] = useState<CompraDetailResponse | null>(null);

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageCompras = normalizedRole === "jefe" || normalizedRole === "admin";

    const appliedFilters = useMemo(() => ({
        fecha: fechaFilterApplied.trim(),
    }), [fechaFilterApplied]);

    const fetchCompras = useCallback(async (
        options?: { nextPage?: number; append?: boolean; refresh?: boolean },
        forcedFecha?: string
    ) => {
        const nextPage = options?.nextPage ?? 1;
        const append = !!options?.append;
        const targetFecha = (forcedFecha ?? appliedFilters.fecha).trim();

        if (targetFecha && !DATE_FILTER_REGEX.test(targetFecha)) {
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
        setListSuccess("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(comprasListRoute({
                idNegocio: negocio.id_negocio,
                page: nextPage,
                limit: PAGE_SIZE,
                fecha: targetFecha,
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
    }, [appliedFilters.fecha, negocio.id_negocio]);

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
        const normalizedFecha = fechaFilterDraft.trim();

        if (normalizedFecha && !DATE_FILTER_REGEX.test(normalizedFecha)) {
            setListError(DATE_FILTER_INVALID_ERROR);
            return;
        }

        setFechaFilterApplied(normalizedFecha);
        setFiltersModalVisible(false);
        fetchCompras(undefined, normalizedFecha);
    };

    const handleClearFilters = () => {
        setFechaFilterDraft("");
        setFechaFilterApplied("");
        setListError("");
        setDatePickerVisible(false);
        setFiltersModalVisible(false);
        fetchCompras(undefined, "");
    };

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS !== "ios") {
            setDatePickerVisible(false);
        }

        if (event.type === "dismissed" || !selectedDate) {
            return;
        }

        setFechaFilterDraft(toApiDate(selectedDate));
        setListError("");
    };

    const handleOpenDatePicker = () => {
        setDatePickerVisible(true);
        setCalendarCursor(parseApiDate(fechaFilterDraft) || new Date());
    };

    const handleSelectWebDate = (day: number) => {
        const selected = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), day);
        setFechaFilterDraft(toApiDate(selected));
        setListError("");
        setDatePickerVisible(false);
    };

    const webCalendarCells = useMemo(() => buildCalendarMatrix(calendarCursor), [calendarCursor]);
    const selectedDate = parseApiDate(fechaFilterDraft);

    const handleOpenFiltersModal = () => {
        setFechaFilterDraft(fechaFilterApplied);
        setDatePickerVisible(false);
        setFiltersModalVisible(true);
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

    const handleAskDeleteCompra = (idCompra: number) => {
        setListError("");
        setListSuccess("");
        setConfirmDeleteCompraId(idCompra);
    };

    const handleCancelDeleteCompra = () => {
        setConfirmDeleteCompraId(null);
    };

    const handleDeleteCompra = async (idCompra: number) => {
        setDeletingCompraId(idCompra);
        setListError("");
        setListSuccess("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(deleteCompraByIdRoute(idCompra), {
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

            const data = await response.json();
            setListSuccess(data.message || DELETE_SUCCESS_MESSAGE);
            setConfirmDeleteCompraId(null);
            await fetchCompras(undefined, appliedFilters.fecha);
        } catch (error) {
            setListError(CONNECTION_ERROR);
        } finally {
            setDeletingCompraId(null);
        }
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
                        onPress={handleOpenFiltersModal}
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

            {listSuccess ? (
                <Text style={styles.successText} testID="compras-list-success-message">{listSuccess}</Text>
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
                    renderItem={({ item, index }) => {
                        const isDeleting = deletingCompraId === item.id_compra;

                        return (
                            <View style={styles.compraCard} testID={`compras-item-${index}`}>
                                <View style={styles.compraCardContent}>
                                    <TouchableOpacity
                                        style={styles.compraInfoButton}
                                        onPress={() => handleOpenDetail(item.id_compra)}
                                        testID={`compras-open-detail-${item.id_compra}`}
                                    >
                                        <Text style={styles.compraDate}>Fecha: {formatDate(item.fecha)}</Text>
                                        <Text style={styles.compraAmount}>Importe: {formatAmount(item.importe_total)}</Text>
                                        <Text style={styles.compraProvider}>Proveedor: {item.proveedor || NO_PROVIDER_MESSAGE}</Text>
                                        <Text style={styles.compraStatus}>Estado: {item.estado}</Text>
                                    </TouchableOpacity>

                                    {canManageCompras ? (
                                        <View style={styles.cardActionsRow}>
                                            <TouchableOpacity
                                                style={[styles.actionIconButton, styles.deleteIconButton]}
                                                onPress={() => handleAskDeleteCompra(item.id_compra)}
                                                disabled={isDeleting}
                                                testID={`compras-delete-button-${item.id_compra}`}
                                            >
                                                {isDeleting ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <MaterialIcons name="delete" size={16} color="#fff" />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}
                                </View>

                                {confirmDeleteCompraId === item.id_compra ? (
                                    <View style={styles.confirmBox} testID={`compras-delete-confirm-${item.id_compra}`}>
                                        <Text style={styles.confirmTitle}>{DELETE_CONFIRM_TITLE}</Text>
                                        <Text style={styles.confirmMessage}>{DELETE_CONFIRM_MESSAGE}</Text>
                                        <View style={styles.confirmActions}>
                                            <TouchableOpacity
                                                style={styles.confirmCancelButton}
                                                onPress={handleCancelDeleteCompra}
                                                testID={`compras-delete-cancel-${item.id_compra}`}
                                            >
                                                <Text style={styles.confirmCancelText}>{CONFIRM_DELETE_CANCEL}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.confirmDeleteButton}
                                                onPress={() => handleDeleteCompra(item.id_compra)}
                                                disabled={isDeleting}
                                                testID={`compras-delete-confirm-button-${item.id_compra}`}
                                            >
                                                <Text style={styles.confirmDeleteText}>{CONFIRM_DELETE_ACCEPT}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        );
                    }}
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

                        <TouchableOpacity
                            style={styles.input}
                            onPress={handleOpenDatePicker}
                            testID="compras-filter-fecha-input"
                        >
                            <View style={styles.datePickerRow}>
                                <MaterialIcons name="calendar-month" size={18} color="#4b5563" />
                                <Text style={fechaFilterDraft ? styles.datePickerText : styles.datePickerPlaceholder}>
                                    {fechaFilterDraft || FILTER_DATE_PLACEHOLDER}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {datePickerVisible && Platform.OS !== "web" ? (
                            <DateTimePicker
                                testID="compras-filter-date-picker"
                                value={parseApiDate(fechaFilterDraft) || new Date()}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                onChange={handleDateChange}
                            />
                        ) : null}

                        {datePickerVisible && Platform.OS === "web" ? (
                            <View style={styles.webCalendarCard} testID="compras-filter-date-picker-web">
                                <View style={styles.webCalendarHeader}>
                                    <TouchableOpacity
                                        style={styles.webCalendarNavButton}
                                        onPress={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1))}
                                        testID="compras-calendar-prev-month"
                                    >
                                        <MaterialIcons name="chevron-left" size={18} color="#374151" />
                                    </TouchableOpacity>
                                    <Text style={styles.webCalendarTitle}>
                                        {calendarCursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.webCalendarNavButton}
                                        onPress={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1))}
                                        testID="compras-calendar-next-month"
                                    >
                                        <MaterialIcons name="chevron-right" size={18} color="#374151" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.webWeekdaysRow}>
                                    {["L", "M", "X", "J", "V", "S", "D"].map((label) => (
                                        <Text key={label} style={styles.webWeekdayLabel}>{label}</Text>
                                    ))}
                                </View>

                                <View style={styles.webCalendarGrid}>
                                    {webCalendarCells.map((day, index) => {
                                        if (!day) {
                                            return <View key={`empty-${index}`} style={styles.webCalendarDayEmpty} />;
                                        }

                                        const isSelected = !!selectedDate
                                            && selectedDate.getFullYear() === calendarCursor.getFullYear()
                                            && selectedDate.getMonth() === calendarCursor.getMonth()
                                            && selectedDate.getDate() === day;

                                        return (
                                            <TouchableOpacity
                                                key={`day-${day}`}
                                                style={[styles.webCalendarDayButton, isSelected && styles.webCalendarDayButtonSelected]}
                                                onPress={() => handleSelectWebDate(day)}
                                                testID={`compras-calendar-day-${day}`}
                                            >
                                                <Text style={[styles.webCalendarDayText, isSelected && styles.webCalendarDayTextSelected]}>{day}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : null}

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
    datePickerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    datePickerText: {
        color: "#111827",
        fontWeight: "600",
    },
    datePickerPlaceholder: {
        color: "#9ca3af",
        fontWeight: "500",
    },
    webCalendarCard: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        backgroundColor: "#fff",
        padding: 10,
    },
    webCalendarHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    webCalendarNavButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: "#f3f4f6",
    },
    webCalendarTitle: {
        color: "#111827",
        fontWeight: "700",
        textTransform: "capitalize",
    },
    webWeekdaysRow: {
        flexDirection: "row",
        marginBottom: 6,
    },
    webWeekdayLabel: {
        flex: 1,
        textAlign: "center",
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "700",
    },
    webCalendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    webCalendarDayEmpty: {
        width: "14.2857%",
        height: 34,
    },
    webCalendarDayButton: {
        width: "14.2857%",
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
    },
    webCalendarDayButtonSelected: {
        backgroundColor: "#1976D2",
    },
    webCalendarDayText: {
        color: "#1f2937",
    },
    webCalendarDayTextSelected: {
        color: "#fff",
        fontWeight: "700",
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
    compraCardContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    compraInfoButton: {
        flex: 1,
    },
    cardActionsRow: {
        marginLeft: 8,
    },
    actionIconButton: {
        height: 34,
        width: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    deleteIconButton: {
        backgroundColor: "#dc2626",
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
    successText: {
        color: "#166534",
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
