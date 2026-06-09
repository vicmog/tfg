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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Proveedor } from "../types";
import {
    ADD_SUPPLIER_BUTTON,
    ADMIN_ROLE,
    CONNECTION_ERROR,
    CONTACT_METHOD_REQUIRED_ERROR,
    createProveedorRoute,
    DEFAULT_DELETE_ERROR,
    DEFAULT_CREATE_ERROR,
    DEFAULT_FETCH_ERROR,
    DEFAULT_UPDATE_ERROR,
    EDIT_BUTTON_TEXT,
    EDIT_FORM_TITLE,
    DELETE_BUTTON_TEXT,
    DELETE_CONFIRM_MESSAGE,
    DELETE_CONFIRM_TITLE,
    DELETE_SUCCESS_MESSAGE,
    DETAIL_ADDRESS_LABEL,
    DETAIL_CIF_LABEL,
    DETAIL_CONTACT_LABEL,
    DETAIL_EMAIL_LABEL,
    DETAIL_NAME_LABEL,
    DETAIL_PHONE_LABEL,
    DETAIL_SUPPLIER_TITLE,
    DETAIL_TYPE_LABEL,
    EMPTY_CIF_ERROR,
    EMPTY_CONTACTO_ERROR,
    EMPTY_NOMBRE_ERROR,
    EMPTY_SUPPLIERS_MESSAGE,
    EMPTY_TIPO_ERROR,
    EMAIL_REGEX,
    FORM_TITLE,
    INVALID_EMAIL_ERROR,
    JEFE_ROLE,
    NO_ADDRESS_MESSAGE,
    NO_EMAIL_MESSAGE,
    NO_PHONE_MESSAGE,
    SAVE_CHANGES_BUTTON_TEXT,
    SAVE_BUTTON_TEXT,
    SAVING_CHANGES_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SCREEN_TITLE,
    SEARCH_SUPPLIER,
    SUCCESS_MESSAGE,
    UPDATE_SUCCESS_MESSAGE,
    updateProveedorRoute,
    deleteProveedorRoute,
    proveedoresByNegocioRoute,
} from "./constants";
import { ProveedoresProps } from "./types";

