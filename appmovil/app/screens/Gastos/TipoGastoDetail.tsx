import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { Gasto } from "../types";
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
    const [loading, setLoading] = useState(false);
    const [savingGasto, setSavingGasto] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [gastoNombre, setGastoNombre] = useState("");
    const [gastoFecha, setGastoFecha] = useState(todayKey());
    const [gastoImporte, setGastoImporte] = useState("");
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [calendarCursor, setCalendarCursor] = useState<Date>(new Date());
    const [modalVisible, setModalVisible] = useState(false);
    const [modalError, setModalError] = useState("");

    const webCalendarCells = useMemo(() => buildCalendarMatrix(calendarCursor), [calendarCursor]);
    const selectedDate = parseApiDate(gastoFecha);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(API_ROUTES.gastosByNegocio(negocio.id_negocio), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || "No se pudieron obtener los gastos");
                return;
            }

            const data = await response.json();
            const gastosList = ((data.gastos || []) as Gasto[]).filter(
                (gasto) => gasto.id_tipo_gasto === tipoGasto.id_tipo_gasto
            );

            setGastos(gastosList);
        } catch (fetchError) {
            setError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio, tipoGasto.id_tipo_gasto]);

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
                    id_tipo_gasto: tipoGasto.id_tipo_gasto,
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

    const handleOpenModal = () => {
        setModalError("");
        setGastoNombre("");
        setGastoImporte("");
        setGastoFecha(todayKey());
        setCalendarCursor(new Date());
        setDatePickerVisible(false);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setModalError("");
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} testID="tipo-gasto-detail-back-button">
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.title}>{tipoGasto.nombre_tipo}</Text>
                    <Text style={styles.subtitle}>Gastos de esta categoria</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={handleOpenModal} testID="toggle-gasto-form-button">
                    <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.addButtonText}>Añadir gasto</Text>
                </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={handleCloseModal}
                testID="gasto-form-modal"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Añadir gasto en {tipoGasto.nombre_tipo}</Text>
                            <TouchableOpacity onPress={handleCloseModal} testID="close-gasto-form-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
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

                        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateGasto} disabled={savingGasto} testID="gasto-save-button">
                            {savingGasto ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Registrar gasto</Text>
                            )}
                        </TouchableOpacity>
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
                ) : (
                    gastos.map((gasto) => (
                        <View key={gasto.id_gasto} style={styles.listCard}>
                            <Text style={styles.listTitle}>{gasto.nombre}</Text>
                            <Text style={styles.listMeta}>Fecha: {formatDate(gasto.fecha)}</Text>
                            <Text style={styles.listAmount}>{formatAmount(gasto.importe)}</Text>
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
        color: "#0D47A1",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1976D2",
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
        marginTop: 2,
        color: "#6b7280",
        fontSize: 13,
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
    errorText: {
        marginHorizontal: 16,
        marginTop: 12,
        color: "#b91c1c",
        backgroundColor: "#fef2f2",
        borderRadius: 10,
        padding: 10,
    },
    successText: {
        marginHorizontal: 16,
        marginTop: 12,
        color: "#166534",
        backgroundColor: "#f0fdf4",
        borderRadius: 10,
        padding: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(17,24,39,0.45)",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        gap: 10,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    modalErrorText: {
        color: "#b91c1c",
        backgroundColor: "#fef2f2",
        borderRadius: 10,
        padding: 10,
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 14,
        gap: 4,
    },
    listTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },
    listMeta: {
        color: "#6b7280",
        fontSize: 13,
    },
    listAmount: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f766e",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(17,24,39,0.45)",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        gap: 10,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
});