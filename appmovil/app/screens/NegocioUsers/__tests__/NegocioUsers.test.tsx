import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NegocioUsers from "../NegocioUsers";
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
        }, []);
    },
}));
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

mockNavigation.navigate = mockNavigate;
mockNavigation.goBack = mockGoBack;

global.fetch = jest.fn();

describe("NegocioUsers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("renderiza la lista de usuarios con acceso", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                usuarios: [
                    { id_usuario: 10, nombre_usuario: "jefe1", nombre: "Jefe", rol: "jefe" },
                    { id_usuario: 11, nombre_usuario: "trab1", nombre: "Trabajador", rol: "trabajador" },
                ],
            }),
        });

        const { getByText, getByTestId } = render(
            <NegocioUsers navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByText("Usuarios con acceso")).toBeTruthy();
        });

        await waitFor(() => {
            expect(getByTestId("user-item-10")).toBeTruthy();
            expect(getByTestId("user-item-11")).toBeTruthy();
        });
    }, 15000);

    it("muestra estado vacío cuando no hay usuarios", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ usuarios: [] }),
        });

        const { getByText } = render(
            <NegocioUsers navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByText("No hay usuarios con acceso")).toBeTruthy();
        });
    });

    it("navega hacia atrás al pulsar el botón back", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ usuarios: [] }),
        });

        const { getByTestId } = render(
            <NegocioUsers navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("back-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("back-button"));
        expect(mockGoBack).toHaveBeenCalled();
    });

    it("muestra el botón de añadir usuario", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ usuarios: [] }),
        });

        const { getByTestId } = render(
            <NegocioUsers navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("add-user-button")).toBeTruthy();
        });
    });

    it("abre el modal de búsqueda", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ usuarios: [] }),
        });

        const { getByTestId, getByText } = render(
            <NegocioUsers navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("add-user-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("add-user-button"));

        await waitFor(() => {
            expect(getByText("Dar permiso a usuario")).toBeTruthy();
            expect(getByTestId("user-search-input")).toBeTruthy();
        });
    });

    it("busca usuarios y asigna acceso", async () => {
        jest.useFakeTimers();
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ usuarios: [] }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    usuarios: [
                        { id_usuario: 10, nombre_usuario: "jefe1", nombre: "Jefe" },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Usuario añadido correctamente" }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ usuarios: [] }),
            });

        const { getByTestId, getByText } = render(
            <NegocioUsers navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("add-user-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("add-user-button"));

        fireEvent.changeText(getByTestId("user-search-input"), "jefe");

        act(() => {
            jest.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(getByTestId("search-user-10")).toBeTruthy();
            expect(getByText("Jefe")).toBeTruthy();
        });

        fireEvent.press(getByTestId("search-user-10"));
        fireEvent.press(getByTestId("confirm-add-user-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.negocioUsersById(2),
                expect.objectContaining({
                    method: "POST",
                })
            );
        });
    });

    it("permite cambiar rol desde la lista y refresca usuarios", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    usuarios: [
                        { id_usuario: 10, nombre_usuario: "user10", nombre: "Usuario 10", rol: "trabajador" },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    message: "Rol actualizado correctamente",
                    usuario: { id_usuario: 10, rol: "jefe" },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    usuarios: [
                        { id_usuario: 10, nombre_usuario: "user10", nombre: "Usuario 10", rol: "jefe" },
                    ],
                }),
            });

        const { getByTestId } = render(
            <NegocioUsers navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("change-role-button-10")).toBeTruthy();
        });

        fireEvent.press(getByTestId("change-role-button-10"));
        fireEvent.press(getByTestId("edit-role-jefe-button"));
        fireEvent.press(getByTestId("confirm-edit-role-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.putNegocioUserRoleById(2),
                expect.objectContaining({
                    method: "PUT",
                    body: JSON.stringify({ id_usuario: 10, rol: "jefe" }),
                })
            );
        });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.negocioUsersById(2),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });
    });

    it("permite eliminar acceso desde la lista y refresca usuarios", async () => {

        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    usuarios: [
                        { id_usuario: 10, nombre_usuario: "user10", nombre: "Usuario 10", rol: "trabajador" },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Acceso de usuario eliminado correctamente" }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ usuarios: [] }),
            });

        const { getByTestId } = render(
            <NegocioUsers navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("delete-access-button-10")).toBeTruthy();
        });

        fireEvent.press(getByTestId("delete-access-button-10"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.deleteNegocioUserById(2),
                expect.objectContaining({
                    method: "DELETE",
                    body: JSON.stringify({ id_usuario: 10 }),
                })
            );
        });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.negocioUsersById(2),
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });
    });
});