const Proveedores: React.FC<ProveedoresProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingProveedorId, setDeletingProveedorId] = useState<number | null>(null);
    const [confirmDeleteProveedorId, setConfirmDeleteProveedorId] = useState<number | null>(null);
    const [listError, setListError] = useState("");
    const [listSuccess, setListSuccess] = useState("");
    const [modalError, setModalError] = useState("");

    const [searchText, setSearchText] = useState("");

    const [modalVisible, setModalVisible] = useState(false);
    const [editingProveedorId, setEditingProveedorId] = useState<number | null>(null);
    const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);

    const [nombre, setNombre] = useState("");
    const [cifNif, setCifNif] = useState("");
    const [contacto, setContacto] = useState("");
    const [telefono, setTelefono] = useState("");
    const [email, setEmail] = useState("");
    const [tipoProveedor, setTipoProveedor] = useState("");
    const [direccion, setDireccion] = useState("");

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageProveedores = normalizedRole === JEFE_ROLE || normalizedRole === ADMIN_ROLE;

    const filteredProveedores = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        if (!query) {
            return proveedores;
        }

        return proveedores.filter((proveedor) =>
            proveedor.nombre.toLowerCase().includes(query)
            || proveedor.cif_nif.toLowerCase().includes(query)
            || proveedor.contacto.toLowerCase().includes(query)
            || proveedor.tipo_proveedor.toLowerCase().includes(query)
        );
    }, [proveedores, searchText]);

    const resetForm = () => {
        setNombre("");
        setCifNif("");
        setContacto("");
        setTelefono("");
        setEmail("");
        setTipoProveedor("");
        setDireccion("");
    };

    const fetchProveedores = useCallback(async () => {
        setLoading(true);
        setListError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(proveedoresByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_FETCH_ERROR);
                setProveedores([]);
                return;
            }

            const data = await response.json();
            setProveedores(data.proveedores || []);
        } catch (error) {
            setListError(CONNECTION_ERROR);
            setProveedores([]);
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchProveedores();
        }, [fetchProveedores])
    );

    const validateForm = () => {
        if (!nombre.trim()) {
            setModalError(EMPTY_NOMBRE_ERROR);
            return false;
        }

        if (!cifNif.trim()) {
            setModalError(EMPTY_CIF_ERROR);
            return false;
        }

        if (!contacto.trim()) {
            setModalError(EMPTY_CONTACTO_ERROR);
            return false;
        }

        if (!tipoProveedor.trim()) {
            setModalError(EMPTY_TIPO_ERROR);
            return false;
        }

        if (!telefono.trim() && !email.trim()) {
            setModalError(CONTACT_METHOD_REQUIRED_ERROR);
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
        setEditingProveedorId(null);
        setModalError("");
        setModalVisible(true);
    };

    const handleOpenEditModal = (proveedor: Proveedor) => {
        setEditingProveedorId(proveedor.id_proveedor);
        setNombre(proveedor.nombre);
        setCifNif(proveedor.cif_nif);
        setContacto(proveedor.contacto);
        setTelefono(proveedor.telefono || "");
        setEmail(proveedor.email || "");
        setTipoProveedor(proveedor.tipo_proveedor);
        setDireccion(proveedor.direccion || "");
        setModalError("");
        setModalVisible(true);
    };

    const handleToggleModal = () => {
        setModalVisible(!modalVisible);
        setModalError("");

        if (modalVisible) {
            resetForm();
            setEditingProveedorId(null);
        }
    };

    const handleOpenProveedorDetail = (proveedor: Proveedor) => {
        setSelectedProveedor(proveedor);
    };

    const handleCloseProveedorDetail = () => {
        setSelectedProveedor(null);
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
            const isEditing = !!editingProveedorId;
            const response = await fetch(
                isEditing ? updateProveedorRoute(editingProveedorId) : createProveedorRoute,
                {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...(isEditing ? {} : { id_negocio: negocio.id_negocio }),
                    nombre: nombre.trim(),
                    cif_nif: cifNif.trim(),
                    contacto: contacto.trim(),
                    telefono: telefono.trim(),
                    email: email.trim(),
                    tipo_proveedor: tipoProveedor.trim(),
                    direccion: direccion.trim(),
                }),
            }
            );

            if (!response.ok) {
                const data = await response.json();
                setModalError(data.message || (isEditing ? DEFAULT_UPDATE_ERROR : DEFAULT_CREATE_ERROR));
                return;
            }

            setModalVisible(false);
            resetForm();
            setEditingProveedorId(null);
            setListSuccess(isEditing ? UPDATE_SUCCESS_MESSAGE : SUCCESS_MESSAGE);
            await fetchProveedores();
        } catch (error) {
            setModalError(CONNECTION_ERROR);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProveedor = async (idProveedor: number) => {
        setListError("");
        setListSuccess("");
        setDeletingProveedorId(idProveedor);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(deleteProveedorRoute(idProveedor), {
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

            if (selectedProveedor?.id_proveedor === idProveedor) {
                setSelectedProveedor(null);
            }

            setListSuccess(DELETE_SUCCESS_MESSAGE);
            setConfirmDeleteProveedorId(null);
            await fetchProveedores();
        } catch (error) {
            setListError(CONNECTION_ERROR);
        } finally {
            setDeletingProveedorId(null);
        }
    };

    const handleAskDeleteProveedor = (idProveedor: number) => {
        setListError("");
        setListSuccess("");
        setConfirmDeleteProveedorId(idProveedor);
    };

    const handleCancelDeleteProveedor = () => {
        setConfirmDeleteProveedorId(null);
    };

    const isEditing = !!editingProveedorId;
    const modalTitle = isEditing ? EDIT_FORM_TITLE : FORM_TITLE;
    const saveButtonLabel = saving
        ? (isEditing ? SAVING_CHANGES_BUTTON_TEXT : SAVING_BUTTON_TEXT)
        : (isEditing ? SAVE_CHANGES_BUTTON_TEXT : SAVE_BUTTON_TEXT);

    const roleLabel = normalizedRole === ADMIN_ROLE ? "Administrador" : normalizedRole === JEFE_ROLE ? "Jefe" : "Trabajador";

    return (
        <View style={styles.container}>
            <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <TouchableOpacity style={styles.heroBackButton} onPress={() => navigation.goBack()} testID="back-button">
                        <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    {canManageProveedores ? (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleOpenCreateModal}
                            testID="toggle-proveedor-form-button"
                        >
                            <MaterialIcons name="local-shipping" size={18} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.addButtonText}>{ADD_SUPPLIER_BUTTON}</Text>
                        </TouchableOpacity>
                    ) : <View style={{ width: 1 }} />}
                </View>

                <View style={styles.heroBody}>
                    <Text style={styles.title}>{SCREEN_TITLE}</Text>
                    <Text style={styles.subtitle}>{roleLabel} · {proveedores.length} proveedores registrados</Text>
                </View>

                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                    <TextInput
                        placeholder={SEARCH_SUPPLIER}
                        placeholderTextColor="#94a3b8"
                        value={searchText}
                        onChangeText={setSearchText}
                        style={styles.searchInput}
                        autoCapitalize="none"
                        testID="proveedor-search-input"
                    />
                </View>
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType={isEditing ? "slide" : "none"}
                onRequestClose={handleToggleModal}
                testID="proveedor-form-modal"
            >
                <View style={[styles.modalBackdrop, isEditing && styles.modalBackdropBottom]}>
                    <View style={[styles.formContainer, isEditing && styles.modalCard]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isEditing && styles.modalTitleEdit]}>{modalTitle}</Text>
                            {!isEditing ? (
                                <TouchableOpacity onPress={handleToggleModal} testID="close-proveedor-form-button">
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
                                testID="proveedor-nombre-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="CIF/NIF"
                                value={cifNif}
                                onChangeText={setCifNif}
                                autoCapitalize="characters"
                                testID="proveedor-cif-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Persona de contacto"
                                value={contacto}
                                onChangeText={setContacto}
                                testID="proveedor-contacto-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Teléfono"
                                value={telefono}
                                onChangeText={setTelefono}
                                keyboardType="phone-pad"
                                testID="proveedor-telefono-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                testID="proveedor-email-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Tipo de proveedor"
                                value={tipoProveedor}
                                onChangeText={setTipoProveedor}
                                testID="proveedor-tipo-input"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Dirección (opcional)"
                                value={direccion}
                                onChangeText={setDireccion}
                                testID="proveedor-direccion-input"
                            />
                        </ScrollView>

                        {modalError ? (
                            <Text style={styles.modalErrorText} testID="proveedor-error-message">{modalError}</Text>
                        ) : null}

                        {isEditing ? (
                            <View style={styles.modalActionRow}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleSave}
                                    disabled={saving}
                                    testID="proveedor-save-button"
                                >
                                    <Text style={styles.primaryButtonText}>{saveButtonLabel}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={handleToggleModal}
                                    disabled={saving}
                                    testID="close-proveedor-form-button"
                                >
                                    <Text style={styles.secondaryButtonText}>Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={saving}
                                testID="proveedor-save-button"
                            >
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                                <Text style={styles.saveButtonText}>{saveButtonLabel}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={!!selectedProveedor}
                transparent
                animationType="none"
                onRequestClose={handleCloseProveedorDetail}
                testID="proveedor-detail-modal"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.formContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{DETAIL_SUPPLIER_TITLE}</Text>
                            <TouchableOpacity onPress={handleCloseProveedorDetail} testID="proveedor-detail-close-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{DETAIL_NAME_LABEL}</Text>
                            <Text style={styles.detailValue}>{selectedProveedor?.nombre}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{DETAIL_CIF_LABEL}</Text>
                            <Text style={styles.detailValue}>{selectedProveedor?.cif_nif}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{DETAIL_CONTACT_LABEL}</Text>
                            <Text style={styles.detailValue}>{selectedProveedor?.contacto}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{DETAIL_PHONE_LABEL}</Text>
                            <Text style={styles.detailValue}>{selectedProveedor?.telefono || NO_PHONE_MESSAGE}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{DETAIL_EMAIL_LABEL}</Text>
                            <Text style={styles.detailValue}>{selectedProveedor?.email || NO_EMAIL_MESSAGE}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{DETAIL_TYPE_LABEL}</Text>
                            <Text style={styles.detailValue}>{selectedProveedor?.tipo_proveedor}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{DETAIL_ADDRESS_LABEL}</Text>
                            <Text style={styles.detailValue}>{selectedProveedor?.direccion || NO_ADDRESS_MESSAGE}</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {listError ? (
                <View style={styles.feedbackError} testID="proveedores-list-error-message">
                    <Text style={styles.feedbackErrorText}>{listError}</Text>
                </View>
            ) : null}

            {listSuccess ? (
                <View style={styles.feedbackSuccess} testID="proveedores-list-success-message">
                    <Text style={styles.feedbackSuccessText}>{listSuccess}</Text>
                </View>
            ) : null}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {filteredProveedores.length === 0 ? (
                        <Text style={styles.emptyText}>{EMPTY_SUPPLIERS_MESSAGE}</Text>
                    ) : (
                        filteredProveedores.map((proveedor) => (
                            <View key={proveedor.id_proveedor} style={styles.card} testID={`proveedor-item-${proveedor.id_proveedor}`}>
                                <View style={styles.cardContent}>
                                    <TouchableOpacity
                                        style={styles.supplierInfo}
                                        onPress={() => handleOpenProveedorDetail(proveedor)}
                                        testID={`proveedor-open-detail-${proveedor.id_proveedor}`}
                                    >
                                        <Text style={styles.supplierName}>{proveedor.nombre}</Text>
                                        <Text style={styles.supplierMeta}>{proveedor.cif_nif}</Text>
                                        <Text style={styles.supplierMeta}>{proveedor.contacto}</Text>
                                        <Text style={styles.supplierMeta}>{proveedor.tipo_proveedor}</Text>
                                        <Text style={styles.supplierMeta}>{proveedor.email || NO_EMAIL_MESSAGE}</Text>
                                        <Text style={styles.supplierMeta}>{proveedor.telefono || NO_PHONE_MESSAGE}</Text>
                                    </TouchableOpacity>
                                    {canManageProveedores ? (
                                        <View style={styles.actionsRow}>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.editButton]}
                                                onPress={() => handleOpenEditModal(proveedor)}
                                                testID={`proveedor-edit-button-${proveedor.id_proveedor}`}
                                            >
                                                <MaterialIcons name="edit" size={16} color="#fff" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.deleteButton]}
                                                onPress={() => handleAskDeleteProveedor(proveedor.id_proveedor)}
                                                disabled={deletingProveedorId === proveedor.id_proveedor}
                                                testID={`proveedor-delete-button-${proveedor.id_proveedor}`}
                                            >
                                                {deletingProveedorId === proveedor.id_proveedor ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <MaterialIcons name="delete" size={16} color="#fff" />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}
                                </View>

                                {confirmDeleteProveedorId === proveedor.id_proveedor ? (
                                    <View style={styles.confirmBox} testID={`proveedor-delete-confirm-${proveedor.id_proveedor}`}>
                                        <Text style={styles.confirmTitle}>{DELETE_CONFIRM_TITLE}</Text>
                                        <Text style={styles.confirmMessage}>{DELETE_CONFIRM_MESSAGE}</Text>
                                        <View style={styles.confirmActions}>
                                            <TouchableOpacity
                                                style={styles.confirmCancelButton}
                                                onPress={handleCancelDeleteProveedor}
                                                testID={`proveedor-delete-cancel-${proveedor.id_proveedor}`}
                                            >
                                                <Text style={styles.confirmCancelText}>Cancelar</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.confirmDeleteButton}
                                                onPress={() => handleDeleteProveedor(proveedor.id_proveedor)}
                                                disabled={deletingProveedorId === proveedor.id_proveedor}
                                                testID={`proveedor-delete-confirm-button-${proveedor.id_proveedor}`}
                                            >
                                                <Text style={styles.confirmDeleteText}>{DELETE_BUTTON_TEXT}</Text>
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

export default Proveedores;

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
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#0f172a",
        letterSpacing: -0.3,
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
    supplierInfo: {
        flex: 1,
        paddingRight: 10,
    },
    supplierName: {
        fontWeight: "800",
        color: "#0f172a",
        fontSize: 16,
        marginBottom: 6,
    },
    supplierMeta: {
        color: "#4b5563",
        fontSize: 13,
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
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    deleteButton: {
        backgroundColor: "#dc2626",
    },
    editButton: {
        backgroundColor: "#2563eb",
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
