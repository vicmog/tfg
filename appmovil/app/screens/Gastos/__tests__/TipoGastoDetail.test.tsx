/// <reference types="jest" />
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TipoGastoDetail from "../TipoGastoDetail";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { mockDetailRoute, mockNavigation } from "./data";

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

describe("TipoGastoDetail", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("carga los gastos de la categoria y registra uno nuevo", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gastos: [
                        {
                            id_gasto: 1,
                            id_tipo_gasto: 12,
                            nombre: "Factura de abril",
                            fecha: "2026-04-03T00:00:00.000Z",
                            importe: 48.5,
                        },
                        {
                            id_gasto: 2,
                            id_tipo_gasto: 99,
                            nombre: "No debe salir",
                            fecha: "2026-04-04T00:00:00.000Z",
                            importe: 12,
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Gasto registrado correctamente",
                    gasto: {
                        id_gasto: 3,
                        id_tipo_gasto: 12,
                        nombre: "Nueva factura",
                        fecha: "2026-04-05T00:00:00.000Z",
                        importe: 15,
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gastos: [
                        {
                            id_gasto: 1,
                            id_tipo_gasto: 12,
                            nombre: "Factura de abril",
                            fecha: "2026-04-03T00:00:00.000Z",
                            importe: 48.5,
                        },
                        {
                            id_gasto: 3,
                            id_tipo_gasto: 12,
                            nombre: "Nueva factura",
                            fecha: "2026-04-05T00:00:00.000Z",
                            importe: 15,
                        },
                    ],
                }),
            });

        const { getByText, getByPlaceholderText, getByTestId, queryByText } = render(
            <TipoGastoDetail navigation={mockNavigation} route={mockDetailRoute} />
        );

        await waitFor(() => {
            expect(getByText("Factura de abril")).toBeTruthy();
        });

        expect(queryByText("No debe salir")).toBeNull();

        fireEvent.changeText(getByPlaceholderText("Nombre del gasto"), "Nueva factura");
        fireEvent.changeText(getByPlaceholderText("Importe"), "15");
        fireEvent.press(getByText("Registrar gasto"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.gastos,
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({ Authorization: "Bearer mock-token" }),
                })
            );
        });

        expect(mockNavigation.goBack).not.toHaveBeenCalled();
        expect(getByTestId("tipo-gasto-detail-back-button")).toBeTruthy();
    });
});