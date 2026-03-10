import React, { useCallback, useState } from "react";
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
import { Servicio } from "../types";
import {
    ADD_SERVICE_BUTTON,
    ADMIN_ROLE,
    CONNECTION_ERROR,
    CONFIRM_DELETE_ACCEPT,
    CONFIRM_DELETE_CANCEL,
    CONFIRM_DELETE_MESSAGE,
    CONFIRM_DELETE_TITLE,
    createServicioRoute,
    DEFAULT_CREATE_ERROR,
    DEFAULT_DELETE_ERROR,
    DEFAULT_FETCH_ERROR,
    DEFAULT_UPDATE_ERROR,
    DELETE_SUCCESS_MESSAGE,
    deleteServicioByIdRoute,
    DESCRIPCION_PLACEHOLDER,
    DELETING_BUTTON_TEXT,
    DURACION_LABEL,
    EMPTY_DESCRIPCION_ERROR,
    EMPTY_DURACION_ERROR,
    EMPTY_NOMBRE_ERROR,
    EMPTY_PRECIO_ERROR,
    EMPTY_SERVICIOS_MESSAGE,
    EDIT_BUTTON_TEXT,
    EDIT_FORM_TITLE,
    FORM_TITLE,
    INVALID_DURACION_ERROR,
    INVALID_PRECIO_ERROR,
    JEFE_ROLE,
    NO_ACCESS_MESSAGE,
    PRECIO_LABEL,
    SAVE_BUTTON_TEXT,
    SAVE_CHANGES_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SAVING_CHANGES_BUTTON_TEXT,
    SCREEN_TITLE,
    serviciosByNegocioRoute,
    SUCCESS_MESSAGE,
    UPDATE_SUCCESS_MESSAGE,
    updateServicioByIdRoute,
} from "./constants";
import { ServiciosProps } from "./types";

const formatPrice = (precio: number) => `${precio.toFixed(2)} EUR`;
const formatDuration = (duracion: number) => `${duracion} min`;
const PRICE_REGEX = /^\d+(?:[.,]\d{1,2})?$/;
const INTEGER_REGEX = /^\d+$/;

