import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EditarProducto from "../EditarProducto";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { mockEditarRoute, mockEditarRouteTrabajador, mockNavigation } from "./data";

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

describe("EditarProducto", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("muestra valores iniciales del producto", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                proveedores: [
                    { id_proveedor: 7, id_negocio: 1, nombre: "Proveedor Norte", cif_nif: "B123", contacto: "Ana", tipo_proveedor: "General" },
                ],
            }),
        });

        const { getByDisplayValue } = render(
            <EditarProducto navigation={mockNavigation} route={mockEditarRoute} />
        );

        await waitFor(() => {
            expect(getByDisplayValue("Champu")).toBeTruthy();
            expect(getByDisplayValue("CH-001")).toBeTruthy();
        });
    });

    it("actualiza producto y redirige a productos", async () => {
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
                    message: "Producto actualizado correctamente",
                }),
            });

        const { getByTestId } = render(
            <EditarProducto navigation={mockNavigation} route={mockEditarRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("producto-editar-save-button")).toBeTruthy();
        });

        fireEvent.changeText(getByTestId("producto-editar-nombre-input"), "Champu premium");
        fireEvent.changeText(getByTestId("producto-editar-precio-venta-input"), "14");
        fireEvent.press(getByTestId("producto-editar-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.updateProductoById(5),
                expect.objectContaining({
                    method: "PUT",
                    headers: expect.objectContaining({
                        "Content-Type": "application/json",
                        Authorization: "Bearer mock-token",
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(mockNavigation.navigate).toHaveBeenCalledWith("Productos", {
                negocio: mockEditarRoute.params.negocio,
            });
        });
    });

    it("muestra error de validacion si falta nombre", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                proveedores: [
                    { id_proveedor: 7, id_negocio: 1, nombre: "Proveedor Norte", cif_nif: "B123", contacto: "Ana", tipo_proveedor: "General" },
                ],
            }),
        });

        const { getByTestId, getByText } = render(
            <EditarProducto navigation={mockNavigation} route={mockEditarRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("producto-editar-nombre-input")).toBeTruthy();
        });

        fireEvent.changeText(getByTestId("producto-editar-nombre-input"), "");
        fireEvent.press(getByTestId("producto-editar-save-button"));

        expect(getByText("El nombre del producto es obligatorio")).toBeTruthy();
    });

    it("bloquea gestion para rol sin permisos", async () => {
        const { getByTestId, queryByTestId } = render(
            <EditarProducto navigation={mockNavigation} route={mockEditarRouteTrabajador} />
        );

        expect(getByTestId("productos-editar-no-access-message")).toBeTruthy();
        expect(queryByTestId("producto-editar-save-button")).toBeNull();
    });
});