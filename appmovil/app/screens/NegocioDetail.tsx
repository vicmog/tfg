import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { Modulo } from "./types";

type NegocioDetailProps = NativeStackScreenProps<
    NavigationScreenList,
    "NegocioDetail"
>;


const modulos: Modulo[] = [
    { id: "clientes", nombre: "Gestión de Clientes", icono: "people", color: "#4CAF50" },
    { id: "productos", nombre: "Productos", icono: "inventory", color: "#2196F3" },
    { id: "proveedores", nombre: "Proveedores", icono: "local-shipping", color: "#FF9800" },
    { id: "servicios", nombre: "Servicios", icono: "build", color: "#9C27B0" },
    { id: "reservas", nombre: "Reservas", icono: "event", color: "#00BCD4" },
    { id: "ventas", nombre: "Ventas", icono: "point-of-sale", color: "#E91E63" },
    { id: "gastos", nombre: "Gastos", icono: "receipt-long", color: "#F44336" },
    { id: "empleados", nombre: "Empleados", icono: "badge", color: "#607D8B" },
];

const NegocioDetail: React.FC<NegocioDetailProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const handleModuloPress = (modulo: Modulo) => {
        console.log(`Navegando a ${modulo.nombre}`);
    };

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
                                    console.log("Ajustes de permisos");
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
                                console.log("Editar Modulos");
                            }}
                            testID="edit-modules-button"
                        >
                            <MaterialIcons name="edit" size={24} color="#1976D2" />
                        </TouchableOpacity>
                        : null
                }

            </View>

            <ScrollView contentContainerStyle={styles.modulosContainer}>
                {modulos.map((modulo) => (
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
});
