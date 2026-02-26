import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Cliente } from "../types";
import {
    ADD_CLIENT_BUTTON,
    CONNECTION_ERROR,
    CONFIRM_DELETE_ACCEPT,
    CONFIRM_DELETE_CANCEL,
    CONFIRM_DELETE_MESSAGE,
    CONFIRM_DELETE_TITLE,
    CONTACT_REQUIRED_ERROR,
    createClienteRoute,
    clientesByNegocioRoute,
    deleteClienteByIdRoute,
    DELETE_BUTTON_TEXT,
    DELETING_BUTTON_TEXT,
    DELETE_SUCCESS_MESSAGE,
    DETAIL_CLIENT_TITLE,
    DETAIL_CLOSE_BUTTON,
    DETAIL_EMAIL_LABEL,
    DETAIL_NAME_LABEL,
    DETAIL_PHONE_LABEL,
    DEFAULT_DELETE_ERROR,
    DEFAULT_CREATE_ERROR,
    DEFAULT_UPDATE_ERROR,
    DEFAULT_FETCH_ERROR,
    EMAIL_REGEX,
    EDIT_BUTTON_TEXT,
    EDIT_CLIENT_PLACEHOLDER,
    EMPTY_APELLIDO1_ERROR,
    EMPTY_NOMBRE_ERROR,
    INVALID_EMAIL_ERROR,
    SAVE_BUTTON_TEXT,
    SAVE_CHANGES_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SAVING_CHANGES_BUTTON_TEXT,
    SCREEN_TITLE,
    SUCCESS_MESSAGE,
    UPDATE_SUCCESS_MESSAGE,
    updateClienteByIdRoute,
    EMPTY_CLIENTS_MESSAGE,
    NO_EMAIL_MESSAGE,
    NO_TELEFONO_MESSAGE,
    NEW_CLIENT_PLACEHOLDER,
    SEARCH_PHONE_NAME,
    searchClientByNameOrPhoneRoute,
} from "./constants";
import { ClientesProps } from "./types";

