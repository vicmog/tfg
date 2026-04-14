import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CrearReserva from "../CrearReserva";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { mockNavigation, mockRoute } from "./data";

jest.mock("@expo/vector-icons", () => ({
    MaterialIcons: "MaterialIcons",
}));

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

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

describe("CrearReserva", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("muestra validacion al guardar sin datos", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ clientes: [] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ recursos: [] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ servicios: [] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ reservas: [] }) });

        const { getByTestId, getByText } = render(<CrearReserva navigation={mockNavigation} route={mockRoute} />);

        await waitFor(() => {
            expect(getByTestId("reservas-save-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("reservas-save-button"));

        await waitFor(() => {
            expect(getByText("Debes seleccionar un cliente")).toBeTruthy();
        });
    });

    it("crea reserva correctamente", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    clientes: [{ id_cliente: 5, nombre: "Juan", apellido1: "Perez", id_negocio: 1, bloqueado: false }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    recursos: [{ id_recurso: 7, id_negocio: 1, nombre: "Sala principal", capacidad: 12 }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [{ id_servicio: 3, id_negocio: 1, nombre: "Corte premium", precio: 20, duracion: 45, descripcion: "x" }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ reservas: [] }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Reserva registrada correctamente", reserva: { id_reserva: 10 } }),
            });

        const { getByTestId } = render(<CrearReserva navigation={mockNavigation} route={mockRoute} />);

        await waitFor(() => {
            expect(getByTestId("reservas-open-clientes-picker")).toBeTruthy();
        });

        fireEvent.press(getByTestId("reservas-open-clientes-picker"));
        fireEvent.press(getByTestId("reservas-select-cliente-5"));

        fireEvent.press(getByTestId("reservas-open-recursos-picker"));
        fireEvent.press(getByTestId("reservas-select-recurso-7"));

        fireEvent.press(getByTestId("reservas-open-servicios-picker"));
        fireEvent.press(getByTestId("reservas-select-servicio-3"));

        fireEvent.changeText(getByTestId("reservas-duracion-input"), "60");
        fireEvent.press(getByTestId("reservas-slot-0800"));

        fireEvent.press(getByTestId("reservas-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.reservas,
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        "Content-Type": "application/json",
                        Authorization: "Bearer mock-token",
                    }),
                    body: expect.stringContaining('"id_servicio":3'),
                })
            );
        });

        expect(mockNavigation.goBack).toHaveBeenCalled();
    });
});
