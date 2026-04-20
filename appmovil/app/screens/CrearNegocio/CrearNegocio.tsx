import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
    CIF_REGEX,
    CONNECTION_ERROR,
    CREATE_NEGOCIO_ROUTE,
    CREATE_SUCCESS_MESSAGE,
    DEFAULT_CREATE_ERROR,
    EMPTY_CIF_ERROR,
    EMPTY_NOMBRE_ERROR,
    GET_PLANTILLAS_ROUTE,
    INVALID_CIF_ERROR,
    NO_TOKEN_ERROR,
    TEMPLATE_LIST_ERROR,
    TEMPLATE_LOADING,
    TEMPLATE_OPTION_NONE,
    TEMPLATE_PLACEHOLDER,
} from "./constants";
import { CrearNegocioProps } from "./types";
import { Plantilla } from "../types";

const CrearNegocio: React.FC<CrearNegocioProps> = ({ navigation }) => {
    const [nombre, setNombre] = useState("");
    const [cif, setCif] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [loadingPlantillas, setLoadingPlantillas] = useState(false);
    const [plantillasError, setPlantillasError] = useState("");
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [selectedPlantillaId, setSelectedPlantillaId] = useState<number | null>(null);

    const selectedPlantilla = plantillas.find((plantilla) => plantilla.id_plantilla === selectedPlantillaId) || null;

    useFocusEffect(
        useCallback(() => {
            const fetchPlantillas = async () => {
                setLoadingPlantillas(true);
                setPlantillasError("");

                try {
                    const token = await AsyncStorage.getItem("token");

                    if (!token) {
                        setPlantillasError(NO_TOKEN_ERROR);
                        return;
                    }

                    const response = await fetch(GET_PLANTILLAS_ROUTE, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    const data = await response.json();

                    if (response.ok) {
                        setPlantillas(data.plantillas || []);
                    } else {
                        setPlantillasError(data.message || TEMPLATE_LIST_ERROR);
                    }
                } catch {
                    setPlantillasError(TEMPLATE_LIST_ERROR);
                } finally {
                    setLoadingPlantillas(false);
                }
            };

            fetchPlantillas();
        }, [])
    );

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
                    id_plantilla: selectedPlantillaId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(CREATE_SUCCESS_MESSAGE);
                setNombre("");
                setCif("");
                setSelectedPlantillaId(null);

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
                        <TouchableOpacity
                            style={styles.selectorButton}
                            onPress={() => setSelectorVisible(true)}
                            testID="plantilla-selector-button"
                        >
                            <View style={styles.selectorContent}>
                                <Text style={[styles.selectorText, !selectedPlantilla && styles.selectorPlaceholder]}>
                                    {selectedPlantilla ? selectedPlantilla.nombre : TEMPLATE_PLACEHOLDER}
                                </Text>
                                {selectedPlantilla ? (
                                    <Text style={styles.selectorHintText}>Se copiaran servicios y recursos</Text>
                                ) : null}
                            </View>
                            <MaterialIcons name="keyboard-arrow-down" size={24} color="#6b7280" />
                        </TouchableOpacity>

                        {loadingPlantillas ? (
                            <View style={styles.templateFeedbackRow}>
                                <ActivityIndicator size="small" color="#1976D2" />
                                <Text style={styles.templateLoadingText}>{TEMPLATE_LOADING}</Text>
                            </View>
                        ) : null}

                        {plantillasError ? (
                            <Text style={styles.templateErrorText}>{plantillasError}</Text>
                        ) : null}
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

            <Modal
                visible={selectorVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectorVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Selecciona una plantilla</Text>

                        <ScrollView style={styles.modalList}>
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => {
                                    setSelectedPlantillaId(null);
                                    setSelectorVisible(false);
                                }}
                                testID="plantilla-option-none"
                            >
                                <Text style={styles.modalItemTitle}>{TEMPLATE_OPTION_NONE}</Text>
                                {selectedPlantillaId === null ? (
                                    <MaterialIcons name="check-circle" size={18} color="#16a34a" />
                                ) : null}
                            </TouchableOpacity>

                            {plantillas.map((plantilla) => (
                                <TouchableOpacity
                                    key={plantilla.id_plantilla}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedPlantillaId(plantilla.id_plantilla);
                                        setSelectorVisible(false);
                                    }}
                                    testID={`plantilla-option-${plantilla.id_plantilla}`}
                                >
                                    <View style={styles.modalItemMain}>
                                        <Text style={styles.modalItemTitle}>{plantilla.nombre}</Text>
                                        <Text style={styles.modalItemMeta}>
                                            {plantilla.servicios.length} servicios · {plantilla.recursos.length} recursos
                                        </Text>
                                    </View>
                                    {selectedPlantillaId === plantilla.id_plantilla ? (
                                        <MaterialIcons name="check-circle" size={18} color="#16a34a" />
                                    ) : null}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setSelectorVisible(false)}
                            testID="plantilla-selector-close"
                        >
                            <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    selectorButton: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    selectorContent: {
        flex: 1,
        marginRight: 8,
    },
    selectorText: {
        fontSize: 15,
        color: "#111827",
        fontWeight: "600",
    },
    selectorPlaceholder: {
        color: "#6b7280",
        fontWeight: "500",
    },
    selectorHintText: {
        marginTop: 4,
        fontSize: 12,
        color: "#475569",
    },
    templateFeedbackRow: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    templateLoadingText: {
        marginLeft: 8,
        color: "#475569",
        fontSize: 12,
    },
    templateErrorText: {
        marginTop: 8,
        color: "#dc2626",
        fontSize: 12,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        maxHeight: "70%",
        padding: 16,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 10,
    },
    modalList: {
        maxHeight: 320,
    },
    modalItem: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    modalItemMain: {
        flex: 1,
        marginRight: 8,
    },
    modalItemTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1f2937",
    },
    modalItemMeta: {
        marginTop: 3,
        fontSize: 12,
        color: "#64748b",
    },
    modalCloseButton: {
        marginTop: 8,
        backgroundColor: "#e2e8f0",
        borderRadius: 8,
        alignItems: "center",
        paddingVertical: 10,
    },
    modalCloseButtonText: {
        color: "#0f172a",
        fontWeight: "700",
        fontSize: 13,
    },
});
