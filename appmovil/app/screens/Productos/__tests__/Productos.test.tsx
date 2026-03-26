import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Productos from "../Productos";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { mockNavigation, mockRoute, mockRouteTrabajador } from "./data";

jest.mock("@expo/vector-icons", () => ({
    MaterialIcons: "MaterialIcons",
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
    useFocusEffect: (callback: () => void) => {
        const React = require("react");
        React.useEffect(() => {
            callback();
        }, [callback]);
    },
}));

global.fetch = jest.fn();

describe("Productos listado", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("renderiza y obtiene productos", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                productos: [
                    {
                        id_producto: 3,
                        id_proveedor: 7,
                        nombre: "Champu",
                        referencia: "CH-001",
                        categoria: "Cosmetica",
                        precio_venta: 10,
                        stock: 8,
                        stock_minimo: 1,
                        precio_compra: 5,
                        proveedor_nombre: "Proveedor Norte",
                    },
                ],
            }),
        });

        const { getByText } = render(
            <Productos navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.productosByNegocio(1),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        expect(getByText("Champu")).toBeTruthy();
        expect(getByText("Ref: CH-001")).toBeTruthy();
    });

    it("filtra por texto de busqueda", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                productos: [
                    { id_producto: 1, id_proveedor: 7, nombre: "Champu", referencia: "CH-001", categoria: "Cosmetica", precio_venta: 10, stock: 8, stock_minimo: 1, precio_compra: 5, proveedor_nombre: "Proveedor Norte" },
                    { id_producto: 2, id_proveedor: 8, nombre: "Tijera", referencia: "TJ-100", categoria: "Herramienta", precio_venta: 25, stock: 3, stock_minimo: 1, precio_compra: 10, proveedor_nombre: "Proveedor Sur" },
                ],
            }),
        });

        const { getByTestId, queryByText } = render(
            <Productos navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("productos-search-input")).toBeTruthy();
        });

        fireEvent.changeText(getByTestId("productos-search-input"), "tijera");

        expect(queryByText("Champu")).toBeNull();
        expect(queryByText("Tijera")).toBeTruthy();
    });

    it("navega a la pantalla de crear producto", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ productos: [] }),
        });

        const { getByTestId } = render(
            <Productos navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("productos-add-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("productos-add-button"));

        expect(mockNavigation.navigate).toHaveBeenCalledWith("CrearProducto", {
            negocio: mockRoute.params.negocio,
        });
    });

    it("bloquea la gestion si el rol no es jefe ni admin", async () => {
        const { getByTestId, queryByTestId } = render(
            <Productos navigation={mockNavigation} route={mockRouteTrabajador} />
        );

        expect(getByTestId("productos-list-error-message")).toBeTruthy();
        expect(queryByTestId("productos-add-button")).toBeNull();
    });
});
