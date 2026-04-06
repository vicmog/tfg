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
import { Empleado } from "../types";
import {
    ADD_EMPLOYEE_BUTTON,
    ADMIN_ROLE,
    CONNECTION_ERROR,
    CONFIRM_DELETE_ACCEPT,
    CONFIRM_DELETE_CANCEL,
    CONFIRM_DELETE_MESSAGE,
    CONFIRM_DELETE_TITLE,
    CONTACT_REQUIRED_ERROR,
    createEmpleadoRoute,
    DEFAULT_DELETE_ERROR,
    DEFAULT_CREATE_ERROR,
    DEFAULT_FETCH_ERROR,
    DEFAULT_UPDATE_ERROR,
    deleteEmpleadoByIdRoute,
    DELETE_SUCCESS_MESSAGE,
    DELETING_BUTTON_TEXT,
    DETAIL_EMAIL_LABEL,
    DETAIL_EMPLOYEE_TITLE,
    DETAIL_NAME_LABEL,
    DETAIL_PHONE_LABEL,
    empleadoByIdRoute,
    EDIT_FORM_TITLE,
    empleadosByNegocioRoute,
    EMAIL_REGEX,
    EMPTY_APELLIDO1_ERROR,
    EMPTY_EMPLEADOS_MESSAGE,
    EMPTY_NOMBRE_ERROR,
    FORM_TITLE,
    INVALID_EMAIL_ERROR,
    JEFE_ROLE,
    NO_ACCESS_MESSAGE,
    NO_EMAIL_MESSAGE,
    NO_TELEFONO_MESSAGE,
    SAVE_CHANGES_BUTTON_TEXT,
    SAVE_BUTTON_TEXT,
    SEARCH_EMPLOYEE_NAME_OR_EMAIL,
    SAVING_CHANGES_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SCREEN_TITLE,
    searchEmpleadoByNameOrEmailRoute,
    SUCCESS_MESSAGE,
    updateEmpleadoByIdRoute,
    UPDATE_SUCCESS_MESSAGE,
} from "./constants";
import { EmpleadosProps } from "./types";

