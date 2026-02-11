import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NegocioUsers from "../NegocioUsers";

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
const navigation = {
    navigate: mockNavigate,
    goBack: mockGoBack,
    setOptions: jest.fn(),
} as any;

const mockNegocio = {
    id_negocio: 2,
    nombre: "Mi Negocio",
    CIF: "B12345678",
    plantilla: 0,
    rol: "jefe",
};

const mockRoute = {
    params: { negocio: mockNegocio },
} as any;

global.fetch = jest.fn();

describe("NegocioUsers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
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
            <NegocioUsers navigation={navigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByText("Usuarios con acceso")).toBeTruthy();
        });

        await waitFor(() => {
            expect(getByTestId("user-item-10")).toBeTruthy();
            expect(getByTestId("user-item-11")).toBeTruthy();
        });
    });

    it("muestra estado vacío cuando no hay usuarios", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ usuarios: [] }),
        });

        const { getByText } = render(
            <NegocioUsers navigation={navigation} route={mockRoute} />
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
            <NegocioUsers navigation={navigation} route={mockRoute} />
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
            <NegocioUsers navigation={navigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("add-user-button")).toBeTruthy();
        });
    });
});
