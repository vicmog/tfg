import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Servicios from "../Servicios";
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

describe("Servicios", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("renderiza y obtiene servicios", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ servicios: [] }),
        });

        const { getByText, getByTestId } = render(
            <Servicios navigation={mockNavigation} route={mockRoute} />
        );

        expect(getByTestId("toggle-servicio-form-button")).toBeTruthy();

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.serviciosByNegocio(1),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        expect(getByText("No hay servicios registrados")).toBeTruthy();
    });

    it("muestra validación si falta descripción", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ servicios: [] }),
        });

        const { getByTestId, getByText, getAllByText } = render(
            <Servicios navigation={mockNavigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("toggle-servicio-form-button"));
        fireEvent.changeText(getByTestId("servicio-nombre-input"), "Corte premium");
        fireEvent.changeText(getByTestId("servicio-precio-input"), "25.5");
        fireEvent.changeText(getByTestId("servicio-duracion-input"), "45");
        fireEvent.press(getByTestId("servicio-save-button"));

        await waitFor(() => {
            expect(getByText("La descripción del servicio es obligatoria")).toBeTruthy();
        });
    });

    it("crea servicio y refresca la lista", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ servicios: [] }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Servicio creado correctamente",
                    servicio: {
                        id_servicio: 3,
                        id_negocio: 1,
                        nombre: "Corte premium",
                        precio: 25.5,
                        duracion: 45,
                        descripcion: "Corte con lavado y peinado",
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [
                        {
                            id_servicio: 3,
                            id_negocio: 1,
                            nombre: "Corte premium",
                            precio: 25.5,
                            duracion: 45,
                            descripcion: "Corte con lavado y peinado",
                        },
                    ],
                }),
            });

        const { getByTestId, getByText, getAllByText } = render(
            <Servicios navigation={mockNavigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("toggle-servicio-form-button"));
        fireEvent.changeText(getByTestId("servicio-nombre-input"), "Corte premium");
        fireEvent.changeText(getByTestId("servicio-precio-input"), "25.5");
        fireEvent.changeText(getByTestId("servicio-duracion-input"), "45");
        fireEvent.changeText(getByTestId("servicio-descripcion-input"), "Corte con lavado y peinado");
        fireEvent.press(getByTestId("servicio-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.servicios,
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
            expect(getByText(/Corte premium/)).toBeTruthy();
        });
    });

    it("edita servicio y guarda cambios", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [
                        {
                            id_servicio: 3,
                            id_negocio: 1,
                            nombre: "Corte premium",
                            precio: 25.5,
                            duracion: 45,
                            descripcion: "Corte con lavado y peinado",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Servicio actualizado correctamente",
                    servicio: {
                        id_servicio: 3,
                        id_negocio: 1,
                        nombre: "Corte premium actualizado",
                        precio: 30,
                        duracion: 50,
                        descripcion: "Corte con tratamiento",
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [
                        {
                            id_servicio: 3,
                            id_negocio: 1,
                            nombre: "Corte premium actualizado",
                            precio: 30,
                            duracion: 50,
                            descripcion: "Corte con tratamiento",
                        },
                    ],
                }),
            });

        const { getByTestId, getByDisplayValue, getByText } = render(
            <Servicios navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("servicio-edit-button-3")).toBeTruthy();
        });

        fireEvent.press(getByTestId("servicio-edit-button-3"));

        expect(getByDisplayValue("Corte premium")).toBeTruthy();
        expect(getByDisplayValue("25.5")).toBeTruthy();
        expect(getByText("Editar servicio")).toBeTruthy();

        fireEvent.changeText(getByTestId("servicio-nombre-input"), "Corte premium actualizado");
        fireEvent.changeText(getByTestId("servicio-precio-input"), "30");
        fireEvent.changeText(getByTestId("servicio-duracion-input"), "50");
        fireEvent.changeText(getByTestId("servicio-descripcion-input"), "Corte con tratamiento");
        fireEvent.press(getByTestId("servicio-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.updateServicioById(3),
                expect.objectContaining({
                    method: "PUT",
                    headers: expect.objectContaining({
                        "Content-Type": "application/json",
                        Authorization: "Bearer mock-token",
                    }),
                    body: JSON.stringify({
                        nombre: "Corte premium actualizado",
                        precio: "30",
                        duracion: "50",
                        descripcion: "Corte con tratamiento",
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(getByText("Servicio actualizado correctamente")).toBeTruthy();
            expect(getByText("Corte premium actualizado")).toBeTruthy();
        });
    });

    it("muestra error si falla la edición", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [
                        {
                            id_servicio: 3,
                            id_negocio: 1,
                            nombre: "Corte premium",
                            precio: 25.5,
                            duracion: 45,
                            descripcion: "Corte con lavado y peinado",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: "No tienes permisos para gestionar servicios" }),
            });

        const { getByTestId, getByText } = render(
            <Servicios navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("servicio-edit-button-3")).toBeTruthy();
        });

        fireEvent.press(getByTestId("servicio-edit-button-3"));
        fireEvent.changeText(getByTestId("servicio-nombre-input"), "Corte premium actualizado");
        fireEvent.press(getByTestId("servicio-save-button"));

        await waitFor(() => {
            expect(getByText("No tienes permisos para gestionar servicios")).toBeTruthy();
        });
    });

    it("elimina servicio desde la lista y refresca servicios", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [
                        {
                            id_servicio: 3,
                            id_negocio: 1,
                            nombre: "Corte premium",
                            precio: 25.5,
                            duracion: 45,
                            descripcion: "Corte con lavado y peinado",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Servicio eliminado correctamente" }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ servicios: [] }),
            });

        const { getByTestId, getByText } = render(
            <Servicios navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("servicio-delete-button-3")).toBeTruthy();
        });

        fireEvent.press(getByTestId("servicio-delete-button-3"));

        await waitFor(() => {
            expect(getByTestId("servicio-delete-confirm-3")).toBeTruthy();
        });

        fireEvent.press(getByTestId("servicio-delete-confirm-button-3"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.deleteServicioById(3),
                expect.objectContaining({
                    method: "DELETE",
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        await waitFor(() => {
            expect(getByText("Servicio eliminado correctamente")).toBeTruthy();
        });
    });

    it("muestra error si falla el borrado", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [
                        {
                            id_servicio: 3,
                            id_negocio: 1,
                            nombre: "Corte premium",
                            precio: 25.5,
                            duracion: 45,
                            descripcion: "Corte con lavado y peinado",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: "No tienes permisos para gestionar servicios" }),
            });

        const { getByTestId, getByText } = render(
            <Servicios navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("servicio-delete-button-3")).toBeTruthy();
        });

        fireEvent.press(getByTestId("servicio-delete-button-3"));
        fireEvent.press(getByTestId("servicio-delete-confirm-button-3"));

        await waitFor(() => {
            expect(getByText("No tienes permisos para gestionar servicios")).toBeTruthy();
        });
    });

    it("abre popup de detalle y muestra precio y duración", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [
                        {
                            id_servicio: 3,
                            id_negocio: 1,
                            nombre: "Corte premium",
                            precio: 25.5,
                            duracion: 45,
                            descripcion: "Corte con lavado y peinado",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicio: {
                        id_servicio: 3,
                        id_negocio: 1,
                        nombre: "Corte premium",
                        precio: 25.5,
                        duracion: 45,
                        descripcion: "Corte con lavado y peinado",
                    },
                }),
            });

        const { getByTestId, getByText, getAllByText } = render(
            <Servicios navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("servicio-open-detail-3")).toBeTruthy();
        });

        fireEvent.press(getByTestId("servicio-open-detail-3"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.servicioById(3),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        await waitFor(() => {
            expect(getByTestId("servicio-detail-modal")).toBeTruthy();
            expect(getByText("Detalles del servicio")).toBeTruthy();
            expect(getAllByText("25.50 EUR").length).toBeGreaterThan(0);
            expect(getAllByText("45 min").length).toBeGreaterThan(0);
        });
    });

    it("muestra error en popup de detalle cuando falla el endpoint", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    servicios: [
                        {
                            id_servicio: 3,
                            id_negocio: 1,
                            nombre: "Corte premium",
                            precio: 25.5,
                            duracion: 45,
                            descripcion: "Corte con lavado y peinado",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: "Servicio no encontrado" }),
            });

        const { getByTestId, getByText } = render(
            <Servicios navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("servicio-open-detail-3")).toBeTruthy();
        });

        fireEvent.press(getByTestId("servicio-open-detail-3"));

        await waitFor(() => {
            expect(getByTestId("servicio-detail-error-message")).toBeTruthy();
            expect(getByText("Servicio no encontrado")).toBeTruthy();
        });
    });

    it("permite ver y buscar para trabajador sin acciones de gestion", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                servicios: [
                    {
                        id_servicio: 3,
                        id_negocio: 1,
                        nombre: "Corte premium",
                        precio: 25.5,
                        duracion: 45,
                        descripcion: "Corte con lavado y peinado",
                    },
                ],
            }),
        });

        const { getByTestId, getByText, queryByTestId, queryByText } = render(
            <Servicios navigation={mockNavigation} route={mockRouteTrabajador} />
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.serviciosByNegocio(1),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        expect(queryByTestId("toggle-servicio-form-button")).toBeNull();
        expect(queryByTestId("servicio-edit-button-3")).toBeNull();
        expect(queryByTestId("servicio-delete-button-3")).toBeNull();
        expect(getByTestId("servicio-search-input")).toBeTruthy();
        expect(getByText("Corte premium")).toBeTruthy();

        fireEvent.changeText(getByTestId("servicio-search-input"), "premium");
        expect(getByText("Corte premium")).toBeTruthy();

        fireEvent.changeText(getByTestId("servicio-search-input"), "NoCoincide");
        expect(queryByText("Corte premium")).toBeNull();
        expect(getByText("No hay servicios registrados")).toBeTruthy();
    });
});