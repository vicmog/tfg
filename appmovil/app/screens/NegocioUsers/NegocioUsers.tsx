import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Alert,
    Modal,
    TextInput,
    ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { UsuarioAcceso } from "../types";
import {
    CONNECTION_ERROR,
    DEFAULT_FETCH_USERS_ERROR,
    DEFAULT_GRANT_ACCESS_ERROR,
    DEFAULT_SEARCH_USERS_ERROR,
    SEARCH_DEBOUNCE_MS,
    negocioUsersByIdRoute,
    searchUsersRoute,
} from "./constants";
import { NegocioUsersProps } from "./types";

const NegocioUsers: React.FC<NegocioUsersProps> = ({ route, navigation }) => {
    const { negocio } = route.params;
    const [usuarios, setUsuarios] = useState<UsuarioAcceso[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UsuarioAcceso[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [modalError, setModalError] = useState("");
    const [selectedRole, setSelectedRole] = useState<"trabajador" | "jefe">("trabajador");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    const fetchUsuarios = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(
                negocioUsersByIdRoute(negocio.id_negocio),
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
                setError(data.message || DEFAULT_FETCH_USERS_ERROR);
            }
        } catch (err) {
            setError(CONNECTION_ERROR);
        } finally {
            setLoading(false);
        }
    }, [negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchUsuarios();
        }, [fetchUsuarios])
    );

    useEffect(() => {
        if (!modalVisible) {
            return;
        }

        const timeout = setTimeout(async () => {
            const trimmed = searchTerm.trim();
            if (!trimmed) {
                setSearchResults([]);
                setSearchLoading(false);
                return;
            }

            setSearchLoading(true);
            setModalError("");
            try {
                const token = await AsyncStorage.getItem("token");
                const response = await fetch(
                    searchUsersRoute(trimmed),
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data.usuarios || []);
                } else {
                    const data = await response.json();
                    setModalError(data.message || DEFAULT_SEARCH_USERS_ERROR);
                    setSearchResults([]);
                }
            } catch (err) {
                setModalError(CONNECTION_ERROR);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [modalVisible, searchTerm]);

    const handleAddUser = () => {
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSearchTerm("");
        setSearchResults([]);
        setModalError("");
        setSelectedUserId(null);
        setSelectedRole("trabajador");
    };

    const handleGrantAccess = async () => {
        if (!selectedUserId) {
            Alert.alert("Selecciona un usuario", "Elige un usuario para asignar acceso.");
            return;
        }

        setModalError("");
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(
                negocioUsersByIdRoute(negocio.id_negocio),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        id_usuario: selectedUserId,
                        rol: selectedRole,
                    }),
                }
            );

            if (response.ok) {
                handleCloseModal();
                fetchUsuarios();
            } else {
                const data = await response.json();
                setModalError(data.message || DEFAULT_GRANT_ACCESS_ERROR);
            }
        } catch (err) {
            setModalError(CONNECTION_ERROR);
        }
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

    const existingUserIds = new Set(usuarios.map((user) => user.id_usuario));

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

            <Modal
                visible={modalVisible}
                animationType="fade"
                transparent
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Dar permiso a usuario</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={handleCloseModal}
                                testID="close-modal-button"
                            >
                                <MaterialIcons name="close" size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por nombre o usuario"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            autoCapitalize="none"
                            testID="user-search-input"
                        />

                        <View style={styles.roleSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    selectedRole === "trabajador" && styles.roleOptionActive,
                                ]}
                                onPress={() => setSelectedRole("trabajador")}
                                testID="role-trabajador-button"
                            >
                                <Text
                                    style={[
                                        styles.roleOptionText,
                                        selectedRole === "trabajador" && styles.roleOptionTextActive,
                                    ]}
                                >
                                    trabajador
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    selectedRole === "jefe" && styles.roleOptionActive,
                                ]}
                                onPress={() => setSelectedRole("jefe")}
                                testID="role-jefe-button"
                            >
                                <Text
                                    style={[
                                        styles.roleOptionText,
                                        selectedRole === "jefe" && styles.roleOptionTextActive,
                                    ]}
                                >
                                    jefe
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {modalError ? (
                            <Text style={styles.modalError}>{modalError}</Text>
                        ) : null}

                        <View style={styles.searchResults}>
                            {searchLoading ? (
                                <View style={styles.loadingSmall}>
                                    <ActivityIndicator size="small" color="#1976D2" />
                                </View>
                            ) : searchResults.length === 0 ? (
                                <Text style={styles.emptySearchText}>Sin resultados</Text>
                            ) : (
                                <ScrollView>
                                    {searchResults.map((user) => {
                                        const alreadyAdded = existingUserIds.has(user.id_usuario);
                                        const isSelected = selectedUserId === user.id_usuario;
                                        return (
                                            <TouchableOpacity
                                                key={user.id_usuario}
                                                style={[
                                                    styles.searchResultItem,
                                                    isSelected && styles.searchResultItemActive,
                                                    alreadyAdded && styles.searchResultItemDisabled,
                                                ]}
                                                onPress={() => {
                                                    if (!alreadyAdded) {
                                                        setSelectedUserId(user.id_usuario);
                                                    }
                                                }}
                                                disabled={alreadyAdded}
                                                testID={`search-user-${user.id_usuario}`}
                                            >
                                                <View>
                                                    <Text style={styles.searchResultName}>{user.nombre}</Text>
                                                    <Text style={styles.searchResultUsername}>@{user.nombre_usuario}</Text>
                                                    {alreadyAdded ? (
                                                        <Text style={styles.searchResultHint}>Ya tiene acceso</Text>
                                                    ) : null}
                                                </View>
                                                {isSelected ? (
                                                    <MaterialIcons name="check-circle" size={20} color="#1976D2" />
                                                ) : null}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleGrantAccess}
                            testID="confirm-add-user-button"
                        >
                            <Text style={styles.confirmButtonText}>Dar acceso</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        padding: 20,
        width: "100%",
        maxWidth: 420,
        maxHeight: "85%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    modalCloseButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: "#f3f4f6",
    },
    searchInput: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 10,
        fontSize: 14,
        backgroundColor: "#f9fafb",
        marginBottom: 12,
    },
    roleSelector: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    roleOption: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
        backgroundColor: "#fff",
    },
    roleOptionActive: {
        borderColor: "#1976D2",
        backgroundColor: "#e0f2fe",
    },
    roleOptionText: {
        color: "#6b7280",
        fontWeight: "600",
        textTransform: "capitalize",
    },
    roleOptionTextActive: {
        color: "#1976D2",
    },
    modalError: {
        color: "#F44336",
        marginBottom: 8,
        fontSize: 13,
    },
    searchResults: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 8,
        minHeight: 140,
        maxHeight: 260,
        marginBottom: 12,
    },
    emptySearchText: {
        color: "#9ca3af",
        fontSize: 13,
        textAlign: "center",
        marginTop: 16,
    },
    searchResultItem: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#f3f4f6",
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
    },
    searchResultItemActive: {
        borderColor: "#1976D2",
        backgroundColor: "#f0f7ff",
    },
    searchResultItemDisabled: {
        opacity: 0.6,
    },
    searchResultName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    searchResultUsername: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
    },
    searchResultHint: {
        fontSize: 11,
        color: "#9ca3af",
        marginTop: 4,
    },
    loadingSmall: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 20,
    },
    confirmButton: {
        backgroundColor: "#1976D2",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    confirmButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
});
