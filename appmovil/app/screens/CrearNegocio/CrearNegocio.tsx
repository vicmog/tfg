import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    CIF_REGEX,
    CONNECTION_ERROR,
    CREATE_NEGOCIO_ROUTE,
    CREATE_SUCCESS_MESSAGE,
    DEFAULT_CREATE_ERROR,
    EMPTY_CIF_ERROR,
    EMPTY_NOMBRE_ERROR,
    INVALID_CIF_ERROR,
    NO_TOKEN_ERROR,
} from "./constants";
import { CrearNegocioProps } from "./types";

const CrearNegocio: React.FC<CrearNegocioProps> = ({ navigation }) => {
    const [nombre, setNombre] = useState("");
    const [cif, setCif] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const validateForm = (): boolean => {
        setErrorMessage("");

        if (!nombre.trim()) {
            setErrorMessage(EMPTY_NOMBRE_ERROR);
            return false;
        }

        if (!cif.trim()) {
            setErrorMessage(EMPTY_CIF_ERROR);
            return false;
        }

        if (!CIF_REGEX.test(cif.trim())) {
            setErrorMessage(INVALID_CIF_ERROR);
            return false;
        }

        return true;
    };

    const handleCrearNegocio = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const token = await AsyncStorage.getItem("token");

            if (!token) {
                setErrorMessage(NO_TOKEN_ERROR);
                setLoading(false);
                return;
            }

            const response = await fetch(CREATE_NEGOCIO_ROUTE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    CIF: cif.trim().toUpperCase(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(CREATE_SUCCESS_MESSAGE);
                setNombre("");
                setCif("");

                setTimeout(() => {
                    navigation.goBack();
                }, 1500);
            } else {
                setErrorMessage(data.message || DEFAULT_CREATE_ERROR);
            }
        } catch (error) {
            console.error("Error al crear negocio:", error);
            setErrorMessage(CONNECTION_ERROR);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        testID="back-button"
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Crear Nuevo Negocio</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nombre del negocio</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Mi Cafetería"
                            value={nombre}
                            onChangeText={setNombre}
                            testID="nombre-input"
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CIF</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: B12345678"
                            value={cif}
                            onChangeText={setCif}
                            testID="cif-input"
                            autoCapitalize="characters"
                            maxLength={9}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Plantilla</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Disponible próximamente"
                            value={""}
                            onChangeText={() => { }}
                            testID="plantilla-input"
                            autoCapitalize="characters"
                            editable={false}
                        />
                    </View>

                    {errorMessage ? (
                        <View style={styles.errorContainer} testID="error-message">
                            <MaterialIcons name="error-outline" size={20} color="#dc2626" />
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}

                    {successMessage ? (
                        <View style={styles.successContainer} testID="success-message">
                            <MaterialIcons name="check-circle" size={20} color="#16a34a" />
                            <Text style={styles.successText}>{successMessage}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleCrearNegocio}
                        disabled={loading}
                        testID="submit-button"
                    >
                        <MaterialIcons name="add-business" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.submitButtonText}>
                            {loading ? "Creando..." : "Crear Negocio"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default CrearNegocio;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 30,
    },
    backButton: {
        padding: 8,
        marginRight: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#0D47A1",
    },
    formContainer: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: "#111827",
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef2f2",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: "#dc2626",
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    successContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0fdf4",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    successText: {
        color: "#16a34a",
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    submitButton: {
        backgroundColor: "#1976D2",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 10,
        marginTop: 10,
    },
    submitButtonDisabled: {
        backgroundColor: "#93c5fd",
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
