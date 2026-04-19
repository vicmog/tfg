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
    CAPACIDAD_SOLICITADA_LABEL,
    CAPACIDAD_SOLICITADA_PLACEHOLDER,
    CONNECTION_ERROR,
    DEFAULT_CLIENTES_ERROR,
    DEFAULT_CREATE_ERROR,
    DEFAULT_RESERVAS_ERROR,
    DEFAULT_RECURSOS_ERROR,
    DEFAULT_SERVICIOS_ERROR,
    DURACION_LABEL,
    DURACION_PLACEHOLDER,
    EMPTY_CLIENTE_ERROR,
    EMPTY_CAPACIDAD_SOLICITADA_ERROR,
    EMPTY_CLIENTES_MESSAGE,
    EMPTY_DURACION_ERROR,
    EMPTY_FRANJA_ERROR,
    EMPTY_RECURRENCIA_CANTIDAD_ERROR,
    EMPTY_RECURRENCIA_INTERVALO_ERROR,
    EMPTY_RECURSO_ERROR,
    EMPTY_RECURSOS_MESSAGE,
    EMPTY_SERVICIO_ERROR,
    EMPTY_SERVICIOS_MESSAGE,
    FECHA_INICIO_LABEL,
    FORM_TITLE,
    FRANJA_LABEL,
    RECURRENCIA_LABEL,
    RECURRENCIA_ACTIVAR,
    RECURRENCIA_CANTIDAD_LABEL,
    RECURRENCIA_CANTIDAD_PLACEHOLDER,
    RECURRENCIA_INTERVALO_LABEL,
    RECURRENCIA_INTERVALO_PLACEHOLDER,
    INVALID_DURACION_ERROR,
    INVALID_CAPACIDAD_SOLICITADA_ERROR,
    INVALID_FECHA_INICIO_ERROR,
    INVALID_RECURRENCIA_CANTIDAD_ERROR,
    INVALID_RECURRENCIA_INTERVALO_ERROR,
    NO_SERVICIO_OPTION_LABEL,
    PICK_CLIENTE_PLACEHOLDER,
    PICK_FRANJA_PLACEHOLDER,
    PICK_RECURSO_PLACEHOLDER,
    PICK_SERVICIO_PLACEHOLDER,
    SAVE_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SELECT_CLIENTE_LABEL,
    SELECT_RECURSO_LABEL,
    SELECT_SERVICIO_LABEL,
    AVAILABLE_SLOTS_EMPTY_MESSAGE,
    clientesByNegocioRoute,
    reservasByNegocioRoute,
    reservasRoute,
    recursosByNegocioRoute,
    serviciosByNegocioRoute,
} from "./constants";
import { CrearReservaProps } from "./types";

const INTEGER_REGEX = /^\d+$/;
const NO_SERVICIO_OPTION_ID = 0;
const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const OPENING_HOUR = 8;
const CLOSING_HOUR = 21;

const toNumericId = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

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