const Clientes: React.FC<ClientesProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [listError, setListError] = useState("");
    const [listSuccess, setListSuccess] = useState("");
    const [modalError, setModalError] = useState("");
    const [modalSuccess, setModalSuccess] = useState("");

    const [nombre, setNombre] = useState("");
    const [apellido1, setApellido1] = useState("");
    const [apellido2, setApellido2] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [editingClienteId, setEditingClienteId] = useState<number | null>(null);
    const [deletingClienteId, setDeletingClienteId] = useState<number | null>(null);
    const [confirmDeleteClienteId, setConfirmDeleteClienteId] = useState<number | null>(null);

    const [searchText, setSearchText] = useState<string>("");
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

    const fetchClientes = useCallback(async () => {
        setLoading(true);
        setListError("");
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(clientesByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_FETCH_ERROR);
                setClientes([]);
                return;
            }

            const data = await response.json();
            setClientes(data.clientes || []);
        } catch (err) {
            setListError(CONNECTION_ERROR);
            setClientes([]);
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio]);

    const fetchSearchClientes = useCallback(async () => {
        setLoading(true);
        setListError("");
        try {
            const token = await AsyncStorage.getItem("token");
            const searchRoute = searchClientByNameOrPhoneRoute(negocio.id_negocio, searchText);
            const response = await fetch(searchRoute, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_FETCH_ERROR);
                setClientes([]);
                return;
            }

            const data = await response.json();
            setClientes(data.clientes || []);
        }catch (err) {
            setListError(CONNECTION_ERROR);
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio, searchText]);
        


    useFocusEffect(
        useCallback(() => {
            if(searchText==="") {
                fetchClientes();
            }else{
                fetchSearchClientes();
            }
        }, [fetchClientes, fetchSearchClientes, searchText])
    );

    const resetForm = () => {
        setNombre("");
        setApellido1("");
        setApellido2("");
        setEmail("");
        setTelefono("");
        setEditingClienteId(null);
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

    const handleSave = async () => {
        setModalError("");
        setModalSuccess("");

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const isEditing = !!editingClienteId;
            const route = isEditing ? updateClienteByIdRoute(editingClienteId) : createClienteRoute;
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

            setModalSuccess(isEditing ? UPDATE_SUCCESS_MESSAGE : SUCCESS_MESSAGE);
            resetForm();
            setModalVisible(false);
            await fetchClientes();
        } catch (err) {
            setModalError(CONNECTION_ERROR);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleModal = () => {
        setModalVisible(!modalVisible);
        setModalError("");
        setModalSuccess("");
        if (modalVisible) {
            resetForm();
        }
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setModalError("");
        setModalSuccess("");
        setModalVisible(true);
    };

    const handleOpenEditModal = (cliente: Cliente) => {
        setNombre(cliente.nombre || "");
        setApellido1(cliente.apellido1 || "");
        setApellido2(cliente.apellido2 || "");
        setEmail(cliente.email || "");
        setTelefono(cliente.numero_telefono || "");
        setEditingClienteId(cliente.id_cliente);
        setModalError("");
        setModalSuccess("");
        setModalVisible(true);
    };

    const handleDeleteCliente = async (idCliente: number) => {
        setListError("");
        setListSuccess("");
        setDeletingClienteId(idCliente);
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(deleteClienteByIdRoute(idCliente), {
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

            setListError("");
            setListSuccess(DELETE_SUCCESS_MESSAGE);
            setModalSuccess("");
            setConfirmDeleteClienteId(null);
            await fetchClientes();
        } catch (error) {
            setListError(CONNECTION_ERROR);
        } finally {
            setDeletingClienteId(null);
        }
    };


    const handleAskDeleteCliente = (idCliente: number) => {
        setListError("");
        setListSuccess("");
        setConfirmDeleteClienteId(idCliente);
    };

    const handleCancelDeleteCliente = () => {
        setConfirmDeleteClienteId(null);
    };

    const handleOpenClienteDetail = (cliente: Cliente) => {
        setSelectedCliente(cliente);
    };

    const handleCloseClienteDetail = () => {
        setSelectedCliente(null);
    };

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
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleOpenCreateModal}
                    testID="toggle-client-form-button"
                >
                    <MaterialIcons name="person-add" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.addButtonText}>{ADD_CLIENT_BUTTON}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                    placeholder={SEARCH_PHONE_NAME}
                    placeholderTextColor="#000000"
                    value={searchText || ""}
                    onChangeText={setSearchText}
                    style={styles.searchInput}
                    autoCapitalize="none"
                    testID="business-search-input"
                />
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="none"
                onRequestClose={handleToggleModal}
                testID="cliente-form-modal"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.formContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingClienteId ? EDIT_CLIENT_PLACEHOLDER : NEW_CLIENT_PLACEHOLDER}</Text>
                            <TouchableOpacity onPress={handleToggleModal} testID="close-client-form-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Nombre"
                            value={nombre}
                            onChangeText={setNombre}
                            testID="cliente-nombre-input"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Primer apellido"
                            value={apellido1}
                            onChangeText={setApellido1}
                            testID="cliente-apellido1-input"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Segundo apellido (opcional)"
                            value={apellido2}
                            onChangeText={setApellido2}
                            testID="cliente-apellido2-input"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            testID="cliente-email-input"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Teléfono"
                            value={telefono}
                            onChangeText={setTelefono}
                            keyboardType="phone-pad"
                            testID="cliente-telefono-input"
                        />

                        {modalError ? (
                            <View style={styles.feedbackError} testID="cliente-error-message">
                                <Text style={styles.feedbackErrorText}>{modalError}</Text>
                            </View>
                        ) : null}

                        {modalSuccess ? (
                            <View style={styles.feedbackSuccess} testID="cliente-success-message">
                                <Text style={styles.feedbackSuccessText}>{modalSuccess}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                            testID="cliente-save-button"
                        >
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                            <Text style={styles.saveButtonText}>
                                {saving
                                    ? (editingClienteId ? SAVING_CHANGES_BUTTON_TEXT : SAVING_BUTTON_TEXT)
                                    : (editingClienteId ? SAVE_CHANGES_BUTTON_TEXT : SAVE_BUTTON_TEXT)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={!!selectedCliente}
                transparent
                animationType="none"
                onRequestClose={handleCloseClienteDetail}
                testID="cliente-detail-modal"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.formContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{DETAIL_CLIENT_TITLE}</Text>
                            <TouchableOpacity onPress={handleCloseClienteDetail} testID="cliente-detail-close-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{DETAIL_NAME_LABEL}</Text>
                            <Text style={styles.detailValue}>
                                {selectedCliente?.nombre} {selectedCliente?.apellido1} {selectedCliente?.apellido2 || ""}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{DETAIL_EMAIL_LABEL}</Text>
                            <Text style={styles.detailValue}>{selectedCliente?.email || NO_EMAIL_MESSAGE}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{DETAIL_PHONE_LABEL}</Text>
                            <Text style={styles.detailValue}>{selectedCliente?.numero_telefono || NO_TELEFONO_MESSAGE}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.closeDetailButton}
                            onPress={handleCloseClienteDetail}
                            testID="cliente-detail-close-action"
                        >
                            <Text style={styles.closeDetailButtonText}>{DETAIL_CLOSE_BUTTON}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {listError ? (
                <View style={styles.feedbackError} testID="clientes-list-error-message">
                    <Text style={styles.feedbackErrorText}>{listError}</Text>
                </View>
            ) : null}

            {listSuccess ? (
                <View style={styles.feedbackSuccess} testID="clientes-list-success-message">
                    <Text style={styles.feedbackSuccessText}>{listSuccess}</Text>
                </View>
            ) : null}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {clientes.length === 0 ? (
                        <Text style={styles.emptyText}>{EMPTY_CLIENTS_MESSAGE}</Text>
                    ) : (
                        clientes.map((cliente) => (
                            <View key={cliente.id_cliente} style={styles.card} testID={`cliente-item-${cliente.id_cliente}`}>
                                <View style={styles.cardContent}>
                                    <TouchableOpacity
                                        style={styles.clientInfo}
                                        onPress={() => handleOpenClienteDetail(cliente)}
                                        testID={`cliente-open-detail-${cliente.id_cliente}`}
                                    >
                                        <Text style={styles.clientName}>
                                            {cliente.nombre} {cliente.apellido1} {cliente.apellido2 || ""}
                                        </Text>
                                        <Text style={styles.clientMeta}>{cliente.email || NO_EMAIL_MESSAGE}</Text>
                                        <Text style={styles.clientMeta}>{cliente.numero_telefono || NO_TELEFONO_MESSAGE}</Text>
                                    </TouchableOpacity>
                                    <View style={styles.actionsRow}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.editButton]}
                                            onPress={() => handleOpenEditModal(cliente)}
                                            testID={`cliente-edit-button-${cliente.id_cliente}`}
                                        >
                                            <MaterialIcons name="edit" size={16} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.deleteButton]}
                                            onPress={() => handleAskDeleteCliente(cliente.id_cliente)}
                                            disabled={deletingClienteId === cliente.id_cliente}
                                            testID={`cliente-delete-button-${cliente.id_cliente}`}
                                        >
                                            {deletingClienteId === cliente.id_cliente ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <MaterialIcons name="delete" size={16} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {confirmDeleteClienteId === cliente.id_cliente ? (
                                    <View style={styles.confirmBox} testID={`cliente-delete-confirm-${cliente.id_cliente}`}>
                                        <Text style={styles.confirmTitle}>{CONFIRM_DELETE_TITLE}</Text>
                                        <Text style={styles.confirmMessage}>{CONFIRM_DELETE_MESSAGE}</Text>
                                        <View style={styles.confirmActions}>
                                            <TouchableOpacity
                                                style={styles.confirmCancelButton}
                                                onPress={handleCancelDeleteCliente}
                                                testID={`cliente-delete-cancel-${cliente.id_cliente}`}
                                            >
                                                <Text style={styles.confirmCancelText}>{CONFIRM_DELETE_CANCEL}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.confirmDeleteButton}
                                                onPress={() => handleDeleteCliente(cliente.id_cliente)}
                                                disabled={deletingClienteId === cliente.id_cliente}
                                                testID={`cliente-delete-confirm-button-${cliente.id_cliente}`}
                                            >
                                                <Text style={styles.confirmDeleteText}>{CONFIRM_DELETE_ACCEPT}</Text>
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

export default Clientes;

const styles = StyleSheet.create({
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
    actionButton: {
        height: 34,
        width: 34,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    deleteButton: {
        backgroundColor: "#dc2626",
    },
    deleteButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 12,
    },
    actionsRow: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
    },
    editButton: {
        backgroundColor: "#1976D2",
        marginBottom: 8,
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
        color: "#991b1b",
        fontWeight: "700",
        marginBottom: 4,
    },
    confirmMessage: {
        color: "#7f1d1d",
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
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: "#01050e",
        paddingVertical: 6,
    },
    detailRow: {
        marginBottom: 12,
    },
    detailLabel: {
        color: "#6b7280",
        fontSize: 13,
        marginBottom: 4,
    },
    detailValue: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "600",
    },
    closeDetailButton: {
        marginTop: 8,
        backgroundColor: "#1976D2",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    closeDetailButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
});
