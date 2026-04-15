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

    it("cancela una reserva desde el detalle con confirmacion", async () => {
        const start = new Date();
        start.setHours(10, 0, 0, 0);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

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
                    recursos: [{ id_recurso: 7, id_negocio: 1, nombre: "Mesa 7", capacidad: 4 }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [{ id_servicio: 3, id_negocio: 1, nombre: "Comida", precio: 20, duracion: 60, descripcion: "x" }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    reservas: [{
                        id_reserva: 11,
                        id_recurso: 7,
                        id_cliente: 5,
                        id_servicio: 3,
                        servicio_nombre: "Comida",
                        duracion_minutos: 60,
                        fecha_hora_inicio: start.toISOString(),
                        fecha_hora_fin: end.toISOString(),
                        estado: "pendiente",
                    }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Reserva cancelada correctamente" }),
            })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ clientes: [] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ recursos: [] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ servicios: [] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ reservas: [] }) });

        const { getByTestId } = render(<Reservas navigation={mockNavigation} route={mockRoute} />);

        await waitFor(() => {
            expect(getByTestId("reserva-item-11")).toBeTruthy();
        });

        fireEvent.press(getByTestId("reserva-item-11"));
        fireEvent.press(getByTestId("reserva-detail-cancel-button"));
        fireEvent.press(getByTestId("reserva-confirm-yes"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.cancelReservaById(11),
                expect.objectContaining({
                    method: "PATCH",
                    headers: expect.objectContaining({ Authorization: "Bearer mock-token" }),
                })
            );
        });
    });

    it("marca una reserva como completada desde el detalle", async () => {
        const start = new Date();
        start.setHours(10, 0, 0, 0);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

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
                    recursos: [{ id_recurso: 7, id_negocio: 1, nombre: "Mesa 7", capacidad: 4 }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [{ id_servicio: 3, id_negocio: 1, nombre: "Comida", precio: 20, duracion: 60, descripcion: "x" }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    reservas: [{
                        id_reserva: 12,
                        id_recurso: 7,
                        id_cliente: 5,
                        id_servicio: 3,
                        servicio_nombre: "Comida",
                        duracion_minutos: 60,
                        fecha_hora_inicio: start.toISOString(),
                        fecha_hora_fin: end.toISOString(),
                        estado: "pendiente",
                    }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Reserva completada correctamente" }),
            })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ clientes: [] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ recursos: [] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ servicios: [] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ reservas: [] }) });

        const { getByTestId } = render(<Reservas navigation={mockNavigation} route={mockRoute} />);

        await waitFor(() => {
            expect(getByTestId("reserva-item-12")).toBeTruthy();
        });

        fireEvent.press(getByTestId("reserva-item-12"));
        fireEvent.press(getByTestId("reserva-detail-complete-button"));
        fireEvent.press(getByTestId("reserva-confirm-yes"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.completeReservaById(12),
                expect.objectContaining({
                    method: "PATCH",
                    headers: expect.objectContaining({ Authorization: "Bearer mock-token" }),
                })
            );
        });
    });

    it("no permite cancelar cuando la reserva esta completada", async () => {
        const start = new Date();
        start.setHours(10, 0, 0, 0);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        (fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ clientes: [{ id_cliente: 5, nombre: "Juan", apellido1: "Perez", id_negocio: 1, bloqueado: false }] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ recursos: [{ id_recurso: 7, id_negocio: 1, nombre: "Mesa 7", capacidad: 4 }] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ servicios: [{ id_servicio: 3, id_negocio: 1, nombre: "Comida", precio: 20, duracion: 60, descripcion: "x" }] }) })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    reservas: [{
                        id_reserva: 13,
                        id_recurso: 7,
                        id_cliente: 5,
                        id_servicio: 3,
                        servicio_nombre: "Comida",
                        duracion_minutos: 60,
                        fecha_hora_inicio: start.toISOString(),
                        fecha_hora_fin: end.toISOString(),
                        estado: "completada",
                    }],
                }),
            });

        const { getByTestId, queryByTestId } = render(<Reservas navigation={mockNavigation} route={mockRoute} />);

        await waitFor(() => {
            expect(getByTestId("reserva-item-13")).toBeTruthy();
        });

        fireEvent.press(getByTestId("reserva-item-13"));

        expect(queryByTestId("reserva-detail-cancel-button")).toBeNull();
    });

    it("no permite completar cuando la reserva esta cancelada", async () => {
        const start = new Date();
        start.setHours(10, 0, 0, 0);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        (fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ clientes: [{ id_cliente: 5, nombre: "Juan", apellido1: "Perez", id_negocio: 1, bloqueado: false }] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ recursos: [{ id_recurso: 7, id_negocio: 1, nombre: "Mesa 7", capacidad: 4 }] }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ servicios: [{ id_servicio: 3, id_negocio: 1, nombre: "Comida", precio: 20, duracion: 60, descripcion: "x" }] }) })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    reservas: [{
                        id_reserva: 14,
                        id_recurso: 7,
                        id_cliente: 5,
                        id_servicio: 3,
                        servicio_nombre: "Comida",
                        duracion_minutos: 60,
                        fecha_hora_inicio: start.toISOString(),
                        fecha_hora_fin: end.toISOString(),
                        estado: "cancelada",
                    }],
                }),
            });

        const { getByTestId, queryByTestId } = render(<Reservas navigation={mockNavigation} route={mockRoute} />);

        await waitFor(() => {
            expect(getByTestId("reserva-item-14")).toBeTruthy();
        });

        fireEvent.press(getByTestId("reserva-item-14"));

        expect(queryByTestId("reserva-detail-complete-button")).toBeNull();
    });

});
