import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Negocios from "./../Negocios";
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
      const cleanup = callback();
      return cleanup;
    }, [callback]);
  },
}));

global.fetch = jest.fn();

describe("Negocios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renderiza la barra de búsqueda y los negocios", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        negocios: [
          { id_negocio: 1, nombre: "Negocio 1", CIF: "A11111111", plantilla: 0, rol: "jefe" },
        ],
      }),
    });

    const { getByTestId, getByText } = render(
      <Negocios navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId("business-search-input")).toBeTruthy();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        API_ROUTES.negocios,
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
        })
      );
    });

    await waitFor(() => {
      expect(getByText("Negocio 1")).toBeTruthy();
    });
  });

  it("actualiza la búsqueda al cambiar el texto", async () => {
    jest.useFakeTimers();

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ negocios: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ negocios: [] }),
      });

    const { getByTestId, getByText } = render(
      <Negocios navigation={mockNavigation} route={mockRoute} />
    );

    const searchInput = getByTestId("business-search-input");
    fireEvent.changeText(searchInput, "B22");

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${API_ROUTES.negocios}?search=B22`,
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
        })
      );
    });

    await waitFor(() => {
      expect(getByText("No se encontraron negocios")).toBeTruthy();
    });
  });
});
