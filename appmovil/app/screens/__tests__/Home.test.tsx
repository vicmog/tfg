import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomeScreen from "./../Home";

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
  params: {} 
} as any;

describe("HomeScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renderiza el texto de bienvenida", () => {
    const { getByText } = render(<HomeScreen navigation={navigation} route={mockRoute} />);
    expect(getByText("Bienvenido a Negocio360")).toBeTruthy();
  });

  it("renderiza los botones de Iniciar Sesión y Crear cuenta", () => {
    const { getByText } = render(<HomeScreen navigation={navigation} route={mockRoute} />);
    expect(getByText("Iniciar Sesión")).toBeTruthy();
    expect(getByText("Crear cuenta")).toBeTruthy();
  });

  it("navega a Login al presionar Iniciar Sesión", () => {
    const { getByText } = render(<HomeScreen navigation={navigation} route={mockRoute} />);
    const loginButton = getByText("Iniciar Sesión");
    fireEvent.press(loginButton);
    expect(mockNavigate).toHaveBeenCalledWith("Login", {});
  });

  it("navega a Register al presionar Crear cuenta", () => {
    const { getByText } = render(<HomeScreen navigation={navigation} route={mockRoute}/>);
    const registerButton = getByText("Crear cuenta");
    fireEvent.press(registerButton);
    expect(mockNavigate).toHaveBeenCalledWith("Register");
  });

   it("coincide con el snapshot", () => {
    const { toJSON } = render(
      <HomeScreen navigation={navigation} route={mockRoute} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
