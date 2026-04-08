import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Recursos from "../Recursos";
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

describe("Recursos", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("renderiza y obtiene recursos", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ recursos: [] }),
        });

        const { getByText, getByTestId } = render(
            <Recursos navigation={mockNavigation} route={mockRoute} />
        );

        expect(getByTestId("toggle-recurso-form-button")).toBeTruthy();

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.recursosByNegocio(1),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        expect(getByText("No hay recursos registrados")).toBeTruthy();
    });

    it("crea recurso y refresca la lista", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ recursos: [] }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Recurso creado correctamente",
                    recurso: {
                        id_recurso: 3,
                        id_negocio: 1,
                        nombre: "Sala principal",
                        capacidad: 12,
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    recursos: [
                        {
                            id_recurso: 3,
                            id_negocio: 1,
                            nombre: "Sala principal",
                            capacidad: 12,
                        },
                    ],
                }),
            });

        const { getByTestId, getByText } = render(
            <Recursos navigation={mockNavigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("toggle-recurso-form-button"));
        fireEvent.changeText(getByTestId("recurso-nombre-input"), "Sala principal");
        fireEvent.changeText(getByTestId("recurso-capacidad-input"), "12");
        fireEvent.press(getByTestId("recurso-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.recursos,
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        "Content-Type": "application/json",
                        Authorization: "Bearer mock-token",
                    }),
                    body: JSON.stringify({
                        id_negocio: 1,
                        nombre: "Sala principal",
                        capacidad: "12",
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(getByText("Recurso creado correctamente")).toBeTruthy();
            expect(getByText("Sala principal")).toBeTruthy();
        });
    });

    it("no muestra botón de crear para trabajador", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ recursos: [] }),
        });

        const { queryByTestId } = render(
            <Recursos navigation={mockNavigation} route={mockRouteTrabajador} />
        );

        await waitFor(() => {
            expect(queryByTestId("toggle-recurso-form-button")).toBeNull();
        });
    });
});
