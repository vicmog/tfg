import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type NegocioSettingsProps = NativeStackScreenProps<
    NavigationScreenList,
    "NegocioSettings"
>;

const NegocioSettings: React.FC<NegocioSettingsProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [nombre, setNombre] = useState(negocio.nombre);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSave = async () => {
        if (!nombre.trim()) {
            setError("El nombre no puede estar vacío");
            return;
        }

        setError("");
        setIsSaving(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(
                `http://localhost:3000/v1/api/negocios/${negocio.id_negocio}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ nombre: nombre.trim() }),
                }
            );

            if (response.ok) {
                setMessage("Nombre actualizado correctamente");
            } else {
                const data = await response.json();
                setError(data.message || "Error al actualizar el negocio");
            }
        } catch (err) {
            setError(err + "Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteModal(false);
        setIsDeleting(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(
                `http://localhost:3000/v1/api/negocios/${negocio.id_negocio}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                setMessage("Negocio eliminado correctamente");
                navigation.navigate("Negocios");
            } else {
                const data = await response.json();
                setError(data.message || "Error al eliminar el negocio");
                setIsDeleting(false);
            }
        } catch (err) {
            setError("Error de conexión");
            setIsDeleting(false);
        }
    };

    return (
        <View style={styles.container}>
            {isDeleting && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#1976D2" />
                    <Text style={styles.loadingText}>Eliminando negocio...</Text>
                </View>
            )}

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.goBack()}
                    testID="back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ajustes del Negocio</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>CIF</Text>
                        <Text style={styles.value}>{negocio.CIF}</Text>
                    </View>
                </View>

                <View style={styles.editSection}>
                    <Text style={styles.sectionTitle}>Nombre del negocio</Text>
                    <TextInput
                        style={styles.input}
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder="Nombre del negocio"
                        testID="nombre-input"
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                        testID="save-button"
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialIcons name="save" size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>Guardar cambios</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    {message ? <Text style={{ color: "green", marginTop: 10 }}>{message}</Text> : null}
                </View>

                <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>Cuidado!</Text>
                    <Text style={styles.dangerDescription}>
                        Esta acción eliminará permanentemente el negocio y todos sus datos
                        asociados. Esta acción no se puede deshacer.
                    </Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => setShowDeleteModal(true)}
                        testID="delete-button"
                    >
                        <MaterialIcons name="delete" size={20} color="#fff" />
                        <Text style={styles.deleteButtonText}>Eliminar negocio</Text>
                    </TouchableOpacity>
                </View>
            </View>


            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialIcons name="warning" size={48} color="#F44336" />
                        <Text style={styles.modalTitle}>¿Eliminar negocio?</Text>
                        <Text style={styles.modalMessage}>
                            Estás a punto de eliminar "{negocio.nombre}". Esta acción no se
                            puede deshacer y se eliminarán todos los datos asociados.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowDeleteModal(false)}
                                testID="cancel-delete-button"
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmDeleteButton}
                                onPress={handleDelete}
                                testID="confirm-delete-button"
                            >
                                <Text style={styles.confirmDeleteButtonText}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default NegocioSettings;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#374151",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#374151",
    },
    content: {
        padding: 16,
    },
    infoCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    label: {
        fontSize: 14,
        color: "#6b7280",
        fontWeight: "500",
    },
    value: {
        fontSize: 14,
        color: "#374151",
        fontWeight: "600",
    },
    editSection: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#f9fafb",
        marginBottom: 12,
    },
    errorText: {
        color: "#F44336",
        fontSize: 14,
        marginBottom: 12,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1976D2",
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    dangerZone: {
        backgroundColor: "#fef2f2",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#fecaca",
    },
    dangerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#991b1b",
        marginBottom: 8,
    },
    dangerDescription: {
        fontSize: 14,
        color: "#7f1d1d",
        marginBottom: 16,
        lineHeight: 20,
    },
    deleteButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F44336",
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    deleteButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        width: "100%",
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#374151",
        marginTop: 16,
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: "#f3f4f6",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#374151",
        fontWeight: "600",
        fontSize: 16,
    },
    confirmDeleteButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: "#F44336",
        alignItems: "center",
    },
    confirmDeleteButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