const Servicios: React.FC<ServiciosProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [listError, setListError] = useState("");
    const [listSuccess, setListSuccess] = useState("");
    const [modalError, setModalError] = useState("");
    const [deletingServicioId, setDeletingServicioId] = useState<number | null>(null);
    const [confirmDeleteServicioId, setConfirmDeleteServicioId] = useState<number | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingServicioId, setEditingServicioId] = useState<number | null>(null);
    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState("");
    const [duracion, setDuracion] = useState("");
    const [descripcion, setDescripcion] = useState("");

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageServicios = normalizedRole === JEFE_ROLE || normalizedRole === ADMIN_ROLE;

    const resetForm = () => {
        setNombre("");
        setPrecio("");
        setDuracion("");
        setDescripcion("");
        setEditingServicioId(null);
    };

    const fetchServicios = useCallback(async () => {
        if (!canManageServicios) {
            setServicios([]);
            setListError(NO_ACCESS_MESSAGE);
            return;
        }

        setLoading(true);
        setListError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(serviciosByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_FETCH_ERROR);
                setServicios([]);
                return;
            }

            const data = await response.json();
            setServicios(data.servicios || []);
        } catch (error) {
            setListError(CONNECTION_ERROR);
            setServicios([]);
        } finally {
            setLoading(false);
        }
    }, [canManageServicios, negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchServicios();
        }, [fetchServicios])
    );

    const validateForm = () => {
        if (!nombre.trim()) {
            setModalError(EMPTY_NOMBRE_ERROR);
            return false;
        }

        if (!precio.trim()) {
            setModalError(EMPTY_PRECIO_ERROR);
            return false;
        }

        const precioValue = precio.trim();

        if (!PRICE_REGEX.test(precioValue)) {
            setModalError(INVALID_PRECIO_ERROR);
            return false;
        }

        const parsedPrecio = Number.parseFloat(precioValue.replace(",", "."));

        if (!Number.isFinite(parsedPrecio) || parsedPrecio <= 0) {
            setModalError(INVALID_PRECIO_ERROR);
            return false;
        }

        if (!duracion.trim()) {
            setModalError(EMPTY_DURACION_ERROR);
            return false;
        }

        const duracionValue = duracion.trim();

        if (!INTEGER_REGEX.test(duracionValue)) {
            setModalError(INVALID_DURACION_ERROR);
            return false;
        }

        const parsedDuracion = Number.parseInt(duracionValue, 10);

        if (!Number.isInteger(parsedDuracion) || parsedDuracion <= 0) {
            setModalError(INVALID_DURACION_ERROR);
            return false;
        }

        if (!descripcion.trim()) {
            setModalError(EMPTY_DESCRIPCION_ERROR);
            return false;
        }

        return true;
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setModalError("");
        setModalVisible(true);
    };

    const handleOpenEditModal = (servicio: Servicio) => {
        setNombre(servicio.nombre || "");
        setPrecio(`${servicio.precio}`);
        setDuracion(`${servicio.duracion}`);
        setDescripcion(servicio.descripcion || "");
        setEditingServicioId(servicio.id_servicio);
        setModalError("");
        setModalVisible(true);
    };

    const handleToggleModal = () => {
        setModalVisible(!modalVisible);
        setModalError("");

        if (modalVisible) {
            resetForm();
        }
    };

    const handleSave = async () => {
        setModalError("");
        setListSuccess("");

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const isEditing = !!editingServicioId;
            const route = isEditing ? updateServicioByIdRoute(editingServicioId) : createServicioRoute;
            const method = isEditing ? "PUT" : "POST";
            const response = await fetch(route, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...(isEditing ? {} : { id_negocio: negocio.id_negocio }),
                    nombre: nombre.trim(),
                    precio: precio.trim(),
                    duracion: duracion.trim(),
                    descripcion: descripcion.trim(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setModalError(data.message || (isEditing ? DEFAULT_UPDATE_ERROR : DEFAULT_CREATE_ERROR));
                return;
            }

            setModalVisible(false);
            resetForm();
            setListSuccess(isEditing ? UPDATE_SUCCESS_MESSAGE : SUCCESS_MESSAGE);
            await fetchServicios();
        } catch (error) {
            setModalError(CONNECTION_ERROR);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteServicio = async (idServicio: number) => {
        setListError("");
        setListSuccess("");
        setDeletingServicioId(idServicio);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(deleteServicioByIdRoute(idServicio), {
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
            setConfirmDeleteServicioId(null);
            await fetchServicios();
        } catch (error) {
            setListError(CONNECTION_ERROR);
        } finally {
            setDeletingServicioId(null);
        }
    };

    const handleAskDeleteServicio = (idServicio: number) => {
        setListError("");
        setListSuccess("");
        setConfirmDeleteServicioId(idServicio);
    };

    const handleCancelDeleteServicio = () => {
        setConfirmDeleteServicioId(null);
    };

    const isEditing = !!editingServicioId;
    const modalTitle = isEditing ? EDIT_FORM_TITLE : FORM_TITLE;
    const saveButtonLabel = saving
        ? (isEditing ? SAVING_CHANGES_BUTTON_TEXT : SAVING_BUTTON_TEXT)
        : (isEditing ? SAVE_CHANGES_BUTTON_TEXT : SAVE_BUTTON_TEXT);

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
                {canManageServicios ? (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleOpenCreateModal}
                        testID="toggle-servicio-form-button"
                    >
                        <MaterialIcons name="add-business" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.addButtonText}>{ADD_SERVICE_BUTTON}</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="none"
                onRequestClose={handleToggleModal}
                testID="servicio-form-modal"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.formContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{modalTitle}</Text>
                            <TouchableOpacity onPress={handleToggleModal} testID="close-servicio-form-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Nombre"
                            value={nombre}
                            onChangeText={setNombre}
                            testID="servicio-nombre-input"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={PRECIO_LABEL}
                            value={precio}
                            onChangeText={setPrecio}
                            keyboardType="decimal-pad"
                            testID="servicio-precio-input"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={DURACION_LABEL}
                            value={duracion}
                            onChangeText={setDuracion}
                            keyboardType="number-pad"
                            testID="servicio-duracion-input"
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={DESCRIPCION_PLACEHOLDER}
                            value={descripcion}
                            onChangeText={setDescripcion}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            testID="servicio-descripcion-input"
                        />

                        {modalError ? (
                            <View style={styles.feedbackError} testID="servicio-error-message">
                                <Text style={styles.feedbackErrorText}>{modalError}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                            testID="servicio-save-button"
                        >
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                            <Text style={styles.saveButtonText}>{saveButtonLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {listError ? (
                <View style={styles.feedbackError} testID="servicios-list-error-message">
                    <Text style={styles.feedbackErrorText}>{listError}</Text>
                </View>
            ) : null}

            {listSuccess ? (
                <View style={styles.feedbackSuccess} testID="servicios-list-success-message">
                    <Text style={styles.feedbackSuccessText}>{listSuccess}</Text>
                </View>
            ) : null}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {servicios.length === 0 ? (
                        <Text style={styles.emptyText}>{EMPTY_SERVICIOS_MESSAGE}</Text>
                    ) : (
                        servicios.map((servicio) => (
                            <View key={servicio.id_servicio} style={styles.card} testID={`servicio-item-${servicio.id_servicio}`}>
                                <View style={styles.cardContent}>
                                    <View style={styles.serviceInfo}>
                                        <Text style={styles.serviceName}>{servicio.nombre}</Text>
                                        <View style={styles.metaRow}>
                                            <Text style={styles.serviceMeta}>{formatPrice(servicio.precio)}</Text>
                                            <Text style={styles.serviceMeta}>{formatDuration(servicio.duracion)}</Text>
                                        </View>
                                        <Text style={styles.serviceDescription}>{servicio.descripcion}</Text>
                                    </View>
                                    <View style={styles.actionsRow}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.editButton]}
                                            onPress={() => handleOpenEditModal(servicio)}
                                            testID={`servicio-edit-button-${servicio.id_servicio}`}
                                            accessibilityLabel={`${EDIT_BUTTON_TEXT} ${servicio.nombre}`}
                                        >
                                            <MaterialIcons name="edit" size={16} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.deleteButton]}
                                            onPress={() => handleAskDeleteServicio(servicio.id_servicio)}
                                            disabled={deletingServicioId === servicio.id_servicio}
                                            testID={`servicio-delete-button-${servicio.id_servicio}`}
                                        >
                                            {deletingServicioId === servicio.id_servicio ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <MaterialIcons name="delete" size={16} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {confirmDeleteServicioId === servicio.id_servicio ? (
                                    <View style={styles.confirmBox} testID={`servicio-delete-confirm-${servicio.id_servicio}`}>
                                        <Text style={styles.confirmTitle}>{CONFIRM_DELETE_TITLE}</Text>
                                        <Text style={styles.confirmMessage}>{CONFIRM_DELETE_MESSAGE}</Text>
                                        <View style={styles.confirmActions}>
                                            <TouchableOpacity
                                                style={styles.confirmCancelButton}
                                                onPress={handleCancelDeleteServicio}
                                                testID={`servicio-delete-cancel-${servicio.id_servicio}`}
                                            >
                                                <Text style={styles.confirmCancelText}>{CONFIRM_DELETE_CANCEL}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.confirmDeleteButton}
                                                onPress={() => handleDeleteServicio(servicio.id_servicio)}
                                                disabled={deletingServicioId === servicio.id_servicio}
                                                testID={`servicio-delete-confirm-button-${servicio.id_servicio}`}
                                            >
                                                <Text style={styles.confirmDeleteText}>
                                                    {deletingServicioId === servicio.id_servicio
                                                        ? DELETING_BUTTON_TEXT
                                                        : CONFIRM_DELETE_ACCEPT}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
};

export default Servicios;

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
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
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
    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 10,
        backgroundColor: "#f9fafb",
    },
    textArea: {
        minHeight: 96,
    },
    saveButton: {
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
    listContainer: {
        paddingHorizontal: 12,
        paddingBottom: 24,
    },
    emptyText: {
        textAlign: "center",
        color: "#6b7280",
        marginTop: 40,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    serviceInfo: {
        flex: 1,
        paddingRight: 10,
    },
    serviceName: {
        fontWeight: "700",
        color: "#0D47A1",
        fontSize: 16,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: "row",
        marginBottom: 8,
    },
    serviceMeta: {
        color: "#4b5563",
        fontSize: 13,
        marginRight: 12,
    },
    serviceDescription: {
        color: "#111827",
        lineHeight: 20,
    },
    actionsRow: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
    },
    actionButton: {
        height: 34,
        width: 34,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    editButton: {
        backgroundColor: "#2563eb",
        marginBottom: 8,
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
});