const Empleados: React.FC<EmpleadosProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [listError, setListError] = useState("");
    const [listSuccess, setListSuccess] = useState("");
    const [modalError, setModalError] = useState("");
    const [deletingEmpleadoId, setDeletingEmpleadoId] = useState<number | null>(null);
    const [confirmDeleteEmpleadoId, setConfirmDeleteEmpleadoId] = useState<number | null>(null);
    const [editingEmpleadoId, setEditingEmpleadoId] = useState<number | null>(null);
    const [searchText, setSearchText] = useState("");
    const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    const [nombre, setNombre] = useState("");
    const [apellido1, setApellido1] = useState("");
    const [apellido2, setApellido2] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [modalVisible, setModalVisible] = useState(false);

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageEmpleados = normalizedRole === JEFE_ROLE || normalizedRole === ADMIN_ROLE;

    const fetchEmpleados = useCallback(async () => {
        if (!canManageEmpleados) {
            setEmpleados([]);
            setListError(NO_ACCESS_MESSAGE);
            return;
        }

        setLoading(true);
        setListError("");
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(empleadosByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_FETCH_ERROR);
                setEmpleados([]);
                return;
            }

            const data = await response.json();
            setEmpleados(data.empleados || []);
        } catch (error) {
            setListError(CONNECTION_ERROR);
            setEmpleados([]);
        } finally {
            setLoading(false);
        }
    }, [canManageEmpleados, negocio.id_negocio]);

    const fetchSearchEmpleados = useCallback(async () => {
        if (!canManageEmpleados) {
            setEmpleados([]);
            setListError(NO_ACCESS_MESSAGE);
            return;
        }

        setLoading(true);
        setListError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(searchEmpleadoByNameOrEmailRoute(negocio.id_negocio, searchText), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_FETCH_ERROR);
                setEmpleados([]);
                return;
            }

            const data = await response.json();
            setEmpleados(data.empleados || []);
        } catch (error) {
            setListError(CONNECTION_ERROR);
            setEmpleados([]);
        } finally {
            setLoading(false);
        }
    }, [canManageEmpleados, negocio.id_negocio, searchText]);

    useFocusEffect(
        useCallback(() => {
            if (searchText.trim()) {
                fetchSearchEmpleados();
                return;
            }

            fetchEmpleados();
        }, [fetchEmpleados, fetchSearchEmpleados, searchText])
    );

    const resetForm = () => {
        setNombre("");
        setApellido1("");
        setApellido2("");
        setEmail("");
        setTelefono("");
        setEditingEmpleadoId(null);
    };

    const validateForm = () => {
        if (!nombre.trim()) {
            setModalError(EMPTY_NOMBRE_ERROR);
            return false;
        }

        if (!apellido1.trim()) {
            setModalError(EMPTY_APELLIDO1_ERROR);
            return false;
        }

        if (!email.trim() && !telefono.trim()) {
            setModalError(CONTACT_REQUIRED_ERROR);
            return false;
        }

        if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
            setModalError(INVALID_EMAIL_ERROR);
            return false;
        }

        return true;
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setModalError("");
        setModalVisible(true);
    };

    const handleOpenEditModal = (empleado: Empleado) => {
        setNombre(empleado.nombre || "");
        setApellido1(empleado.apellido1 || "");
        setApellido2(empleado.apellido2 || "");
        setEmail(empleado.email || "");
        setTelefono(empleado.numero_telefono || "");
        setEditingEmpleadoId(empleado.id_empleado);
        setModalError("");
        setModalVisible(true);
    };

    const handleOpenEmpleadoDetail = async (idEmpleado: number) => {
        setDetailVisible(true);
        setDetailLoading(true);
        setDetailError("");
        setSelectedEmpleado(null);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(empleadoByIdRoute(idEmpleado), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setDetailError(data.message || DEFAULT_FETCH_ERROR);
                return;
            }

            const data = await response.json();
            setSelectedEmpleado(data.empleado || null);
        } catch (error) {
            setDetailError(CONNECTION_ERROR);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseEmpleadoDetail = () => {
        setDetailVisible(false);
        setDetailLoading(false);
        setDetailError("");
        setSelectedEmpleado(null);
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
            const isEditing = !!editingEmpleadoId;
            const route = isEditing ? updateEmpleadoByIdRoute(editingEmpleadoId) : createEmpleadoRoute;
            const method = isEditing ? "PUT" : "POST";
            const response = await fetch(route, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_negocio: negocio.id_negocio,
                    nombre: nombre.trim(),
                    apellido1: apellido1.trim(),
                    apellido2: apellido2.trim(),
                    email: email.trim(),
                    numero_telefono: telefono.trim(),
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
            await fetchEmpleados();
        } catch (error) {
            setModalError(CONNECTION_ERROR);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEmpleado = async (idEmpleado: number) => {
        setListError("");
        setListSuccess("");
        setDeletingEmpleadoId(idEmpleado);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(deleteEmpleadoByIdRoute(idEmpleado), {
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
            setConfirmDeleteEmpleadoId(null);
            await fetchEmpleados();
        } catch (error) {
            setListError(CONNECTION_ERROR);
        } finally {
            setDeletingEmpleadoId(null);
        }
    };

    const handleAskDeleteEmpleado = (idEmpleado: number) => {
        setListError("");
        setListSuccess("");
        setConfirmDeleteEmpleadoId(idEmpleado);
    };

    const handleCancelDeleteEmpleado = () => {
        setConfirmDeleteEmpleadoId(null);
    };

    const isEditing = !!editingEmpleadoId;
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
                {canManageEmpleados ? (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleOpenCreateModal}
                        testID="toggle-empleado-form-button"
                    >
                        <MaterialIcons name="person-add" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.addButtonText}>{ADD_EMPLOYEE_BUTTON}</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {canManageEmpleados ? (
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                    <TextInput
                        placeholder={SEARCH_EMPLOYEE_NAME_OR_EMAIL}
                        placeholderTextColor="#000000"
                        value={searchText}
                        onChangeText={setSearchText}
                        style={styles.searchInput}
                        autoCapitalize="none"
                        testID="empleado-search-input"
                    />
                </View>
            ) : null}

            <Modal
                visible={modalVisible}
                transparent
                animationType={isEditing ? "slide" : "none"}
                onRequestClose={handleToggleModal}
                testID="empleado-form-modal"
            >
                <View style={[styles.modalBackdrop, isEditing && styles.modalBackdropBottom]}>
                    <View style={[styles.formContainer, isEditing && styles.modalCard]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isEditing && styles.modalTitleEdit]}>{modalTitle}</Text>
                            {!isEditing ? (
                                <TouchableOpacity onPress={handleToggleModal} testID="close-empleado-form-button">
                                    <MaterialIcons name="close" size={22} color="#6b7280" />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        <ScrollView style={isEditing ? styles.editScroll : undefined} contentContainerStyle={isEditing ? styles.editContent : undefined}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre"
                                value={nombre}
                                onChangeText={setNombre}
                                testID="empleado-nombre-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Primer apellido"
                                value={apellido1}
                                onChangeText={setApellido1}
                                testID="empleado-apellido1-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Segundo apellido (opcional)"
                                value={apellido2}
                                onChangeText={setApellido2}
                                testID="empleado-apellido2-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                testID="empleado-email-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Teléfono"
                                value={telefono}
                                onChangeText={setTelefono}
                                keyboardType="phone-pad"
                                testID="empleado-telefono-input"
                            />
                        </ScrollView>

                        {modalError ? (
                            <Text style={styles.modalErrorText} testID="empleado-error-message">{modalError}</Text>
                        ) : null}

                        {isEditing ? (
                            <View style={styles.modalActionRow}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleSave}
                                    disabled={saving}
                                    testID="empleado-save-button"
                                >
                                    <Text style={styles.primaryButtonText}>{saveButtonLabel}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={handleToggleModal}
                                    disabled={saving}
                                    testID="close-empleado-form-button"
                                >
                                    <Text style={styles.secondaryButtonText}>Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={saving}
                                testID="empleado-save-button"
                            >
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                                <Text style={styles.saveButtonText}>{saveButtonLabel}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={detailVisible}
                transparent
                animationType="none"
                onRequestClose={handleCloseEmpleadoDetail}
                testID="empleado-detail-modal"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.formContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{DETAIL_EMPLOYEE_TITLE}</Text>
                            <TouchableOpacity onPress={handleCloseEmpleadoDetail} testID="empleado-detail-close-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {detailLoading ? (
                            <View style={styles.detailLoadingContainer}>
                                <ActivityIndicator size="large" color="#1976D2" />
                            </View>
                        ) : null}

                        {!detailLoading && detailError ? (
                            <View style={styles.feedbackError} testID="empleado-detail-error-message">
                                <Text style={styles.feedbackErrorText}>{detailError}</Text>
                            </View>
                        ) : null}

                        {!detailLoading && !detailError && selectedEmpleado ? (
                            <>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_NAME_LABEL}</Text>
                                    <Text style={styles.detailValue}>
                                        {selectedEmpleado.nombre} {selectedEmpleado.apellido1} {selectedEmpleado.apellido2 || ""}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_EMAIL_LABEL}</Text>
                                    <Text style={styles.detailValue}>{selectedEmpleado.email || NO_EMAIL_MESSAGE}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_PHONE_LABEL}</Text>
                                    <Text style={styles.detailValue}>{selectedEmpleado.numero_telefono || NO_TELEFONO_MESSAGE}</Text>
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {listError ? (
                <View style={styles.feedbackError} testID="empleados-list-error-message">
                    <Text style={styles.feedbackErrorText}>{listError}</Text>
                </View>
            ) : null}

            {listSuccess ? (
                <View style={styles.feedbackSuccess} testID="empleados-list-success-message">
                    <Text style={styles.feedbackSuccessText}>{listSuccess}</Text>
                </View>
            ) : null}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {empleados.length === 0 ? (
                        <Text style={styles.emptyText}>{EMPTY_EMPLEADOS_MESSAGE}</Text>
                    ) : (
                        empleados.map((empleado) => (
                            <View key={empleado.id_empleado} style={styles.card} testID={`empleado-item-${empleado.id_empleado}`}>
                                <View style={styles.cardContent}>
                                    <TouchableOpacity
                                        style={styles.clientInfo}
                                        onPress={() => void handleOpenEmpleadoDetail(empleado.id_empleado)}
                                        testID={`empleado-open-detail-${empleado.id_empleado}`}
                                    >
                                        <Text style={styles.clientName}>
                                            {empleado.nombre} {empleado.apellido1} {empleado.apellido2 || ""}
                                        </Text>
                                        <Text style={styles.clientMeta}>{empleado.email || NO_EMAIL_MESSAGE}</Text>
                                        <Text style={styles.clientMeta}>{empleado.numero_telefono || NO_TELEFONO_MESSAGE}</Text>
                                    </TouchableOpacity>
                                    <View style={styles.actionsRow}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.editButton]}
                                            onPress={() => handleOpenEditModal(empleado)}
                                            testID={`empleado-edit-button-${empleado.id_empleado}`}
                                        >
                                            <MaterialIcons name="edit" size={16} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.deleteButton]}
                                            onPress={() => handleAskDeleteEmpleado(empleado.id_empleado)}
                                            disabled={deletingEmpleadoId === empleado.id_empleado}
                                            testID={`empleado-delete-button-${empleado.id_empleado}`}
                                        >
                                            {deletingEmpleadoId === empleado.id_empleado ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <MaterialIcons name="delete" size={16} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {confirmDeleteEmpleadoId === empleado.id_empleado ? (
                                    <View style={styles.confirmBox} testID={`empleado-delete-confirm-${empleado.id_empleado}`}>
                                        <Text style={styles.confirmTitle}>{CONFIRM_DELETE_TITLE}</Text>
                                        <Text style={styles.confirmMessage}>{CONFIRM_DELETE_MESSAGE}</Text>
                                        <View style={styles.confirmActions}>
                                            <TouchableOpacity
                                                style={styles.confirmCancelButton}
                                                onPress={handleCancelDeleteEmpleado}
                                                testID={`empleado-delete-cancel-${empleado.id_empleado}`}
                                            >
                                                <Text style={styles.confirmCancelText}>{CONFIRM_DELETE_CANCEL}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.confirmDeleteButton}
                                                onPress={() => handleDeleteEmpleado(empleado.id_empleado)}
                                                disabled={deletingEmpleadoId === empleado.id_empleado}
                                                testID={`empleado-delete-confirm-button-${empleado.id_empleado}`}
                                            >
                                                <Text style={styles.confirmDeleteText}>
                                                    {deletingEmpleadoId === empleado.id_empleado
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

export default Empleados;

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
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: "#111827",
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
    modalBackdropBottom: {
        justifyContent: "flex-end",
        alignItems: "stretch",
        paddingHorizontal: 0,
    },
    modalCard: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        width: "100%",
        maxWidth: undefined,
        marginHorizontal: 0,
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        padding: 16,
        maxHeight: "78%",
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
    modalTitleEdit: {
        color: "#111827",
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
    editScroll: {
        maxHeight: 420,
    },
    editContent: {
        gap: 10,
    },
    modalErrorText: {
        color: "#b91c1c",
        fontWeight: "600",
        marginBottom: 8,
    },
    modalActionRow: {
        marginTop: 10,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
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
        alignItems: "center",
        justifyContent: "space-between",
    },
    clientInfo: {
        flex: 1,
        paddingRight: 10,
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
        backgroundColor: "#1976D2",
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
    clientName: {
        fontWeight: "700",
        color: "#0D47A1",
        fontSize: 16,
        marginBottom: 6,
    },
    clientMeta: {
        color: "#4b5563",
        fontSize: 13,
    },
    detailLoadingContainer: {
        paddingVertical: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    detailRow: {
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6b7280",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    detailValue: {
        fontSize: 15,
        color: "#111827",
    },
});
