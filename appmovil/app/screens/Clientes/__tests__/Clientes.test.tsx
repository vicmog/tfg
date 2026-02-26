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

    const { getByTestId, getByText, getAllByText } = render(
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

    const { getByTestId, getByText, getAllByText } = render(
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

  it("elimina cliente tras confirmación y refresca la lista", async () => {
    (fetch as jest.Mock)
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Cliente eliminado correctamente" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ clientes: [] }),
      });

    const { getByTestId, queryByText } = render(
      <Clientes navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId("cliente-delete-button-12")).toBeTruthy();
    });

    fireEvent.press(getByTestId("cliente-delete-button-12"));

    await waitFor(() => {
      expect(getByTestId("cliente-delete-confirm-12")).toBeTruthy();
    });

    fireEvent.press(getByTestId("cliente-delete-confirm-button-12"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        API_ROUTES.deleteClienteById(12),
        expect.objectContaining({
          method: "DELETE",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(queryByText("Juan Pérez")).toBeNull();
    });

    expect(queryByText("Cliente eliminado correctamente")).toBeTruthy();
  });

  it("edita cliente y guarda cambios", async () => {
    (fetch as jest.Mock)
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Cliente actualizado correctamente",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          clientes: [
            {
              id_cliente: 12,
              id_negocio: 1,
              nombre: "Juan Carlos",
              apellido1: "Pérez",
              apellido2: null,
              email: "juan@mail.com",
              numero_telefono: "600123123",
              bloqueado: false,
            },
          ],
        }),
      });

    const { getByTestId, getByDisplayValue, getByText } = render(
      <Clientes navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId("cliente-edit-button-12")).toBeTruthy();
    });

    fireEvent.press(getByTestId("cliente-edit-button-12"));
    fireEvent.changeText(getByDisplayValue("Juan"), "Juan Carlos");
    fireEvent.press(getByTestId("cliente-save-button"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        API_ROUTES.updateClienteById(12),
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(getByText("Juan Carlos Pérez")).toBeTruthy();
    });
  });

  it("busca clientes al escribir en el buscador", async () => {
    (fetch as jest.Mock)
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          clientes: [
            {
              id_cliente: 13,
              id_negocio: 1,
              nombre: "María",
              apellido1: "Gómez",
              apellido2: null,
              email: "maria@mail.com",
              numero_telefono: "611111111",
              bloqueado: false,
            },
          ],
        }),
      });

    const { getByTestId, getByText, getAllByText } = render(
      <Clientes navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText("Juan Pérez")).toBeTruthy();
    });

    fireEvent.changeText(getByTestId("business-search-input"), "Mar");

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        API_ROUTES.searchClientByNameOrPhone(1, "Mar"),
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
        })
      );
    });

    await waitFor(() => {
      expect(getByText("María Gómez")).toBeTruthy();
    });
  });

  it("finaliza loading tras buscar y muestra vacío si no hay resultados", async () => {
    (fetch as jest.Mock)
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ clientes: [] }),
      });

    const { getByTestId, getByText, queryByText } = render(
      <Clientes navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText("Juan Pérez")).toBeTruthy();
    });

    fireEvent.changeText(getByTestId("business-search-input"), "Zzz");

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        API_ROUTES.searchClientByNameOrPhone(1, "Zzz"),
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
        })
      );
    });

    await waitFor(() => {
      expect(queryByText("Juan Pérez")).toBeNull();
      expect(getByText("No hay clientes registrados")).toBeTruthy();
    });
  });

  it("abre el modal de detalle al pulsar un cliente", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
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

    const { getByTestId, getByText, getAllByText } = render(
      <Clientes navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId("cliente-open-detail-12")).toBeTruthy();
    });

    fireEvent.press(getByTestId("cliente-open-detail-12"));

    await waitFor(() => {
      expect(getByTestId("cliente-detail-modal")).toBeTruthy();
      expect(getByText("Detalle del cliente")).toBeTruthy();
      expect(getAllByText("Juan Pérez").length).toBeGreaterThan(0);
      expect(getAllByText("juan@mail.com").length).toBeGreaterThan(0);
      expect(getAllByText("600123123").length).toBeGreaterThan(0);
    });
  });

  it("cierra el modal de detalle del cliente", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
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

    const { getByTestId, queryByText } = render(
      <Clientes navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId("cliente-open-detail-12")).toBeTruthy();
    });

    fireEvent.press(getByTestId("cliente-open-detail-12"));

    await waitFor(() => {
      expect(getByTestId("cliente-detail-close-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("cliente-detail-close-button"));

    await waitFor(() => {
      expect(queryByText("Detalle del cliente")).toBeNull();
    });
  });
});
