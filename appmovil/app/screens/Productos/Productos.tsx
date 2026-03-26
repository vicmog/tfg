import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Producto } from "../types";
import {
    ADD_PRODUCT_BUTTON,
    ADMIN_ROLE,
    CONNECTION_ERROR,
    DEFAULT_PRODUCTS_ERROR,
    EMPTY_PRODUCTS_MESSAGE,
    JEFE_ROLE,
    NO_ACCESS_MESSAGE,
    SCREEN_TITLE,
    SEARCH_PRODUCT,
    productosByNegocioRoute,
} from "./constants";
import { ProductosProps } from "./types";

const Productos: React.FC<ProductosProps> = ({ route, navigation }) => {
    const { negocio } = route.params;

    const [productos, setProductos] = useState<Producto[]>([]);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(false);
    const [listError, setListError] = useState("");

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageProductos = normalizedRole === JEFE_ROLE || normalizedRole === ADMIN_ROLE;

    const filteredProductos = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        if (!query) {
            return productos;
        }

        return productos.filter((producto) =>
            producto.nombre.toLowerCase().includes(query)
            || producto.referencia.toLowerCase().includes(query)
            || producto.categoria.toLowerCase().includes(query)
            || (producto.proveedor_nombre || "").toLowerCase().includes(query)
        );
    }, [productos, searchText]);

    const fetchProductos = useCallback(async () => {
        if (!canManageProductos) {
            setProductos([]);
            setListError(NO_ACCESS_MESSAGE);
            return;
        }

        setLoading(true);
        setListError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(productosByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setListError(data.message || DEFAULT_PRODUCTS_ERROR);
                setProductos([]);
                return;
            }

            const data = await response.json();
            setProductos(data.productos || []);
        } catch (error) {
            setListError(CONNECTION_ERROR);
            setProductos([]);
        } finally {
            setLoading(false);
        }
    }, [canManageProductos, negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchProductos();
        }, [fetchProductos])
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
                <Text style={styles.title}>{SCREEN_TITLE}</Text>
                {canManageProductos ? (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate("CrearProducto", { negocio })}
                        testID="productos-add-button"
                    >
                        <MaterialIcons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.addButtonText}>{ADD_PRODUCT_BUTTON}</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {canManageProductos ? (
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                    <TextInput
                        placeholder={SEARCH_PRODUCT}
                        placeholderTextColor="#000000"
                        value={searchText}
                        onChangeText={setSearchText}
                        style={styles.searchInput}
                        autoCapitalize="none"
                        testID="productos-search-input"
                    />
                </View>
            ) : null}

            {listError ? (
                <View style={styles.feedbackError} testID="productos-list-error-message">
                    <Text style={styles.feedbackErrorText}>{listError}</Text>
                </View>
            ) : null}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976D2" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {!filteredProductos.length && !listError ? (
                        <Text style={styles.emptyText}>{EMPTY_PRODUCTS_MESSAGE}</Text>
                    ) : null}

                    {filteredProductos.map((producto) => (
                        <View key={producto.id_producto} style={styles.productCard} testID={`producto-card-${producto.id_producto}`}>
                            <View style={styles.cardTopRow}>
                                <Text style={styles.productName}>{producto.nombre}</Text>
                                <Text style={styles.productPrice}>{Number(producto.precio_venta).toFixed(2)} EUR</Text>
                            </View>
                            <Text style={styles.productMeta}>Ref: {producto.referencia}</Text>
                            <Text style={styles.productMeta}>Categoria: {producto.categoria}</Text>
                            <Text style={styles.productMeta}>Proveedor: {producto.proveedor_nombre || "-"}</Text>
                            <Text style={styles.productMeta}>Stock: {producto.stock}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

export default Productos;

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
        backgroundColor: "#1976D2",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        paddingHorizontal: 10,
    },
    searchIcon: {
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        height: 42,
        color: "#111827",
    },
    feedbackError: {
        backgroundColor: "#fee2e2",
        borderColor: "#fecaca",
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    feedbackErrorText: {
        color: "#b91c1c",
        fontWeight: "600",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContainer: {
        padding: 16,
    },
    emptyText: {
        textAlign: "center",
        color: "#6b7280",
        marginTop: 20,
    },
    productCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    productName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        flex: 1,
        marginRight: 8,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1d4ed8",
    },
    productMeta: {
        color: "#4b5563",
        marginTop: 2,
    },
});
