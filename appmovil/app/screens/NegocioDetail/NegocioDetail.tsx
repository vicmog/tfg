import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { Ajuste, Modulo, Negocio } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { ajustesByNegocioRoute, MODULOS, MODULO_TO_AJUSTE_FIELD, negocioByIdRoute } from "./constants";
import { NegocioDetailProps } from "./types";

const NegocioDetail: React.FC<NegocioDetailProps> = ({ route, navigation }) => {
    const { negocio: negocioInicial } = route.params;
    const [negocio, setNegocio] = useState<Negocio>(negocioInicial);
    const [ajuste, setAjuste] = useState<Ajuste | null>(null);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchNegocioYAjustes = async () => {
                setLoading(true);
                try {
                    const token = await AsyncStorage.getItem("token");

                    const [negocioResponse, ajusteResponse] = await Promise.all([
                        fetch(negocioByIdRoute(negocioInicial.id_negocio), {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }),
                        fetch(ajustesByNegocioRoute(negocioInicial.id_negocio), {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }),
                    ]);

                    if (negocioResponse.ok) {
                        const data = await negocioResponse.json();
                        setNegocio(data.negocio);
                    }

                    if (ajusteResponse.ok) {
                        const data = await ajusteResponse.json();
                        setAjuste(data.ajuste || null);
                    }
                } catch (error) {
                    console.error("Error al obtener negocio:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchNegocioYAjustes();
        }, [negocioInicial.id_negocio])
    );

    const isModuloEnabled = (moduloId: Modulo["id"]) => {
        if (!ajuste) {
            return true;
        }

        const ajusteField = MODULO_TO_AJUSTE_FIELD[moduloId];
        return Boolean(ajuste[ajusteField]);
    };

    const modulosVisibles = MODULOS.filter((modulo) => isModuloEnabled(modulo.id));
    const modulesCount = modulosVisibles.length;
    const roleLabel = negocio.rol === "admin" ? "Administrador" : negocio.rol === "jefe" ? "Jefe" : "Trabajador";

    const handleModuloPress = (modulo: Modulo) => {
        if (modulo.id === "clientes") {
            navigation.navigate("Clientes", { negocio });
            return;
        }

        if (modulo.id === "productos") {
            navigation.navigate("Productos", { negocio });
            return;
        }

        if (modulo.id === "servicios") {
            navigation.navigate("Servicios", { negocio });
            return;
        }

        if (modulo.id === "recursos") {
            navigation.navigate("Recursos", { negocio });
            return;
        }

        if (modulo.id === "empleados") {
            navigation.navigate("Empleados", { negocio });
            return;
        }

        if (modulo.id === "proveedores") {
            navigation.navigate("Proveedores", { negocio });
            return;
        }

        if (modulo.id === "descuentos") {
            navigation.navigate("Descuentos", { negocio });
            return;
        }

        if (modulo.id === "gastos") {
            navigation.navigate("Gastos", { negocio });
            return;
        }

        if (modulo.id === "compras") {
            navigation.navigate("Compras", { negocio });
            return;
        }

        if (modulo.id === "ventas") {
            navigation.navigate("Ventas", { negocio });
            return;
        }

        if (modulo.id === "reservas") {
            navigation.navigate("Reservas", { negocio });
            return;
        }

        if (modulo.id === "estadisticas") {
            navigation.navigate("Estadisticas", { negocio });
            return;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#1976D2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.goBack()}
                        testID="back-button"
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    <View style={styles.headerActions}>
                        {(negocio.rol === "jefe" || negocio.rol === "admin") ? (
                            <TouchableOpacity
                                style={styles.actionChip}
                                onPress={() => {
                                    navigation.navigate("NegocioUsers", { negocio });
                                }}
                                testID="permissions-settings-button"
                            >
                                <MaterialIcons name="admin-panel-settings" size={18} color="#334155" />
                                <Text style={styles.actionChipText}>Usuarios</Text>
                            </TouchableOpacity>
                        ) : null}

                        {(negocio.rol === "jefe" || negocio.rol === "admin") ? (
                            <TouchableOpacity
                                style={styles.actionChip}
                                onPress={() => {
                                    navigation.navigate("NegocioSettings", { negocio });
                                }}
                                testID="settings-button"
                            >
                                <MaterialIcons name="settings" size={18} color="#334155" />
                                <Text style={styles.actionChipText}>Ajustes</Text>
                            </TouchableOpacity>
                        ) : null}

                        {negocio.rol === "admin" ? (
                            <TouchableOpacity
                                style={styles.actionChip}
                                onPress={() => {
                                    navigation.navigate("AjustesModulos", { negocio });
                                }}
                                testID="edit-modules-button"
                            >
                                <MaterialIcons name="edit" size={18} color="#334155" />
                                <Text style={styles.actionChipText}>Módulos</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                <View style={styles.heroBody}>
                    <Text style={styles.businessName} numberOfLines={2}>
                        {negocio.nombre}
                    </Text>
                    <Text style={styles.businessSubtitle}>
                        {roleLabel} · {modulesCount} módulos activos
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Módulos del negocio</Text>
                    <Text style={styles.sectionMeta}>{modulesCount} disponibles</Text>
                </View>

                <View style={styles.modulosContainer}>
                    {modulosVisibles.map((modulo) => (
                        <TouchableOpacity
                            key={modulo.id}
                            style={styles.moduloCard}
                            onPress={() => handleModuloPress(modulo)}
                            testID={`modulo-${modulo.id}`}
                        >
                            <View style={[styles.moduloIconContainer, { backgroundColor: modulo.color + "18" }]}>
                                <MaterialIcons name={modulo.icono} size={32} color={modulo.color} />
                            </View>
                            <Text style={styles.moduloText}>{modulo.nombre}</Text>
                        </TouchableOpacity>
                    ))}

                    {modulosVisibles.length === 0 ? (
                        <Text style={styles.emptyModulesText}>No hay grupos de modulos activos para este negocio.</Text>
                    ) : null}
                </View>
            </ScrollView>
        </View>
    );
};

export default NegocioDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f3f6fb",
        paddingTop: 12,
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    heroCard: {
        marginHorizontal: 16,
        marginBottom: 14,
        padding: 16,
        borderRadius: 20,
        backgroundColor: "#ffffff",
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
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
    },
    heroBody: {
        marginTop: 14,
    },
    headerActions: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        gap: 6,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#eef4ff",
        alignItems: "center",
        justifyContent: "center",
    },
    businessName: {
        fontSize: 24,
        fontWeight: "800",
        color: "#0f172a",
        letterSpacing: -0.3,
        lineHeight: 30,
    },
    businessSubtitle: {
        marginTop: 6,
        color: "#64748b",
        fontSize: 14,
        fontWeight: "500",
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    sectionHeader: {
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0f172a",
    },
    sectionMeta: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "600",
    },
    actionChip: {
        minHeight: 36,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    actionChipText: {
        color: "#334155",
        fontSize: 13,
        fontWeight: "600",
    },
    modulosContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    moduloCard: {
        width: "48%",
        backgroundColor: "#ffffff",
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 14,
        marginBottom: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    moduloIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    moduloText: {
        fontWeight: "700",
        fontSize: 14,
        color: "#1f2937",
        textAlign: "center",
        lineHeight: 18,
    },
    emptyModulesText: {
        width: "100%",
        textAlign: "center",
        color: "#64748b",
        fontSize: 15,
        marginTop: 24,
        paddingHorizontal: 16,
    },
    editModulesButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
        marginLeft: 10,
    },
    permissionsButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
    },
    settingsButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
        marginLeft: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    adminButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
    },
});
