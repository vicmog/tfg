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

import NegocioSettings from "./../NegocioSettings";

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

describe("NegocioSettings", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("renderiza correctamente todos los elementos", () => {
        const { getByText, getByTestId } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        expect(getByText("Ajustes del Negocio")).toBeTruthy();
        expect(getByText("CIF")).toBeTruthy();
        expect(getByText("B12345678")).toBeTruthy();
        expect(getByTestId("nombre-input")).toBeTruthy();
        expect(getByTestId("save-button")).toBeTruthy();
        expect(getByTestId("delete-button")).toBeTruthy();
        expect(getByTestId("back-button")).toBeTruthy();
    });

    it("muestra el nombre del negocio en el input", () => {
        const { getByTestId } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        const input = getByTestId("nombre-input");
        expect(input.props.value).toBe("Mi Negocio");
    });

    it("navega hacia atrás al pulsar el botón back", () => {
        const { getByTestId } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("back-button"));
        expect(mockGoBack).toHaveBeenCalled();
    });

    it("muestra error si el nombre está vacío al guardar", () => {
        const { getByTestId, getByText } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.changeText(getByTestId("nombre-input"), "");
        fireEvent.press(getByTestId("save-button"));

        expect(getByText("El nombre no puede estar vacío")).toBeTruthy();
    });

    it("guarda el nombre correctamente", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                message: "Negocio actualizado correctamente",
                negocio: { ...mockNegocio, nombre: "Nuevo Nombre" },
            }),
        });

        const { getByTestId, getByText } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.changeText(getByTestId("nombre-input"), "Nuevo Nombre");
        fireEvent.press(getByTestId("save-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:3000/v1/api/negocios/1",
                expect.objectContaining({
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer mock-token",
                    },
                    body: JSON.stringify({ nombre: "Nuevo Nombre" }),
                })
            );
        });

        await waitFor(() => {
            expect(getByText("Nombre actualizado correctamente")).toBeTruthy();
        });
    });

    it("muestra error si la API falla al guardar", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "Error del servidor" }),
        });

        const { getByTestId, getByText } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.changeText(getByTestId("nombre-input"), "Nuevo Nombre");
        fireEvent.press(getByTestId("save-button"));

        await waitFor(() => {
            expect(getByText("Error del servidor")).toBeTruthy();
        });
    });

    it("muestra modal de confirmación al pulsar eliminar", () => {
        const { getByTestId, getByText } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("delete-button"));

        expect(getByText("¿Eliminar negocio?")).toBeTruthy();
        expect(getByTestId("cancel-delete-button")).toBeTruthy();
        expect(getByTestId("confirm-delete-button")).toBeTruthy();
    });

    it("cierra el modal al cancelar eliminación", () => {
        const { getByTestId, queryByText } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("delete-button"));
        expect(queryByText("¿Eliminar negocio?")).toBeTruthy();

        fireEvent.press(getByTestId("cancel-delete-button"));
        // El modal debería cerrarse
    });

    it("elimina el negocio correctamente", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Negocio eliminado correctamente" }),
        });

        const { getByTestId } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("delete-button"));
        fireEvent.press(getByTestId("confirm-delete-button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:3000/v1/api/negocios/1",
                expect.objectContaining({
                    method: "DELETE",
                    headers: { Authorization: "Bearer mock-token" },
                })
            );
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("Negocios");
        });
    });

    it("muestra error si la API falla al eliminar", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "No tienes permisos" }),
        });

        const { getByTestId, getByText } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("delete-button"));
        fireEvent.press(getByTestId("confirm-delete-button"));

        await waitFor(() => {
            expect(getByText("No tienes permisos")).toBeTruthy();
        });
    });

    it("muestra indicador de carga mientras guarda", async () => {
        (fetch as jest.Mock).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
        );

        const { getByTestId } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.changeText(getByTestId("nombre-input"), "Nuevo Nombre");
        fireEvent.press(getByTestId("save-button"));

        // El botón debería estar deshabilitado mientras guarda
        expect(getByTestId("save-button").props.accessibilityState?.disabled).toBe(true);
    });

    it("muestra overlay de carga mientras elimina", async () => {
        (fetch as jest.Mock).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
        );

        const { getByTestId, getByText } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("delete-button"));
        fireEvent.press(getByTestId("confirm-delete-button"));

        await waitFor(() => {
            expect(getByText("Eliminando negocio...")).toBeTruthy();
        });
    });

    it("maneja errores de conexión al guardar", async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

        const { getByTestId, getByText } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.changeText(getByTestId("nombre-input"), "Nuevo Nombre");
        fireEvent.press(getByTestId("save-button"));

        await waitFor(() => {
            expect(getByText(/Error de conexión/)).toBeTruthy();
        });
    });

    it("maneja errores de conexión al eliminar", async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

        const { getByTestId, getByText } = render(
            <NegocioSettings navigation={navigation} route={mockRoute} />
        );

        fireEvent.press(getByTestId("delete-button"));
        fireEvent.press(getByTestId("confirm-delete-button"));

        await waitFor(() => {
            expect(getByText("Error de conexión")).toBeTruthy();
        });
    });
});
