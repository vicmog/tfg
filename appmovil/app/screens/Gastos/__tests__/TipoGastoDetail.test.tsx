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

jest.mock("@react-native-community/datetimepicker", () => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return ({ onChange, testID }: { onChange: (event: { type: string }, date: Date) => void; testID?: string }) => (
        <TouchableOpacity
            testID={testID || "mock-datetimepicker"}
            onPress={() => onChange({ type: "set" }, new Date(2026, 3, 5))}
        >
            <Text>Mock Date Picker</Text>
        </TouchableOpacity>
    );
});

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

        const { getByText, getByTestId, queryByText, queryByTestId } = render(
            <TipoGastoDetail navigation={mockNavigation} route={mockDetailRoute} />
        );

        await waitFor(() => {
            expect(getByText("Factura de abril")).toBeTruthy();
        });

        expect(queryByText("No debe salir")).toBeNull();

        fireEvent.press(getByTestId("toggle-gasto-form-button"));
        fireEvent.changeText(getByTestId("gasto-nombre-input"), "Nueva factura");
        fireEvent.press(getByTestId("gasto-fecha-input"));
        if (queryByTestId("gasto-fecha-date-picker")) {
            fireEvent.press(getByTestId("gasto-fecha-date-picker"));
        } else {
            fireEvent.press(getByTestId("gasto-fecha-calendar-day-5"));
        }
        fireEvent.changeText(getByTestId("gasto-importe-input"), "15");
        fireEvent.press(getByTestId("gasto-save-button"));

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