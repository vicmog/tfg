import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Reservas from "../Reservas";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { mockNavigation, mockRoute, mockNegocio } from "./data";

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

describe("Reservas", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("renderiza y carga clientes y recursos", async () => {
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
            });

        const { getByText } = render(<Reservas navigation={mockNavigation} route={mockRoute} />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.clientesByNegocio(1),
                expect.objectContaining({ headers: { Authorization: "Bearer mock-token" } })
            );
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.recursosByNegocio(1),
                expect.objectContaining({ headers: { Authorization: "Bearer mock-token" } })
            );
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.serviciosByNegocio(1),
                expect.objectContaining({ headers: { Authorization: "Bearer mock-token" } })
            );
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.reservasByNegocio(1),
                expect.objectContaining({ headers: { Authorization: "Bearer mock-token" } })
            );
        });

        expect(getByText("Reservas")).toBeTruthy();
    });

    it("navega a CrearReserva al pulsar el boton de anadir", async () => {
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
            });

        const { getByTestId } = render(<Reservas navigation={mockNavigation} route={mockRoute} />);

        await waitFor(() => {
            expect(getByTestId("reservas-open-form-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("reservas-open-form-button"));

        expect(mockNavigation.navigate).toHaveBeenCalledWith("CrearReserva", { negocio: mockNegocio });
    });
});
