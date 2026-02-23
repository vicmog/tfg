import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Cliente } from "../types";
import {
    ADD_CLIENT_BUTTON,
    CONNECTION_ERROR,
    CONTACT_REQUIRED_ERROR,
    createClienteRoute,
    clientesByNegocioRoute,
    DEFAULT_CREATE_ERROR,
    DEFAULT_FETCH_ERROR,
    EMAIL_REGEX,
    EMPTY_APELLIDO1_ERROR,
    EMPTY_NOMBRE_ERROR,
    INVALID_EMAIL_ERROR,
    SAVE_BUTTON_TEXT,
    SAVING_BUTTON_TEXT,
    SCREEN_TITLE,
    SUCCESS_MESSAGE,
    EMPTY_CLIENTS_MESSAGE,
    NO_EMAIL_MESSAGE,
    NO_TELEFONO_MESSAGE,
} from "./constants";
import { ClientesProps } from "./types";

const Clientes: React.FC<ClientesProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [nombre, setNombre] = useState("");
    const [apellido1, setApellido1] = useState("");
    const [apellido2, setApellido2] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [showForm, setShowForm] = useState(false);

    const fetchClientes = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(clientesByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_FETCH_ERROR);
                setClientes([]);
                return;
            }

            const data = await response.json();
            setClientes(data.clientes || []);
        } catch (err) {
            setError(CONNECTION_ERROR);
            setClientes([]);
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchClientes();
        }, [fetchClientes])
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
            setError(EMPTY_NOMBRE_ERROR);
            return false;
        }

        if (!apellido1.trim()) {
            setError(EMPTY_APELLIDO1_ERROR);
            return false;
        }

        if (!email.trim() && !telefono.trim()) {
            setError(CONTACT_REQUIRED_ERROR);
            return false;
        }

        if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
            setError(INVALID_EMAIL_ERROR);
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(createClienteRoute, {
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
                setError(data.message || DEFAULT_CREATE_ERROR);
                return;
            }

            setSuccess(SUCCESS_MESSAGE);
            resetForm();
            setShowForm(false);
            await fetchClientes();
        } catch (err) {
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
                    testID="back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.title}>{SCREEN_TITLE}</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setShowForm(!showForm);
                        setError("");
                        setSuccess("");
                    }}
                    testID="toggle-client-form-button"
                >
                    <MaterialIcons name="person-add" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.addButtonText}>{ADD_CLIENT_BUTTON}</Text>
                </TouchableOpacity>
            </View>

            {showForm ? (
                <View style={styles.formContainer}>
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
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                        testID="cliente-save-button"
                    >
                        {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                        <Text style={styles.saveButtonText}>{saving ? SAVING_BUTTON_TEXT : SAVE_BUTTON_TEXT}</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {error ? (
                <View style={styles.feedbackError} testID="cliente-error-message">
                    <Text style={styles.feedbackErrorText}>{error}</Text>
                </View>
            ) : null}

            {success ? (
                <View style={styles.feedbackSuccess} testID="cliente-success-message">
                    <Text style={styles.feedbackSuccessText}>{success}</Text>
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
                                <Text style={styles.clientName}>
                                    {cliente.nombre} {cliente.apellido1} {cliente.apellido2 || ""}
                                </Text>
                                <Text style={styles.clientMeta}>{cliente.email || NO_EMAIL_MESSAGE}</Text>
                                <Text style={styles.clientMeta}>{cliente.numero_telefono || NO_TELEFONO_MESSAGE}</Text>
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
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
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