const normalizeText = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const CrearReserva: React.FC<CrearReservaProps> = ({ route, navigation }) => {
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
    const [capacidadSolicitada, setCapacidadSolicitada] = useState("");
    const [duracionMinutos, setDuracionMinutos] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceCount, setRecurrenceCount] = useState("2");
    const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState("7");

    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [clientePickerVisible, setClientePickerVisible] = useState(false);
    const [recursoPickerVisible, setRecursoPickerVisible] = useState(false);
    const [servicioPickerVisible, setServicioPickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [datePickerCursor, setDatePickerCursor] = useState<Date>(new Date());
    const [clienteSearchQuery, setClienteSearchQuery] = useState("");
    const [recursoSearchQuery, setRecursoSearchQuery] = useState("");
    const [servicioSearchQuery, setServicioSearchQuery] = useState("");

    const selectedCliente = useMemo(
        () => clientes.find((cliente) => cliente.id_cliente === selectedClienteId) || null,
        [clientes, selectedClienteId]
    );

    const selectedRecurso = useMemo(
        () => recursos.find((recurso) => recurso.id_recurso === selectedRecursoId) || null,
        [recursos, selectedRecursoId]
    );

    const selectedServicio = useMemo(
        () => {
            const selectedId = toNumericId(selectedServicioId);
            if (selectedId === null) {
                return null;
            }

            return servicios.find((servicio) => toNumericId(servicio.id_servicio) === selectedId) || null;
        },
        [servicios, selectedServicioId]
    );

    const isNoServicioSelected = toNumericId(selectedServicioId) === NO_SERVICIO_OPTION_ID;
    const requiresCapacity = isNoServicioSelected || Boolean(selectedServicio?.requiere_capacidad);

    const filteredClientes = useMemo(() => {
        const query = normalizeText(clienteSearchQuery.trim());
        if (!query) {
            return clientes;
        }

        return clientes.filter((cliente) => normalizeText(formatClienteName(cliente)).includes(query));
    }, [clientes, clienteSearchQuery]);

    const filteredRecursos = useMemo(() => {
        const query = normalizeText(recursoSearchQuery.trim());
        if (!query) {
            return recursos;
        }

        return recursos.filter((recurso) => normalizeText(recurso.nombre).includes(query));
    }, [recursos, recursoSearchQuery]);

    const filteredServicios = useMemo(() => {
        const query = normalizeText(servicioSearchQuery.trim());
        if (!query) {
            return servicios;
        }

        return servicios.filter((servicio) => normalizeText(servicio.nombre).includes(query));
    }, [servicios, servicioSearchQuery]);

    const selectedDurationMinutes = useMemo(() => {
        if (!INTEGER_REGEX.test(duracionMinutos.trim())) {
            return 0;
        }

        return Number.parseInt(duracionMinutos.trim(), 10);
    }, [duracionMinutos]);

    const webCalendarCells = useMemo(() => buildCalendarMatrix(datePickerCursor), [datePickerCursor]);

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
    }, [duracionMinutos, reservas, selectedDurationMinutes, selectedFecha, selectedRecursoId]);

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

        if (selectedServicioId === null) {
            setError(EMPTY_SERVICIO_ERROR);
            return false;
        }

        if (requiresCapacity) {
            if (!capacidadSolicitada.trim()) {
                setError(EMPTY_CAPACIDAD_SOLICITADA_ERROR);
                return false;
            }

            if (!INTEGER_REGEX.test(capacidadSolicitada.trim()) || Number.parseInt(capacidadSolicitada.trim(), 10) <= 0) {
                setError(INVALID_CAPACIDAD_SOLICITADA_ERROR);
                return false;
            }
        }

        if (!selectedFecha.trim()) {
            setError(INVALID_FECHA_INICIO_ERROR);
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

        if (isRecurring) {
            if (!recurrenceCount.trim()) {
                setError(EMPTY_RECURRENCIA_CANTIDAD_ERROR);
                return false;
            }

            if (!INTEGER_REGEX.test(recurrenceCount.trim()) || Number.parseInt(recurrenceCount.trim(), 10) < 2) {
                setError(INVALID_RECURRENCIA_CANTIDAD_ERROR);
                return false;
            }

            if (!recurrenceIntervalDays.trim()) {
                setError(EMPTY_RECURRENCIA_INTERVALO_ERROR);
                return false;
            }

            if (!INTEGER_REGEX.test(recurrenceIntervalDays.trim()) || Number.parseInt(recurrenceIntervalDays.trim(), 10) <= 0) {
                setError(INVALID_RECURRENCIA_INTERVALO_ERROR);
                return false;
            }
        }

        return true;
    };

    const handleSelectServicio = (idServicio: number) => {
        const normalizedServiceId = toNumericId(idServicio);
        if (normalizedServiceId === null) {
            return;
        }

        setSelectedServicioId(normalizedServiceId);
        const servicio = servicios.find((item) => toNumericId(item.id_servicio) === normalizedServiceId);

        if (servicio?.duracion) {
            setDuracionMinutos(`${servicio.duracion}`);
        }

        const servicioRequiereCapacidad = normalizedServiceId === NO_SERVICIO_OPTION_ID
            || Boolean(servicio?.requiere_capacidad);

        if (!servicioRequiereCapacidad) {
            setCapacidadSolicitada("");
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
        const selectedDate = dateFromKey(selectedFecha);
        setDatePickerCursor(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        setDatePickerVisible(true);
    };

    const handleSelectDateFromCalendar = (day: number) => {
        const pickedDate = new Date(datePickerCursor.getFullYear(), datePickerCursor.getMonth(), day);
        setSelectedFecha(toLocalDateKey(pickedDate));
        setSelectedSlotInicioIso(null);
        setDatePickerVisible(false);
    };

    const handleSave = async () => {
        setError("");

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
                    id_servicio: isNoServicioSelected ? undefined : selectedServicioId,
                    fecha_hora_inicio: selectedSlotInicioIso,
                    duracion_minutos: duracionMinutos.trim(),
                    capacidad_solicitada: requiresCapacity
                        ? Number.parseInt(capacidadSolicitada.trim(), 10)
                        : undefined,
                    recurrencia: isRecurring
                        ? {
                            activa: true,
                            cantidad: Number.parseInt(recurrenceCount.trim(), 10),
                            intervalo_dias: Number.parseInt(recurrenceIntervalDays.trim(), 10),
                        }
                        : undefined,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_CREATE_ERROR);
                return;
            }

            navigation.goBack();
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
                    testID="crear-reserva-back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.title}>{FORM_TITLE}</Text>
            </View>

            {error ? (
                <View style={styles.feedbackError} testID="crear-reserva-error-message">
                    <Text style={styles.feedbackErrorText}>{error}</Text>
                </View>
            ) : null}

            {loadingData ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" testID="crear-reserva-loading-data" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.fieldLabel}>{SELECT_CLIENTE_LABEL}</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => {
                            setClienteSearchQuery("");
                            setClientePickerVisible(true);
                        }}
                        testID="reservas-open-clientes-picker"
                    >
                        <Text style={selectedCliente ? styles.selectorValue : styles.selectorPlaceholder}>
                            {selectedCliente ? formatClienteName(selectedCliente) : PICK_CLIENTE_PLACEHOLDER}
                        </Text>
                        <MaterialIcons name="expand-more" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    <Text style={styles.fieldLabel}>{SELECT_SERVICIO_LABEL}</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => {
                            setServicioSearchQuery("");
                            setServicioPickerVisible(true);
                        }}
                        testID="reservas-open-servicios-picker"
                    >
                        <Text style={selectedServicio ? styles.selectorValue : styles.selectorPlaceholder}>
                            {isNoServicioSelected
                                ? NO_SERVICIO_OPTION_LABEL
                                : selectedServicio
                                    ? selectedServicio.nombre
                                    : PICK_SERVICIO_PLACEHOLDER}
                        </Text>
                        <MaterialIcons name="expand-more" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    {requiresCapacity ? (
                        <>
                            <Text style={styles.fieldLabel}>{CAPACIDAD_SOLICITADA_LABEL}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={CAPACIDAD_SOLICITADA_PLACEHOLDER}
                                value={capacidadSolicitada}
                                onChangeText={(value) => {
                                    setCapacidadSolicitada(value);
                                    const parsed = Number.parseInt(value.trim(), 10);
                                    if (selectedRecurso && Number.isInteger(parsed) && parsed > 0 && (selectedRecurso.capacidad ?? 0) < parsed) {
                                        setSelectedRecursoId(null);
                                        setSelectedSlotInicioIso(null);
                                    }
                                }}
                                keyboardType="number-pad"
                                testID="reservas-capacidad-input"
                            />
                        </>
                    ) : null}

                    <Text style={styles.fieldLabel}>{SELECT_RECURSO_LABEL}</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => {
                            setRecursoSearchQuery("");
                            setRecursoPickerVisible(true);
                        }}
                        testID="reservas-open-recursos-picker"
                    >
                        <Text style={selectedRecurso ? styles.selectorValue : styles.selectorPlaceholder}>
                            {selectedRecurso ? selectedRecurso.nombre : PICK_RECURSO_PLACEHOLDER}
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

                    {datePickerVisible ? (
                        Platform.OS === "web" ? (
                            <View style={styles.inlineCalendarCard} testID="reservas-date-picker">
                                <View style={styles.inlineCalendarHeader}>
                                    <TouchableOpacity
                                        onPress={() => setDatePickerCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                        testID="crear-reserva-prev-month"
                                    >
                                        <MaterialIcons name="chevron-left" size={20} color="#374151" />
                                    </TouchableOpacity>
                                    <Text style={styles.inlineCalendarTitle}>
                                        {datePickerCursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setDatePickerCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                        testID="crear-reserva-next-month"
                                    >
                                        <MaterialIcons name="chevron-right" size={20} color="#374151" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inlineWeekRow}>
                                    {WEEK_LABELS.map((label) => (
                                        <Text key={label} style={styles.inlineWeekLabel}>{label}</Text>
                                    ))}
                                </View>

                                <View style={styles.inlineDaysGrid}>
                                    {webCalendarCells.map((day, index) => {
                                        if (day === null) {
                                            return <View key={`empty-${index}`} style={styles.inlineDayCell} />;
                                        }

                                        const dayKey = toLocalDateKey(new Date(datePickerCursor.getFullYear(), datePickerCursor.getMonth(), day));
                                        const isSelected = dayKey === selectedFecha;

                                        return (
                                            <TouchableOpacity
                                                key={`calendar-day-${day}`}
                                                style={[styles.inlineDayCell, isSelected && styles.inlineDayCellSelected]}
                                                onPress={() => handleSelectDateFromCalendar(day)}
                                                testID={`crear-reserva-calendar-day-${day}`}
                                            >
                                                <Text style={[styles.inlineDayText, isSelected && styles.inlineDayTextSelected]}>{day}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : (
                            <DateTimePicker
                                testID="reservas-date-picker"
                                value={dateFromKey(selectedFecha)}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                onChange={handleDateChange}
                            />
                        )
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

                    <Text style={styles.fieldLabel}>{RECURRENCIA_LABEL}</Text>
                    <TouchableOpacity
                        style={[styles.selector, styles.recurringToggle]}
                        onPress={() => setIsRecurring((prev) => !prev)}
                        testID="reservas-recurring-toggle"
                    >
                        <Text style={styles.selectorValue}>{RECURRENCIA_ACTIVAR}</Text>
                        <MaterialIcons
                            name={isRecurring ? "check-box" : "check-box-outline-blank"}
                            size={22}
                            color={isRecurring ? "#1d4ed8" : "#6b7280"}
                        />
                    </TouchableOpacity>

                    {isRecurring ? (
                        <View style={styles.recurrenciaContainer}>
                            <Text style={styles.fieldLabel}>{RECURRENCIA_CANTIDAD_LABEL}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={RECURRENCIA_CANTIDAD_PLACEHOLDER}
                                value={recurrenceCount}
                                onChangeText={setRecurrenceCount}
                                keyboardType="number-pad"
                                testID="reservas-recurring-count-input"
                            />

                            <Text style={styles.fieldLabel}>{RECURRENCIA_INTERVALO_LABEL}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={RECURRENCIA_INTERVALO_PLACEHOLDER}
                                value={recurrenceIntervalDays}
                                onChangeText={setRecurrenceIntervalDays}
                                keyboardType="number-pad"
                                testID="reservas-recurring-interval-input"
                            />
                        </View>
                    ) : null}

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
            )}

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
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar cliente"
                            value={clienteSearchQuery}
                            onChangeText={setClienteSearchQuery}
                            testID="crear-reserva-search-cliente-input"
                        />
                        <ScrollView>
                            {clientes.length === 0 ? (
                                <Text style={styles.emptyText}>{EMPTY_CLIENTES_MESSAGE}</Text>
                            ) : filteredClientes.length === 0 ? (
                                <Text style={styles.emptyText}>No hay clientes que coincidan</Text>
                            ) : filteredClientes.map((cliente) => (
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
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar recurso"
                            value={recursoSearchQuery}
                            onChangeText={setRecursoSearchQuery}
                            testID="crear-reserva-search-recurso-input"
                        />
                        <ScrollView>
                            {recursos.length === 0 ? (
                                <Text style={styles.emptyText}>{EMPTY_RECURSOS_MESSAGE}</Text>
                            ) : filteredRecursos.length === 0 ? (
                                <Text style={styles.emptyText}>No hay recursos que coincidan</Text>
                            ) : filteredRecursos.map((recurso) => (
                                (() => {
                                    const capacidadRequerida = requiresCapacity && INTEGER_REGEX.test(capacidadSolicitada.trim())
                                        ? Number.parseInt(capacidadSolicitada.trim(), 10)
                                        : null;
                                    const capacidadInsuficiente = capacidadRequerida !== null
                                        && (recurso.capacidad ?? 0) < capacidadRequerida;

                                    return (
                                        <TouchableOpacity
                                            key={recurso.id_recurso}
                                            style={[styles.optionRow, capacidadInsuficiente && styles.optionRowDisabled]}
                                            disabled={capacidadInsuficiente}
                                            onPress={() => {
                                                setSelectedRecursoId(recurso.id_recurso);
                                                setSelectedSlotInicioIso(null);
                                                setRecursoPickerVisible(false);
                                            }}
                                            testID={`reservas-select-recurso-${recurso.id_recurso}`}
                                        >
                                            <Text style={[styles.optionText, capacidadInsuficiente && styles.optionTextDisabled]}>{recurso.nombre}</Text>
                                            <Text style={styles.optionMeta}>Capacidad: {recurso.capacidad ?? 0}</Text>
                                            {capacidadInsuficiente ? (
                                                <Text style={styles.optionMetaWarning}>Capacidad insuficiente</Text>
                                            ) : null}
                                        </TouchableOpacity>
                                    );
                                })()
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
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar servicio"
                            value={servicioSearchQuery}
                            onChangeText={setServicioSearchQuery}
                            testID="crear-reserva-search-servicio-input"
                        />
                        <ScrollView>
                            <TouchableOpacity
                                style={styles.optionRow}
                                onPress={() => handleSelectServicio(NO_SERVICIO_OPTION_ID)}
                                testID="reservas-select-servicio-ninguno"
                            >
                                <Text style={styles.optionText}>{NO_SERVICIO_OPTION_LABEL}</Text>
                            </TouchableOpacity>
                            {servicios.length === 0 ? (
                                <Text style={styles.emptyText}>{EMPTY_SERVICIOS_MESSAGE}</Text>
                            ) : filteredServicios.length === 0 ? (
                                <Text style={styles.emptyText}>No hay servicios que coincidan</Text>
                            ) : filteredServicios.map((servicio) => (
                                <TouchableOpacity
                                    key={servicio.id_servicio}
                                    style={styles.optionRow}
                                    onPress={() => handleSelectServicio(servicio.id_servicio)}
                                    testID={`reservas-select-servicio-${servicio.id_servicio}`}
                                >
                                    <Text style={styles.optionText}>{servicio.nombre}</Text>
                                    <Text style={styles.optionMeta}>Duracion: {servicio.duracion} min</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default CrearReserva;

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
        marginLeft: 12,
        fontSize: 22,
        color: "#0D47A1",
        fontWeight: "700",
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        paddingHorizontal: 12,
        paddingBottom: 24,
    },
    fieldLabel: {
        marginTop: 10,
        marginBottom: 6,
        color: "#374151",
        fontWeight: "600",
    },
    selector: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    recurringToggle: {
        marginBottom: 2,
    },
    recurrenciaContainer: {
        marginTop: 4,
    },
    selectorValue: {
        color: "#111827",
        fontWeight: "600",
    },
    selectorPlaceholder: {
        color: "#9ca3af",
    },
    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: "#fff",
    },
    inlineCalendarCard: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 10,
        marginTop: 8,
    },
    inlineCalendarHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    inlineCalendarTitle: {
        color: "#111827",
        fontWeight: "700",
        textTransform: "capitalize",
    },
    inlineWeekRow: {
        flexDirection: "row",
        marginBottom: 6,
    },
    inlineWeekLabel: {
        flex: 1,
        textAlign: "center",
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "600",
    },
    inlineDaysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    inlineDayCell: {
        width: "14.2857%",
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
    },
    inlineDayCellSelected: {
        backgroundColor: "#dbeafe",
    },
    inlineDayText: {
        color: "#1f2937",
        fontWeight: "600",
    },
    inlineDayTextSelected: {
        color: "#1d4ed8",
    },
    saveButton: {
        marginTop: 16,
        backgroundColor: "#1976D2",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(17, 24, 39, 0.45)",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        maxHeight: "75%",
        padding: 12,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    modalTitle: {
        fontWeight: "700",
        color: "#111827",
    },
    searchInput: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 10,
        backgroundColor: "#fff",
    },
    optionRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    optionRowDisabled: {
        opacity: 0.6,
    },
    optionText: {
        color: "#1f2937",
    },
    optionTextDisabled: {
        textDecorationLine: "line-through",
    },
    optionMeta: {
        color: "#6b7280",
        marginTop: 2,
    },
    optionMetaWarning: {
        color: "#b45309",
        marginTop: 2,
        fontWeight: "600",
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
    emptyText: {
        color: "#6b7280",
    },
});
