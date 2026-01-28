import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import RegisterScreen from "./../Register";

const mockNavigate = jest.fn();
const navigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

const mockRoute = {
  params: { message: "REGISTER_SUCCESS" },
} as any;

global.fetch = jest.fn();

describe("RegisterScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza correctamente todos los elementos", () => {
    const { getByPlaceholderText, getByText } = render(
      <RegisterScreen navigation={navigation} route={mockRoute} />
    );

    expect(getByText("Registrate Gratis!")).toBeTruthy();
    expect(getByPlaceholderText("Usuario")).toBeTruthy();
    expect(getByPlaceholderText("Nombre completo")).toBeTruthy();
    expect(getByPlaceholderText("DNI/NIE")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Numero de Teléfono")).toBeTruthy();
    expect(getByPlaceholderText("Contraseña")).toBeTruthy();
    expect(getByPlaceholderText("Confirmar contraseña")).toBeTruthy();
    expect(getByText("Crear Cuenta")).toBeTruthy();
    expect(getByText("¿Ya tienes cuenta? Inicia sesión")).toBeTruthy();
  });

  it("muestra error si los campos están vacíos al presionar Crear Cuenta", () => {
    const { getByText } = render(
      <RegisterScreen navigation={navigation} route={mockRoute} />
    );

    fireEvent.press(getByText("Crear Cuenta"));
    expect(getByText("Completa todos los campos")).toBeTruthy();
  });

  /*it("muestra error si las contraseñas no coinciden", () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={navigation} route={mockRoute}/>
    );

    fireEvent.changeText(getByPlaceholderText("Contraseña"), "123456");
    fireEvent.changeText(getByPlaceholderText("Confirmar contraseña"), "654321");

    fireEvent.press(getByText("Crear Cuenta"));
    expect(getByText("Las contraseñas no coinciden")).toBeTruthy();
  });*/

  it("registra correctamente y navega a Login si fetch es exitoso", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Usuario creado" }),
    });

    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByPlaceholderText("Usuario"), "usuario1");
    fireEvent.changeText(getByPlaceholderText("Nombre completo"), "Juan Perez");
    fireEvent.changeText(getByPlaceholderText("DNI/NIE"), "12345678A");
    fireEvent.changeText(getByPlaceholderText("Email"), "juan@test.com");
    fireEvent.changeText(getByPlaceholderText("Numero de Teléfono"), "600123456");
    fireEvent.changeText(getByPlaceholderText("Contraseña"), "123456");
    fireEvent.changeText(getByPlaceholderText("Confirmar contraseña"), "123456");

    fireEvent.press(getByText("Crear Cuenta"));

    await waitFor(() => {
      expect(getByText("Usuario registrado correctamente")).toBeTruthy();
      expect(mockNavigate).toHaveBeenCalledWith("Login", { message: "REGISTER_SUCCESS" });
    });
  });

  it("muestra error si fetch devuelve error", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Usuario ya existe" }),
    });

    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByPlaceholderText("Usuario"), "usuario1");
    fireEvent.changeText(getByPlaceholderText("Nombre completo"), "Juan Perez");
    fireEvent.changeText(getByPlaceholderText("DNI/NIE"), "12345678A");
    fireEvent.changeText(getByPlaceholderText("Email"), "juan@test.com");
    fireEvent.changeText(getByPlaceholderText("Numero de Teléfono"), "600123456");
    fireEvent.changeText(getByPlaceholderText("Contraseña"), "123456");
    fireEvent.changeText(getByPlaceholderText("Confirmar contraseña"), "123456");

    fireEvent.press(getByText("Crear Cuenta"));

    await waitFor(() => {
      expect(getByText("Usuario ya existe")).toBeTruthy();
    });
  });

  it("navega a Login al presionar el link", () => {
    const { getByText } = render(<RegisterScreen navigation={navigation} route={mockRoute} />);
    const loginLink = getByText("¿Ya tienes cuenta? Inicia sesión");
    fireEvent.press(loginLink);
    expect(mockNavigate).toHaveBeenCalledWith("Login", {});
  });

  it("coincide con el snapshot", () => {
    const { toJSON } = render(<RegisterScreen navigation={navigation} route={mockRoute} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
