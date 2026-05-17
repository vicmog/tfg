import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CrearNegocio from "./../CrearNegocio";
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
    }, [callback]);
  },
}));

global.fetch = jest.fn();

describe("CrearNegocio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
  });

  it("muestra error si el nombre está vacío", () => {
    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("cif-input"), "B12345678");
    fireEvent.press(getByTestId("submit-button"));

    expect(getByText("El nombre del negocio es obligatorio")).toBeTruthy();
  });

  it("muestra error si el CIF está vacío", () => {
    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("nombre-input"), "Mi Negocio");
    fireEvent.press(getByTestId("submit-button"));

    expect(getByText("El CIF es obligatorio")).toBeTruthy();
  });

  it("muestra error si el formato del CIF es inválido", () => {
    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("nombre-input"), "Mi Negocio");
    fireEvent.changeText(getByTestId("cif-input"), "INVALIDCIF");
    fireEvent.press(getByTestId("submit-button"));

    expect(getByText("El formato del CIF no es válido")).toBeTruthy();
  });

  it("muestra error si el CIF ya existe", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Ya existe un negocio con este CIF" }),
    });

    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.changeText(getByTestId("nombre-input"), "Mi Negocio");
    fireEvent.changeText(getByTestId("cif-input"), "B12345678");
    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(getByText("Ya existe un negocio con este CIF")).toBeTruthy();
    });
  });

  it("navega hacia atrás al presionar el botón de volver", () => {
    const { getByTestId } = render(
      <CrearNegocio navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId("back-button"));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it("maneja error de conexión", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const { getByTestId, getByText } = render(
      <CrearNegocio navigation={mockNavigation} route={mockRoute} />
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
      <CrearNegocio navigation={mockNavigation} route={mockRoute} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
