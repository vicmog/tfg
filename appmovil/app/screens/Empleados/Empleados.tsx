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
    CONTACT_REQUIRED_ERROR,
    createEmpleadoRoute,
    DEFAULT_CREATE_ERROR,
    DEFAULT_FETCH_ERROR,
    empleadosByNegocioRoute,
    EMAIL_REGEX,
    EMPTY_APELLIDO1_ERROR,
    EMPTY_EMPLEADOS_MESSAGE,
    EMPTY_NOMBRE_ERROR,
    FORM_TITLE,
    INVALID_EMAIL_ERROR,
    JEFE_ROLE,
    NO_ACCESS_MESSAGE,
    SAVE_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SCREEN_TITLE,
    SUCCESS_MESSAGE,
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

    useFocusEffect(
        useCallback(() => {
            fetchEmpleados();
        }, [fetchEmpleados])
    );

    const resetForm = () => {
        setNombre("");
        setApellido1("");
        setApellido2("");
        setEmail("");
        setTelefono("");
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
            const response = await fetch(createEmpleadoRoute, {
                method: "POST",
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
                setModalError(data.message || DEFAULT_CREATE_ERROR);
                return;
            }

            setModalVisible(false);
            resetForm();
            setListSuccess(SUCCESS_MESSAGE);
            await fetchEmpleados();
        } catch (error) {
            setModalError(CONNECTION_ERROR);
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

            <Modal
                visible={modalVisible}
                transparent
                animationType="none"
                onRequestClose={handleToggleModal}
                testID="empleado-form-modal"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.formContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{FORM_TITLE}</Text>
                            <TouchableOpacity onPress={handleToggleModal} testID="close-empleado-form-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

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

                        {modalError ? (
                            <View style={styles.feedbackError} testID="empleado-error-message">
                                <Text style={styles.feedbackErrorText}>{modalError}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                            testID="empleado-save-button"
                        >
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                            <Text style={styles.saveButtonText}>{saving ? SAVING_BUTTON_TEXT : SAVE_BUTTON_TEXT}</Text>
                        </TouchableOpacity>
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
                                    <View style={styles.clientInfo}>
                                        <Text style={styles.clientName}>
                                            {empleado.nombre} {empleado.apellido1} {empleado.apellido2 || ""}
                                        </Text>
                                        <Text style={styles.clientMeta}>{empleado.email || "Sin email"}</Text>
                                        <Text style={styles.clientMeta}>{empleado.numero_telefono || "Sin teléfono"}</Text>
                                    </View>
                                </View>
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
});
