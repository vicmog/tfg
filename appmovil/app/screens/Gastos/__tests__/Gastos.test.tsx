/// <reference types="jest" />
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Gastos from "../Gastos";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { mockGastosRoute, mockNavigation, mockTipoGasto } from "./data";

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

describe("Gastos", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("muestra los tipos de gasto y navega al detalle al pulsar una categoria", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                tipos_gasto: [mockTipoGasto],
            }),
        });

        const { getByTestId, getByText } = render(<Gastos navigation={mockNavigation} route={mockGastosRoute} />);

        await waitFor(() => {
            expect(getByText("Luz")).toBeTruthy();
        });

        fireEvent.press(getByTestId("tipo-gasto-card-12"));

        expect(mockNavigation.navigate).toHaveBeenCalledWith("TipoGastoDetail", {
            negocio: mockGastosRoute.params.negocio,
            tipoGasto: mockTipoGasto,
        });
        expect(fetch).toHaveBeenCalledWith(
            API_ROUTES.tipogastosByNegocio(mockGastosRoute.params.negocio.id_negocio),
            expect.objectContaining({
                headers: { Authorization: "Bearer mock-token" },
            })
        );
    });
});