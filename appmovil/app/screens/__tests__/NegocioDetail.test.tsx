import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

import NegocioDetail from "./../NegocioDetail";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const navigation = {
    navigate: mockNavigate,
    goBack: mockGoBack,
    setOptions: jest.fn(),
} as any;

const mockNegocio = {
    id_negocio: 1,
    nombre: "Mi Negocio",
    CIF: "B12345678",
    plantilla: 0,
    rol: "jefe",
};

const mockRoute = {
    params: { negocio: mockNegocio },
} as any;

global.fetch = jest.fn();

describe("NegocioDetail", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ negocio: mockNegocio }),
        });
    });

    it("renderiza correctamente con los datos del negocio", async () => {
        const { getByText, getByTestId } = render(
            <NegocioDetail navigation={navigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByText("Mi Negocio")).toBeTruthy();
        });

        expect(getByTestId("back-button")).toBeTruthy();
    });

    it("muestra todos los módulos", async () => {
        const { getByTestId } = render(
            <NegocioDetail navigation={navigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("modulo-clientes")).toBeTruthy();
            expect(getByTestId("modulo-productos")).toBeTruthy();
            expect(getByTestId("modulo-proveedores")).toBeTruthy();
            expect(getByTestId("modulo-servicios")).toBeTruthy();
            expect(getByTestId("modulo-reservas")).toBeTruthy();
            expect(getByTestId("modulo-ventas")).toBeTruthy();
            expect(getByTestId("modulo-gastos")).toBeTruthy();
            expect(getByTestId("modulo-empleados")).toBeTruthy();
        });
    });

    it("muestra botones de ajustes para jefe", async () => {
        const { getByTestId } = render(
            <NegocioDetail navigation={navigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("settings-button")).toBeTruthy();
            expect(getByTestId("permissions-settings-button")).toBeTruthy();
        });
    });

    it("muestra botón de editar módulos para admin", async () => {
        const adminNegocio = { ...mockNegocio, rol: "admin" };
        const adminRoute = { params: { negocio: adminNegocio } } as any;
        
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ negocio: adminNegocio }),
        });

        const { getByTestId } = render(
            <NegocioDetail navigation={navigation} route={adminRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("edit-modules-button")).toBeTruthy();
        });
    });

    it("no muestra botones de admin para trabajador", async () => {
        const trabajadorNegocio = { ...mockNegocio, rol: "trabajador" };
        const trabajadorRoute = { params: { negocio: trabajadorNegocio } } as any;

        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ negocio: trabajadorNegocio }),
        });

        const { queryByTestId } = render(
            <NegocioDetail navigation={navigation} route={trabajadorRoute} />
        );

        await waitFor(() => {
            expect(queryByTestId("settings-button")).toBeNull();
            expect(queryByTestId("permissions-settings-button")).toBeNull();
            expect(queryByTestId("edit-modules-button")).toBeNull();
        });
    });

    it("navega hacia atrás al pulsar el botón back", async () => {
        const { getByTestId } = render(
            <NegocioDetail navigation={navigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("back-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("back-button"));
        expect(mockGoBack).toHaveBeenCalled();
    });

    it("navega a NegocioSettings al pulsar settings-button", async () => {
        const { getByTestId } = render(
            <NegocioDetail navigation={navigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("settings-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("settings-button"));
        expect(mockNavigate).toHaveBeenCalledWith("NegocioSettings", { negocio: mockNegocio });
    });

    it("hace fetch de los datos del negocio al montar", async () => {
        render(<NegocioDetail navigation={navigation} route={mockRoute} />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:3000/v1/api/negocios/1",
                expect.objectContaining({
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });
    });

    it("maneja errores de la API correctamente", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

        const { getByText } = render(
            <NegocioDetail navigation={navigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByText("Mi Negocio")).toBeTruthy();
        });

        consoleSpy.mockRestore();
    });

    it("actualiza los datos cuando la respuesta es exitosa", async () => {
        const updatedNegocio = { ...mockNegocio, nombre: "Negocio Actualizado" };
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ negocio: updatedNegocio }),
        });

        const { getByText } = render(
            <NegocioDetail navigation={navigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByText("Negocio Actualizado")).toBeTruthy();
        });
    });
});
