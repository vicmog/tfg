import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ventas from "../Ventas";
import { API_ROUTES } from "@/app/constants/apiRoutes";

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void) => {
    const React = require("react");
    React.useEffect(() => {
      callback();
    }, []);
  },
}));

global.fetch = jest.fn();

describe("Ventas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");

    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === API_ROUTES.ventasByNegocio(1)) {
        return Promise.resolve({ ok: true, json: async () => ({ ventas: [] }) });
      }

      if (url === API_ROUTES.clientesByNegocio(1)) {
        return Promise.resolve({ ok: true, json: async () => ({ clientes: [] }) });
      }

      if (url === API_ROUTES.productosByNegocio(1)) {
        return Promise.resolve({ ok: true, json: async () => ({ productos: [] }) });
      }

      if (url === API_ROUTES.serviciosByNegocio(1)) {
        return Promise.resolve({ ok: true, json: async () => ({ servicios: [] }) });
      }

      return Promise.resolve({ ok: false, json: async () => ({}) });
    });
  });

  it("muestra el boton de añadir venta para un trabajador", async () => {
    const { getByText } = render(
      <Ventas
        route={{ params: { negocio: { id_negocio: 1, nombre: "Mi Negocio", rol: "trabajador" } } } as any}
        navigation={{ goBack: jest.fn(), navigate: jest.fn() } as any}
      />
    );

    await waitFor(() => {
      expect(getByText("Añadir Venta")).toBeTruthy();
    });
  });
});