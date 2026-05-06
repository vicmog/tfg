import React, { useCallback, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { TipoGasto } from "../types";
import { GastosProps } from "./types";

const Gastos: React.FC<GastosProps> = ({ route, navigation }) => {
    const { negocio } = route.params;
    const [tiposGasto, setTiposGasto] = useState<TipoGasto[]>([]);
    const [loading, setLoading] = useState(false);
    const [savingTipo, setSavingTipo] = useState(false);
    const [deletingTipoGastoId, setDeletingTipoGastoId] = useState<number | null>(null);
    const [confirmDeleteTipoGastoId, setConfirmDeleteTipoGastoId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [newTipoNombre, setNewTipoNombre] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [modalError, setModalError] = useState("");

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageGastos = normalizedRole === "jefe" || normalizedRole === "admin";

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(API_ROUTES.tipogastosByNegocio(negocio.id_negocio), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || "No se pudieron obtener los tipos de gasto");
                return;
            }

            const data = await response.json();
            setTiposGasto((data.tipos_gasto || []) as TipoGasto[]);
        } catch {
            setError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleCreateTipoGasto = async () => {
        const nombre = newTipoNombre.trim();

        if (!nombre) {
            setModalError("El nombre del tipo de gasto es obligatorio");
            return;
        }

        setSavingTipo(true);
        setModalError("");
        setSuccess("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(API_ROUTES.tipogastos, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_negocio: negocio.id_negocio,
                    nombre_tipo: nombre,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "No se pudo crear el tipo de gasto");
                return;
            }

            setSuccess(data.message || "Tipo de gasto creado correctamente");
            setNewTipoNombre("");
            setModalVisible(false);
            await loadData();
        } catch {
            setModalError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setSavingTipo(false);
        }
    };

    const handleOpenModal = () => {
        setModalError("");
        setNewTipoNombre("");
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setModalError("");
        setNewTipoNombre("");
    };

    const handleAskDeleteTipoGasto = (idTipoGasto: number) => {
        setError("");
        setSuccess("");
        setConfirmDeleteTipoGastoId(idTipoGasto);
    };

    const handleCancelDeleteTipoGasto = () => {
        setConfirmDeleteTipoGastoId(null);
    };

    const handleDeleteTipoGasto = async (idTipoGasto: number) => {
        setError("");
        setSuccess("");
        setDeletingTipoGastoId(idTipoGasto);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(API_ROUTES.deleteTipoGastoById(idTipoGasto), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || "No se pudo eliminar el tipo de gasto");
                return;
            }

            setSuccess("Tipo de gasto eliminado correctamente");
            setConfirmDeleteTipoGastoId(null);
            await loadData();
        } catch {
            setError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setDeletingTipoGastoId(null);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} testID="gastos-back-button">
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.title}>Gastos</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleOpenModal} testID="toggle-tipo-gasto-form-button">
                    <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.addButtonText}>Añadir tipo</Text>
                </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={handleCloseModal}
                testID="tipo-gasto-form-modal"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Crear tipo de gasto</Text>
                            <TouchableOpacity onPress={handleCloseModal} testID="close-tipo-gasto-form-button">
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Agua, luz, internet..."
                            value={newTipoNombre}
                            onChangeText={setNewTipoNombre}
                            testID="tipo-gasto-nombre-input"
                        />

                        {modalError ? <Text style={styles.modalErrorText} testID="tipo-gasto-error-message">{modalError}</Text> : null}

                        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateTipoGasto} disabled={savingTipo} testID="tipo-gasto-save-button">
                            {savingTipo ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Crear tipo</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tipos de gasto</Text>
                </View>

                {loading ? (
                    <ActivityIndicator color="#1976D2" />
                ) : tiposGasto.length === 0 ? (
                    <Text style={styles.emptyText}>Aun no hay tipos de gasto creados</Text>
                ) : (
                    tiposGasto.map((tipo) => (
                        <View key={tipo.id_tipo_gasto}>
                            <View style={styles.listCard}>
                                <TouchableOpacity
                                    style={styles.typeCardContent}
                                    onPress={() => navigation.navigate("TipoGastoDetail", { negocio, tipoGasto: tipo })}
                                    testID={`tipo-gasto-card-${tipo.id_tipo_gasto}`}
                                >
                                    <Text style={styles.listTitle}>{tipo.nombre_tipo}</Text>
                                    <Text style={styles.listMeta}>Toca para abrir y añadir gastos</Text>
                                </TouchableOpacity>

                                {canManageGastos ? (
                                    <TouchableOpacity
                                        style={styles.deleteIconButton}
                                        onPress={() => handleAskDeleteTipoGasto(tipo.id_tipo_gasto)}
                                        disabled={deletingTipoGastoId === tipo.id_tipo_gasto}
                                        testID={`tipo-gasto-delete-button-${tipo.id_tipo_gasto}`}
                                    >
                                        {deletingTipoGastoId === tipo.id_tipo_gasto ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <MaterialIcons name="delete" size={18} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                ) : (
                                    <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                                )}
                            </View>

                            {confirmDeleteTipoGastoId === tipo.id_tipo_gasto ? (
                                <View style={styles.confirmBox} testID={`tipo-gasto-delete-confirm-${tipo.id_tipo_gasto}`}>
                                    <Text style={styles.confirmTitle}>Eliminar tipo de gasto</Text>
                                    <Text style={styles.confirmMessage}>¿Seguro que quieres eliminar este tipo de gasto? Se borrarán también todos sus gastos.</Text>
                                    <View style={styles.confirmActions}>
                                        <TouchableOpacity
                                            style={styles.confirmCancelButton}
                                            onPress={handleCancelDeleteTipoGasto}
                                            testID={`tipo-gasto-delete-cancel-${tipo.id_tipo_gasto}`}
                                        >
                                            <Text style={styles.confirmCancelText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.confirmDeleteButton}
                                            onPress={() => handleDeleteTipoGasto(tipo.id_tipo_gasto)}
                                            disabled={deletingTipoGastoId === tipo.id_tipo_gasto}
                                            testID={`tipo-gasto-delete-confirm-button-${tipo.id_tipo_gasto}`}
                                        >
                                            <Text style={styles.confirmDeleteText}>Eliminar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

export default Gastos;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
        paddingTop: 10,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    iconButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0D47A1",
        flex: 1,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1976D2",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
    content: {
        padding: 16,
        gap: 12,
        paddingBottom: 28,
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    primaryButton: {
        backgroundColor: "#1976D2",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    sectionHeader: {
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    typeCardContent: {
        flex: 1,
        gap: 3,
    },
    listCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    listTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },
    listMeta: {
        color: "#374151",
        fontSize: 13,
    },
    deleteIconButton: {
        width: 36,
        height: 36,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#dc2626",
    },
    errorText: {
        color: "#b91c1c",
        fontWeight: "600",
        marginHorizontal: 16,
        marginTop: 8,
    },
    successText: {
        color: "#166534",
        fontWeight: "600",
        marginHorizontal: 16,
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(17,24,39,0.45)",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    modalErrorText: {
        color: "#b91c1c",
        backgroundColor: "#fef2f2",
        borderRadius: 10,
        padding: 10,
    },
    webCalendarCard: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        backgroundColor: "#fff",
        padding: 10,
    },
    webCalendarHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    webCalendarNavButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: "#f3f4f6",
    },
    webCalendarTitle: {
        color: "#111827",
        fontWeight: "700",
        textTransform: "capitalize",
    },
    webWeekdaysRow: {
        flexDirection: "row",
        marginBottom: 6,
    },
    webWeekdayLabel: {
        flex: 1,
        textAlign: "center",
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "700",
    },
    webCalendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    webCalendarDayEmpty: {
        width: "14.2857%",
        height: 34,
    },
    webCalendarDayButton: {
        width: "14.2857%",
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
    },
    webCalendarDayButtonSelected: {
        backgroundColor: "#1976D2",
    },
    webCalendarDayText: {
        color: "#1f2937",
        fontWeight: "600",
    },
    webCalendarDayTextSelected: {
        color: "#fff",
    },
    confirmBox: {
        marginTop: 8,
        backgroundColor: "#fff7ed",
        borderWidth: 1,
        borderColor: "#fed7aa",
        borderRadius: 10,
        padding: 12,
        gap: 10,
    },
    confirmTitle: {
        fontWeight: "700",
        color: "#9a3412",
    },
    confirmMessage: {
        color: "#7c2d12",
    },
    confirmActions: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "flex-end",
    },
    confirmCancelButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#e5e7eb",
    },
    confirmCancelText: {
        fontWeight: "700",
        color: "#374151",
    },
    confirmDeleteButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#dc2626",
    },
    confirmDeleteText: {
        fontWeight: "700",
        color: "#fff",
    },
    emptyText: {
        color: "#6b7280",
        fontStyle: "italic",
    },
});