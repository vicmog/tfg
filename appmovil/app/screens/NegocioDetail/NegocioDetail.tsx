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
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.goBack()}
                        testID="back-button"
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                    </TouchableOpacity>
                    <Text style={styles.businessName} numberOfLines={1}>
                        {negocio.nombre}
                    </Text>
                </View>
                {
                    (negocio.rol === "jefe" || negocio.rol === "admin") ?
                        <>
                            <TouchableOpacity
                                style={styles.permissionsButton}
                                onPress={() => {
                                    navigation.navigate("NegocioUsers", { negocio });
                                }}
                                testID="permissions-settings-button"
                            >
                                <MaterialIcons name="admin-panel-settings" size={24} color="#1976D2" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.settingsButton}
                                onPress={() => {
                                    navigation.navigate("NegocioSettings", { negocio });
                                }}
                                testID="settings-button"
                            >
                                <MaterialIcons name="settings" size={24} color="#575757" />
                            </TouchableOpacity>


                        </>
                        : null
                }

                {
                    negocio.rol === "admin" ?
                        <TouchableOpacity
                            style={styles.editModulesButton}
                            onPress={() => {
                                navigation.navigate("AjustesModulos", { negocio });
                            }}
                            testID="edit-modules-button"
                        >
                            <MaterialIcons name="edit" size={24} color="#1976D2" />
                        </TouchableOpacity>
                        : null
                }

            </View>

            <ScrollView contentContainerStyle={styles.modulosContainer}>
                {modulosVisibles.map((modulo) => (
                    <TouchableOpacity
                        key={modulo.id}
                        style={styles.moduloCard}
                        onPress={() => handleModuloPress(modulo)}
                        testID={`modulo-${modulo.id}`}
                    >
                        <View style={[styles.moduloIconContainer, { backgroundColor: modulo.color + "20" }]}>
                            <MaterialIcons name={modulo.icono} size={32} color={modulo.color} />
                        </View>
                        <Text style={styles.moduloText}>{modulo.nombre}</Text>
                    </TouchableOpacity>
                ))}
                {modulosVisibles.length === 0 ? (
                    <Text style={styles.emptyModulesText}>No hay grupos de modulos activos para este negocio.</Text>
                ) : null}
            </ScrollView>
        </View>
    );
};

export default NegocioDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
        paddingTop: 10,
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
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
    settingsButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
        marginLeft: 10,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    iconButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
        marginRight: 12,
    },
    businessName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0D47A1",
        flex: 1,
    },
    adminButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f0f7ff",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#374151",
        paddingHorizontal: 16,
        marginTop: 24,
        marginBottom: 12,
    },
    modulosContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 12,
        justifyContent: "space-between",
        marginTop: 12,
    },
    moduloCard: {
        width: "47%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 4,
        marginBottom: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    moduloIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    moduloText: {
        fontWeight: "600",
        fontSize: 14,
        color: "#374151",
        textAlign: "center",
    },
    emptyModulesText: {
        width: "100%",
        textAlign: "center",
        color: "#6b7280",
        fontSize: 15,
        marginTop: 24,
        paddingHorizontal: 16,
    },
});
