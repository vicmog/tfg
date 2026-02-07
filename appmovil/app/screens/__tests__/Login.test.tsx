import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "./../Login";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
  AntDesign: "AntDesign",
}));

const mockSetIsAuth = jest.fn();

const mockNavigation = {
  navigate: jest.fn(),
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
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <LoginScreen
        navigation={mockNavigation}
        route={mockRoute}
        setIsAuth={mockSetIsAuth}
      />
    );

    expect(getAllByText("Iniciar Sesión").length).toBeGreaterThan(0);
    expect(getByPlaceholderText("Introduce tu usuario")).toBeTruthy();
    expect(getByPlaceholderText("Introduce tu contraseña")).toBeTruthy();
    expect(getAllByText("Iniciar Sesión").length).toBeGreaterThan(0);
    expect(getByText("¿No tienes cuenta? Regístrate")).toBeTruthy();
    expect(getByText("Registrado correctamente. Comprueba tu email para validar tu cuenta.")).toBeTruthy();
  });

  it('navega a ValidateCode cuando backend devuelve UsuarioNoValidado', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id_usuario: 10, message: 'UsuarioNoValidado' }),
    });

    const { getByPlaceholderText, getAllByText } = render(
      <LoginScreen
        navigation={mockNavigation}
        route={mockRoute}
        setIsAuth={mockSetIsAuth}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Introduce tu usuario'), 'user1');
    fireEvent.changeText(getByPlaceholderText('Introduce tu contraseña'), 'pass');
    const loginButtons = getAllByText('Iniciar Sesión');
    fireEvent.press(loginButtons[loginButtons.length - 1]);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ValidateCode', { id_usuario: 10, nombre_usuario: 'user1' });
    });
  });

  it("muestra error si los campos están vacíos al presionar Iniciar Sesión", () => {
    const { getAllByText, getByText } = render(
      <LoginScreen
        navigation={mockNavigation}
        route={mockRoute}
        setIsAuth={mockSetIsAuth}
      />
    );

    const loginButtons = getAllByText("Iniciar Sesión");
    const loginButton = loginButtons[loginButtons.length - 1];
    fireEvent.press(loginButton);

    expect(getByText("Por favor completa todos los campos")).toBeTruthy();
  });

  it("cambia isAuth si login es exitoso", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "abc123", id_usuario: "1" }),
    });

    const { getAllByText, getByPlaceholderText } = render(
      <LoginScreen
        navigation={mockNavigation}
        route={mockRoute}
        setIsAuth={mockSetIsAuth}
      />
    );

    fireEvent.changeText(getByPlaceholderText("Introduce tu usuario"), "usuario1");
    fireEvent.changeText(getByPlaceholderText("Introduce tu contraseña"), "123456");
    const loginButtons = getAllByText("Iniciar Sesión");
    fireEvent.press(loginButtons[loginButtons.length - 1]);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("token", "abc123");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("id_usuario", "1");
      expect(mockSetIsAuth).toHaveBeenCalledWith(true);
    });
  });

  it("muestra error si fetch devuelve error", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Usuario o contraseña incorrecta" }),
    });

    const { getAllByText, getByPlaceholderText, getByText } = render(
      <LoginScreen
        navigation={mockNavigation}
        route={mockRoute}
        setIsAuth={mockSetIsAuth}
      />
    );

    fireEvent.changeText(getByPlaceholderText("Introduce tu usuario"), "usuario1");
    fireEvent.changeText(getByPlaceholderText("Introduce tu contraseña"), "wrongpass");
    const loginButtons = getAllByText("Iniciar Sesión");
    fireEvent.press(loginButtons[loginButtons.length - 1]);

    await waitFor(() => {
      expect(getByText("Usuario o contraseña incorrecta")).toBeTruthy();
    });
  });

  it("navega a Register al presionar Regístrate", () => {
    const { getByText } = render(
      <LoginScreen
        navigation={mockNavigation}
        route={mockRoute}
        setIsAuth={mockSetIsAuth}
      />
    );

    const registerLink = getByText("¿No tienes cuenta? Regístrate");
    fireEvent.press(registerLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith("Register");
  });

  it("coincide con el snapshot", () => {
    const { toJSON } = render(
      <LoginScreen
        navigation={mockNavigation}
        route={mockRoute}
        setIsAuth={mockSetIsAuth}
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
