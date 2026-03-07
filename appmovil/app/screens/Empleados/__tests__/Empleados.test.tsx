import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Empleados from "../Empleados";
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

describe("Empleados", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("renderiza y obtiene empleados", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ empleados: [] }),
        });

        const { getByText, getByTestId } = render(
            <Empleados navigation={mockNavigation} route={mockRoute} />
        );

        expect(getByTestId("toggle-empleado-form-button")).toBeTruthy();

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.empleadosByNegocio(1),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        expect(getByText("No hay empleados registrados")).toBeTruthy();
    });

    it("muestra validación si falta nombre", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ empleados: [] }),
        });

        const { getByTestId, getByText } = render(
            <Empleados navigation={mockNavigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("toggle-empleado-form-button"));
        fireEvent.changeText(getByTestId("empleado-email-input"), "empleado@mail.com");
        fireEvent.press(getByTestId("empleado-save-button"));

        await waitFor(() => {
            expect(getByText("El nombre del empleado es obligatorio")).toBeTruthy();
        });
    });

    it("crea empleado y refresca la lista", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ empleados: [] }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Empleado creado correctamente",
                    empleado: {
                        id_empleado: 8,
                        id_negocio: 1,
                        nombre: "Laura",
                        apellido1: "Pérez",
                        apellido2: null,
                        numero_telefono: null,
                        email: "laura@mail.com",
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    empleados: [
                        {
                            id_empleado: 8,
                            id_negocio: 1,
                            nombre: "Laura",
                            apellido1: null,
                            apellido2: null,
                            numero_telefono: null,
                            email: "laura@mail.com",
                        },
                    ],
                }),
            });

        const { getByTestId, getByText } = render(
            <Empleados navigation={mockNavigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("toggle-empleado-form-button"));
        fireEvent.changeText(getByTestId("empleado-nombre-input"), "Laura");
        fireEvent.changeText(getByTestId("empleado-apellido1-input"), "Pérez");
        fireEvent.changeText(getByTestId("empleado-email-input"), "laura@mail.com");
        fireEvent.press(getByTestId("empleado-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.empleados,
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
            expect(getByText(/Laura/)).toBeTruthy();
        });
    });

    it("elimina empleado desde la lista y refresca empleados", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    empleados: [
                        {
                            id_empleado: 8,
                            id_negocio: 1,
                            nombre: "Laura",
                            apellido1: "Pérez",
                            apellido2: null,
                            numero_telefono: "600123123",
                            email: "laura@mail.com",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Empleado eliminado correctamente" }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ empleados: [] }),
            });

        const { getByTestId, queryByTestId, queryByText } = render(
            <Empleados navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("empleado-delete-button-8")).toBeTruthy();
        });

        fireEvent.press(getByTestId("empleado-delete-button-8"));

        await waitFor(() => {
            expect(getByTestId("empleado-delete-confirm-8")).toBeTruthy();
        });

        fireEvent.press(getByTestId("empleado-delete-confirm-button-8"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.deleteEmpleadoById(8),
                expect.objectContaining({
                    method: "DELETE",
                    headers: expect.objectContaining({
                        Authorization: "Bearer mock-token",
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(queryByTestId("empleado-item-8")).toBeNull();
        });

        expect(queryByText("Empleado eliminado correctamente")).toBeTruthy();
    });

    it("muestra error si falla la eliminación", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    empleados: [
                        {
                            id_empleado: 8,
                            id_negocio: 1,
                            nombre: "Laura",
                            apellido1: "Pérez",
                            apellido2: null,
                            numero_telefono: "600123123",
                            email: "laura@mail.com",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: "No tienes permisos para gestionar empleados" }),
            });

        const { getByTestId, getByText } = render(
            <Empleados navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("empleado-delete-button-8")).toBeTruthy();
        });

        fireEvent.press(getByTestId("empleado-delete-button-8"));
        fireEvent.press(getByTestId("empleado-delete-confirm-button-8"));

        await waitFor(() => {
            expect(getByText("No tienes permisos para gestionar empleados")).toBeTruthy();
        });
    });

    it("restringe acceso para trabajador", async () => {
        const { queryByTestId, getByText } = render(
            <Empleados navigation={mockNavigation} route={mockRouteTrabajador} />
        );

        expect(queryByTestId("toggle-empleado-form-button")).toBeNull();
        expect(getByText("Solo jefe y administrador pueden gestionar empleados")).toBeTruthy();
    });
});
