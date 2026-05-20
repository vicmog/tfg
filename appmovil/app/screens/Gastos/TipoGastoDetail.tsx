import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { Gasto, TipoGasto } from "../types";
import { TipoGastoDetailProps } from "./types";

const todayKey = () => new Date().toISOString().slice(0, 10);
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

const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatAmount = (value: number) =>
    new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
    }).format(value);

const TipoGastoDetail: React.FC<TipoGastoDetailProps> = ({ route, navigation }) => {
    const { negocio, tipoGasto } = route.params;
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [currentTipoGasto, setCurrentTipoGasto] = useState<TipoGasto>(tipoGasto);
    const [loading, setLoading] = useState(false);
    const [savingGasto, setSavingGasto] = useState(false);
    const [updatingGasto, setUpdatingGasto] = useState(false);
    const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
    const [deletingGastoId, setDeletingGastoId] = useState<number | null>(null);
    const [confirmDeleteGastoId, setConfirmDeleteGastoId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [gastoNombre, setGastoNombre] = useState("");
    const [gastoFecha, setGastoFecha] = useState(todayKey());
    const [gastoImporte, setGastoImporte] = useState("");
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [calendarCursor, setCalendarCursor] = useState<Date>(new Date());
    const [modalVisible, setModalVisible] = useState(false);
    const [modalError, setModalError] = useState("");
    const [searchText, setSearchText] = useState("");

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageGastos = normalizedRole === "jefe" || normalizedRole === "admin";

    const webCalendarCells = useMemo(() => buildCalendarMatrix(calendarCursor), [calendarCursor]);
    const selectedDate = parseApiDate(gastoFecha);
    const filteredGastos = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        if (!query) {
            return gastos;
        }

        return gastos.filter((gasto) => (
            gasto.nombre.toLowerCase().includes(query)
            || formatDate(gasto.fecha).toLowerCase().includes(query)
        ));
    }, [gastos, searchText]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const gastosResponse = await fetch(API_ROUTES.gastosByNegocio(negocio.id_negocio), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!gastosResponse.ok) {
                const data = await gastosResponse.json();
                setError(data.message || "No se pudieron obtener los gastos");
                return;
            }

            const gastosData = await gastosResponse.json();
            const gastosList = ((gastosData.gastos || []) as Gasto[]).filter(
                (gasto) => gasto.id_tipo_gasto === currentTipoGasto.id_tipo_gasto
            );

            setGastos(gastosList);
        } catch {
            setError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio, currentTipoGasto.id_tipo_gasto]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleCreateGasto = async () => {
        const nombre = gastoNombre.trim();

        if (!nombre) {
            setModalError("El nombre del gasto es obligatorio");
            return;
        }

        if (!gastoFecha.trim()) {
            setModalError("La fecha del gasto es obligatoria");
            return;
        }

        if (!DATE_FILTER_REGEX.test(gastoFecha.trim())) {
            setModalError("La fecha del gasto no es valida");
            return;
        }

        const importeValue = Number.parseFloat(gastoImporte.replace(",", "."));
        if (!Number.isFinite(importeValue) || importeValue <= 0) {
            setModalError("El importe del gasto debe ser mayor que 0");
            return;
        }

        setSavingGasto(true);
        setModalError("");
        setSuccess("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(API_ROUTES.gastos, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_negocio: negocio.id_negocio,
                    id_tipo_gasto: currentTipoGasto.id_tipo_gasto,
                    nombre,
                    fecha: gastoFecha.trim(),
                    importe: importeValue,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "No se pudo registrar el gasto");
                return;
            }

            setSuccess(data.message || "Gasto registrado correctamente");
            setGastoNombre("");
            setGastoImporte("");
            setGastoFecha(todayKey());
            setDatePickerVisible(false);
            setModalVisible(false);
            await loadData();
        } catch (createError) {
            setModalError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setSavingGasto(false);
        }
    };

    const handleUpdateGasto = async () => {
        if (!editingGasto) {
            return;
        }

        const nombre = gastoNombre.trim();

        if (!nombre) {
            setModalError("El nombre del gasto es obligatorio");
            return;
        }

        if (!gastoFecha.trim()) {
            setModalError("La fecha del gasto es obligatoria");
            return;
        }

        if (!DATE_FILTER_REGEX.test(gastoFecha.trim())) {
            setModalError("La fecha del gasto no es valida");
            return;
        }

        const importeValue = Number.parseFloat(gastoImporte.replace(",", "."));
        if (!Number.isFinite(importeValue) || importeValue <= 0) {
            setModalError("El importe del gasto debe ser mayor que 0");
            return;
        }

        setUpdatingGasto(true);
        setModalError("");
        setSuccess("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(API_ROUTES.updateGastoById(editingGasto.id_gasto), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_tipo_gasto: currentTipoGasto.id_tipo_gasto,
                    nombre,
                    fecha: gastoFecha.trim(),
                    importe: importeValue,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setModalError(data.message || "No se pudo actualizar el gasto");
                return;
            }

            setSuccess(data.message || "Gasto actualizado correctamente");
            setEditingGasto(null);
            setGastoNombre("");
            setGastoImporte("");
            setGastoFecha(todayKey());
            setDatePickerVisible(false);
            setModalVisible(false);
            await loadData();
        } catch {
            setModalError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setUpdatingGasto(false);
        }
    };

    const handleSaveGasto = async () => {
        if (editingGasto) {
            await handleUpdateGasto();
            return;
        }

        await handleCreateGasto();
    };

    const handleOpenModal = () => {
        setModalError("");
        setGastoNombre("");
        setGastoImporte("");
        setGastoFecha(todayKey());
        setEditingGasto(null);
        setCalendarCursor(new Date());
        setDatePickerVisible(false);
        setModalVisible(true);
    };

    const handleOpenEditModal = (gasto: Gasto) => {
        setError("");
        setSuccess("");
        setModalError("");
        setEditingGasto(gasto);
        setGastoNombre(gasto.nombre);
        setGastoImporte(`${gasto.importe}`.replace(".", ","));
        setGastoFecha(toApiDate(new Date(gasto.fecha)));
        setCalendarCursor(parseApiDate(toApiDate(new Date(gasto.fecha))) || new Date());
        setDatePickerVisible(false);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setModalError("");
        setEditingGasto(null);
        setGastoNombre("");
        setGastoImporte("");
        setGastoFecha(todayKey());
        setDatePickerVisible(false);
    };

    const handleDateChange = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
        if (Platform.OS !== "ios") {
            setDatePickerVisible(false);
        }

        if (event.type === "dismissed" || !selectedDateValue) {
            return;
        }

        setGastoFecha(toApiDate(selectedDateValue));
        setModalError("");
    };

    const handleOpenDatePicker = () => {
        setDatePickerVisible(true);
        setCalendarCursor(parseApiDate(gastoFecha) || new Date());
    };

    const handleSelectWebDate = (day: number) => {
        const selected = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), day);
        setGastoFecha(toApiDate(selected));
        setModalError("");
        setDatePickerVisible(false);
    };

    const handleAskDeleteGasto = (idGasto: number) => {
        setError("");
        setSuccess("");
        setConfirmDeleteGastoId(idGasto);
    };

    const handleCancelDeleteGasto = () => {
        setConfirmDeleteGastoId(null);
    };

    const handleDeleteGasto = async (idGasto: number) => {
        setError("");
        setSuccess("");
        setDeletingGastoId(idGasto);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(API_ROUTES.deleteGastoById(idGasto), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || "No se pudo eliminar el gasto");
                return;
            }

            setSuccess("Gasto eliminado correctamente");
            setConfirmDeleteGastoId(null);
            await loadData();
        } catch {
            setError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setDeletingGastoId(null);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <TouchableOpacity style={styles.heroBackButton} onPress={() => navigation.goBack()} testID="tipo-gasto-detail-back-button">
                        <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addButton} onPress={handleOpenModal} testID="toggle-gasto-form-button">
                        <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.addButtonText}>Añadir gasto</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.heroBody}>
                    <Text style={styles.title}>{currentTipoGasto.nombre_tipo}</Text>
                    <Text style={styles.subtitle}>Gastos de esta categoría · {gastos.length} registros</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={18} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Buscar por nombre o fecha"
                    placeholderTextColor="#9ca3af"
                    testID="gasto-search-input"
                />
            </View>

            {error ? (
                <View style={styles.feedbackErrorBox}>
                    <MaterialIcons name="error-outline" size={18} color="#b91c1c" />
                    <Text style={styles.feedbackErrorText}>{error}</Text>
                </View>
            ) : null}
            {success ? (
                <View style={styles.feedbackSuccessBox}>
                    <MaterialIcons name="check-circle-outline" size={18} color="#166534" />
                    <Text style={styles.feedbackSuccessText}>{success}</Text>
                </View>
            ) : null}

            <Modal
                visible={modalVisible}
                transparent
                animationType={editingGasto ? "slide" : "none"}
                onRequestClose={handleCloseModal}
                testID="gasto-form-modal"
            >
                <View style={[styles.modalOverlay, editingGasto && styles.modalOverlayBottom]}>
                    <View style={[styles.modalCard, editingGasto && styles.modalCardBottom]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingGasto ? "Editar gasto" : `Añadir gasto en ${currentTipoGasto.nombre_tipo}`}
                            </Text>
                            {!editingGasto ? (
                                <TouchableOpacity onPress={handleCloseModal} testID="close-gasto-form-button">
                                    <MaterialIcons name="close" size={22} color="#6b7280" />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Nombre del gasto"
                            value={gastoNombre}
                            onChangeText={setGastoNombre}
                            testID="gasto-nombre-input"
                        />
                        <TouchableOpacity style={styles.input} onPress={handleOpenDatePicker} testID="gasto-fecha-input">
                            <View style={styles.datePickerRow}>
                                <MaterialIcons name="calendar-month" size={18} color="#4b5563" />
                                <Text style={gastoFecha ? styles.datePickerText : styles.datePickerPlaceholder}>
                                    {gastoFecha || "Fecha (YYYY-MM-DD)"}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {datePickerVisible && Platform.OS !== "web" ? (
                            <DateTimePicker
                                testID="gasto-fecha-date-picker"
                                value={parseApiDate(gastoFecha) || new Date()}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                onChange={handleDateChange}
                            />
                        ) : null}

                        {datePickerVisible && Platform.OS === "web" ? (
                            <View style={styles.webCalendarCard} testID="gasto-fecha-date-picker-web">
                                <View style={styles.webCalendarHeader}>
                                    <TouchableOpacity
                                        style={styles.webCalendarNavButton}
                                        onPress={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1))}
                                        testID="gasto-fecha-calendar-prev-month"
                                    >
                                        <MaterialIcons name="chevron-left" size={18} color="#374151" />
                                    </TouchableOpacity>
                                    <Text style={styles.webCalendarTitle}>
                                        {calendarCursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.webCalendarNavButton}
                                        onPress={() => setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1))}
                                        testID="gasto-fecha-calendar-next-month"
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
                                                testID={`gasto-fecha-calendar-day-${day}`}
                                            >
                                                <Text style={[styles.webCalendarDayText, isSelected && styles.webCalendarDayTextSelected]}>{day}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : null}
                        <TextInput
                            style={styles.input}
                            placeholder="Importe"
                            keyboardType="decimal-pad"
                            value={gastoImporte}
                            onChangeText={setGastoImporte}
                            testID="gasto-importe-input"
                        />

                        {modalError ? <Text style={styles.modalErrorText} testID="gasto-error-message">{modalError}</Text> : null}

                        {editingGasto ? (
                            <View style={styles.modalActionRow}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleSaveGasto}
                                    disabled={savingGasto || updatingGasto}
                                    testID="gasto-save-button"
                                >
                                    {savingGasto || updatingGasto ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Guardar cambios</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={handleCloseModal}
                                    disabled={savingGasto || updatingGasto}
                                    testID="gasto-close-button"
                                >
                                    <Text style={styles.secondaryButtonText}>Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleSaveGasto}
                                disabled={savingGasto || updatingGasto}
                                testID="gasto-save-button"
                            >
                                {savingGasto || updatingGasto ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>{editingGasto ? "Guardar cambios" : "Registrar gasto"}</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Gastos registrados</Text>
                </View>

                {loading ? (
                    <ActivityIndicator color="#1976D2" />
                ) : gastos.length === 0 ? (
                    <Text style={styles.emptyText}>Todavia no hay gastos en esta categoria</Text>
                ) : filteredGastos.length === 0 ? (
                    <Text style={styles.emptyText}>No hay resultados para tu busqueda</Text>
                ) : (
                    filteredGastos.map((gasto) => (
                        <View key={gasto.id_gasto}>
                            <View style={styles.listCard}>
                                <View style={styles.listContent}>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.listTitle}>{gasto.nombre}</Text>
                                        <View style={styles.amountBadge}>
                                            <Text style={styles.listAmount}>{formatAmount(gasto.importe)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.metaRow}>
                                        <MaterialIcons name="event" size={14} color="#6b7280" />
                                        <Text style={styles.listMeta}>{formatDate(gasto.fecha)}</Text>
                                    </View>
                                </View>

                                {canManageGastos ? (
                                    <View style={styles.actionsWrap}>
                                        <TouchableOpacity
                                            style={styles.editIconButton}
                                            onPress={() => handleOpenEditModal(gasto)}
                                            testID={`gasto-edit-button-${gasto.id_gasto}`}
                                        >
                                            <MaterialIcons name="edit" size={18} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteIconButton}
                                            onPress={() => handleAskDeleteGasto(gasto.id_gasto)}
                                            disabled={deletingGastoId === gasto.id_gasto}
                                            testID={`gasto-delete-button-${gasto.id_gasto}`}
                                        >
                                            {deletingGastoId === gasto.id_gasto ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <MaterialIcons name="delete" size={18} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                            </View>

                            {confirmDeleteGastoId === gasto.id_gasto ? (
                                <View style={styles.confirmBox} testID={`gasto-delete-confirm-${gasto.id_gasto}`}>
                                    <Text style={styles.confirmTitle}>Eliminar gasto</Text>
                                    <Text style={styles.confirmMessage}>¿Seguro que quieres eliminar este gasto?</Text>
                                    <View style={styles.confirmActions}>
                                        <TouchableOpacity
                                            style={styles.confirmCancelButton}
                                            onPress={handleCancelDeleteGasto}
                                            testID={`gasto-delete-cancel-${gasto.id_gasto}`}
                                        >
                                            <Text style={styles.confirmCancelText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.confirmDeleteButton}
                                            onPress={() => handleDeleteGasto(gasto.id_gasto)}
                                            disabled={deletingGastoId === gasto.id_gasto}
                                            testID={`gasto-delete-confirm-button-${gasto.id_gasto}`}
                                        >
                                            <Text style={styles.confirmDeleteText}>Eliminar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

export default TipoGastoDetail;

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
        marginBottom: 6,
    },
    heroBackButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#eef4ff",
        alignItems: "center",
        justifyContent: "center",
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
    headerTextWrap: {
        flex: 1,
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
        color: "#0f172a",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1d4ed8",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
    subtitle: {
        marginTop: 6,
        color: "#64748b",
        fontSize: 14,
        fontWeight: "500",
    },
    searchContainer: {
        marginTop: 12,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 12,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: "#111827",
        fontSize: 14,
        paddingVertical: 8,
    },
    content: {
        padding: 16,
        gap: 12,
        paddingBottom: 28,
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
    primaryButton: {
        backgroundColor: "#1976D2",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    feedbackErrorBox: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: "#fef2f2",
        borderWidth: 1,
        borderColor: "#fecaca",
        borderRadius: 10,
        padding: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    feedbackErrorText: {
        color: "#b91c1c",
        fontWeight: "600",
        flex: 1,
    },
    feedbackSuccessBox: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: "#f0fdf4",
        borderWidth: 1,
        borderColor: "#bbf7d0",
        borderRadius: 10,
        padding: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    feedbackSuccessText: {
        color: "#166534",
        fontWeight: "600",
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.42)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
    },
    modalOverlayBottom: {
        justifyContent: "flex-end",
        alignItems: "stretch",
        paddingHorizontal: 0,
    },
    modalCard: {
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
        gap: 12,
    },
    modalCardBottom: {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        width: "100%",
        padding: 18,
        maxHeight: "78%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0f172a",
    },
    modalErrorText: {
        color: "#dc2626",
        fontWeight: "600",
        marginBottom: 12,
        fontSize: 14,
    },
    modalActionRow: {
        marginTop: 16,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    secondaryButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: "#f3f4f6",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButtonText: {
        color: "#374151",
        fontWeight: "700",
    },
    webCalendarCard: {
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
        fontWeight: "600",
    },
    webCalendarDayTextSelected: {
        color: "#fff",
    },
    sectionHeader: {
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    emptyText: {
        color: "#6b7280",
        textAlign: "center",
        paddingVertical: 12,
    },
    listCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    listContent: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0f172a",
        flex: 1,
    },
    amountBadge: {
        backgroundColor: "#ecfdf5",
        borderWidth: 1,
        borderColor: "#a7f3d0",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    metaRow: {
        marginTop: 2,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    listMeta: {
        color: "#475569",
        fontSize: 13,
    },
    listAmount: {
        fontSize: 13,
        fontWeight: "700",
        color: "#0f766e",
    },
    deleteIconButton: {
        width: 36,
        height: 36,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#dc2626",
        marginLeft: 8,
    },
    editIconButton: {
        width: 36,
        height: 36,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563eb",
    },
    actionsWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginLeft: 8,
    },
    confirmBox: {
        marginTop: 8,
        backgroundColor: "#fff7ed",
        borderWidth: 1,
        borderColor: "#fed7aa",
        borderRadius: 10,
        padding: 12,
        gap: 10,
    },
    confirmTitle: {
        fontWeight: "700",
        color: "#9a3412",
    },
    confirmMessage: {
        color: "#7c2d12",
    },
    confirmActions: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
    },
    confirmCancelButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#e5e7eb",
    },
    confirmCancelText: {
        fontWeight: "700",
        color: "#374151",
    },
    confirmDeleteButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#dc2626",
    },
    confirmDeleteText: {
        fontWeight: "700",
        color: "#fff",
    },
});