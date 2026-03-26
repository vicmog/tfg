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

describe("Productos", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("renderiza y obtiene proveedores", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                proveedores: [
                    { id_proveedor: 7, id_negocio: 1, nombre: "Proveedor Norte", cif_nif: "B123", contacto: "Ana", tipo_proveedor: "General" },
                ],
            }),
        });

        const { getByText } = render(
            <Productos navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.proveedoresByNegocio(1),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        expect(getByText("Proveedor Norte")).toBeTruthy();
    });

    it("muestra validacion si falta referencia", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                proveedores: [
                    { id_proveedor: 7, id_negocio: 1, nombre: "Proveedor Norte", cif_nif: "B123", contacto: "Ana", tipo_proveedor: "General" },
                ],
            }),
        });

        const { getByTestId, getByText } = render(
            <Productos navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("producto-proveedor-option-7")).toBeTruthy();
        });

        fireEvent.changeText(getByTestId("producto-nombre-input"), "Champu");
        fireEvent.press(getByTestId("producto-proveedor-option-7"));
        fireEvent.changeText(getByTestId("producto-categoria-input"), "Cosmetica");
        fireEvent.changeText(getByTestId("producto-precio-compra-input"), "5.2");
        fireEvent.changeText(getByTestId("producto-precio-venta-input"), "10");
        fireEvent.changeText(getByTestId("producto-stock-input"), "8");
        fireEvent.press(getByTestId("producto-save-button"));

        await waitFor(() => {
            expect(getByText("La referencia del producto es obligatoria")).toBeTruthy();
        });
    });

    it("crea producto y muestra mensaje de exito", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    proveedores: [
                        { id_proveedor: 7, id_negocio: 1, nombre: "Proveedor Norte", cif_nif: "B123", contacto: "Ana", tipo_proveedor: "General" },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Producto creado correctamente",
                    producto: {
                        id_producto: 5,
                        id_proveedor: 7,
                        nombre: "Champu",
                    },
                }),
            });

        const { getByTestId, getByText } = render(
            <Productos navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("producto-proveedor-option-7")).toBeTruthy();
        });

        fireEvent.changeText(getByTestId("producto-nombre-input"), "Champu");
        fireEvent.changeText(getByTestId("producto-referencia-input"), "CH-001");
        fireEvent.press(getByTestId("producto-proveedor-option-7"));
        fireEvent.changeText(getByTestId("producto-categoria-input"), "Cosmetica");
        fireEvent.changeText(getByTestId("producto-precio-compra-input"), "5.2");
        fireEvent.changeText(getByTestId("producto-precio-venta-input"), "10");
        fireEvent.changeText(getByTestId("producto-stock-input"), "8");
        fireEvent.press(getByTestId("producto-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.productos,
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        "Content-Type": "application/json",
                        Authorization: "Bearer mock-token",
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(getByText("Producto creado correctamente")).toBeTruthy();
        });
    });

    it("bloquea la gestion si el rol no es jefe ni admin", async () => {
        const { getByTestId, queryByTestId } = render(
            <Productos navigation={mockNavigation} route={mockRouteTrabajador} />
        );

        expect(getByTestId("productos-no-access-message")).toBeTruthy();
        expect(queryByTestId("producto-save-button")).toBeNull();
    });
});
