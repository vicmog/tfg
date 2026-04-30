import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [newTipoNombre, setNewTipoNombre] = useState("");

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
            setError("El nombre del tipo de gasto es obligatorio");
            return;
        }

        setSavingTipo(true);
        setError("");
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
            await loadData();
        } catch {
            setError("Error de conexion. Intentalo de nuevo.");
        } finally {
            setSavingTipo(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} testID="gastos-back-button">
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.title}>Gastos</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Crear tipo de gasto</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Agua, luz, internet..."
                        value={newTipoNombre}
                        onChangeText={setNewTipoNombre}
                    />
                    <TouchableOpacity style={styles.primaryButton} onPress={handleCreateTipoGasto} disabled={savingTipo}>
                        {savingTipo ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Crear tipo</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tipos de gasto</Text>
                </View>

                {loading ? (
                    <ActivityIndicator color="#1976D2" />
                ) : tiposGasto.length === 0 ? (
                    <Text style={styles.emptyText}>Aun no hay tipos de gasto creados</Text>
                ) : (
                    tiposGasto.map((tipo) => (
                        <TouchableOpacity
                            key={tipo.id_tipo_gasto}
                            style={styles.listCard}
                            onPress={() => navigation.navigate("TipoGastoDetail", { negocio, tipoGasto: tipo })}
                            testID={`tipo-gasto-card-${tipo.id_tipo_gasto}`}
                        >
                            <View style={styles.typeCardContent}>
                                <Text style={styles.listTitle}>{tipo.nombre_tipo}</Text>
                                <Text style={styles.listMeta}>Toca para abrir y añadir gastos</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                        </TouchableOpacity>
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
    emptyText: {
        color: "#6b7280",
        fontStyle: "italic",
    },
});