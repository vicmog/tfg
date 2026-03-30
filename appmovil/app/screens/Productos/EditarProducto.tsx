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
import { Proveedor } from "../types";
import {
    ADMIN_ROLE,
    CATEGORY_OTHER_OPTION,
    CONNECTION_ERROR,
    DEFAULT_PROVIDERS_ERROR,
    DEFAULT_UPDATE_ERROR,
    EDIT_SCREEN_TITLE,
    EMPTY_CATEGORIA_ERROR,
    EMPTY_NOMBRE_ERROR,
    EMPTY_PRECIO_COMPRA_ERROR,
    EMPTY_PRECIO_VENTA_ERROR,
    EMPTY_PROVIDER_SEARCH_MESSAGE,
    EMPTY_PROVEEDOR_ERROR,
    EMPTY_REFERENCIA_ERROR,
    EMPTY_STOCK_ERROR,
    FORM_TITLE,
    INVALID_PRECIO_COMPRA_ERROR,
    INVALID_PRECIO_VENTA_ERROR,
    INVALID_STOCK_ERROR,
    INVALID_STOCK_MINIMO_ERROR,
    JEFE_ROLE,
    NO_ACCESS_MESSAGE,
    PRODUCT_CATEGORIES,
    PROVIDER_SEARCH_PLACEHOLDER,
    SAVE_CHANGES_BUTTON_TEXT,
    SAVING_CHANGES_BUTTON_TEXT,
    UPDATE_SUCCESS_MESSAGE,
    proveedoresByNegocioRoute,
    updateProductoByIdRoute,
} from "./constants";
import { EditarProductoProps } from "./types";

const PRICE_REGEX = /^\d+(?:[.,]\d{1,2})?$/;
const INTEGER_REGEX = /^\d+$/;
const CATEGORY_OPTION_TEST_ID_PREFIX = "producto-editar-categoria-option-";
const buildCategoryOptionTestId = (category: string) =>
    `${CATEGORY_OPTION_TEST_ID_PREFIX}${category.toLowerCase().replace(/\s+/g, "-")}`;

