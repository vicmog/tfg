import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
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
import { Cliente, Recurso, Reserva, Servicio } from "../types";
import {
    ADD_RESERVA_BUTTON,
    CALENDAR_EMPTY_MESSAGE,
    clientesByNegocioRoute,
    CONNECTION_ERROR,
    DEFAULT_CLIENTES_ERROR,
    DEFAULT_CREATE_ERROR,
    DEFAULT_RESERVAS_ERROR,
    DEFAULT_RECURSOS_ERROR,
    DEFAULT_SERVICIOS_ERROR,
    DURACION_LABEL,
    DURACION_PLACEHOLDER,
    EMPTY_FRANJA_ERROR,
    EMPTY_CLIENTE_ERROR,
    EMPTY_CLIENTES_MESSAGE,
    EMPTY_DURACION_ERROR,
    EMPTY_RECURSO_ERROR,
    EMPTY_RECURSOS_MESSAGE,
    EMPTY_SERVICIO_ERROR,
    EMPTY_SERVICIOS_MESSAGE,
    FECHA_INICIO_LABEL,
    FRANJA_LABEL,
    AVAILABLE_SLOTS_EMPTY_MESSAGE,
    FORM_TITLE,
    INVALID_DURACION_ERROR,
    INVALID_FECHA_INICIO_ERROR,
    PICK_CLIENTE_PLACEHOLDER,
    PICK_FRANJA_PLACEHOLDER,
    PICK_RECURSO_PLACEHOLDER,
    PICK_SERVICIO_PLACEHOLDER,
    reservasByNegocioRoute,
    reservasRoute,
    recursosByNegocioRoute,
    SAVE_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SCREEN_TITLE,
    SELECT_CLIENTE_LABEL,
    SELECT_RECURSO_LABEL,
    SELECT_SERVICIO_LABEL,
    serviciosByNegocioRoute,
    SUCCESS_MESSAGE,
} from "./constants";
import { ReservasProps } from "./types";

const INTEGER_REGEX = /^\d+$/;
const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const OPENING_HOUR = 8;
const CLOSING_HOUR = 21;

