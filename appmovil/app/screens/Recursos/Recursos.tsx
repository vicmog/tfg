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
import { Recurso } from "../types";
import {
    ADD_RESOURCE_BUTTON,
    ADMIN_ROLE,
    CAPACIDAD_PLACEHOLDER,
    CONFIRM_DELETE_ACCEPT,
    CONFIRM_DELETE_CANCEL,
    CONFIRM_DELETE_MESSAGE,
    CONFIRM_DELETE_TITLE,
    CONNECTION_ERROR,
    createRecursoRoute,
    DEFAULT_CREATE_ERROR,
    DEFAULT_DELETE_ERROR,
    DEFAULT_FETCH_ERROR,
    DEFAULT_UPDATE_ERROR,
    DELETE_SUCCESS_MESSAGE,
    deleteRecursoByIdRoute,
    DELETING_BUTTON_TEXT,
    DETAIL_CAPACITY_LABEL,
    DETAIL_NAME_LABEL,
    DETAIL_RESOURCE_TITLE,
    EDIT_BUTTON_TEXT,
    EDIT_FORM_TITLE,
    EMPTY_CAPACIDAD_ERROR,
    EMPTY_NOMBRE_ERROR,
    EMPTY_RECURSOS_MESSAGE,
    FORM_TITLE,
    INVALID_CAPACIDAD_ERROR,
    JEFE_ROLE,
    NAME_PLACEHOLDER,
    recursoByIdRoute,
    recursosByNegocioRoute,
    RESERVA_INFO,
    SAVE_BUTTON_TEXT,
    SAVE_CHANGES_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SAVING_CHANGES_BUTTON_TEXT,
    SCREEN_TITLE,
    SUCCESS_MESSAGE,
    UPDATE_SUCCESS_MESSAGE,
    updateRecursoByIdRoute,
} from "./constants";
import { RecursosProps } from "./types";

const INTEGER_REGEX = /^\d+$/;
const formatCapacity = (capacidad: number) => `${capacidad} personas`;

