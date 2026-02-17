import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomeScreen from "../Home";
import { mockRoute } from "./data";
import { LOGIN_MESSAGE, REGISTER, REGISTER_MESSAGE, WELCOME } from "../constants";

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
  AntDesign: "AntDesign",
}));

const mockNavigate = jest.fn();

export const navigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

describe("HomeScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renderiza el texto de bienvenida", () => {
    const { getByText } = render(<HomeScreen navigation={navigation} route={mockRoute} />);
    expect(getByText(WELCOME)).toBeTruthy();
  });

  it("renderiza los botones de Iniciar Sesión y Crear cuenta", () => {
    const { getByText } = render(<HomeScreen navigation={navigation} route={mockRoute} />);
    expect(getByText(LOGIN_MESSAGE)).toBeTruthy();
    expect(getByText(REGISTER_MESSAGE)).toBeTruthy();
  });

  it("navega a Login al presionar Iniciar Sesión", () => {
    const { getByText } = render(<HomeScreen navigation={navigation} route={mockRoute} />);
    const loginButton = getByText(LOGIN_MESSAGE);
    fireEvent.press(loginButton);
    expect(mockNavigate).toHaveBeenCalledWith("Login", {});
  });

  it("navega a Register al presionar Crear cuenta", () => {
    const { getByText } = render(<HomeScreen navigation={navigation} route={mockRoute}/>);
    const registerButton = getByText(REGISTER_MESSAGE);
    fireEvent.press(registerButton);
    expect(mockNavigate).toHaveBeenCalledWith(REGISTER);
  });

   it("coincide con el snapshot", () => {
    const { toJSON } = render(
      <HomeScreen navigation={navigation} route={mockRoute} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