const EditarProducto: React.FC<EditarProductoProps> = ({ route, navigation }) => {
    const { negocio, producto } = route.params;

    const [nombre, setNombre] = useState(producto.nombre || "");
    const [referencia, setReferencia] = useState(producto.referencia || "");
    const initialCategoria = (producto.categoria || "").trim();
    const [selectedCategoria, setSelectedCategoria] = useState(
        PRODUCT_CATEGORIES.includes(initialCategoria as typeof PRODUCT_CATEGORIES[number])
            ? initialCategoria
            : CATEGORY_OTHER_OPTION
    );
    const [customCategoria, setCustomCategoria] = useState(
        PRODUCT_CATEGORIES.includes(initialCategoria as typeof PRODUCT_CATEGORIES[number]) ? "" : initialCategoria
    );
    const [precioCompra, setPrecioCompra] = useState(`${producto.precio_compra ?? ""}`);
    const [precioVenta, setPrecioVenta] = useState(`${producto.precio_venta ?? ""}`);
    const [stock, setStock] = useState(`${producto.stock ?? 0}`);
    const [stockMinimo, setStockMinimo] = useState(`${producto.stock_minimo ?? 0}`);
    const [descripcion, setDescripcion] = useState(producto.descripcion || "");
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [providerSearch, setProviderSearch] = useState("");
    const [selectedProveedorId, setSelectedProveedorId] = useState<number | null>(producto.id_proveedor || null);

    const [loadingProviders, setLoadingProviders] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const normalizedRole = (negocio.rol || "").toLowerCase();
    const canManageProductos = normalizedRole === JEFE_ROLE || normalizedRole === ADMIN_ROLE;

    const filteredProveedores = useMemo(() => {
        const query = providerSearch.trim().toLowerCase();

        if (!query) {
            return proveedores;
        }

        return proveedores.filter((proveedor) =>
            proveedor.nombre.toLowerCase().includes(query)
            || proveedor.cif_nif.toLowerCase().includes(query)
            || proveedor.contacto.toLowerCase().includes(query)
            || proveedor.tipo_proveedor.toLowerCase().includes(query)
        );
    }, [providerSearch, proveedores]);

    const selectedProveedor = useMemo(
        () => proveedores.find((proveedor) => proveedor.id_proveedor === selectedProveedorId) || null,
        [proveedores, selectedProveedorId]
    );

    const categoriaValue = useMemo(() => {
        if (selectedCategoria === CATEGORY_OTHER_OPTION) {
            return customCategoria.trim();
        }

        return selectedCategoria.trim();
    }, [customCategoria, selectedCategoria]);

    const fetchProveedores = useCallback(async () => {
        if (!canManageProductos) {
            setError(NO_ACCESS_MESSAGE);
            return;
        }

        setLoadingProviders(true);
        setError("");

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(proveedoresByNegocioRoute(negocio.id_negocio), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_PROVIDERS_ERROR);
                setProveedores([]);
                return;
            }

            const data = await response.json();
            setProveedores(data.proveedores || []);
        } catch (fetchError) {
            setError(CONNECTION_ERROR);
            setProveedores([]);
        } finally {
            setLoadingProviders(false);
        }
    }, [canManageProductos, negocio.id_negocio]);

    useFocusEffect(
        useCallback(() => {
            fetchProveedores();
        }, [fetchProveedores])
    );

    const validateForm = () => {
        if (!nombre.trim()) {
            setError(EMPTY_NOMBRE_ERROR);
            return false;
        }

        if (!referencia.trim()) {
            setError(EMPTY_REFERENCIA_ERROR);
            return false;
        }

        if (!selectedProveedorId) {
            setError(EMPTY_PROVEEDOR_ERROR);
            return false;
        }

        if (!categoriaValue) {
            setError(EMPTY_CATEGORIA_ERROR);
            return false;
        }

        const precioCompraValue = precioCompra.trim();

        if (!precioCompraValue) {
            setError(EMPTY_PRECIO_COMPRA_ERROR);
            return false;
        }

        if (!PRICE_REGEX.test(precioCompraValue) || Number.parseFloat(precioCompraValue.replace(",", ".")) <= 0) {
            setError(INVALID_PRECIO_COMPRA_ERROR);
            return false;
        }

        const precioVentaValue = precioVenta.trim();

        if (!precioVentaValue) {
            setError(EMPTY_PRECIO_VENTA_ERROR);
            return false;
        }

        if (!PRICE_REGEX.test(precioVentaValue) || Number.parseFloat(precioVentaValue.replace(",", ".")) <= 0) {
            setError(INVALID_PRECIO_VENTA_ERROR);
            return false;
        }

        const stockValue = stock.trim();

        if (!stockValue) {
            setError(EMPTY_STOCK_ERROR);
            return false;
        }

        if (!INTEGER_REGEX.test(stockValue)) {
            setError(INVALID_STOCK_ERROR);
            return false;
        }

        if (stockMinimo.trim() && !INTEGER_REGEX.test(stockMinimo.trim())) {
            setError(INVALID_STOCK_MINIMO_ERROR);
            return false;
        }

        return true;
    };

    const handleSaveChanges = async () => {
        setError("");
        setSuccess("");

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(updateProductoByIdRoute(producto.id_producto), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_proveedor: selectedProveedorId,
                    nombre: nombre.trim(),
                    referencia: referencia.trim(),
                    categoria: categoriaValue,
                    precio_compra: precioCompra.trim(),
                    precio_venta: precioVenta.trim(),
                    stock: stock.trim(),
                    stock_minimo: stockMinimo.trim() || "0",
                    descripcion: descripcion.trim(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || DEFAULT_UPDATE_ERROR);
                return;
            }

            setSuccess(UPDATE_SUCCESS_MESSAGE);
            navigation.navigate("Productos", { negocio });
        } catch (saveError) {
            setError(CONNECTION_ERROR);
        } finally {
            setSaving(false);
        }
    };

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
                <Text style={styles.title}>{EDIT_SCREEN_TITLE}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {!canManageProductos ? (
                    <Text style={styles.errorText} testID="productos-editar-no-access-message">
                        {NO_ACCESS_MESSAGE}
                    </Text>
                ) : (
                    <>
                        <Text style={styles.formTitle}>{FORM_TITLE}</Text>

                        {loadingProviders ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#1976D2" testID="productos-editar-loading-proveedores" />
                                <Text style={styles.loadingText}>Cargando proveedores...</Text>
                            </View>
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Nombre"
                            value={nombre}
                            onChangeText={setNombre}
                            testID="producto-editar-nombre-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Referencia"
                            value={referencia}
                            onChangeText={setReferencia}
                            testID="producto-editar-referencia-input"
                        />

                        <Text style={styles.label}>Proveedor</Text>
                        <View style={styles.providersList} testID="producto-editar-proveedores-scroll">
                            <TextInput
                                style={styles.input}
                                placeholder={PROVIDER_SEARCH_PLACEHOLDER}
                                value={providerSearch}
                                onChangeText={setProviderSearch}
                                testID="producto-editar-proveedor-search-input"
                            />
                            <ScrollView nestedScrollEnabled>
                                {filteredProveedores.map((proveedor) => (
                                    <TouchableOpacity
                                        key={proveedor.id_proveedor}
                                        style={[
                                            styles.providerChip,
                                            selectedProveedorId === proveedor.id_proveedor && styles.providerChipSelected,
                                        ]}
                                        onPress={() => setSelectedProveedorId(proveedor.id_proveedor)}
                                        testID={`producto-editar-proveedor-option-${proveedor.id_proveedor}`}
                                    >
                                        <Text
                                            style={[
                                                styles.providerChipText,
                                                selectedProveedorId === proveedor.id_proveedor && styles.providerChipTextSelected,
                                            ]}
                                        >
                                            {proveedor.nombre}
                                        </Text>
                                    </TouchableOpacity>
                                ))}

                                {!filteredProveedores.length ? (
                                    <Text style={styles.emptyProvidersText}>{EMPTY_PROVIDER_SEARCH_MESSAGE}</Text>
                                ) : null}
                            </ScrollView>
                        </View>

                        {selectedProveedor ? (
                            <Text style={styles.helperText} testID="producto-editar-proveedor-selected">
                                Seleccionado: {selectedProveedor.nombre}
                            </Text>
                        ) : null}

                        <Text style={styles.label}>Categoria</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.categoriesScroll}
                            contentContainerStyle={styles.categoriesContainer}
                            testID="producto-editar-categorias-scroll"
                        >
                            {PRODUCT_CATEGORIES.map((categoryOption) => (
                                <TouchableOpacity
                                    key={categoryOption}
                                    style={[
                                        styles.categoryChip,
                                        selectedCategoria === categoryOption && styles.categoryChipSelected,
                                    ]}
                                    onPress={() => setSelectedCategoria(categoryOption)}
                                    testID={buildCategoryOptionTestId(categoryOption)}
                                >
                                    <Text
                                        style={[
                                            styles.categoryChipText,
                                            selectedCategoria === categoryOption && styles.categoryChipTextSelected,
                                        ]}
                                    >
                                        {categoryOption}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {selectedCategoria === CATEGORY_OTHER_OPTION ? (
                            <TextInput
                                style={styles.input}
                                placeholder="Escribe la categoria"
                                value={customCategoria}
                                onChangeText={setCustomCategoria}
                                testID="producto-editar-categoria-otra-input"
                            />
                        ) : null}

                        <TextInput
                            style={styles.input}
                            placeholder="Precio compra"
                            value={precioCompra}
                            onChangeText={setPrecioCompra}
                            keyboardType="decimal-pad"
                            testID="producto-editar-precio-compra-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Precio venta"
                            value={precioVenta}
                            onChangeText={setPrecioVenta}
                            keyboardType="decimal-pad"
                            testID="producto-editar-precio-venta-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Stock"
                            value={stock}
                            onChangeText={setStock}
                            keyboardType="number-pad"
                            testID="producto-editar-stock-input"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Stock minimo (opcional)"
                            value={stockMinimo}
                            onChangeText={setStockMinimo}
                            keyboardType="number-pad"
                            testID="producto-editar-stock-minimo-input"
                        />

                        <TextInput
                            style={[styles.input, styles.descriptionInput]}
                            placeholder="Descripcion (opcional)"
                            value={descripcion}
                            onChangeText={setDescripcion}
                            multiline
                            testID="producto-editar-descripcion-input"
                        />

                        {error ? (
                            <Text style={styles.errorText} testID="producto-editar-error-message">
                                {error}
                            </Text>
                        ) : null}

                        {success ? (
                            <Text style={styles.successText} testID="producto-editar-success-message">
                                {success}
                            </Text>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSaveChanges}
                            disabled={saving}
                            testID="producto-editar-save-button"
                        >
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
                            <Text style={styles.saveButtonText}>{saving ? SAVING_CHANGES_BUTTON_TEXT : SAVE_CHANGES_BUTTON_TEXT}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

export default EditarProducto;

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
        gap: 10,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 6,
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    loadingText: {
        marginLeft: 8,
        color: "#4b5563",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 4,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: "#111827",
    },
    providersList: {
        maxHeight: 220,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        padding: 8,
    },
    providerChip: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
        alignSelf: "flex-start",
        backgroundColor: "#fff",
    },
    providerChipSelected: {
        backgroundColor: "#e0f2fe",
        borderColor: "#0284c7",
    },
    providerChipText: {
        color: "#374151",
    },
    providerChipTextSelected: {
        color: "#0c4a6e",
        fontWeight: "700",
    },
    emptyProvidersText: {
        color: "#6b7280",
        marginTop: 6,
    },
    helperText: {
        fontSize: 13,
        color: "#0f766e",
    },
    categoriesScroll: {
        maxHeight: 48,
    },
    categoriesContainer: {
        alignItems: "center",
        paddingRight: 8,
    },
    categoryChip: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        backgroundColor: "#fff",
    },
    categoryChipSelected: {
        borderColor: "#1d4ed8",
        backgroundColor: "#dbeafe",
    },
    categoryChipText: {
        color: "#374151",
    },
    categoryChipTextSelected: {
        color: "#1e3a8a",
        fontWeight: "700",
    },
    descriptionInput: {
        minHeight: 92,
        textAlignVertical: "top",
    },
    errorText: {
        color: "#b91c1c",
        fontWeight: "600",
    },
    successText: {
        color: "#166534",
        fontWeight: "700",
    },
    saveButton: {
        marginTop: 8,
        backgroundColor: "#1976D2",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
});