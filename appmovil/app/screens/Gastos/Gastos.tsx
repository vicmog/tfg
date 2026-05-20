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
    const [updatingTipo, setUpdatingTipo] = useState(false);
    const [editingTipoGasto, setEditingTipoGasto] = useState<TipoGasto | null>(null);
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

    const handleUpdateTipoGasto = async () => {
        if (!editingTipoGasto) {
            return;
        }

        const nombre = newTipoNombre.trim();

        if (!nombre) {
            setModalError("El nombre del tipo de gasto es obligatorio");
            return;
        }

        setUpdatingTipo(true);
        setModalError("");
        setSuccess("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(API_ROUTES.updateTipoGastoById(editingTipoGasto.id_tipo_gasto), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre_tipo: nombre,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setModalError(data.message || "No se pudo actualizar el tipo de gasto");
                return;
            }

            setSuccess(data.message || "Tipo de gasto actualizado correctamente");
            setModalVisible(false);
            setEditingTipoGasto(null);
            setNewTipoNombre("");
            await loadData();
        } catch {
            setModalError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setUpdatingTipo(false);
        }
    };

    const handleSaveTipoGasto = async () => {
        if (editingTipoGasto) {
            await handleUpdateTipoGasto();
            return;
        }

        await handleCreateTipoGasto();
    };

    const handleOpenModal = () => {
        setModalError("");
        setNewTipoNombre("");
        setEditingTipoGasto(null);
        setModalVisible(true);
    };

    const handleOpenEditModal = (tipoGasto: TipoGasto) => {
        setModalError("");
        setError("");
        setSuccess("");
        setEditingTipoGasto(tipoGasto);
        setNewTipoNombre(tipoGasto.nombre_tipo);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setModalError("");
        setNewTipoNombre("");
        setEditingTipoGasto(null);
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
                <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} testID="gastos-back-button">
                        <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    {canManageGastos ? (
                        <TouchableOpacity style={styles.addButton} onPress={handleOpenModal} testID="toggle-tipo-gasto-form-button">
                            <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.addButtonText}>Añadir tipo</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                <View style={styles.heroBody}>
                    <Text style={styles.title}>Gastos</Text>
                    <Text style={styles.subtitle}>{normalizedRole === 'admin' ? 'Administrador' : normalizedRole === 'jefe' ? 'Jefe' : 'Trabajador'} · {tiposGasto.length} tipos</Text>
                </View>

            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <Modal
                visible={modalVisible}
                transparent
                animationType={editingTipoGasto ? "slide" : "none"}
                onRequestClose={handleCloseModal}
                testID="tipo-gasto-form-modal"
            >
                <View style={[styles.modalOverlay, editingTipoGasto && styles.modalOverlayBottom]}>
                    <View style={[styles.modalCard, editingTipoGasto && styles.modalCardBottom]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingTipoGasto ? "Editar tipo de gasto" : "Crear tipo de gasto"}
                            </Text>
                            {!editingTipoGasto ? (
                                <TouchableOpacity onPress={handleCloseModal} testID="close-tipo-gasto-form-button">
                                    <MaterialIcons name="close" size={22} color="#6b7280" />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Agua, luz, internet..."
                            value={newTipoNombre}
                            onChangeText={setNewTipoNombre}
                            testID="tipo-gasto-nombre-input"
                        />

                        {modalError ? <Text style={styles.modalErrorText} testID="tipo-gasto-error-message">{modalError}</Text> : null}

                        {editingTipoGasto ? (
                            <View style={styles.modalActionRow}>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleSaveTipoGasto}
                                    disabled={savingTipo || updatingTipo}
                                    testID="tipo-gasto-save-button"
                                >
                                    {savingTipo || updatingTipo ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Guardar cambios</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={handleCloseModal}
                                    disabled={savingTipo || updatingTipo}
                                    testID="tipo-gasto-close-button"
                                >
                                    <Text style={styles.secondaryButtonText}>Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleSaveTipoGasto}
                                disabled={savingTipo || updatingTipo}
                                testID="tipo-gasto-save-button"
                            >
                                {savingTipo || updatingTipo ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Crear tipo</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tipos de gasto</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1976D2" />
                    </View>
                ) : tiposGasto.length === 0 ? (
                    <Text style={styles.emptyText}>Aun no hay tipos de gasto creados</Text>
                ) : (
                    tiposGasto.map((tipo) => (
                        <View key={tipo.id_tipo_gasto}>
                            <View style={styles.listCard}>
                                <TouchableOpacity
                                    style={styles.typeCardRow}
                                    onPress={() => navigation.navigate("TipoGastoDetail", { negocio, tipoGasto: tipo })}
                                    testID={`tipo-gasto-card-${tipo.id_tipo_gasto}`}
                                >
                                    <View style={styles.typeIcon}>
                                        <Text style={styles.typeIconText}>{(tipo.nombre_tipo || "?").charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.typeCardContent}>
                                        <Text style={styles.listTitle}>{tipo.nombre_tipo}</Text>
                                        <Text style={styles.listMeta}>Toca para abrir y añadir gastos</Text>
                                    </View>
                                </TouchableOpacity>

                                {canManageGastos ? (
                                    <View style={styles.actionsWrap}>
                                        <TouchableOpacity
                                            style={styles.editIconButton}
                                            onPress={() => handleOpenEditModal(tipo)}
                                            testID={`tipo-gasto-edit-button-${tipo.id_tipo_gasto}`}
                                        >
                                            <MaterialIcons name="edit" size={18} color="#fff" />
                                        </TouchableOpacity>
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
                                    </View>
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
        fontSize: 24,
        fontWeight: "800",
        color: "#0f172a",
        letterSpacing: -0.3,
        flex: 1,
    },
    subtitle: {
        marginTop: 6,
        color: "#64748b",
        fontSize: 14,
        fontWeight: "500",
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
    content: {
        padding: 16,
        gap: 12,
        paddingBottom: 28,
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
    primaryButton: {
        backgroundColor: "#1d4ed8",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    sectionHeader: {
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    typeCardRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    typeCardContent: {
        flex: 1,
        gap: 4,
    },
    listCard: {
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0f172a",
    },
    listMeta: {
        color: "#64748b",
        fontSize: 13,
        marginTop: 2,
    },
    typeIcon: {
        width: 44,
        height: 44,
        borderRadius: 999,
        backgroundColor: "#eef2ff",
        alignItems: "center",
        justifyContent: "center",
    },
    typeIconText: {
        color: "#3730a3",
        fontWeight: "800",
        fontSize: 18,
    },
    deleteIconButton: {
        height: 36,
        width: 36,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#dc2626",
    },
    editIconButton: {
        height: 36,
        width: 36,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563eb",
    },
    actionsWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    errorText: {
        marginHorizontal: 12,
        backgroundColor: "#fef2f2",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#fecaca",
        padding: 12,
        marginBottom: 12,
        color: "#dc2626",
        fontWeight: "500",
        fontSize: 14,
    },
    successText: {
        marginHorizontal: 12,
        backgroundColor: "#f0fdf4",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#bbf7d0",
        padding: 12,
        marginBottom: 12,
        color: "#16a34a",
        fontWeight: "500",
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.42)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
    },
    modalOverlayBottom: {
        justifyContent: "flex-end",
        alignItems: "stretch",
        paddingHorizontal: 0,
    },
    modalCard: {
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
        gap: 12,
    },
    modalCardBottom: {
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
        marginBottom: 8,
    },
    modalTitle: {
        color: "#0f172a",
        fontSize: 20,
        fontWeight: "800",
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
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
    emptyText: {
        textAlign: "center",
        color: "#64748b",
        marginTop: 40,
    },
});