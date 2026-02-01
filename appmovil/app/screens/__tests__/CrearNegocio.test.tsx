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

import CrearNegocio from "./../CrearNegocio";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const navigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  setOptions: jest.fn(),
} as any;

const mockRoute = {
  params: {},
} as any;

global.fetch = jest.fn();

describe("CrearNegocio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
  });

  it("renderiza correctamente todos los elementos", () => {
    const { getByText, getByTestId } = render(
      <CrearNegocio navigation={navigation} route={mockRoute} />
    );

    expect(getByText("Crear Nuevo Negocio")).toBeTruthy();
    expect(getByText("Nombre del negocio *")).toBeTruthy();
    expect(getByText("CIF *")).toBeTruthy();
    expect(getByTestId("nombre-input")).toBeTruthy();
    expect(getByTestId("cif-input")).toBeTruthy();
    expect(getByTestId("submit-button")).toBeTruthy();
    expect(getByTestId("back-button")).toBeTruthy();
  });

  it("muestra error si el nombre está vacío", () => {
    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("cif-input"), "B12345678");
    fireEvent.press(getByTestId("submit-button"));

    expect(getByText("El nombre del negocio es obligatorio")).toBeTruthy();
  });

  it("muestra error si el CIF está vacío", () => {
    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("nombre-input"), "Mi Negocio");
    fireEvent.press(getByTestId("submit-button"));

    expect(getByText("El CIF es obligatorio")).toBeTruthy();
  });

  it("muestra error si el formato del CIF es inválido", () => {
    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("nombre-input"), "Mi Negocio");
    fireEvent.changeText(getByTestId("cif-input"), "INVALIDCIF");
    fireEvent.press(getByTestId("submit-button"));

    expect(getByText("El formato del CIF no es válido")).toBeTruthy();
  });

  it("crea negocio correctamente y muestra mensaje de éxito", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: "Negocio creado correctamente",
        negocio: { id_negocio: 1, nombre: "Mi Negocio", CIF: "B12345678", plantilla: 0 },
      }),
    });

    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("nombre-input"), "Mi Negocio");
    fireEvent.changeText(getByTestId("cif-input"), "B12345678");
    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(getByText("¡Negocio creado correctamente!")).toBeTruthy();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/api/negocios"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        }),
        body: JSON.stringify({ nombre: "Mi Negocio", CIF: "B12345678" }),
      })
    );
  });

  it("muestra error si el CIF ya existe", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Ya existe un negocio con este CIF" }),
    });

    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("nombre-input"), "Mi Negocio");
    fireEvent.changeText(getByTestId("cif-input"), "B12345678");
    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(getByText("Ya existe un negocio con este CIF")).toBeTruthy();
    });
  });

  it("muestra error si no hay token de autenticación", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("nombre-input"), "Mi Negocio");
    fireEvent.changeText(getByTestId("cif-input"), "B12345678");
    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(getByText("No estás autenticado. Por favor, inicia sesión de nuevo.")).toBeTruthy();
    });
  });

  it("navega hacia atrás al presionar el botón de volver", () => {
    const { getByTestId } = render(
      <CrearNegocio navigation={navigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId("back-button"));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("maneja error de conexión", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("nombre-input"), "Mi Negocio");
    fireEvent.changeText(getByTestId("cif-input"), "B12345678");
    
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(getByText("Error de conexión. Inténtalo de nuevo.")).toBeTruthy();
    });
    consoleSpy.mockRestore();
  });

  it("coincide con el snapshot", () => {
    const { toJSON } = render(
      <CrearNegocio navigation={navigation} route={mockRoute} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
