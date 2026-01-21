import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "./../Login";
import AsyncStorage from "@react-native-async-storage/async-storage";

const mockNavigate = jest.fn();
const navigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

const mockRoute = {
  params: { message: "REGISTER_SUCCESS" },
} as any;

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
}));

global.fetch = jest.fn();

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza correctamente todos los elementos", () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={navigation} route={mockRoute} />
    );

    expect(getByText("Login")).toBeTruthy();
    expect(getByPlaceholderText("Usuario")).toBeTruthy();
    expect(getByPlaceholderText("Contraseña")).toBeTruthy();
    expect(getByText("Ingresar")).toBeTruthy();
    expect(getByText("¿No tienes cuenta? Regístrate")).toBeTruthy();
    expect(getByText("Registrado Correctamente. Inicie Sesion")).toBeTruthy();
  });

  it("muestra error si los campos están vacíos al presionar Ingresar", () => {
    const { getByText } = render(
      <LoginScreen navigation={navigation} route={mockRoute} />
    );
    const loginButton = getByText("Ingresar");

    fireEvent.press(loginButton);
    expect(getByText("Por favor completa todos los campos")).toBeTruthy();
  });

  it("navega a Negocios si login es exitoso", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "abc123" }),
    });

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByPlaceholderText("Usuario"), "usuario1");
    fireEvent.changeText(getByPlaceholderText("Contraseña"), "123456");

    fireEvent.press(getByText("Ingresar"));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("token", "abc123");
      expect(mockNavigate).toHaveBeenCalledWith("Negocios");
    });
  });

  it("muestra error si fetch devuelve error", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Usuario o contraseña incorrecta" }),
    });

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByPlaceholderText("Usuario"), "usuario1");
    fireEvent.changeText(getByPlaceholderText("Contraseña"), "wrongpass");

    fireEvent.press(getByText("Ingresar"));

    await waitFor(() => {
      expect(getByText("Usuario o contraseña incorrecta")).toBeTruthy();
    });
  });

  it("navega a Register al presionar Regístrate", () => {
    const { getByText } = render(
      <LoginScreen navigation={navigation} route={mockRoute} />
    );

    const registerLink = getByText("¿No tienes cuenta? Regístrate");
    fireEvent.press(registerLink);

    expect(mockNavigate).toHaveBeenCalledWith("Register");
  });

  it("coincide con el snapshot", () => {
    const { toJSON } = render(
      <LoginScreen navigation={navigation} route={mockRoute} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
