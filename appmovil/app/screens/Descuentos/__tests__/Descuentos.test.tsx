import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Descuentos from "../Descuentos";
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

describe("Descuentos", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("abre modal y carga productos y aplica descuento", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    productos: [
                        {
                            id_producto: 5,
                            id_proveedor: 7,
                            nombre: "Champu",
                            referencia: "CH-001",
                            categoria: "Cosmetica",
                            precio_compra: 5,
                            precio_venta: 10,
                            stock: 8,
                            stock_minimo: 1,
                            proveedor_nombre: "Proveedor Norte",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Descuento aplicado correctamente" }),
            });

        const { getByTestId, getByText } = render(
            <Descuentos navigation={mockNavigation} route={mockRoute} />
        );

        // Abre modal
        fireEvent.press(getByTestId("toggle-descuento-form-button"));

        await waitFor(() => {
            expect(getByTestId("descuento-producto-option-5")).toBeTruthy();
        });

        fireEvent.press(getByTestId("descuento-producto-option-5"));
        fireEvent.changeText(getByTestId("descuento-porcentaje-input"), "15");
        fireEvent.press(getByTestId("descuento-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.descuentos,
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        "Content-Type": "application/json",
                        Authorization: "Bearer mock-token",
                    }),
                    body: JSON.stringify({
                        id_producto: 5,
                        porcentaje_descuento: "15",
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(getByText("Descuento aplicado correctamente")).toBeTruthy();
        });
    });

    it("valida que el porcentaje no supere 100", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                productos: [
                    {
                        id_producto: 5,
                        id_proveedor: 7,
                        nombre: "Champu",
                        referencia: "CH-001",
                        categoria: "Cosmetica",
                        precio_compra: 5,
                        precio_venta: 10,
                        stock: 8,
                        stock_minimo: 1,
                        proveedor_nombre: "Proveedor Norte",
                    },
                ],
            }),
        });

        const { getByTestId, getByText } = render(
            <Descuentos navigation={mockNavigation} route={mockRoute} />
        );

        // Abre modal
        fireEvent.press(getByTestId("toggle-descuento-form-button"));

        await waitFor(() => {
            expect(getByTestId("descuento-producto-option-5")).toBeTruthy();
        });

        fireEvent.press(getByTestId("descuento-producto-option-5"));
        fireEvent.changeText(getByTestId("descuento-porcentaje-input"), "120");
        fireEvent.press(getByTestId("descuento-save-button"));

        expect(getByText("El porcentaje debe ser mayor que 0 y menor o igual a 100")).toBeTruthy();
    });

    it("bloquea acceso para rol sin permisos", () => {
        const { getByTestId, queryByTestId } = render(
            <Descuentos navigation={mockNavigation} route={mockRouteTrabajador} />
        );

        expect(getByTestId("descuentos-no-access-message")).toBeTruthy();
        expect(queryByTestId("toggle-descuento-form-button")).toBeNull();
        expect(queryByTestId("descuento-save-button")).toBeNull();
    });
});
