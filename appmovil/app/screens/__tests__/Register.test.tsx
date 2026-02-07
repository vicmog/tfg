import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import RegisterScreen from "./../Register";

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
  AntDesign: "AntDesign",
}));

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

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renderiza correctamente todos los elementos", () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <RegisterScreen navigation={navigation} route={mockRoute} />
    );

    expect(getAllByText("Crear Cuenta").length).toBeGreaterThan(0);
    expect(getByPlaceholderText("Elige un nombre de usuario")).toBeTruthy();
    expect(getByPlaceholderText("Tu nombre y apellidos")).toBeTruthy();
    expect(getByPlaceholderText("Ej: 12345678A")).toBeTruthy();
    expect(getByPlaceholderText("tu@email.com")).toBeTruthy();
    expect(getByPlaceholderText("Ej: 600123456")).toBeTruthy();
    expect(getByPlaceholderText("Mínimo 6 caracteres")).toBeTruthy();
    expect(getByPlaceholderText("Repite la contraseña")).toBeTruthy();
    expect(getAllByText("Crear Cuenta").length).toBeGreaterThan(0);
    expect(getByText("¿Ya tienes cuenta? Inicia sesión")).toBeTruthy();
  });

  it("muestra error si los campos están vacíos al presionar Crear Cuenta", () => {
    const { getAllByText, getByText } = render(
      <RegisterScreen navigation={navigation} route={mockRoute} />
    );

    const submitButtons = getAllByText("Crear Cuenta");
    fireEvent.press(submitButtons[submitButtons.length - 1]);
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
    jest.useFakeTimers();
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Usuario creado" }),
    });

    const { getAllByText, getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByPlaceholderText("Elige un nombre de usuario"), "usuario1");
    fireEvent.changeText(getByPlaceholderText("Tu nombre y apellidos"), "Juan Perez");
    fireEvent.changeText(getByPlaceholderText("Ej: 12345678A"), "12345678A");
    fireEvent.changeText(getByPlaceholderText("tu@email.com"), "juan@test.com");
    fireEvent.changeText(getByPlaceholderText("Ej: 600123456"), "600123456");
    fireEvent.changeText(getByPlaceholderText("Mínimo 6 caracteres"), "123456");
    fireEvent.changeText(getByPlaceholderText("Repite la contraseña"), "123456");

    const submitButtons = getAllByText("Crear Cuenta");
    fireEvent.press(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(getByText("Usuario registrado correctamente")).toBeTruthy();
    });

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(mockNavigate).toHaveBeenCalledWith("Login", { message: "REGISTER_SUCCESS" });
  });

  it("muestra error si fetch devuelve error", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Usuario ya existe" }),
    });

    const { getAllByText, getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={navigation} route={mockRoute} />
    );

    fireEvent.changeText(getByPlaceholderText("Elige un nombre de usuario"), "usuario1");
    fireEvent.changeText(getByPlaceholderText("Tu nombre y apellidos"), "Juan Perez");
    fireEvent.changeText(getByPlaceholderText("Ej: 12345678A"), "12345678A");
    fireEvent.changeText(getByPlaceholderText("tu@email.com"), "juan@test.com");
    fireEvent.changeText(getByPlaceholderText("Ej: 600123456"), "600123456");
    fireEvent.changeText(getByPlaceholderText("Mínimo 6 caracteres"), "123456");
    fireEvent.changeText(getByPlaceholderText("Repite la contraseña"), "123456");

    const submitButtons = getAllByText("Crear Cuenta");
    fireEvent.press(submitButtons[submitButtons.length - 1]);

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
