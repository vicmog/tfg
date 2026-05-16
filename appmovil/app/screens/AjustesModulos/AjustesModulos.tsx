import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ajuste, AjusteModuleField } from "../types";
import { ajustesByNegocioRoute, MODULO_GRUPOS, MODULOS, MODULO_TO_AJUSTE_FIELD } from "../NegocioDetail/constants";
import { AjustesModulosProps } from "./types";

const moduleLabelById = Object.fromEntries(MODULOS.map((modulo) => [modulo.id, modulo.nombre]));

const AjustesModulos: React.FC<AjustesModulosProps> = ({ route, navigation }) => {
    const { negocio } = route.params;
    const [ajuste, setAjuste] = useState<Ajuste | null>(null);
    const [loading, setLoading] = useState(false);
    const [updatingGroupId, setUpdatingGroupId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");

    const fetchAjustes = useCallback(async () => {
        setLoading(true);
        setErrorMessage("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(ajustesByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                setErrorMessage(data?.message || "No se pudieron obtener los ajustes");
                setAjuste(null);
                return;
            }

            setAjuste(data.ajuste || null);
        } catch (error) {
            setErrorMessage("No se pudieron obtener los ajustes");
            setAjuste(null);
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchAjustes();
        }, [fetchAjustes])
    );

    const groupStatus = useMemo(() => {
        return MODULO_GRUPOS.map((grupo) => {
            const fields = grupo.modulos.map((moduloId) => MODULO_TO_AJUSTE_FIELD[moduloId]);
            const enabledCount = fields.filter((field) => Boolean(ajuste?.[field])).length;
            return {
                groupId: grupo.id,
                fields,
                isActive: enabledCount === fields.length,
                isMixed: enabledCount > 0 && enabledCount < fields.length,
            };
        });
    }, [ajuste]);

    const handleToggleGroup = async (groupId: string) => {
        const group = MODULO_GRUPOS.find((item) => item.id === groupId);
        const status = groupStatus.find((item) => item.groupId === groupId);

        if (!group || !status) {
            return;
        }

        const nextValue = !status.isActive;
        const payload: Partial<Record<AjusteModuleField, boolean>> = {};

        for (const moduloId of group.modulos) {
            const field = MODULO_TO_AJUSTE_FIELD[moduloId];
            payload[field] = nextValue;
        }

        setUpdatingGroupId(groupId);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(ajustesByNegocioRoute(negocio.id_negocio), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) {
                setErrorMessage(data?.message || "No se pudieron actualizar los ajustes");
                return;
            }

            setAjuste(data.ajuste || null);
            setSuccessMessage(data?.message || "Ajustes actualizados correctamente");
        } catch (error) {
            setErrorMessage("No se pudieron actualizar los ajustes");
        } finally {
            setUpdatingGroupId(null);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.goBack()}
                    testID="ajustes-modulos-back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.title}>Activacion por grupos</Text>
                    <Text style={styles.subtitle}>{negocio.nombre}</Text>
                </View>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Dependencias aplicadas</Text>
                <Text style={styles.infoText}>
                    Cada grupo activa o desactiva varios modulos a la vez para evitar combinaciones incoherentes, por ejemplo compras sin productos.
                </Text>
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {MODULO_GRUPOS.map((grupo) => {
                        const status = groupStatus.find((item) => item.groupId === grupo.id);
                        const isUpdating = updatingGroupId === grupo.id;
                        const moduleNames = grupo.modulos.map((moduloId) => moduleLabelById[moduloId]);

                        return (
                            <View key={grupo.id} style={styles.groupCard} testID={`grupo-${grupo.id}`}>
                                <View style={styles.groupHeaderRow}>
                                    <View style={styles.groupTextWrap}>
                                        <Text style={styles.groupTitle}>{grupo.nombre}</Text>
                                        <Text style={styles.groupDescription}>{grupo.descripcion}</Text>
                                    </View>
                                    <Switch
                                        value={Boolean(status?.isActive)}
                                        onValueChange={() => handleToggleGroup(grupo.id)}
                                        disabled={isUpdating}
                                        trackColor={{ false: "#d1d5db", true: "#90CAF9" }}
                                        thumbColor={Boolean(status?.isActive) ? "#1976D2" : "#f3f4f6"}
                                        testID={`grupo-switch-${grupo.id}`}
                                    />
                                </View>

                                {status?.isMixed ? (
                                    <Text style={styles.mixedText}>
                                        Este grupo tiene modulos mezclados por configuraciones anteriores. Al cambiar el switch se alinean todos.
                                    </Text>
                                ) : null}

                                <View style={styles.modulesRow}>
                                    {moduleNames.map((moduleName) => (
                                        <View key={`${grupo.id}-${moduleName}`} style={styles.moduleChip}>
                                            <Text style={styles.moduleChipText}>{moduleName}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
};

export default AjustesModulos;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
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
    headerTextWrap: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0D47A1",
    },
    subtitle: {
        marginTop: 2,
        fontSize: 13,
        color: "#6b7280",
    },
    infoBox: {
        marginTop: 12,
        marginHorizontal: 14,
        padding: 12,
        borderRadius: 10,
        backgroundColor: "#eaf3ff",
        borderWidth: 1,
        borderColor: "#cfe2ff",
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0D47A1",
        marginBottom: 4,
    },
    infoText: {
        color: "#334155",
        fontSize: 13,
        lineHeight: 18,
    },
    errorText: {
        marginTop: 10,
        marginHorizontal: 16,
        color: "#b91c1c",
        fontSize: 13,
    },
    successText: {
        marginTop: 10,
        marginHorizontal: 16,
        color: "#166534",
        fontSize: 13,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 24,
    },
    groupCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    groupHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    groupTextWrap: {
        flex: 1,
        paddingRight: 12,
    },
    groupTitle: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "700",
    },
    groupDescription: {
        marginTop: 4,
        color: "#4b5563",
        fontSize: 13,
        lineHeight: 18,
    },
    mixedText: {
        marginTop: 8,
        color: "#92400e",
        fontSize: 12,
        lineHeight: 16,
    },
    modulesRow: {
        marginTop: 10,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    moduleChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#f3f4f6",
    },
    moduleChipText: {
        color: "#374151",
        fontSize: 12,
        fontWeight: "600",
    },
});
