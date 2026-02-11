import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationScreenList } from "..";
import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { UsuarioAcceso } from "./types";

type NegocioUsersProps = NativeStackScreenProps<
    NavigationScreenList,
    "NegocioUsers"
>;

const NegocioUsers: React.FC<NegocioUsersProps> = ({ route, navigation }) => {
    const { negocio } = route.params;
    const [usuarios, setUsuarios] = useState<UsuarioAcceso[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchUsuarios = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(
                `http://localhost:3000/v1/api/negocios/users/${negocio.id_negocio}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setUsuarios(data.usuarios || []);
            } else {
                const data = await response.json();
                setError(data.message || "No se pudieron cargar los usuarios");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchUsuarios();
        }, [fetchUsuarios])
    );

    const handleAddUser = () => {
        Alert.alert("Añadir usuario", "Funcionalidad pendiente de implementar");
    };

    const renderItem = ({ item }: { item: UsuarioAcceso }) => (
        <View style={styles.userCard} testID={`user-item-${item.id_usuario}`}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.nombre}</Text>
                <Text style={styles.userUsername}>@{item.nombre_usuario}</Text>
            </View>
            <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{item.rol}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.goBack()}
                    testID="back-button"
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Usuarios con acceso</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddUser}
                    testID="add-user-button"
                >
                    <MaterialIcons name="person-add" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Añadir</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>
                    Negocio: {negocio.nombre}
                </Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1976D2" />
                        <Text style={styles.loadingText}>Cargando usuarios...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : usuarios.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No hay usuarios con acceso</Text>
                    </View>
                ) : (
                    <FlatList
                        data={usuarios}
                        keyExtractor={(item) => item.id_usuario.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </View>
    );
};

export default NegocioUsers;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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
        fontSize: 17,
        fontWeight: "700",
        color: "#374151",
        flex: 1,
        textAlign: "center",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#1976D2",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    content: {
        padding: 16,
        flex: 1,
    },
    subtitle: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 12,
        fontWeight: "500",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 40,
    },
    loadingText: {
        marginTop: 12,
        color: "#6b7280",
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 40,
    },
    emptyText: {
        color: "#6b7280",
        fontSize: 14,
    },
    errorText: {
        color: "#F44336",
        fontSize: 14,
        textAlign: "center",
    },
    listContent: {
        paddingBottom: 12,
    },
    userCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0D47A1",
    },
    userUsername: {
        fontSize: 13,
        color: "#6b7280",
        marginTop: 4,
    },
    roleBadge: {
        backgroundColor: "#e0f2fe",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        marginLeft: 12,
    },
    roleText: {
        color: "#0369a1",
        fontWeight: "600",
        fontSize: 12,
        textTransform: "capitalize",
    },
});