const Recursos: React.FC<RecursosProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [filteredRecursos, setFilteredRecursos] = useState<Recurso[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [listError, setListError] = useState("");
    const [listSuccess, setListSuccess] = useState("");
    const [modalError, setModalError] = useState("");
    const [deletingRecursoId, setDeletingRecursoId] = useState<number | null>(null);
    const [confirmDeleteRecursoId, setConfirmDeleteRecursoId] = useState<number | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRecursoId, setEditingRecursoId] = useState<number | null>(null);
    const [selectedRecurso, setSelectedRecurso] = useState<Recurso | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [nombre, setNombre] = useState("");
    const [capacidad, setCapacidad] = useState("");

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageRecursos = normalizedRole === JEFE_ROLE || normalizedRole === ADMIN_ROLE;

    const resetForm = () => {
        setNombre("");
        setCapacidad("");
        setEditingRecursoId(null);
    };

    const filterRecursos = (recursosToFilter: Recurso[], query: string) => {
        if (!query.trim()) {
            return recursosToFilter;
        }

        const lowerQuery = query.toLowerCase();
        return recursosToFilter.filter((recurso) => recurso.nombre.toLowerCase().includes(lowerQuery));
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        const filtered = filterRecursos(recursos, text);
        setFilteredRecursos(filtered);
    };

    const fetchRecursos = useCallback(async () => {
        setLoading(true);
        setListError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(recursosByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_FETCH_ERROR);
                setRecursos([]);
                setFilteredRecursos([]);
                return;
            }

            const data = await response.json();
            const allRecursos = data.recursos || [];
            setRecursos(allRecursos);
            setFilteredRecursos(allRecursos);
        } catch (error) {
            setListError(CONNECTION_ERROR);
            setRecursos([]);
            setFilteredRecursos([]);
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchRecursos();
        }, [fetchRecursos])
    );

    const validateForm = () => {
        if (!nombre.trim()) {
            setModalError(EMPTY_NOMBRE_ERROR);
            return false;
        }

        if (!capacidad.trim()) {
            setModalError(EMPTY_CAPACIDAD_ERROR);
            return false;
        }

        const capacidadValue = capacidad.trim();

        if (!INTEGER_REGEX.test(capacidadValue)) {
            setModalError(INVALID_CAPACIDAD_ERROR);
            return false;
        }

        const parsedCapacidad = Number.parseInt(capacidadValue, 10);

        if (!Number.isInteger(parsedCapacidad) || parsedCapacidad <= 0) {
            setModalError(INVALID_CAPACIDAD_ERROR);
            return false;
        }

        return true;
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setModalError("");
        setModalVisible(true);
    };

    const handleOpenEditModal = (recurso: Recurso) => {
        setNombre(recurso.nombre || "");
        setCapacidad(`${recurso.capacidad}`);
        setEditingRecursoId(recurso.id_recurso);
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
            const isEditing = !!editingRecursoId;
            const route = isEditing ? updateRecursoByIdRoute(editingRecursoId) : createRecursoRoute;
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
                    capacidad: capacidad.trim(),
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
            setSearchQuery("");
            await fetchRecursos();
        } catch (error) {
            setModalError(CONNECTION_ERROR);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRecurso = async (idRecurso: number) => {
        setListError("");
        setListSuccess("");
        setDeletingRecursoId(idRecurso);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(deleteRecursoByIdRoute(idRecurso), {
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
            setConfirmDeleteRecursoId(null);
            await fetchRecursos();
        } catch (error) {
            setListError(CONNECTION_ERROR);
        } finally {
            setDeletingRecursoId(null);
        }
    };

    const handleAskDeleteRecurso = (idRecurso: number) => {
        setListError("");
        setListSuccess("");
        setConfirmDeleteRecursoId(idRecurso);
    };

    const handleCancelDeleteRecurso = () => {
        setConfirmDeleteRecursoId(null);
    };

    const handleOpenRecursoDetail = async (idRecurso: number) => {
        setDetailVisible(true);
        setDetailLoading(true);
        setDetailError("");
        setSelectedRecurso(null);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(recursoByIdRoute(idRecurso), {
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
            setSelectedRecurso(data.recurso || null);
        } catch (error) {
            setDetailError(CONNECTION_ERROR);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseRecursoDetail = () => {
        setDetailVisible(false);
        setDetailLoading(false);
        setDetailError("");
        setSelectedRecurso(null);
    };

    const isEditing = !!editingRecursoId;
    const modalTitle = isEditing ? EDIT_FORM_TITLE : FORM_TITLE;
    const saveButtonLabel = saving
        ? (isEditing ? SAVING_CHANGES_BUTTON_TEXT : SAVING_BUTTON_TEXT)
        : (isEditing ? SAVE_CHANGES_BUTTON_TEXT : SAVE_BUTTON_TEXT);

    return (
        <View style={styles.container}>
            <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <TouchableOpacity style={styles.heroBackButton} onPress={() => navigation.goBack()} testID="back-button">
                        <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    {canManageRecursos ? (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleOpenCreateModal}
                            testID="toggle-recurso-form-button"
                        >
                            <MaterialIcons name="add-business" size={18} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.addButtonText}>{ADD_RESOURCE_BUTTON}</Text>
                        </TouchableOpacity>
                    ) : <View style={{ width: 1 }} />}
                </View>

                <View style={styles.heroBody}>
                    <Text style={styles.title}>{SCREEN_TITLE}</Text>
                    <Text style={styles.subtitle}>{normalizedRole === ADMIN_ROLE ? "Administrador" : normalizedRole === JEFE_ROLE ? "Jefe" : "Trabajador"} · {recursos.length} recursos</Text>
                </View>

                {canManageRecursos ? (
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por nombre..."
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            testID="recurso-search-input"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                ) : null}
            </View>

            <Modal
                visible={detailVisible}
                transparent
                animationType="none"
                onRequestClose={handleCloseRecursoDetail}
                testID="recurso-detail-modal"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.formContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{DETAIL_RESOURCE_TITLE}</Text>
                            <TouchableOpacity onPress={handleCloseRecursoDetail} testID="recurso-detail-close-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {detailLoading ? (
                            <View style={styles.detailLoadingContainer}>
                                <ActivityIndicator size="large" color="#1976D2" />
                            </View>
                        ) : null}

                        {!detailLoading && detailError ? (
                            <View style={styles.feedbackError} testID="recurso-detail-error-message">
                                <Text style={styles.feedbackErrorText}>{detailError}</Text>
                            </View>
                        ) : null}

                        {!detailLoading && !detailError && selectedRecurso ? (
                            <>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{DETAIL_NAME_LABEL}</Text>
                                    <Text style={styles.detailValue}>{selectedRecurso.nombre}</Text>
                                </View>

                                <View style={styles.detailRowWithIcon}>
                                    <View style={styles.detailLabelWithIcon}>
                                        <MaterialIcons name="groups" size={16} color="#1976D2" />
                                        <Text style={[styles.detailLabel, styles.detailLabelIconText]}>{DETAIL_CAPACITY_LABEL}</Text>
                                    </View>
                                    <Text style={styles.detailValue}>{formatCapacity(selectedRecurso.capacidad)}</Text>
                                </View>

                                <View style={styles.infoPill}>
                                    <MaterialIcons name="event" size={14} color="#0f766e" />
                                    <Text style={styles.infoPillText}>{RESERVA_INFO}</Text>
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={modalVisible}
                transparent
                animationType={isEditing ? "slide" : "none"}
                onRequestClose={handleToggleModal}
                testID="recurso-form-modal"
            >
                <View style={[styles.modalBackdrop, isEditing && styles.modalBackdropBottom]}>
                    <View style={[styles.formContainer, isEditing && styles.modalCard]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isEditing && styles.modalTitleEdit]}>{modalTitle}</Text>
                            {!isEditing ? (
                                <TouchableOpacity onPress={handleToggleModal} testID="close-recurso-form-button">
                                    <MaterialIcons name="close" size={22} color="#6b7280" />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        <ScrollView style={isEditing ? styles.editScroll : undefined} contentContainerStyle={isEditing ? styles.editContent : undefined}>
                            <TextInput
                                style={styles.input}
                                placeholder={NAME_PLACEHOLDER}
                                value={nombre}
                                onChangeText={setNombre}
                                testID="recurso-nombre-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={CAPACIDAD_PLACEHOLDER}
                                value={capacidad}
                                onChangeText={setCapacidad}
                                keyboardType="number-pad"
                                testID="recurso-capacidad-input"
                            />
                        </ScrollView>

                        {modalError ? (
                            <Text style={styles.modalErrorText} testID="recurso-error-message">{modalError}</Text>
                        ) : null}

                        {isEditing ? (
                            <View style={styles.modalActionRow}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleSave}
                                    disabled={saving}
                                    testID="recurso-save-button"
                                >
                                    <Text style={styles.primaryButtonText}>{saveButtonLabel}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={handleToggleModal}
                                    disabled={saving}
                                    testID="close-recurso-form-button"
                                >
                                    <Text style={styles.secondaryButtonText}>Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={saving}
                                testID="recurso-save-button"
                            >
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                                <Text style={styles.saveButtonText}>{saveButtonLabel}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            {listError ? (
                <View style={styles.feedbackError} testID="recursos-list-error-message">
                    <Text style={styles.feedbackErrorText}>{listError}</Text>
                </View>
            ) : null}

            {listSuccess ? (
                <View style={styles.feedbackSuccess} testID="recursos-list-success-message">
                    <Text style={styles.feedbackSuccessText}>{listSuccess}</Text>
                </View>
            ) : null}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {filteredRecursos.length === 0 ? (
                        <Text style={styles.emptyText}>{EMPTY_RECURSOS_MESSAGE}</Text>
                    ) : (
                        filteredRecursos.map((recurso) => (
                            <View key={recurso.id_recurso} style={styles.card} testID={`recurso-item-${recurso.id_recurso}`}>
                                <View style={styles.cardContent}>
                                    <TouchableOpacity
                                        style={styles.resourceInfo}
                                        onPress={() => void handleOpenRecursoDetail(recurso.id_recurso)}
                                        testID={`recurso-open-detail-${recurso.id_recurso}`}
                                        accessibilityLabel={`Ver detalles de ${recurso.nombre}`}
                                    >
                                        <Text style={styles.resourceName}>{recurso.nombre}</Text>
                                        <Text style={styles.resourceMeta}>{formatCapacity(recurso.capacidad)}</Text>
                                        <Text style={styles.resourceDescription}>{RESERVA_INFO}</Text>
                                    </TouchableOpacity>
                                    {canManageRecursos ? (
                                        <View style={styles.actionsRow}>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.editButton]}
                                                onPress={() => handleOpenEditModal(recurso)}
                                                testID={`recurso-edit-button-${recurso.id_recurso}`}
                                                accessibilityLabel={`${EDIT_BUTTON_TEXT} ${recurso.nombre}`}
                                            >
                                                <MaterialIcons name="edit" size={16} color="#fff" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.deleteButton]}
                                                onPress={() => handleAskDeleteRecurso(recurso.id_recurso)}
                                                disabled={deletingRecursoId === recurso.id_recurso}
                                                testID={`recurso-delete-button-${recurso.id_recurso}`}
                                            >
                                                {deletingRecursoId === recurso.id_recurso ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <MaterialIcons name="delete" size={16} color="#fff" />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}
                                </View>

                                {canManageRecursos && confirmDeleteRecursoId === recurso.id_recurso ? (
                                    <View style={styles.confirmBox} testID={`recurso-delete-confirm-${recurso.id_recurso}`}>
                                        <Text style={styles.confirmTitle}>{CONFIRM_DELETE_TITLE}</Text>
                                        <Text style={styles.confirmMessage}>{CONFIRM_DELETE_MESSAGE}</Text>
                                        <View style={styles.confirmActions}>
                                            <TouchableOpacity
                                                style={styles.confirmCancelButton}
                                                onPress={handleCancelDeleteRecurso}
                                                testID={`recurso-delete-cancel-${recurso.id_recurso}`}
                                            >
                                                <Text style={styles.confirmCancelText}>{CONFIRM_DELETE_CANCEL}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.confirmDeleteButton}
                                                onPress={() => handleDeleteRecurso(recurso.id_recurso)}
                                                disabled={deletingRecursoId === recurso.id_recurso}
                                                testID={`recurso-delete-confirm-button-${recurso.id_recurso}`}
                                            >
                                                <Text style={styles.confirmDeleteText}>
                                                    {deletingRecursoId === recurso.id_recurso
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

export default Recursos;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
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
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.42)",
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
    modalTitleEdit: {
        color: "#0f172a",
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
    editScroll: {
        maxHeight: 420,
    },
    editContent: {
        gap: 10,
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
    primaryButton: {
        backgroundColor: "#1d4ed8",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    secondaryButton: {
        backgroundColor: "#f3f4f6",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    secondaryButtonText: {
        color: "#374151",
        fontWeight: "600",
    },
    saveButton: {
        backgroundColor: "#1d4ed8",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },
    saveButtonDisabled: {
        backgroundColor: "#93c5fd",
        opacity: 0.7,
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    feedbackError: {
        marginHorizontal: 12,
        backgroundColor: "#fef2f2",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#fecaca",
        padding: 12,
        marginBottom: 12,
    },
    feedbackErrorText: {
        color: "#dc2626",
        fontWeight: "500",
        fontSize: 14,
    },
    feedbackSuccess: {
        marginHorizontal: 12,
        backgroundColor: "#f0fdf4",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#bbf7d0",
        padding: 12,
        marginBottom: 12,
    },
    feedbackSuccessText: {
        color: "#16a34a",
        fontWeight: "500",
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    emptyText: {
        textAlign: "center",
        color: "#6b7280",
        marginTop: 40,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    resourceInfo: {
        flex: 1,
        paddingRight: 10,
    },
    resourceName: {
        fontWeight: "800",
        color: "#0f172a",
        fontSize: 16,
        marginBottom: 6,
    },
    resourceMeta: {
        color: "#475569",
        fontSize: 13,
        marginBottom: 8,
    },
    resourceDescription: {
        color: "#0f766e",
        fontSize: 12,
        fontWeight: "600",
    },
    detailLoadingContainer: {
        paddingVertical: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    detailRow: {
        marginBottom: 12,
    },
    detailRowWithIcon: {
        marginBottom: 12,
    },
    detailLabel: {
        color: "#64748b",
        fontSize: 13,
        marginBottom: 4,
    },
    detailLabelWithIcon: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    detailLabelIconText: {
        marginLeft: 6,
        marginBottom: 0,
    },
    detailValue: {
        color: "#0f172a",
        fontSize: 15,
        fontWeight: "600",
    },
    infoPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        backgroundColor: "#ccfbf1",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 4,
    },
    infoPillText: {
        color: "#0f766e",
        fontWeight: "700",
        fontSize: 12,
    },
    actionsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    actionButton: {
        height: 36,
        width: 36,
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    editButton: {
        backgroundColor: "#2563eb",
    },
    deleteButton: {
        backgroundColor: "#dc2626",
    },
    confirmBox: {
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        marginTop: 10,
        paddingTop: 10,
    },
    confirmTitle: {
        color: "#111827",
        fontWeight: "700",
        marginBottom: 4,
    },
    confirmMessage: {
        color: "#4b5563",
        marginBottom: 10,
    },
    confirmActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
    },
    confirmCancelButton: {
        backgroundColor: "#e5e7eb",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    confirmCancelText: {
        color: "#111827",
        fontWeight: "700",
    },
    confirmDeleteButton: {
        backgroundColor: "#dc2626",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    confirmDeleteText: {
        color: "#fff",
        fontWeight: "700",
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
        color: "#0f172a",
        fontSize: 15,
        paddingVertical: 6,
    },
});
