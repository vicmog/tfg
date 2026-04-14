import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EditarReserva from "../EditarReserva";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { mockNavigation, mockNegocio } from "./data";

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

const mockReserva = {
    id_reserva: 11,
    id_recurso: 7,
    id_cliente: 5,
    id_servicio: 3,
    servicio_nombre: "Corte premium",
    duracion_minutos: 60,
    fecha_hora_inicio: "2026-04-12T09:00:00.000Z",
    fecha_hora_fin: "2026-04-12T10:00:00.000Z",
    estado: "pendiente",
};

const mockRoute = {
    params: { negocio: mockNegocio, reserva: mockReserva },
} as any;

describe("EditarReserva", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("actualiza una reserva correctamente", async () => {
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
                    servicios: [{ id_servicio: 3, id_negocio: 1, nombre: "Corte premium", precio: 20, duracion: 60, descripcion: "x" }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ reservas: [] }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Reserva actualizada correctamente", reserva: { id_reserva: 11 } }),
            });

        const { getByTestId } = render(<EditarReserva navigation={mockNavigation} route={mockRoute} />);

        await waitFor(() => {
            expect(getByTestId("editar-reserva-save-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("editar-reserva-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.updateReservaById(11),
                expect.objectContaining({
                    method: "PUT",
                    headers: expect.objectContaining({
                        "Content-Type": "application/json",
                        Authorization: "Bearer mock-token",
                    }),
                })
            );
        });

        expect(mockNavigation.goBack).toHaveBeenCalled();
    });
});
