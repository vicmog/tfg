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
    Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
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
    
    const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
    const [porcentaje, setPorcentaje] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [fechaInicioPickerVisible, setFechaInicioPickerVisible] = useState(false);
    const [fechaFinPickerVisible, setFechaFinPickerVisible] = useState(false);
    const [fechaInicioCalendarCursor, setFechaInicioCalendarCursor] = useState<Date>(new Date());
    const [fechaFinCalendarCursor, setFechaFinCalendarCursor] = useState<Date>(new Date());
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

    const filteredProductos = useMemo(() => productos, [productos]);

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

    const DATE_FILTER_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
        const startWeekDay = (firstDay.getDay() + 6) % 7; // make Monday first
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: Array<number | null> = [];

        for (let i = 0; i < startWeekDay; i += 1) cells.push(null);
        for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
        while (cells.length % 7 !== 0) cells.push(null);

        return cells;
    };

    const webCalendarCellsInicio = useMemo(() => buildCalendarMatrix(fechaInicioCalendarCursor), [fechaInicioCalendarCursor]);
    const webCalendarCellsFin = useMemo(() => buildCalendarMatrix(fechaFinCalendarCursor), [fechaFinCalendarCursor]);

    const selectedInicio = parseApiDate(fechaInicio);
    const selectedFin = parseApiDate(fechaFin);

    const handleSelectWebDateInicio = (day: number) => {
        const selected = new Date(fechaInicioCalendarCursor.getFullYear(), fechaInicioCalendarCursor.getMonth(), day);
        setFechaInicio(toApiDate(selected));
        setFechaInicioPickerVisible(false);
        setError("");
    };

    const handleSelectWebDateFin = (day: number) => {
        const selected = new Date(fechaFinCalendarCursor.getFullYear(), fechaFinCalendarCursor.getMonth(), day);
        setFechaFin(toApiDate(selected));
        setFechaFinPickerVisible(false);
        setError("");
    };

    const handleDateChangeInicio = (event: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS !== "ios") {
            setFechaInicioPickerVisible(false);
        }

        if (event.type === "dismissed" || !selected) return;

        setFechaInicio(toApiDate(selected));
        setError("");
    };

    const handleOpenFechaInicioPicker = () => {
        setFechaInicioPickerVisible(true);
        setFechaInicioCalendarCursor(parseApiDate(fechaInicio) || new Date());
    };

    const handleDateChangeFin = (event: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS !== "ios") {
            setFechaFinPickerVisible(false);
        }

        if (event.type === "dismissed" || !selected) return;

        setFechaFin(toApiDate(selected));
        setError("");
    };

    const handleOpenFechaFinPicker = () => {
        setFechaFinPickerVisible(true);
        setFechaFinCalendarCursor(parseApiDate(fechaFin) || new Date());
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

    const roleLabel = normalizedRole === ADMIN_ROLE ? "Administrador" : normalizedRole === JEFE_ROLE ? "Jefe" : "Trabajador";

    return (
        <View style={styles.container}>
            <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <TouchableOpacity style={styles.heroBackButton} onPress={() => navigation.goBack()} testID="back-button">
                        <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    {canManageDescuentos ? (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleOpenModal}
                            testID="toggle-descuento-form-button"
                        >
                            <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.addButtonText}>Añadir</Text>
                        </TouchableOpacity>
                    ) : <View style={{ width: 1 }} />}
                </View>

                <View style={styles.heroBody}>
                    <Text style={styles.title}>{SCREEN_TITLE}</Text>
                    <Text style={styles.subtitle}>{roleLabel} · {descuentos.length} descuentos</Text>
                </View>

                
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

                        <TouchableOpacity
                            style={styles.input}
                            onPress={handleOpenFechaInicioPicker}
                            testID="descuento-fecha-inicio-input"
                        >
                            <View style={styles.datePickerRow}>
                                <MaterialIcons name="calendar-month" size={18} color="#4b5563" />
                                <Text style={fechaInicio ? styles.datePickerText : styles.datePickerPlaceholder}>
                                    {fechaInicio || DATE_START_PLACEHOLDER}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {fechaInicioPickerVisible && Platform.OS !== "web" ? (
                            <DateTimePicker
                                testID="descuento-fecha-inicio-date-picker"
                                value={parseApiDate(fechaInicio) || new Date()}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                onChange={handleDateChangeInicio}
                            />
                        ) : null}

                        {fechaInicioPickerVisible && Platform.OS === "web" ? (
                            <View style={styles.webCalendarCard} testID="descuento-fecha-inicio-date-picker-web">
                                <View style={styles.webCalendarHeader}>
                                    <TouchableOpacity
                                        style={styles.webCalendarNavButton}
                                        onPress={() => setFechaInicioCalendarCursor(new Date(fechaInicioCalendarCursor.getFullYear(), fechaInicioCalendarCursor.getMonth() - 1, 1))}
                                        testID="descuento-fecha-inicio-calendar-prev-month"
                                    >
                                        <MaterialIcons name="chevron-left" size={18} color="#374151" />
                                    </TouchableOpacity>
                                    <Text style={styles.webCalendarTitle}>
                                        {fechaInicioCalendarCursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.webCalendarNavButton}
                                        onPress={() => setFechaInicioCalendarCursor(new Date(fechaInicioCalendarCursor.getFullYear(), fechaInicioCalendarCursor.getMonth() + 1, 1))}
                                        testID="descuento-fecha-inicio-calendar-next-month"
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
                                    {webCalendarCellsInicio.map((day, index) => {
                                        if (!day) {
                                            return <View key={`empty-${index}`} style={styles.webCalendarDayEmpty} />;
                                        }

                                        const isSelected = !!selectedInicio
                                            && selectedInicio.getFullYear() === fechaInicioCalendarCursor.getFullYear()
                                            && selectedInicio.getMonth() === fechaInicioCalendarCursor.getMonth()
                                            && selectedInicio.getDate() === day;

                                        return (
                                            <TouchableOpacity
                                                key={`day-${day}`}
                                                style={[styles.webCalendarDayButton, isSelected && styles.webCalendarDayButtonSelected]}
                                                onPress={() => handleSelectWebDateInicio(day)}
                                                testID={`descuento-fecha-inicio-calendar-day-${day}`}
                                            >
                                                <Text style={[styles.webCalendarDayText, isSelected && styles.webCalendarDayTextSelected]}>{day}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={styles.input}
                            onPress={handleOpenFechaFinPicker}
                            testID="descuento-fecha-fin-input"
                        >
                            <View style={styles.datePickerRow}>
                                <MaterialIcons name="calendar-month" size={18} color="#4b5563" />
                                <Text style={fechaFin ? styles.datePickerText : styles.datePickerPlaceholder}>
                                    {fechaFin || DATE_END_PLACEHOLDER}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {fechaFinPickerVisible && Platform.OS !== "web" ? (
                            <DateTimePicker
                                testID="descuento-fecha-fin-date-picker"
                                value={parseApiDate(fechaFin) || new Date()}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                onChange={handleDateChangeFin}
                            />
                        ) : null}

                        {fechaFinPickerVisible && Platform.OS === "web" ? (
                            <View style={styles.webCalendarCard} testID="descuento-fecha-fin-date-picker-web">
                                <View style={styles.webCalendarHeader}>
                                    <TouchableOpacity
                                        style={styles.webCalendarNavButton}
                                        onPress={() => setFechaFinCalendarCursor(new Date(fechaFinCalendarCursor.getFullYear(), fechaFinCalendarCursor.getMonth() - 1, 1))}
                                        testID="descuento-fecha-fin-calendar-prev-month"
                                    >
                                        <MaterialIcons name="chevron-left" size={18} color="#374151" />
                                    </TouchableOpacity>
                                    <Text style={styles.webCalendarTitle}>
                                        {fechaFinCalendarCursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.webCalendarNavButton}
                                        onPress={() => setFechaFinCalendarCursor(new Date(fechaFinCalendarCursor.getFullYear(), fechaFinCalendarCursor.getMonth() + 1, 1))}
                                        testID="descuento-fecha-fin-calendar-next-month"
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
                                    {webCalendarCellsFin.map((day, index) => {
                                        if (!day) {
                                            return <View key={`empty-${index}`} style={styles.webCalendarDayEmpty} />;
                                        }

                                        const isSelected = !!selectedFin
                                            && selectedFin.getFullYear() === fechaFinCalendarCursor.getFullYear()
                                            && selectedFin.getMonth() === fechaFinCalendarCursor.getMonth()
                                            && selectedFin.getDate() === day;

                                        return (
                                            <TouchableOpacity
                                                key={`day-${day}`}
                                                style={[styles.webCalendarDayButton, isSelected && styles.webCalendarDayButtonSelected]}
                                                onPress={() => handleSelectWebDateFin(day)}
                                                testID={`descuento-fecha-fin-calendar-day-${day}`}
                                            >
                                                <Text style={[styles.webCalendarDayText, isSelected && styles.webCalendarDayTextSelected]}>{day}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : null}

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
        backgroundColor: "#f3f6fb",
        paddingTop: 12,
    },
    heroCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 20,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
    },
    heroTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    heroBody: {
        marginTop: 14,
        marginBottom: 14,
    },
    heroBackButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#eef4ff",
        alignItems: "center",
        justifyContent: "center",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1d4ed8",
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#0f172a",
        letterSpacing: -0.3,
    },
    subtitle: {
        marginTop: 6,
        color: "#64748b",
        fontSize: 14,
        fontWeight: "500",
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
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: "#0f172a",
        paddingVertical: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
        backgroundColor: "#fafbfc",
        color: "#0f172a",
        fontSize: 15,
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
        backgroundColor: "rgba(15, 23, 42, 0.42)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
    },
    formContainer: {
        backgroundColor: "#fff",
        borderRadius: 20,
        marginHorizontal: 12,
        padding: 18,
        width: "90%",
        maxWidth: 420,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
    },
    modalBackdropBottom: {
        justifyContent: "flex-end",
        alignItems: "stretch",
        paddingHorizontal: 0,
    },
    modalCard: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        width: "100%",
        maxWidth: undefined,
        marginHorizontal: 0,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: "#e5e7eb",
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        padding: 18,
        maxHeight: "78%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    modalTitle: {
        color: "#0f172a",
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: -0.3,
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
    datePickerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    datePickerText: {
        marginLeft: 8,
        color: "#0f172a",
    },
    datePickerPlaceholder: {
        marginLeft: 8,
        color: "#94a3b8",
    },
    webCalendarCard: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        backgroundColor: "#fff",
        padding: 12,
    },
    webCalendarHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    webCalendarNavButton: {
        padding: 6,
        borderRadius: 10,
        backgroundColor: "#f3f4f6",
    },
    webCalendarTitle: {
        color: "#0f172a",
        fontWeight: "800",
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
        borderRadius: 10,
    },
    webCalendarDayButtonSelected: {
        backgroundColor: "#1d4ed8",
    },
    webCalendarDayText: {
        color: "#1f2937",
    },
    webCalendarDayTextSelected: {
        color: "#fff",
        fontWeight: "700",
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
