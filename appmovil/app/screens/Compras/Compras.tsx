import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
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
import { CompraListItem, Producto } from "../types";
import {
    ADD_PRODUCT_ROW_TEXT,
    ADD_COMPRA_BUTTON,
    compraByIdRoute,
    comprasListRoute,
    CONNECTION_ERROR,
    COMPLETED_STATUS_TEXT,
    COMPLETE_BUTTON_TEXT,
    COMPLETE_SUCCESS_MESSAGE,
    CONFIRM_DELETE_ACCEPT,
    CONFIRM_DELETE_CANCEL,
    DATE_FILTER_INVALID_ERROR,
    DEFAULT_PRODUCTS_ERROR,
    DEFAULT_DELETE_ERROR,
    DEFAULT_FETCH_COMPRA_DETAIL_ERROR,
    DEFAULT_FETCH_COMPRAS_ERROR,
    DEFAULT_COMPLETE_ERROR,
    DEFAULT_UPDATE_ERROR,
    DELETE_BUTTON_TEXT,
    DELETE_CONFIRM_MESSAGE,
    DELETE_CONFIRM_TITLE,
    DELETE_SUCCESS_MESSAGE,
    deleteCompraByIdRoute,
    DETAIL_CLOSE_BUTTON,
    DETAIL_PRODUCTS_TITLE,
    DETAIL_TITLE,
    EDIT_BUTTON_TEXT,
    EDIT_DATE_PLACEHOLDER,
    EDIT_DESCRIPTION_PLACEHOLDER,
    EDIT_TITLE,
    EMPTY_COMPRAS_MESSAGE,
    FILTER_DATE_PLACEHOLDER,
    DUPLICATED_PRODUCT_ERROR,
    EMPTY_PRODUCT_ID_ERROR,
    GREEN_BUTTON_INFO,
    LIST_SCREEN_TITLE,
    LOADING_MORE_TEXT,
    NO_PROVIDER_MESSAGE,
    productosByNegocioRoute,
    SAVE_CHANGES_BUTTON_TEXT,
    SAVING_CHANGES_BUTTON_TEXT,
    updateCompraByIdRoute,
    UPDATE_SUCCESS_MESSAGE,
} from "./constants";
import { ComprasProps } from "./types";

const DATE_FILTER_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const INTEGER_REGEX = /^\d+$/;
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

type EditCompraRow = {
    localId: string;
    id_producto: number | null;
    nombre?: string | null;
    cantidad_esperada: string;
    cantidad_llegada: string;
};

