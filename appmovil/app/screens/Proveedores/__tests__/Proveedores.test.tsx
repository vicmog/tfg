import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Proveedores from "../Proveedores";
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

describe("Proveedores", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("renderiza y obtiene proveedores", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ proveedores: [] }),
        });

        const { getByText, getByTestId } = render(
            <Proveedores navigation={mockNavigation} route={mockRoute} />
        );

        expect(getByTestId("toggle-proveedor-form-button")).toBeTruthy();

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.proveedoresByNegocio(1),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        expect(getByText("No hay proveedores registrados")).toBeTruthy();
    });

    it("muestra validación si falta CIF/NIF", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ proveedores: [] }),
        });

        const { getByTestId, getByText, getAllByText } = render(
            <Proveedores navigation={mockNavigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("toggle-proveedor-form-button"));
        fireEvent.changeText(getByTestId("proveedor-nombre-input"), "Distribuciones Norte");
        fireEvent.changeText(getByTestId("proveedor-contacto-input"), "Laura Pérez");
        fireEvent.changeText(getByTestId("proveedor-email-input"), "proveedor@mail.com");
        fireEvent.changeText(getByTestId("proveedor-tipo-input"), "Material de peluquería");
        fireEvent.press(getByTestId("proveedor-save-button"));

        await waitFor(() => {
            expect(getByText("El CIF/NIF del proveedor es obligatorio")).toBeTruthy();
        });
    });

    it("crea proveedor y refresca la lista", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ proveedores: [] }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Proveedor creado correctamente",
                    proveedor: {
                        id_proveedor: 5,
                        id_negocio: 1,
                        nombre: "Distribuciones Norte",
                        cif_nif: "B12345678",
                        contacto: "Laura Pérez",
                        telefono: "600123123",
                        email: "proveedor@mail.com",
                        tipo_proveedor: "Material de peluquería",
                        direccion: "Calle Mayor 1",
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    proveedores: [
                        {
                            id_proveedor: 5,
                            id_negocio: 1,
                            nombre: "Distribuciones Norte",
                            cif_nif: "B12345678",
                            contacto: "Laura Pérez",
                            telefono: "600123123",
                            email: "proveedor@mail.com",
                            tipo_proveedor: "Material de peluquería",
                            direccion: "Calle Mayor 1",
                        },
                    ],
                }),
            });

        const { getByTestId, getByText, getAllByText } = render(
            <Proveedores navigation={mockNavigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("toggle-proveedor-form-button"));
        fireEvent.changeText(getByTestId("proveedor-nombre-input"), "Distribuciones Norte");
        fireEvent.changeText(getByTestId("proveedor-cif-input"), "B12345678");
        fireEvent.changeText(getByTestId("proveedor-contacto-input"), "Laura Pérez");
        fireEvent.changeText(getByTestId("proveedor-telefono-input"), "600123123");
        fireEvent.changeText(getByTestId("proveedor-email-input"), "proveedor@mail.com");
        fireEvent.changeText(getByTestId("proveedor-tipo-input"), "Material de peluquería");
        fireEvent.changeText(getByTestId("proveedor-direccion-input"), "Calle Mayor 1");
        fireEvent.press(getByTestId("proveedor-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.proveedores,
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
            expect(getByText("Distribuciones Norte")).toBeTruthy();
            expect(getByText("Proveedor creado correctamente")).toBeTruthy();
        });
    });

    it("abre modal de detalle al pulsar un proveedor", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                proveedores: [
                    {
                        id_proveedor: 5,
                        id_negocio: 1,
                        nombre: "Distribuciones Norte",
                        cif_nif: "B12345678",
                        contacto: "Laura Pérez",
                        telefono: "600123123",
                        email: "proveedor@mail.com",
                        tipo_proveedor: "Material de peluquería",
                        direccion: "Calle Mayor 1",
                    },
                ],
            }),
        });

        const { getByTestId, getByText, getAllByText } = render(
            <Proveedores navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("proveedor-open-detail-5")).toBeTruthy();
        });

        fireEvent.press(getByTestId("proveedor-open-detail-5"));

        await waitFor(() => {
            expect(getByTestId("proveedor-detail-modal")).toBeTruthy();
            expect(getByText("Detalles del proveedor")).toBeTruthy();
            expect(getAllByText("B12345678").length).toBeGreaterThan(1);
        });
    });

    it("permite ver y buscar para trabajador sin acciones de gestion", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                proveedores: [
                    {
                        id_proveedor: 5,
                        id_negocio: 1,
                        nombre: "Distribuciones Norte",
                        cif_nif: "B12345678",
                        contacto: "Laura Pérez",
                        telefono: "600123123",
                        email: "proveedor@mail.com",
                        tipo_proveedor: "Material de peluquería",
                        direccion: "Calle Mayor 1",
                    },
                ],
            }),
        });

        const { getByTestId, getByText, queryByTestId, queryByText } = render(
            <Proveedores navigation={mockNavigation} route={mockRouteTrabajador} />
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.proveedoresByNegocio(1),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        expect(queryByTestId("toggle-proveedor-form-button")).toBeNull();
        expect(queryByTestId("proveedor-edit-button-5")).toBeNull();
        expect(queryByTestId("proveedor-delete-button-5")).toBeNull();
        expect(getByText("Distribuciones Norte")).toBeTruthy();

        fireEvent.changeText(getByTestId("proveedor-search-input"), "Norte");
        expect(getByText("Distribuciones Norte")).toBeTruthy();

        fireEvent.changeText(getByTestId("proveedor-search-input"), "NoCoincide");
        expect(queryByText("Distribuciones Norte")).toBeNull();
        expect(getByText("No hay proveedores registrados")).toBeTruthy();
    });

    it("edita proveedor y guarda cambios", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    proveedores: [
                        {
                            id_proveedor: 5,
                            id_negocio: 1,
                            nombre: "Distribuciones Norte",
                            cif_nif: "B12345678",
                            contacto: "Laura Pérez",
                            telefono: "600123123",
                            email: "proveedor@mail.com",
                            tipo_proveedor: "Material de peluquería",
                            direccion: "Calle Mayor 1",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Proveedor actualizado correctamente",
                    proveedor: {
                        id_proveedor: 5,
                        id_negocio: 1,
                        nombre: "Distribuciones Norte Editado",
                        cif_nif: "B12345678",
                        contacto: "Laura Pérez",
                        telefono: "699000111",
                        email: "proveedor@mail.com",
                        tipo_proveedor: "Material de peluquería",
                        direccion: "Calle Mayor 1",
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    proveedores: [
                        {
                            id_proveedor: 5,
                            id_negocio: 1,
                            nombre: "Distribuciones Norte Editado",
                            cif_nif: "B12345678",
                            contacto: "Laura Pérez",
                            telefono: "699000111",
                            email: "proveedor@mail.com",
                            tipo_proveedor: "Material de peluquería",
                            direccion: "Calle Mayor 1",
                        },
                    ],
                }),
            });

        const { getByTestId, getByText } = render(
            <Proveedores navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("proveedor-edit-button-5")).toBeTruthy();
        });

        fireEvent.press(getByTestId("proveedor-edit-button-5"));

        await waitFor(() => {
            expect(getByText("Editar proveedor")).toBeTruthy();
            expect(getByText("Guardar cambios")).toBeTruthy();
        });

        fireEvent.changeText(getByTestId("proveedor-nombre-input"), "Distribuciones Norte Editado");
        fireEvent.changeText(getByTestId("proveedor-telefono-input"), "699000111");
        fireEvent.press(getByTestId("proveedor-save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.updateProveedorById(5),
                expect.objectContaining({
                    method: "PUT",
                    headers: expect.objectContaining({
                        "Content-Type": "application/json",
                        Authorization: "Bearer mock-token",
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(getByText("Proveedor actualizado correctamente")).toBeTruthy();
            expect(getByText("Distribuciones Norte Editado")).toBeTruthy();
        });
    });

    it("elimina proveedor después de confirmar", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    proveedores: [
                        {
                            id_proveedor: 5,
                            id_negocio: 1,
                            nombre: "Distribuciones Norte",
                            cif_nif: "B12345678",
                            contacto: "Laura Pérez",
                            telefono: "600123123",
                            email: "proveedor@mail.com",
                            tipo_proveedor: "Material de peluquería",
                            direccion: "Calle Mayor 1",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Proveedor eliminado correctamente" }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ proveedores: [] }),
            });

        const { getByTestId, getByText } = render(
            <Proveedores navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("proveedor-delete-button-5")).toBeTruthy();
        });

        fireEvent.press(getByTestId("proveedor-delete-button-5"));

        await waitFor(() => {
            expect(getByTestId("proveedor-delete-confirm-button-5")).toBeTruthy();
        });

        fireEvent.press(getByTestId("proveedor-delete-confirm-button-5"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.deleteProveedorById(5),
                expect.objectContaining({
                    method: "DELETE",
                    headers: {
                        Authorization: "Bearer mock-token",
                    },
                })
            );
        });

        await waitFor(() => {
            expect(getByText("Proveedor eliminado correctamente")).toBeTruthy();
            expect(getByText("No hay proveedores registrados")).toBeTruthy();
        });
    });

    it("muestra error visual si falla al eliminar", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    proveedores: [
                        {
                            id_proveedor: 5,
                            id_negocio: 1,
                            nombre: "Distribuciones Norte",
                            cif_nif: "B12345678",
                            contacto: "Laura Pérez",
                            telefono: "600123123",
                            email: "proveedor@mail.com",
                            tipo_proveedor: "Material de peluquería",
                            direccion: "Calle Mayor 1",
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: "No tienes permisos para gestionar proveedores" }),
            });

        const { getByTestId, getByText } = render(
            <Proveedores navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("proveedor-delete-button-5")).toBeTruthy();
        });

        fireEvent.press(getByTestId("proveedor-delete-button-5"));

        await waitFor(() => {
            expect(getByTestId("proveedor-delete-confirm-button-5")).toBeTruthy();
        });

        fireEvent.press(getByTestId("proveedor-delete-confirm-button-5"));

        await waitFor(() => {
            expect(getByText("No tienes permisos para gestionar proveedores")).toBeTruthy();
        });
    });
});
