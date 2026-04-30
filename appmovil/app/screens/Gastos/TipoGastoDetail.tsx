import React, { useCallback, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { Gasto } from "../types";
import { TipoGastoDetailProps } from "./types";

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatAmount = (value: number) =>
    new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
    }).format(value);

const TipoGastoDetail: React.FC<TipoGastoDetailProps> = ({ route, navigation }) => {
    const { negocio, tipoGasto } = route.params;
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [loading, setLoading] = useState(false);
    const [savingGasto, setSavingGasto] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [gastoNombre, setGastoNombre] = useState("");
    const [gastoFecha, setGastoFecha] = useState(todayKey());
    const [gastoImporte, setGastoImporte] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(API_ROUTES.gastosByNegocio(negocio.id_negocio), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || "No se pudieron obtener los gastos");
                return;
            }

            const data = await response.json();
            const gastosList = ((data.gastos || []) as Gasto[]).filter(
                (gasto) => gasto.id_tipo_gasto === tipoGasto.id_tipo_gasto
            );

            setGastos(gastosList);
        } catch (fetchError) {
            setError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio, tipoGasto.id_tipo_gasto]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleCreateGasto = async () => {
        const nombre = gastoNombre.trim();

        if (!nombre) {
            setError("El nombre del gasto es obligatorio");
            return;
        }

        if (!gastoFecha.trim()) {
            setError("La fecha del gasto es obligatoria");
            return;
        }

        const importeValue = Number.parseFloat(gastoImporte.replace(",", "."));
        if (!Number.isFinite(importeValue) || importeValue <= 0) {
            setError("El importe del gasto debe ser mayor que 0");
            return;
        }

        setSavingGasto(true);
        setError("");
        setSuccess("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(API_ROUTES.gastos, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_negocio: negocio.id_negocio,
                    id_tipo_gasto: tipoGasto.id_tipo_gasto,
                    nombre,
                    fecha: gastoFecha,
                    importe: importeValue,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "No se pudo registrar el gasto");
                return;
            }

            setSuccess(data.message || "Gasto registrado correctamente");
            setGastoNombre("");
            setGastoImporte("");
            setGastoFecha(todayKey());
            await loadData();
        } catch (createError) {
            setError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setSavingGasto(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} testID="tipo-gasto-detail-back-button">
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.title}>{tipoGasto.nombre_tipo}</Text>
                    <Text style={styles.subtitle}>Gastos de esta categoria</Text>
                </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Añadir gasto en {tipoGasto.nombre_tipo}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre del gasto"
                        value={gastoNombre}
                        onChangeText={setGastoNombre}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Fecha (YYYY-MM-DD)"
                        value={gastoFecha}
                        onChangeText={setGastoFecha}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Importe"
                        keyboardType="decimal-pad"
                        value={gastoImporte}
                        onChangeText={setGastoImporte}
                    />
                    <TouchableOpacity style={styles.primaryButton} onPress={handleCreateGasto} disabled={savingGasto}>
                        {savingGasto ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Registrar gasto</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Gastos registrados</Text>
                </View>

                {loading ? (
                    <ActivityIndicator color="#1976D2" />
                ) : gastos.length === 0 ? (
                    <Text style={styles.emptyText}>Todavia no hay gastos en esta categoria</Text>
                ) : (
                    gastos.map((gasto) => (
                        <View key={gasto.id_gasto} style={styles.listCard}>
                            <Text style={styles.listTitle}>{gasto.nombre}</Text>
                            <Text style={styles.listMeta}>Fecha: {formatDate(gasto.fecha)}</Text>
                            <Text style={styles.listAmount}>{formatAmount(gasto.importe)}</Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

export default TipoGastoDetail;

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
    headerTextWrap: {
        flex: 1,
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
    },
    subtitle: {
        marginTop: 2,
        color: "#6b7280",
        fontSize: 13,
    },
    content: {
        padding: 16,
        gap: 12,
        paddingBottom: 28,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 14,
        gap: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
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
    errorText: {
        marginHorizontal: 16,
        marginTop: 12,
        color: "#b91c1c",
        backgroundColor: "#fef2f2",
        borderRadius: 10,
        padding: 10,
    },
    successText: {
        marginHorizontal: 16,
        marginTop: 12,
        color: "#166534",
        backgroundColor: "#f0fdf4",
        borderRadius: 10,
        padding: 10,
    },
    sectionHeader: {
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    emptyText: {
        color: "#6b7280",
        textAlign: "center",
        paddingVertical: 12,
    },
    listCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 14,
        gap: 4,
    },
    listTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },
    listMeta: {
        color: "#6b7280",
        fontSize: 13,
    },
    listAmount: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f766e",
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
        gap: 10,
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
});