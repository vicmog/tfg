/// <reference types="jest" />
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Compras from "../Compras";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { mockNavigation, mockRoute } from "./data";

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

describe("Compras", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("renderiza compras y abre detalle", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    compras: [
                        {
                            id_compra: 10,
                            id_negocio: 1,
                            fecha: "2026-04-02T10:00:00.000Z",
                            importe_total: 20,
                            estado: "pendiente",
                            proveedor: "Proveedor Uno",
                        },
                    ],
                    pagination: { page: 1, limit: 20, total: 1, has_more: false },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    compra: {
                        id_compra: 10,
                        id_negocio: 1,
                        fecha: "2026-04-02T10:00:00.000Z",
                        importe_total: 20,
                        estado: "pendiente",
                        proveedor: "Proveedor Uno",
                        productos: [
                            {
                                id_producto: 7,
                                nombre: "Champu",
                                cantidad_esperada: 2,
                                cantidad_llegada: 1,
                                proveedor_nombre: "Proveedor Uno",
                            },
                        ],
                    },
                }),
            });

        const { getByTestId } = render(
            <Compras navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("compras-item-0")).toBeTruthy();
        });

        fireEvent.press(getByTestId("compras-item-0"));

        await waitFor(() => {
            expect(getByTestId("compras-detail-close-button")).toBeTruthy();
        });

        expect(fetch).toHaveBeenCalledWith(
            API_ROUTES.compraById(10),
            expect.objectContaining({
                headers: { Authorization: "Bearer mock-token" },
            })
        );
    });

    it("aplica filtro solo por fecha", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                compras: [],
                pagination: { page: 1, limit: 20, total: 0, has_more: false },
            }),
        });

        const { getByTestId } = render(
            <Compras navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenCalled();
        });

        fireEvent.press(getByTestId("compras-open-filters-button"));
        fireEvent.changeText(getByTestId("compras-filter-fecha-input"), "2026-04-02");
        fireEvent.press(getByTestId("compras-apply-filters-button"));

        await waitFor(() => {
            const calls = (fetch as jest.Mock).mock.calls.map((call) => call[0]);
            expect(calls.some((url: string) => url.includes("fecha=2026-04-02") && !url.includes("proveedor="))).toBe(true);
        });
    });

    it("navega a crear compra", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                compras: [],
                pagination: { page: 1, limit: 20, total: 0, has_more: false },
            }),
        });

        const { getByTestId } = render(
            <Compras navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("compras-go-create-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("compras-go-create-button"));

        expect(mockNavigation.navigate).toHaveBeenCalledWith("CrearCompra", { negocio: mockRoute.params.negocio });
    });
});
