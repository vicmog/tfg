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
    CONNECTION_ERROR,
    DEFAULT_CLIENTES_ERROR,
    DEFAULT_CREATE_ERROR,
    DEFAULT_RESERVAS_ERROR,
    DEFAULT_RECURSOS_ERROR,
    DEFAULT_SERVICIOS_ERROR,
    DURACION_LABEL,
    DURACION_PLACEHOLDER,
    EMPTY_CLIENTE_ERROR,
    EMPTY_CLIENTES_MESSAGE,
    EMPTY_DURACION_ERROR,
    EMPTY_FRANJA_ERROR,
    EMPTY_RECURSO_ERROR,
    EMPTY_RECURSOS_MESSAGE,
    EMPTY_SERVICIO_ERROR,
    EMPTY_SERVICIOS_MESSAGE,
    FECHA_INICIO_LABEL,
    FORM_TITLE,
    FRANJA_LABEL,
    INVALID_DURACION_ERROR,
    INVALID_FECHA_INICIO_ERROR,
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

const formatClienteName = (cliente: Cliente) => {
    const fullName = [cliente.nombre, cliente.apellido1, cliente.apellido2].filter(Boolean).join(" ").trim();

    return fullName || `Cliente #${cliente.id_cliente}`;
};

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
    const [duracionMinutos, setDuracionMinutos] = useState("");

    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [clientePickerVisible, setClientePickerVisible] = useState(false);
    const [recursoPickerVisible, setRecursoPickerVisible] = useState(false);
    const [servicioPickerVisible, setServicioPickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);

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

        if (!selectedServicioId) {
            setError(EMPTY_SERVICIO_ERROR);
            return false;
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

        return true;
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
    optionRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    optionText: {
        color: "#1f2937",
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
    emptyText: {
        color: "#6b7280",
    },
});
