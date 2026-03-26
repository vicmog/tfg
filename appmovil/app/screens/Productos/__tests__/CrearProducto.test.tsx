import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CrearProducto from "../CrearProducto";
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

describe("CrearProducto", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("muestra todos los proveedores cuando no hay busqueda", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                proveedores: [
                    { id_proveedor: 7, id_negocio: 1, nombre: "Proveedor Norte", cif_nif: "B123", contacto: "Ana", tipo_proveedor: "General" },
                    { id_proveedor: 8, id_negocio: 1, nombre: "Proveedor Sur", cif_nif: "B124", contacto: "Luis", tipo_proveedor: "General" },
                ],
            }),
        });

        const { getByText, getByTestId } = render(
            <CrearProducto navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("producto-proveedores-scroll")).toBeTruthy();
        });

        expect(getByText("Proveedor Norte")).toBeTruthy();
        expect(getByText("Proveedor Sur")).toBeTruthy();
    });

    it("filtra proveedores por coincidencia", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                proveedores: [
                    { id_proveedor: 7, id_negocio: 1, nombre: "Proveedor Norte", cif_nif: "B123", contacto: "Ana", tipo_proveedor: "General" },
                    { id_proveedor: 8, id_negocio: 1, nombre: "Proveedor Sur", cif_nif: "B124", contacto: "Luis", tipo_proveedor: "General" },
                ],
            }),
        });

        const { getByTestId, queryByText } = render(
            <CrearProducto navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("producto-proveedor-search-input")).toBeTruthy();
        });

        fireEvent.changeText(getByTestId("producto-proveedor-search-input"), "sur");

        expect(queryByText("Proveedor Norte")).toBeNull();
        expect(queryByText("Proveedor Sur")).toBeTruthy();
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
            <CrearProducto navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("producto-proveedor-option-7")).toBeTruthy();
        });

        fireEvent.changeText(getByTestId("producto-nombre-input"), "Champu");
        fireEvent.changeText(getByTestId("producto-referencia-input"), "CH-001");
        fireEvent.press(getByTestId("producto-proveedor-option-7"));
        fireEvent.press(getByTestId("producto-categoria-option-cosmetica"));
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

    it("permite usar categoria otra", async () => {
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
                }),
            });

        const { getByTestId } = render(
            <CrearProducto navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("producto-categoria-option-otra")).toBeTruthy();
        });

        fireEvent.changeText(getByTestId("producto-nombre-input"), "Secador");
        fireEvent.changeText(getByTestId("producto-referencia-input"), "SC-100");
        fireEvent.press(getByTestId("producto-proveedor-option-7"));
        fireEvent.press(getByTestId("producto-categoria-option-otra"));
        fireEvent.changeText(getByTestId("producto-categoria-otra-input"), "Electrodomesticos");
        fireEvent.changeText(getByTestId("producto-precio-compra-input"), "15");
        fireEvent.changeText(getByTestId("producto-precio-venta-input"), "35");
        fireEvent.changeText(getByTestId("producto-stock-input"), "6");
        fireEvent.press(getByTestId("producto-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.productos,
                expect.objectContaining({
                    body: expect.stringContaining("Electrodomesticos"),
                })
            );
        });
    });

    it("bloquea gestion para rol sin permisos", async () => {
        const { getByTestId, queryByTestId } = render(
            <CrearProducto navigation={mockNavigation} route={mockRouteTrabajador} />
        );

        expect(getByTestId("productos-no-access-message")).toBeTruthy();
        expect(queryByTestId("producto-save-button")).toBeNull();
    });
});
