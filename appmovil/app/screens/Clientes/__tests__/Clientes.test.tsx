import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Clientes from "../Clientes";
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

describe("Clientes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
  });

  it("renderiza la pantalla y obtiene clientes", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ clientes: [] }),
    });

    const { getByText, getByTestId } = render(
      <Clientes navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId("toggle-client-form-button")).toBeTruthy();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        API_ROUTES.clientesByNegocio(1),
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
        })
      );
    });

    expect(getByText("No hay clientes registrados")).toBeTruthy();
  });

  it("muestra validación si no hay contacto", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ clientes: [] }),
    });

    const { getByTestId, getByText } = render(
      <Clientes navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId("toggle-client-form-button"));
    fireEvent.changeText(getByTestId("cliente-nombre-input"), "Juan");
    fireEvent.changeText(getByTestId("cliente-apellido1-input"), "Pérez");
    fireEvent.press(getByTestId("cliente-save-button"));

    await waitFor(() => {
      expect(getByText("Debes indicar email o teléfono")).toBeTruthy();
    });
  });

  it("crea cliente y lo muestra en la lista", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ clientes: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Cliente creado correctamente",
          cliente: {
            id_cliente: 12,
            id_negocio: 1,
            nombre: "Juan",
            apellido1: "Pérez",
            apellido2: null,
            email: "juan@mail.com",
            numero_telefono: "600123123",
            bloqueado: false,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          clientes: [
            {
              id_cliente: 12,
              id_negocio: 1,
              nombre: "Juan",
              apellido1: "Pérez",
              apellido2: null,
              email: "juan@mail.com",
              numero_telefono: "600123123",
              bloqueado: false,
            },
          ],
        }),
      });

    const { getByTestId, getByText } = render(
      <Clientes navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId("toggle-client-form-button"));
    fireEvent.changeText(getByTestId("cliente-nombre-input"), "Juan");
    fireEvent.changeText(getByTestId("cliente-apellido1-input"), "Pérez");
    fireEvent.changeText(getByTestId("cliente-email-input"), "juan@mail.com");
    fireEvent.changeText(getByTestId("cliente-telefono-input"), "600123123");
    fireEvent.press(getByTestId("cliente-save-button"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        API_ROUTES.clientes,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(getByText("Juan Pérez")).toBeTruthy();
    });
  });
});