const createEditRow = (id: number): EditCompraRow => ({
    localId: `edit-compra-row-${id}`,
    id_producto: null,
    cantidad_esperada: "",
    cantidad_llegada: "0",
});

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
    const [editVisible, setEditVisible] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const [editingCompraId, setEditingCompraId] = useState<number | null>(null);
    const [editDescripcion, setEditDescripcion] = useState("");
    const [editFecha, setEditFecha] = useState("");
    const [editRows, setEditRows] = useState<EditCompraRow[]>([]);
    const [editDatePickerVisible, setEditDatePickerVisible] = useState(false);
    const [editCalendarCursor, setEditCalendarCursor] = useState<Date>(new Date());
    const [editRowsSequence, setEditRowsSequence] = useState(1);
    const [editProductPickerVisible, setEditProductPickerVisible] = useState(false);
    const [editPickerSearch, setEditPickerSearch] = useState("");
    const [editPickerRowId, setEditPickerRowId] = useState<string | null>(null);
    const [editCatalog, setEditCatalog] = useState<Producto[]>([]);
    const [editCatalogLoading, setEditCatalogLoading] = useState(false);
    const [completingCompraId, setCompletingCompraId] = useState<number | null>(null);
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
    const editWebCalendarCells = useMemo(() => buildCalendarMatrix(editCalendarCursor), [editCalendarCursor]);
    const selectedEditDate = parseApiDate(editFecha);
    const editRowsWithProductData = useMemo(
        () => editRows.map((row) => {
            const producto = editCatalog.find((item) => item.id_producto === row.id_producto) || null;

            return {
                ...row,
                producto,
            };
        }),
        [editCatalog, editRows]
    );

    const selectedEditProductIds = useMemo(
        () => editRows
            .map((row) => row.id_producto)
            .filter((idProducto): idProducto is number => idProducto !== null),
        [editRows]
    );

    const editPickerProducts = useMemo(() => {
        const search = editPickerSearch.trim().toLowerCase();
        const activeRow = editRows.find((row) => row.localId === editPickerRowId);
        const activeProductId = activeRow?.id_producto ?? null;

        return editCatalog.filter((producto) => {
            const alreadySelected = selectedEditProductIds.includes(producto.id_producto)
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
    }, [editCatalog, editPickerRowId, editPickerSearch, editRows, selectedEditProductIds]);

    const handleOpenFiltersModal = () => {
        setFechaFilterDraft(fechaFilterApplied);
        setDatePickerVisible(false);
        setFiltersModalVisible(true);
    };

    const fetchCompraDetail = useCallback(async (idCompra: number) => {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch(compraByIdRoute(idCompra), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            return { error: data.message || DEFAULT_FETCH_COMPRA_DETAIL_ERROR };
        }

        const data = await response.json();
        return { compra: (data.compra || null) as CompraDetailResponse | null };
    }, []);

    const fetchEditProductsCatalog = useCallback(async () => {
        setEditCatalogLoading(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(productosByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                return { error: data.message || DEFAULT_PRODUCTS_ERROR };
            }

            const data = await response.json();
            setEditCatalog(data.productos || []);
            return { error: "" };
        } catch (error) {
            return { error: CONNECTION_ERROR };
        } finally {
            setEditCatalogLoading(false);
        }
    }, [negocio.id_negocio]);

    const handleOpenDetail = async (idCompra: number) => {
        setDetailVisible(true);
        setDetailLoading(true);
        setDetailError("");
        setSelectedCompra(null);

        try {
            const detail = await fetchCompraDetail(idCompra);
            if (detail.error) {
                setDetailError(detail.error);
                return;
            }

            setSelectedCompra(detail.compra || null);
        } catch (error) {
            setDetailError(CONNECTION_ERROR);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleOpenEdit = async (idCompra: number) => {
        setEditVisible(true);
        setEditLoading(true);
        setEditError("");
        setEditDatePickerVisible(false);
        setEditProductPickerVisible(false);
        setEditPickerSearch("");
        setEditPickerRowId(null);
        setEditingCompraId(idCompra);
        setEditRows([]);
        setEditCatalog([]);

        try {
            const [detail, catalogResult] = await Promise.all([
                fetchCompraDetail(idCompra),
                fetchEditProductsCatalog(),
            ]);

            if (catalogResult.error) {
                setEditError(catalogResult.error);
                return;
            }

            if (detail.error || !detail.compra) {
                setEditError(detail.error || DEFAULT_FETCH_COMPRA_DETAIL_ERROR);
                return;
            }

            setEditDescripcion(detail.compra.descripcion || "");
            setEditFecha(toApiDate(new Date(detail.compra.fecha)));
            const nextRows = (detail.compra.productos || []).map((producto, index) => ({
                localId: `edit-compra-row-${index + 1}`,
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                cantidad_esperada: `${producto.cantidad_esperada}`,
                cantidad_llegada: `${producto.cantidad_llegada}`,
            }));

            setEditRows(nextRows.length ? nextRows : [createEditRow(1)]);
            setEditRowsSequence((nextRows.length || 1) + 1);
        } catch (error) {
            setEditError(CONNECTION_ERROR);
        } finally {
            setEditLoading(false);
        }
    };

    const handleCloseEdit = () => {
        setEditVisible(false);
        setEditLoading(false);
        setEditSaving(false);
        setEditError("");
        setEditDatePickerVisible(false);
        setEditProductPickerVisible(false);
        setEditPickerSearch("");
        setEditPickerRowId(null);
        setEditingCompraId(null);
        setEditDescripcion("");
        setEditFecha("");
        setEditRows([]);
        setEditCatalog([]);
    };

    const updateEditRow = (localId: string, changes: Partial<EditCompraRow>) => {
        setEditRows((previousRows) => previousRows.map((row) => {
            if (row.localId !== localId) {
                return row;
            }

            return {
                ...row,
                ...changes,
            };
        }));
    };

    const addEditRow = () => {
        setEditRows((previousRows) => [...previousRows, createEditRow(editRowsSequence)]);
        setEditRowsSequence((previous) => previous + 1);
    };

    const removeEditRow = (localId: string) => {
        setEditRows((previousRows) => previousRows.filter((row) => row.localId !== localId));
    };

    const openEditProductPicker = (localId: string) => {
        setEditPickerRowId(localId);
        setEditPickerSearch("");
        setEditProductPickerVisible(true);
    };

    const closeEditProductPicker = () => {
        setEditProductPickerVisible(false);
        setEditPickerSearch("");
        setEditPickerRowId(null);
    };

    const selectEditProduct = (idProducto: number) => {
        if (!editPickerRowId) {
            return;
        }

        updateEditRow(editPickerRowId, { id_producto: idProducto });
        closeEditProductPicker();
        setEditError("");
    };

    const handleEditDateChange = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
        if (Platform.OS !== "ios") {
            setEditDatePickerVisible(false);
        }

        if (event.type === "dismissed" || !selectedDateValue) {
            return;
        }

        setEditFecha(toApiDate(selectedDateValue));
        setEditError("");
    };

    const handleOpenEditDatePicker = () => {
        setEditDatePickerVisible(true);
        setEditCalendarCursor(parseApiDate(editFecha) || new Date());
    };

    const handleSelectEditWebDate = (day: number) => {
        const selected = new Date(editCalendarCursor.getFullYear(), editCalendarCursor.getMonth(), day);
        setEditFecha(toApiDate(selected));
        setEditError("");
        setEditDatePickerVisible(false);
    };

    const validateEditForm = () => {
        const fechaValue = editFecha.trim();
        if (!fechaValue) {
            setEditError("La fecha de compra es obligatoria");
            return false;
        }

        const parsedDate = new Date(fechaValue);
        if (Number.isNaN(parsedDate.getTime())) {
            setEditError("La fecha de compra no es valida");
            return false;
        }

        if (!editRows.length) {
            setEditError("Debes indicar al menos un producto");
            return false;
        }

        const selectedIds = new Set<number>();

        for (const row of editRows) {
            if (!row.id_producto) {
                setEditError(EMPTY_PRODUCT_ID_ERROR);
                return false;
            }

            if (selectedIds.has(row.id_producto)) {
                setEditError(DUPLICATED_PRODUCT_ERROR);
                return false;
            }

            selectedIds.add(row.id_producto);

            const cantidadEsperada = row.cantidad_esperada.trim();
            const cantidadLlegada = row.cantidad_llegada.trim();

            if (!INTEGER_REGEX.test(cantidadEsperada) || Number.parseInt(cantidadEsperada, 10) <= 0) {
                setEditError("La cantidad esperada debe ser un entero mayor que 0");
                return false;
            }

            if (!INTEGER_REGEX.test(cantidadLlegada) || Number.parseInt(cantidadLlegada, 10) < 0) {
                setEditError("La cantidad llegada debe ser un entero mayor o igual que 0");
                return false;
            }

            if (Number.parseInt(cantidadLlegada, 10) > Number.parseInt(cantidadEsperada, 10)) {
                setEditError("La cantidad llegada no puede ser mayor que la esperada");
                return false;
            }
        }

        return true;
    };

    const handleSaveEdit = async () => {
        setEditError("");
        setListError("");
        setListSuccess("");

        if (!editingCompraId || !validateEditForm()) {
            return;
        }

        setEditSaving(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const fechaIso = new Date(editFecha.trim()).toISOString();
            const response = await fetch(updateCompraByIdRoute(editingCompraId), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    descripcion: editDescripcion.trim(),
                    fecha: fechaIso,
                    productos: editRows.map((row) => ({
                        id_producto: Number(row.id_producto),
                        cantidad_esperada: row.cantidad_esperada.trim(),
                        cantidad_llegada: row.cantidad_llegada.trim(),
                    })),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setEditError(data.message || DEFAULT_UPDATE_ERROR);
                return;
            }

            const data = await response.json();
            setListSuccess(data.message || UPDATE_SUCCESS_MESSAGE);
            handleCloseEdit();
            await fetchCompras(undefined, appliedFilters.fecha);
        } catch (error) {
            setEditError(CONNECTION_ERROR);
        } finally {
            setEditSaving(false);
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

    const handleCompleteCompra = async (idCompra: number) => {
        setListError("");
        setListSuccess("");
        setCompletingCompraId(idCompra);

        try {
            const detail = await fetchCompraDetail(idCompra);
            if (detail.error || !detail.compra) {
                setListError(detail.error || DEFAULT_COMPLETE_ERROR);
                return;
            }

            const token = await AsyncStorage.getItem("token");
            const response = await fetch(updateCompraByIdRoute(idCompra), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    descripcion: detail.compra.descripcion || "",
                    fecha: detail.compra.fecha,
                    productos: (detail.compra.productos || []).map((producto) => ({
                        id_producto: producto.id_producto,
                        cantidad_esperada: `${producto.cantidad_esperada}`,
                        cantidad_llegada: `${producto.cantidad_esperada}`,
                    })),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_COMPLETE_ERROR);
                return;
            }

            const data = await response.json();
            setListSuccess(data.message || COMPLETE_SUCCESS_MESSAGE);
            await fetchCompras(undefined, appliedFilters.fecha);
        } catch (error) {
            setListError(CONNECTION_ERROR);
        } finally {
            setCompletingCompraId(null);
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

            <View style={styles.infoMessageContainer} testID="compras-green-button-info">
                <MaterialIcons name="info" size={18} color="#059669" />
                <Text style={styles.infoMessage}>{GREEN_BUTTON_INFO}</Text>
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
                        const isCompleting = completingCompraId === item.id_compra;
                        const isCompleted = `${item.estado || ""}`.toLowerCase() === "completada";

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
                                        <View style={styles.statusRow}>
                                            <Text style={styles.compraStatus}>Estado: {item.estado}</Text>
                                            {isCompleted ? (
                                                <View style={styles.completedBadge} testID={`compras-completed-badge-${item.id_compra}`}>
                                                    <Text style={styles.completedBadgeText}>{COMPLETED_STATUS_TEXT}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>

                                    {canManageCompras ? (
                                        <View style={styles.cardActionsRow}>
                                            <TouchableOpacity
                                                style={[styles.actionIconButton, styles.editIconButton]}
                                                onPress={() => handleOpenEdit(item.id_compra)}
                                                disabled={isDeleting}
                                                accessibilityLabel={EDIT_BUTTON_TEXT}
                                                testID={`compras-edit-button-${item.id_compra}`}
                                            >
                                                <MaterialIcons name="edit" size={16} color="#fff" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionIconButton, styles.deleteIconButton]}
                                                onPress={() => handleAskDeleteCompra(item.id_compra)}
                                                disabled={isDeleting}
                                                accessibilityLabel={DELETE_BUTTON_TEXT}
                                                testID={`compras-delete-button-${item.id_compra}`}
                                            >
                                                {isDeleting ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <MaterialIcons name="delete" size={16} color="#fff" />
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.completeTextButton,
                                                    (isDeleting || isCompleting || isCompleted) && styles.disabledButton,
                                                ]}
                                                onPress={() => handleCompleteCompra(item.id_compra)}
                                                disabled={isDeleting || isCompleting || isCompleted}
                                                accessibilityLabel={COMPLETE_BUTTON_TEXT}
                                                testID={`compras-complete-button-${item.id_compra}`}
                                            >
                                                {isCompleting ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <MaterialIcons name="check" size={18} color="#fff" />
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
                                <Text style={styles.secondaryButtonText}>Reestablecer filtro</Text>
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
                visible={editVisible}
                transparent
                animationType="slide"
                onRequestClose={handleCloseEdit}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{EDIT_TITLE}</Text>

                        {editLoading ? (
                            <ActivityIndicator size="small" color="#1976D2" testID="compras-edit-loading" />
                        ) : null}

                        {editError ? (
                            <Text style={styles.errorText} testID="compras-edit-error-message">{editError}</Text>
                        ) : null}

                        {!editLoading ? (
                            <ScrollView style={styles.editScroll} contentContainerStyle={styles.editContent}>
                                <TextInput
                                    style={styles.input}
                                    placeholder={EDIT_DESCRIPTION_PLACEHOLDER}
                                    value={editDescripcion}
                                    onChangeText={setEditDescripcion}
                                    testID="compras-edit-descripcion-input"
                                />

                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={handleOpenEditDatePicker}
                                    testID="compras-edit-fecha-input"
                                >
                                    <View style={styles.datePickerRow}>
                                        <MaterialIcons name="calendar-month" size={18} color="#4b5563" />
                                        <Text style={editFecha ? styles.datePickerText : styles.datePickerPlaceholder}>
                                            {editFecha || EDIT_DATE_PLACEHOLDER}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {editDatePickerVisible && Platform.OS !== "web" ? (
                                    <DateTimePicker
                                        testID="compras-edit-date-picker"
                                        value={parseApiDate(editFecha) || new Date()}
                                        mode="date"
                                        display={Platform.OS === "ios" ? "spinner" : "default"}
                                        onChange={handleEditDateChange}
                                    />
                                ) : null}

                                {editDatePickerVisible && Platform.OS === "web" ? (
                                    <View style={styles.webCalendarCard} testID="compras-edit-date-picker-web">
                                        <View style={styles.webCalendarHeader}>
                                            <TouchableOpacity
                                                style={styles.webCalendarNavButton}
                                                onPress={() => setEditCalendarCursor(new Date(editCalendarCursor.getFullYear(), editCalendarCursor.getMonth() - 1, 1))}
                                                testID="compras-edit-calendar-prev-month"
                                            >
                                                <MaterialIcons name="chevron-left" size={18} color="#374151" />
                                            </TouchableOpacity>
                                            <Text style={styles.webCalendarTitle}>
                                                {editCalendarCursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.webCalendarNavButton}
                                                onPress={() => setEditCalendarCursor(new Date(editCalendarCursor.getFullYear(), editCalendarCursor.getMonth() + 1, 1))}
                                                testID="compras-edit-calendar-next-month"
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
                                            {editWebCalendarCells.map((day, index) => {
                                                if (!day) {
                                                    return <View key={`edit-empty-${index}`} style={styles.webCalendarDayEmpty} />;
                                                }

                                                const isSelected = !!selectedEditDate
                                                    && selectedEditDate.getFullYear() === editCalendarCursor.getFullYear()
                                                    && selectedEditDate.getMonth() === editCalendarCursor.getMonth()
                                                    && selectedEditDate.getDate() === day;

                                                return (
                                                    <TouchableOpacity
                                                        key={`edit-day-${day}`}
                                                        style={[styles.webCalendarDayButton, isSelected && styles.webCalendarDayButtonSelected]}
                                                        onPress={() => handleSelectEditWebDate(day)}
                                                        testID={`compras-edit-calendar-day-${day}`}
                                                    >
                                                        <Text style={[styles.webCalendarDayText, isSelected && styles.webCalendarDayTextSelected]}>{day}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                ) : null}

                                {editRowsWithProductData.map((row, index) => (
                                    <View key={row.localId} style={styles.editRowCard} testID={`compras-edit-row-${index}`}>
                                        <View style={styles.editRowHeader}>
                                            <TouchableOpacity
                                                style={styles.productSelectButton}
                                                onPress={() => openEditProductPicker(row.localId)}
                                                testID={`compras-edit-open-product-picker-${index}`}
                                            >
                                                <MaterialIcons name="search" size={18} color="#1d4ed8" />
                                                <Text style={styles.productSelectButtonText}>
                                                    {row.producto
                                                        ? `${row.producto.nombre} (${row.producto.referencia})`
                                                        : "Seleccionar producto"}
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.removeRowButton}
                                                onPress={() => removeEditRow(row.localId)}
                                                testID={`compras-edit-remove-row-${index}`}
                                            >
                                                <MaterialIcons name="delete-outline" size={16} color="#dc2626" />
                                            </TouchableOpacity>
                                        </View>

                                        <TextInput
                                            style={styles.input}
                                            value={row.cantidad_esperada}
                                            onChangeText={(text) => updateEditRow(row.localId, { cantidad_esperada: text.replace(/[^0-9]/g, "") })}
                                            placeholder="Cantidad esperada"
                                            keyboardType="numeric"
                                            testID={`compras-edit-cantidad-esperada-${index}`}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            value={row.cantidad_llegada}
                                            onChangeText={(text) => updateEditRow(row.localId, { cantidad_llegada: text.replace(/[^0-9]/g, "") })}
                                            placeholder="Cantidad llegada"
                                            keyboardType="numeric"
                                            testID={`compras-edit-cantidad-llegada-${index}`}
                                        />
                                    </View>
                                ))}

                                <TouchableOpacity
                                    style={styles.addProductButton}
                                    onPress={addEditRow}
                                    testID="compras-edit-add-product-row"
                                >
                                    <MaterialIcons name="add" size={18} color="#fff" />
                                    <Text style={styles.addProductButtonText}>{ADD_PRODUCT_ROW_TEXT}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        ) : null}

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                style={[styles.primaryButton, editSaving && styles.disabledButton]}
                                onPress={handleSaveEdit}
                                disabled={editSaving || editLoading}
                                testID="compras-edit-save-button"
                            >
                                <Text style={styles.primaryButtonText}>
                                    {editSaving ? SAVING_CHANGES_BUTTON_TEXT : SAVE_CHANGES_BUTTON_TEXT}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleCloseEdit}
                                disabled={editSaving}
                                testID="compras-edit-close-button"
                            >
                                <Text style={styles.secondaryButtonText}>{DETAIL_CLOSE_BUTTON}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={editProductPickerVisible}
                transparent
                animationType="fade"
                onRequestClose={closeEditProductPicker}
            >
                <View style={styles.pickerBackdrop}>
                    <View style={styles.pickerCard}>
                        <Text style={styles.modalTitle}>Seleccionar producto</Text>

                        {editCatalogLoading ? (
                            <ActivityIndicator size="small" color="#1976D2" />
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Buscar por nombre, referencia o categoria"
                            value={editPickerSearch}
                            onChangeText={setEditPickerSearch}
                            testID="compras-edit-picker-search"
                        />

                        <ScrollView style={styles.pickerList}>
                            {editPickerProducts.length ? editPickerProducts.map((producto, index) => (
                                <TouchableOpacity
                                    key={`${producto.id_producto}`}
                                    style={styles.pickerItem}
                                    onPress={() => selectEditProduct(producto.id_producto)}
                                    testID={`compras-edit-picker-item-${index}`}
                                >
                                    <Text style={styles.pickerItemTitle}>{producto.nombre}</Text>
                                    <Text style={styles.pickerItemSubtitle}>Ref: {producto.referencia} | Cat: {producto.categoria}</Text>
                                </TouchableOpacity>
                            )) : (
                                <Text style={styles.emptyText}>No hay productos disponibles</Text>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={closeEditProductPicker}
                            testID="compras-edit-picker-close"
                        >
                            <Text style={styles.secondaryButtonText}>{DETAIL_CLOSE_BUTTON}</Text>
                        </TouchableOpacity>
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
    infoMessageContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0fdf4",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#86efac",
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginHorizontal: 16,
        marginVertical: 8,
        gap: 8,
    },
    infoMessage: {
        flex: 1,
        color: "#166534",
        fontSize: 13,
        fontWeight: "500",
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
        gap: 8,
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
    editIconButton: {
        backgroundColor: "#2563eb",
    },
    completeIconButton: {
        backgroundColor: "#16a34a",
    },
    completeTextButton: {
        backgroundColor: "#16a34a",
        borderRadius: 8,
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
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
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    completedBadge: {
        backgroundColor: "#dcfce7",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    completedBadgeText: {
        color: "#166534",
        fontSize: 11,
        fontWeight: "700",
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
    editScroll: {
        maxHeight: 420,
    },
    editContent: {
        gap: 10,
    },
    editRowCard: {
        backgroundColor: "#f8fafc",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 8,
        gap: 8,
    },
    editRowHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    productSelectButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#bfdbfe",
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "#eff6ff",
    },
    productSelectButtonText: {
        flex: 1,
        color: "#1e3a8a",
        fontWeight: "600",
    },
    removeRowButton: {
        height: 34,
        width: 34,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#fecaca",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff1f2",
    },
    addProductButton: {
        marginTop: 4,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#1976D2",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addProductButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    pickerBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    pickerCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        maxHeight: "72%",
    },
    pickerList: {
        marginTop: 10,
        marginBottom: 10,
    },
    pickerItem: {
        borderWidth: 1,
        borderColor: "#dbeafe",
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        backgroundColor: "#f8fbff",
    },
    pickerItemTitle: {
        color: "#1f2937",
        fontWeight: "700",
    },
    pickerItemSubtitle: {
        marginTop: 2,
        color: "#4b5563",
        fontSize: 12,
    },
    disabledButton: {
        opacity: 0.7,
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
