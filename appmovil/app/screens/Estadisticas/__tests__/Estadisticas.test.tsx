import React from "react";
import { render } from "@testing-library/react-native";
import Estadisticas from "../Estadisticas";

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

jest.mock("react-native-gifted-charts", () => ({
  BarChart: "BarChart",
}));

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

describe("Estadisticas", () => {
  it("muestra un mensaje de acceso denegado a trabajadores", () => {
    const { getByText } = render(
      <Estadisticas
        route={{ params: { negocio: { id_negocio: 1, nombre: "Mi Negocio", rol: "trabajador" } } } as any}
        navigation={{ goBack: jest.fn() } as any}
      />
    );

    expect(getByText("Acceso restringido")).toBeTruthy();
    expect(getByText("No tienes acceso a las estadísticas de este negocio")).toBeTruthy();
  });
});