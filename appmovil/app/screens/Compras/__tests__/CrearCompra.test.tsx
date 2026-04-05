/// <reference types="jest" />
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CrearCompra from "../CrearCompra";
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

jest.mock("@react-native-community/datetimepicker", () => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return ({ onChange, testID }: { onChange: (event: { type: string }, date: Date) => void; testID?: string }) => (
        <TouchableOpacity
            testID={testID || "mock-datetimepicker"}
            onPress={() => onChange({ type: "set" }, new Date(2026, 3, 2))}
        >
            <Text>Mock Date Picker</Text>
        </TouchableOpacity>
    );
});

global.fetch = jest.fn();

describe("CrearCompra", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("registra compra y vuelve atras", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    productos: [
                        { id_producto: 7, id_proveedor: 4, nombre: "Champu", precio_compra: 5, precio_venta: 10, referencia: "A", categoria: "Cosmetica", stock: 1, stock_minimo: 0 },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Compra registrada correctamente",
                }),
            });

        const { getByTestId, queryByTestId } = render(
            <CrearCompra navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("compras-row-0-open-product-picker")).toBeTruthy();
        });

        fireEvent.press(getByTestId("compras-row-0-open-product-picker"));
        await waitFor(() => {
            expect(getByTestId("compras-picker-product-7")).toBeTruthy();
        });
        fireEvent.press(getByTestId("compras-picker-product-7"));
        fireEvent.press(getByTestId("compras-fecha-input"));
        if (queryByTestId("compras-fecha-date-picker")) {
            fireEvent.press(getByTestId("compras-fecha-date-picker"));
        } else {
            fireEvent.press(getByTestId("compras-fecha-calendar-day-2"));
        }
        fireEvent.changeText(getByTestId("compras-row-0-cantidad-esperada-input"), "4");
        fireEvent.changeText(getByTestId("compras-row-0-cantidad-llegada-input"), "1");
        fireEvent.press(getByTestId("compras-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.compras,
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
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });

    it("muestra mensaje para rol sin permisos", () => {
        const { getByTestId, queryByTestId } = render(
            <CrearCompra navigation={mockNavigation} route={mockRouteTrabajador} />
        );

        expect(getByTestId("compras-no-access-message")).toBeTruthy();
        expect(queryByTestId("compras-save-button")).toBeNull();
    });
});