const toLocalDateKey = (value: string | Date) => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const toDateOnlyDisplay = (value: string | Date) => {
    const date = new Date(value);

    return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const dateFromKey = (key: string) => {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const formatSlotLabel = (date: Date) => {
    return `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
};

const toDateTimeDisplay = (value: string | Date) => {
    const date = new Date(value);

    return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const toDayLabel = (value: string | Date) => {
    const date = new Date(value);

    return date.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

const formatClienteName = (cliente: Cliente) => {
    const fullName = [cliente.nombre, cliente.apellido1, cliente.apellido2].filter(Boolean).join(" ").trim();

    return fullName || `Cliente #${cliente.id_cliente}`;
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

const Reservas: React.FC<ReservasProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [reservas, setReservas] = useState<Reserva[]>([]);

    const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
    const [selectedRecursoId, setSelectedRecursoId] = useState<number | null>(null);
    const [selectedServicioId, setSelectedServicioId] = useState<number | null>(null);
    const [selectedFecha, setSelectedFecha] = useState<string>(toLocalDateKey(new Date()));
    const [selectedSlotInicioIso, setSelectedSlotInicioIso] = useState<string | null>(null);
    const [duracionMinutos, setDuracionMinutos] = useState("");

    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formModalVisible, setFormModalVisible] = useState(false);
    const [clientePickerVisible, setClientePickerVisible] = useState(false);
    const [recursoPickerVisible, setRecursoPickerVisible] = useState(false);
    const [servicioPickerVisible, setServicioPickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    const [calendarCursor, setCalendarCursor] = useState<Date>(new Date());
    const [selectedDay, setSelectedDay] = useState<string>(toLocalDateKey(new Date()));
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
    const todayKey = toLocalDateKey(new Date());

    const selectedCliente = useMemo(
        () => clientes.find((cliente) => cliente.id_cliente === selectedClienteId) || null,
        [clientes, selectedClienteId]
    );

    const selectedRecurso = useMemo(
        () => recursos.find((recurso) => recurso.id_recurso === selectedRecursoId) || null,
        [recursos, selectedRecursoId]
    );

    const selectedServicio = useMemo(
        () => servicios.find((servicio) => servicio.id_servicio === selectedServicioId) || null,
        [servicios, selectedServicioId]
    );

    const reservasByDay = useMemo(() => {
        const map = new Map<string, Reserva[]>();

        reservas.forEach((reserva) => {
            const key = toLocalDateKey(reserva.fecha_hora_inicio);
            const current = map.get(key) || [];
            current.push(reserva);
            map.set(key, current);
        });

        return map;
    }, [reservas]);

    const reservasSelectedDay = useMemo(
        () => reservasByDay.get(selectedDay) || [],
        [reservasByDay, selectedDay]
    );

    const selectedDurationMinutes = useMemo(() => {
        if (!INTEGER_REGEX.test(duracionMinutos.trim())) {
            return 0;
        }

        return Number.parseInt(duracionMinutos.trim(), 10);
    }, [duracionMinutos]);

    const availableSlots = useMemo(() => {
        if (!selectedRecursoId || !selectedFecha || selectedDurationMinutes <= 0) {
            return [] as Array<{ label: string; iso: string; id: string }>;
        }

        const dayDate = dateFromKey(selectedFecha);
        const resourceReservations = reservas.filter(
            (reserva) => reserva.id_recurso === selectedRecursoId && toLocalDateKey(reserva.fecha_hora_inicio) === selectedFecha
        );

        const reservationRanges = resourceReservations
            .map((reserva) => {
                const startMs = new Date(reserva.fecha_hora_inicio).getTime();
                const endMs = new Date(reserva.fecha_hora_fin).getTime();

                return { startMs, endMs };
            })
            .filter((range) => Number.isFinite(range.startMs) && Number.isFinite(range.endMs) && range.endMs > range.startMs);

        const slots: Array<{ label: string; iso: string; id: string }> = [];
        const openingMinutes = OPENING_HOUR * 60;
        const closingMinutes = CLOSING_HOUR * 60;
        const slotStepMinutes = selectedDurationMinutes;

        for (
            let minuteOfDay = openingMinutes;
            minuteOfDay + selectedDurationMinutes <= closingMinutes;
            minuteOfDay += slotStepMinutes
        ) {
            const slotStart = new Date(dayDate);
            slotStart.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
            const slotEnd = new Date(slotStart.getTime() + selectedDurationMinutes * 60 * 1000);

            const overlaps = reservationRanges.some(
                (range) => slotStart.getTime() < range.endMs && slotEnd.getTime() > range.startMs
            );

            if (!overlaps) {
                const label = formatSlotLabel(slotStart);
                slots.push({
                    label,
                    iso: slotStart.toISOString(),
                    id: label.replace(":", ""),
                });
            }
        }

        return slots;
    }, [selectedFecha, selectedDurationMinutes, selectedRecursoId, reservas]);

    const webCalendarCells = useMemo(() => buildCalendarMatrix(calendarCursor), [calendarCursor]);

    const clienteById = useMemo(
        () => new Map(clientes.map((cliente) => [cliente.id_cliente, cliente])),
        [clientes]
    );

    const recursoById = useMemo(
        () => new Map(recursos.map((recurso) => [recurso.id_recurso, recurso])),
        [recursos]
    );

    const servicioById = useMemo(
        () => new Map(servicios.map((servicio) => [servicio.id_servicio, servicio])),
        [servicios]
    );

    const fetchData = useCallback(async () => {
        setLoadingData(true);
        setError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const [clientesResponse, recursosResponse, serviciosResponse, reservasResponse] = await Promise.all([
                fetch(clientesByNegocioRoute(negocio.id_negocio), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(recursosByNegocioRoute(negocio.id_negocio), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(serviciosByNegocioRoute(negocio.id_negocio), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(reservasByNegocioRoute(negocio.id_negocio), {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (!clientesResponse.ok) {
                const data = await clientesResponse.json();
                setError(data.message || DEFAULT_CLIENTES_ERROR);
                return;
            }

            if (!recursosResponse.ok) {
                const data = await recursosResponse.json();
                setError(data.message || DEFAULT_RECURSOS_ERROR);
                return;
            }

            if (!serviciosResponse.ok) {
                const data = await serviciosResponse.json();
                setError(data.message || DEFAULT_SERVICIOS_ERROR);
                return;
            }

            if (!reservasResponse.ok) {
                const data = await reservasResponse.json();
                setError(data.message || DEFAULT_RESERVAS_ERROR);
                return;
            }

            const clientesData = await clientesResponse.json();
            const recursosData = await recursosResponse.json();
            const serviciosData = await serviciosResponse.json();
            const reservasData = await reservasResponse.json();

            setClientes(clientesData.clientes || []);
            setRecursos(recursosData.recursos || []);
            setServicios(serviciosData.servicios || []);
            setReservas(reservasData.reservas || []);
        } catch (fetchError) {
            setError(CONNECTION_ERROR);
        } finally {
            setLoadingData(false);
        }
    }, [negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const validateForm = () => {
        if (!selectedClienteId) {
            setError(EMPTY_CLIENTE_ERROR);
            return false;
        }

        if (!selectedRecursoId) {
            setError(EMPTY_RECURSO_ERROR);
            return false;
        }

        if (!selectedServicioId) {
            setError(EMPTY_SERVICIO_ERROR);
            return false;
        }

        if (!selectedFecha.trim()) {
            setError("La fecha y hora de inicio es obligatoria");
            return false;
        }

        const fechaDate = dateFromKey(selectedFecha);
        if (Number.isNaN(fechaDate.getTime())) {
            setError(INVALID_FECHA_INICIO_ERROR);
            return false;
        }

        if (!duracionMinutos.trim()) {
            setError(EMPTY_DURACION_ERROR);
            return false;
        }

        if (!INTEGER_REGEX.test(duracionMinutos.trim()) || Number.parseInt(duracionMinutos.trim(), 10) <= 0) {
            setError(INVALID_DURACION_ERROR);
            return false;
        }

        if (!selectedSlotInicioIso) {
            setError(EMPTY_FRANJA_ERROR);
            return false;
        }

        return true;
    };

    const resetForm = () => {
        setSelectedClienteId(null);
        setSelectedRecursoId(null);
        setSelectedServicioId(null);
        setSelectedFecha(toLocalDateKey(new Date()));
        setSelectedSlotInicioIso(null);
        setDuracionMinutos("");
    };

    const handleSelectServicio = (idServicio: number) => {
        setSelectedServicioId(idServicio);
        const servicio = servicios.find((item) => item.id_servicio === idServicio);

        if (servicio?.duracion) {
            setDuracionMinutos(`${servicio.duracion}`);
        }

        setSelectedSlotInicioIso(null);

        setServicioPickerVisible(false);
    };

    const handleDateChange = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
        if (Platform.OS !== "ios") {
            setDatePickerVisible(false);
        }

        if (event.type === "dismissed" || !selectedDateValue) {
            return;
        }

        setSelectedFecha(toLocalDateKey(selectedDateValue));
        setSelectedSlotInicioIso(null);
    };

    const handleOpenDatePicker = () => {
        setDatePickerVisible(true);
    };

    const handleOpenCreateModal = () => {
        setError("");
        setSuccess("");
        resetForm();
        setFormModalVisible(true);
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");

        if (!validateForm()) {
            return;
        }

        if (!selectedSlotInicioIso) {
            setError(DEFAULT_CREATE_ERROR);
            return;
        }

        setSaving(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(reservasRoute, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_recurso: selectedRecursoId,
                    id_cliente: selectedClienteId,
                    id_servicio: selectedServicioId,
                    fecha_hora_inicio: selectedSlotInicioIso,
                    duracion_minutos: duracionMinutos.trim(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_CREATE_ERROR);
                return;
            }

            setSuccess(SUCCESS_MESSAGE);
            setFormModalVisible(false);
            resetForm();
            await fetchData();
        } catch (saveError) {
            setError(CONNECTION_ERROR);
        } finally {
            setSaving(false);
        }
    };

    const monthTitle = calendarCursor.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
    });

    const toggleCalendar = () => {
        if (isCalendarExpanded) {
            setIsCalendarExpanded(false);
            return;
        }

        const selectedDate = dateFromKey(selectedDay);
        setCalendarCursor(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        setIsCalendarExpanded(true);
    };

    const handleSelectCalendarDay = (dayKey: string) => {
        setSelectedDay(dayKey);

        if (dayKey === todayKey) {
            setIsCalendarExpanded(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.goBack()}
                    testID="reservas-back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.title}>{SCREEN_TITLE}</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate("CrearReserva", { negocio })}
                    testID="reservas-open-form-button"
                >
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.addButtonText}>{ADD_RESERVA_BUTTON}</Text>
                </TouchableOpacity>
            </View>

            {error ? (
                <View style={styles.feedbackError} testID="reservas-error-message">
                    <Text style={styles.feedbackErrorText}>{error}</Text>
                </View>
            ) : null}

            {success ? (
                <View style={styles.feedbackSuccess} testID="reservas-success-message">
                    <Text style={styles.feedbackSuccessText}>{success}</Text>
                </View>
            ) : null}

            {loadingData ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" testID="reservas-loading-data" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.calendarCard}>
                        <TouchableOpacity style={styles.selectedDayToggle} onPress={toggleCalendar} testID="reservas-selected-day-toggle">
                            <View>
                                <Text style={styles.selectedDayLabel}>Día seleccionado</Text>
                                <Text style={styles.selectedDayValue}>{toDayLabel(dateFromKey(selectedDay))}</Text>
                            </View>
                            <MaterialIcons
                                name={isCalendarExpanded ? "expand-less" : "expand-more"}
                                size={22}
                                color="#374151"
                            />
                        </TouchableOpacity>

                        {isCalendarExpanded ? (
                            <>
                                <View style={styles.calendarHeader}>
                                    <TouchableOpacity
                                        onPress={() => setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                        testID="reservas-prev-month"
                                    >
                                        <MaterialIcons name="chevron-left" size={22} color="#374151" />
                                    </TouchableOpacity>
                                    <Text style={styles.calendarTitle}>{monthTitle}</Text>
                                    <TouchableOpacity
                                        onPress={() => setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                        testID="reservas-next-month"
                                    >
                                        <MaterialIcons name="chevron-right" size={22} color="#374151" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.weekRow}>
                                    {WEEK_LABELS.map((label) => (
                                        <Text key={label} style={styles.weekLabel}>{label}</Text>
                                    ))}
                                </View>

                                <View style={styles.daysGrid}>
                                    {webCalendarCells.map((day, index) => {
                                        if (day === null) {
                                            return <View key={`empty-${index}`} style={styles.dayCell} />;
                                        }

                                        const dayKey = toLocalDateKey(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), day));
                                        const events = reservasByDay.get(dayKey) || [];
                                        const isSelected = selectedDay === dayKey;

                                        return (
                                            <TouchableOpacity
                                                key={`day-${day}`}
                                                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                                                onPress={() => handleSelectCalendarDay(dayKey)}
                                                testID={`reservas-calendar-day-${day}`}
                                            >
                                                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                                                {events.length ? <View style={styles.dayDot} /> : null}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        ) : null}
                    </View>

                    <View style={styles.dayListCard}>
                        <Text style={styles.dayListTitle}>Reservas {selectedDay}</Text>
                        {reservasSelectedDay.length === 0 ? (
                            <Text style={styles.emptyText}>{CALENDAR_EMPTY_MESSAGE}</Text>
                        ) : (
                            reservasSelectedDay.map((reserva) => {
                                const cliente = clienteById.get(reserva.id_cliente);
                                const recurso = recursoById.get(reserva.id_recurso);
                                const servicio = reserva.id_servicio ? servicioById.get(reserva.id_servicio) : null;

                                return (
                                    <View key={reserva.id_reserva} style={styles.eventCard} testID={`reserva-item-${reserva.id_reserva}`}>
                                        <Text style={styles.eventTitle}>{cliente ? formatClienteName(cliente) : `Cliente #${reserva.id_cliente}`}</Text>
                                        <Text style={styles.eventMeta}>Recurso: {recurso?.nombre || `#${reserva.id_recurso}`}</Text>
                                        <Text style={styles.eventMeta}>Servicio: {reserva.servicio_nombre || servicio?.nombre || "-"}</Text>
                                        <Text style={styles.eventMeta}>Inicio: {toDateTimeDisplay(reserva.fecha_hora_inicio)}</Text>
                                        <Text style={styles.eventMeta}>Fin: {toDateTimeDisplay(reserva.fecha_hora_fin)}</Text>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </ScrollView>
            )}

            <Modal
                visible={formModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setFormModalVisible(false)}
                testID="reservas-form-modal"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.formContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.formTitle}>{FORM_TITLE}</Text>
                            <TouchableOpacity onPress={() => setFormModalVisible(false)} testID="reservas-close-form-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.fieldLabel}>{SELECT_CLIENTE_LABEL}</Text>
                            <TouchableOpacity
                                style={styles.selector}
                                onPress={() => setClientePickerVisible(true)}
                                testID="reservas-open-clientes-picker"
                            >
                                <Text style={selectedCliente ? styles.selectorValue : styles.selectorPlaceholder}>
                                    {selectedCliente ? formatClienteName(selectedCliente) : PICK_CLIENTE_PLACEHOLDER}
                                </Text>
                                <MaterialIcons name="expand-more" size={20} color="#6b7280" />
                            </TouchableOpacity>

                            <Text style={styles.fieldLabel}>{SELECT_RECURSO_LABEL}</Text>
                            <TouchableOpacity
                                style={styles.selector}
                                onPress={() => setRecursoPickerVisible(true)}
                                testID="reservas-open-recursos-picker"
                            >
                                <Text style={selectedRecurso ? styles.selectorValue : styles.selectorPlaceholder}>
                                    {selectedRecurso ? selectedRecurso.nombre : PICK_RECURSO_PLACEHOLDER}
                                </Text>
                                <MaterialIcons name="expand-more" size={20} color="#6b7280" />
                            </TouchableOpacity>

                            <Text style={styles.fieldLabel}>{SELECT_SERVICIO_LABEL}</Text>
                            <TouchableOpacity
                                style={styles.selector}
                                onPress={() => setServicioPickerVisible(true)}
                                testID="reservas-open-servicios-picker"
                            >
                                <Text style={selectedServicio ? styles.selectorValue : styles.selectorPlaceholder}>
                                    {selectedServicio ? selectedServicio.nombre : PICK_SERVICIO_PLACEHOLDER}
                                </Text>
                                <MaterialIcons name="expand-more" size={20} color="#6b7280" />
                            </TouchableOpacity>

                            <Text style={styles.fieldLabel}>{FECHA_INICIO_LABEL}</Text>
                            <TouchableOpacity
                                style={styles.selector}
                                onPress={handleOpenDatePicker}
                                testID="reservas-date-picker-button"
                            >
                                <Text style={styles.selectorValue}>{toDateOnlyDisplay(selectedFecha)}</Text>
                                <MaterialIcons name="event" size={20} color="#6b7280" />
                            </TouchableOpacity>

                            {datePickerVisible && Platform.OS !== "web" ? (
                                <DateTimePicker
                                    testID="reservas-date-picker"
                                    value={dateFromKey(selectedFecha)}
                                    mode="date"
                                    display={Platform.OS === "ios" ? "spinner" : "default"}
                                    onChange={handleDateChange}
                                />
                            ) : null}

                            <Text style={styles.fieldLabel}>{DURACION_LABEL}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={DURACION_PLACEHOLDER}
                                value={duracionMinutos}
                                onChangeText={(value) => {
                                    setDuracionMinutos(value);
                                    setSelectedSlotInicioIso(null);
                                }}
                                keyboardType="number-pad"
                                testID="reservas-duracion-input"
                            />

                            <Text style={styles.fieldLabel}>{FRANJA_LABEL}</Text>
                            <View style={styles.slotsContainer} testID="reservas-slots-container">
                                {availableSlots.length === 0 ? (
                                    <Text style={styles.emptyText}>{PICK_FRANJA_PLACEHOLDER}</Text>
                                ) : (
                                    availableSlots.map((slot) => {
                                        const isSelected = selectedSlotInicioIso === slot.iso;

                                        return (
                                            <TouchableOpacity
                                                key={slot.iso}
                                                style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                                                onPress={() => setSelectedSlotInicioIso(slot.iso)}
                                                testID={`reservas-slot-${slot.id}`}
                                            >
                                                <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>{slot.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </View>

                            {availableSlots.length === 0 && selectedRecursoId && selectedDurationMinutes > 0 ? (
                                <Text style={styles.slotsEmptyHint}>{AVAILABLE_SLOTS_EMPTY_MESSAGE}</Text>
                            ) : null}

                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={saving}
                                testID="reservas-save-button"
                            >
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                                <Text style={styles.saveButtonText}>{saving ? SAVING_BUTTON_TEXT : SAVE_BUTTON_TEXT}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={clientePickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setClientePickerVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{SELECT_CLIENTE_LABEL}</Text>
                            <TouchableOpacity onPress={() => setClientePickerVisible(false)}>
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {clientes.length === 0 ? (
                                <Text style={styles.emptyText}>{EMPTY_CLIENTES_MESSAGE}</Text>
                            ) : clientes.map((cliente) => (
                                <TouchableOpacity
                                    key={cliente.id_cliente}
                                    style={styles.optionRow}
                                    onPress={() => {
                                        setSelectedClienteId(cliente.id_cliente);
                                        setClientePickerVisible(false);
                                    }}
                                    testID={`reservas-select-cliente-${cliente.id_cliente}`}
                                >
                                    <Text style={styles.optionText}>{formatClienteName(cliente)}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={recursoPickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setRecursoPickerVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{SELECT_RECURSO_LABEL}</Text>
                            <TouchableOpacity onPress={() => setRecursoPickerVisible(false)}>
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {recursos.length === 0 ? (
                                <Text style={styles.emptyText}>{EMPTY_RECURSOS_MESSAGE}</Text>
                            ) : recursos.map((recurso) => (
                                <TouchableOpacity
                                    key={recurso.id_recurso}
                                    style={styles.optionRow}
                                    onPress={() => {
                                        setSelectedRecursoId(recurso.id_recurso);
                                        setSelectedSlotInicioIso(null);
                                        setRecursoPickerVisible(false);
                                    }}
                                    testID={`reservas-select-recurso-${recurso.id_recurso}`}
                                >
                                    <Text style={styles.optionText}>{recurso.nombre}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={servicioPickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setServicioPickerVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{SELECT_SERVICIO_LABEL}</Text>
                            <TouchableOpacity onPress={() => setServicioPickerVisible(false)}>
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {servicios.length === 0 ? (
                                <Text style={styles.emptyText}>{EMPTY_SERVICIOS_MESSAGE}</Text>
                            ) : servicios.map((servicio) => (
                                <TouchableOpacity
                                    key={servicio.id_servicio}
                                    style={styles.optionRow}
                                    onPress={() => handleSelectServicio(servicio.id_servicio)}
                                    testID={`reservas-select-servicio-${servicio.id_servicio}`}
                                >
                                    <Text style={styles.optionText}>{servicio.nombre}</Text>
                                    <Text style={styles.optionMeta}>Duración: {servicio.duracion} min</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Reservas;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
        paddingTop: 12,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
    },
    title: {
        flex: 1,
        marginLeft: 12,
        fontSize: 22,
        color: "#0D47A1",
        fontWeight: "700",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1976D2",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    addButtonText: {
        color: "#fff",
        marginLeft: 4,
        fontWeight: "600",
        fontSize: 13,
    },
    feedbackError: {
        marginHorizontal: 12,
        backgroundColor: "#fef2f2",
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    feedbackErrorText: {
        color: "#dc2626",
    },
    feedbackSuccess: {
        marginHorizontal: 12,
        backgroundColor: "#f0fdf4",
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    feedbackSuccessText: {
        color: "#16a34a",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        paddingHorizontal: 12,
        paddingBottom: 24,
    },
    calendarCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    selectedDayToggle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#dbeafe",
        backgroundColor: "#f0f7ff",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    selectedDayLabel: {
        color: "#1d4ed8",
        fontSize: 12,
        fontWeight: "700",
    },
    selectedDayValue: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "700",
        textTransform: "capitalize",
        marginTop: 2,
    },
    calendarHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 8,
    },
    calendarTitle: {
        fontWeight: "700",
        color: "#111827",
        textTransform: "capitalize",
    },
    weekRow: {
        flexDirection: "row",
        marginBottom: 6,
    },
    weekLabel: {
        flex: 1,
        textAlign: "center",
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "600",
    },
    daysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    dayCell: {
        width: "14.2857%",
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
    },
    dayCellSelected: {
        backgroundColor: "#dbeafe",
    },
    dayText: {
        color: "#1f2937",
        fontWeight: "600",
    },
    dayTextSelected: {
        color: "#1d4ed8",
    },
    dayDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#0ea5e9",
        marginTop: 3,
    },
    dayListCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
    },
    dayListTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 10,
    },
    eventCard: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
    },
    eventTitle: {
        fontWeight: "700",
        color: "#0D47A1",
        marginBottom: 4,
    },
    eventMeta: {
        color: "#4b5563",
        fontSize: 13,
    },
    emptyText: {
        color: "#6b7280",
        textAlign: "center",
        paddingVertical: 12,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
    },
    formContainer: {
        width: "100%",
        maxHeight: "85%",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
    },
    modalCard: {
        width: "92%",
        maxHeight: "80%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    fieldLabel: {
        color: "#374151",
        fontWeight: "600",
        marginBottom: 6,
        marginTop: 8,
    },
    selector: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    selectorPlaceholder: {
        color: "#9ca3af",
    },
    selectorValue: {
        color: "#111827",
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    saveButton: {
        marginTop: 18,
        backgroundColor: "#1976D2",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    saveButtonDisabled: {
        backgroundColor: "#93c5fd",
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "700",
        marginLeft: 6,
    },
    optionRow: {
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        paddingVertical: 10,
    },
    optionText: {
        color: "#111827",
        fontWeight: "600",
    },
    optionMeta: {
        color: "#6b7280",
        marginTop: 2,
    },
    slotsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 6,
    },
    slotChip: {
        borderWidth: 1,
        borderColor: "#bfdbfe",
        backgroundColor: "#eff6ff",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
    },
    slotChipSelected: {
        backgroundColor: "#1d4ed8",
        borderColor: "#1d4ed8",
    },
    slotChipText: {
        color: "#1e3a8a",
        fontWeight: "700",
        fontSize: 12,
    },
    slotChipTextSelected: {
        color: "#fff",
    },
    slotsEmptyHint: {
        marginTop: 6,
        color: "#b45309",
        fontSize: 12,
    },
});
