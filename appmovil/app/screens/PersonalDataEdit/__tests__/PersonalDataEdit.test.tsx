import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import PersonalDataEdit from "../PersonalDataEdit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { mockNavigation, mockRoute } from "./data";

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
  AntDesign: "AntDesign",
}));
global.fetch = jest.fn();

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("PersonalDataEdit", () => {
  const setIsAuthMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly and loads user data", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === "token") return Promise.resolve("mock-jwt");
      if (key === "id_usuario") return Promise.resolve("1");
      return null;
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nombre_usuario: "testuser",
        nombre: "Test User",
        dni: "12345678A",
        email: "test@test.com",
        numero_telefono: "600123456",
      }),
    });

    const { getByTestId } = render(
      <PersonalDataEdit
        navigation={mockNavigation}
        route={mockRoute}
        setIsAuth={setIsAuthMock}
      />,
    );

    await waitFor(() => {
      expect(getByTestId("input-username").props.value).toBe("testuser");
      expect(getByTestId("input-fullname").props.value).toBe("Test User");
      expect(getByTestId("input-dni").props.value).toBe("12345678A");
      expect(getByTestId("input-email").props.value).toBe("test@test.com");
      expect(getByTestId("input-phone").props.value).toBe("600123456");
    });
  });

  it("saves updated data correctly", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === "token") return Promise.resolve("mock-jwt");
      if (key === "id_usuario") return Promise.resolve("1");
      return null;
    });

    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nombre_usuario: "testuser",
          nombre: "Test User",
          dni: "12345678A",
          email: "test@test.com",
          numero_telefono: "600123456",
        }),
      })

      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Usuario actualizado correctamente",
        }),
      });

    const { getByTestId, getByText } = render(
      <PersonalDataEdit
        navigation={mockNavigation}
        route={mockRoute}
        setIsAuth={setIsAuthMock}
      />,
    );

    await waitFor(() => getByTestId("input-fullname"));

    fireEvent.changeText(getByTestId("input-fullname"), "Nuevo Nombre");
    fireEvent.changeText(getByTestId("input-email"), "nuevo@test.com");

    await act(async () => {
      fireEvent.press(getByTestId("save-button"));
    });

    await waitFor(() => {
      expect(getByText("Datos guardados correctamente")).toBeTruthy();
    });

    expect(getByTestId("old-password").props.value).toBe("");
    expect(getByTestId("new-password").props.value).toBe("");
  });
});
