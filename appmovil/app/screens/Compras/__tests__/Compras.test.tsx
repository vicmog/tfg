/// <reference types="jest" />
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Compras from "../Compras";
import { API_ROUTES } from "@/app/constants/apiRoutes";
import { mockNavigation, mockRoute, mockRouteTrabajador } from "./data";

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

jest.mock("@react-native-community/datetimepicker", () => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return ({ onChange, testID }: { onChange: (event: { type: string }, date: Date) => void; testID?: string }) => (
        <TouchableOpacity
            testID={testID || "mock-datetimepicker"}
            onPress={() => onChange({ type: "set" }, new Date(2026, 3, 2))}
        >
            <Text>Mock Date Picker</Text>
        </TouchableOpacity>
    );
});

global.fetch = jest.fn();

describe("Compras", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockReset();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mock-token");
    });

    it("renderiza compras y abre detalle", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    compras: [
                        {
                            id_compra: 10,
                            id_negocio: 1,
                            fecha: "2026-04-02T10:00:00.000Z",
                            importe_total: 20,
                            estado: "pendiente",
                            proveedor: "Proveedor Uno",
                        },
                    ],
                    pagination: { page: 1, limit: 20, total: 1, has_more: false },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    productos: [
                        {
                            id_producto: 7,
                            id_proveedor: 2,
                            nombre: "Champu",
                            referencia: "CH-01",
                            categoria: "higiene",
                            precio_compra: 5,
                            precio_venta: 9,
                            stock: 10,
                            stock_minimo: 2,
                        },
                        {
                            id_producto: 9,
                            id_proveedor: 2,
                            nombre: "Mascarilla",
                            referencia: "MS-01",
                            categoria: "tratamiento",
                            precio_compra: 3,
                            precio_venta: 7,
                            stock: 15,
                            stock_minimo: 3,
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    compra: {
                        id_compra: 10,
                        id_negocio: 1,
                        fecha: "2026-04-02T10:00:00.000Z",
                        importe_total: 20,
                        estado: "pendiente",
                        proveedor: "Proveedor Uno",
                        productos: [
                            {
                                id_producto: 7,
                                nombre: "Champu",
                                cantidad_esperada: 2,
                                cantidad_llegada: 1,
                                proveedor_nombre: "Proveedor Uno",
                            },
                        ],
                    },
                }),
            });

        const { getByTestId, queryByTestId } = render(
            <Compras navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("compras-item-0")).toBeTruthy();
        });

        fireEvent.press(getByTestId("compras-open-detail-10"));

        await waitFor(() => {
            expect(getByTestId("compras-detail-close-button")).toBeTruthy();
        });

        expect(fetch).toHaveBeenCalledWith(
            API_ROUTES.compraById(10),
            expect.objectContaining({
                headers: { Authorization: "Bearer mock-token" },
            })
        );
    });

    it("aplica filtro solo por fecha", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                compras: [],
                pagination: { page: 1, limit: 20, total: 0, has_more: false },
            }),
        });

        const { getByTestId, queryByTestId } = render(
            <Compras navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenCalled();
        });

        fireEvent.press(getByTestId("compras-open-filters-button"));
        fireEvent.press(getByTestId("compras-filter-fecha-input"));
        if (queryByTestId("compras-filter-date-picker")) {
            fireEvent.press(getByTestId("compras-filter-date-picker"));
        } else {
            fireEvent.press(getByTestId("compras-calendar-day-2"));
        }
        fireEvent.press(getByTestId("compras-apply-filters-button"));

        await waitFor(() => {
            const calls = (fetch as jest.Mock).mock.calls.map((call) => call[0]);
            expect(calls.some((url: string) => url.includes("fecha=2026-04-02") && !url.includes("proveedor="))).toBe(true);
        });
    });

    it("navega a crear compra", async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                compras: [],
                pagination: { page: 1, limit: 20, total: 0, has_more: false },
            }),
        });

        const { getByTestId } = render(
            <Compras navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("compras-go-create-button")).toBeTruthy();
        });

        fireEvent.press(getByTestId("compras-go-create-button"));

        expect(mockNavigation.navigate).toHaveBeenCalledWith("CrearCompra", { negocio: mockRoute.params.negocio });
    });

    it("elimina compra desde listado con confirmacion", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    compras: [
                        {
                            id_compra: 10,
                            id_negocio: 1,
                            fecha: "2026-04-02T10:00:00.000Z",
                            importe_total: 20,
                            estado: "pendiente",
                            proveedor: "Proveedor Uno",
                        },
                    ],
                    pagination: { page: 1, limit: 20, total: 1, has_more: false },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: "Compra eliminada correctamente" }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ compras: [], pagination: { page: 1, limit: 20, total: 0, has_more: false } }),
            });

        const { getByTestId, queryByTestId } = render(
            <Compras navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("compras-item-0")).toBeTruthy();
        });

        fireEvent.press(getByTestId("compras-delete-button-10"));
        expect(getByTestId("compras-delete-confirm-10")).toBeTruthy();
        fireEvent.press(getByTestId("compras-delete-confirm-button-10"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                API_ROUTES.deleteCompraById(10),
                expect.objectContaining({ method: "DELETE" })
            );
        });

        expect(queryByTestId("compras-delete-confirm-10")).toBeNull();
    });

    it("edita una compra y guarda cambios", async () => {
        let comprasListCalls = 0;
        (fetch as jest.Mock).mockImplementation(async (url: string, options?: { method?: string }) => {
            if (url.includes("/compras?") && !options?.method) {
                comprasListCalls += 1;

                if (comprasListCalls === 1) {
                    return {
                        ok: true,
                        json: async () => ({
                            compras: [
                                {
                                    id_compra: 10,
                                    id_negocio: 1,
                                    fecha: "2026-04-02T10:00:00.000Z",
                                    importe_total: 20,
                                    estado: "pendiente",
                                    proveedor: "Proveedor Uno",
                                },
                            ],
                            pagination: { page: 1, limit: 20, total: 1, has_more: false },
                        }),
                    };
                }

                return {
                    ok: true,
                    json: async () => ({ compras: [], pagination: { page: 1, limit: 20, total: 0, has_more: false } }),
                };
            }

            if (url === API_ROUTES.compraById(10) && !options?.method) {
                return {
                    ok: true,
                    json: async () => ({
                        compra: {
                            id_compra: 10,
                            id_negocio: 1,
                            descripcion: "Compra inicial",
                            fecha: "2026-04-02T10:00:00.000Z",
                            importe_total: 20,
                            estado: "pendiente",
                            proveedor: "Proveedor Uno",
                            productos: [
                                {
                                    id_producto: 7,
                                    nombre: "Champu",
                                    cantidad_esperada: 2,
                                    cantidad_llegada: 1,
                                },
                            ],
                        },
                    }),
                };
            }

            if (url === API_ROUTES.productosByNegocio(1) && !options?.method) {
                return {
                    ok: true,
                    json: async () => ({
                        productos: [
                            {
                                id_producto: 7,
                                id_proveedor: 2,
                                nombre: "Champu",
                                referencia: "CH-01",
                                categoria: "higiene",
                                precio_compra: 5,
                                precio_venta: 9,
                                stock: 10,
                                stock_minimo: 2,
                            },
                            {
                                id_producto: 9,
                                id_proveedor: 2,
                                nombre: "Mascarilla",
                                referencia: "MS-01",
                                categoria: "tratamiento",
                                precio_compra: 3,
                                precio_venta: 7,
                                stock: 15,
                                stock_minimo: 3,
                            },
                        ],
                    }),
                };
            }

            if (url === API_ROUTES.updateCompraById(10) && options?.method === "PUT") {
                return {
                    ok: true,
                    json: async () => ({ message: "Compra actualizada correctamente" }),
                };
            }

            return {
                ok: false,
                json: async () => ({ message: "Unexpected mock call" }),
            };
        });

        const { getByTestId } = render(
            <Compras navigation={mockNavigation} route={mockRoute} />
        );

        await waitFor(() => {
            expect(getByTestId("compras-item-0")).toBeTruthy();
        });

        fireEvent.press(getByTestId("compras-edit-button-10"));

        await waitFor(() => {
            expect(getByTestId("compras-edit-save-button")).toBeTruthy();
        });

        fireEvent.changeText(getByTestId("compras-edit-cantidad-esperada-0"), "3");
        fireEvent.press(getByTestId("compras-edit-add-product-row"));
        fireEvent.press(getByTestId("compras-edit-open-product-picker-1"));
        fireEvent.press(getByTestId("compras-edit-picker-item-0"));
        fireEvent.changeText(getByTestId("compras-edit-cantidad-esperada-1"), "4");
        fireEvent.changeText(getByTestId("compras-edit-cantidad-llegada-1"), "1");
        fireEvent.press(getByTestId("compras-edit-save-button"));

        await waitFor(() => {
            const updateCall = (fetch as jest.Mock).mock.calls.find(
                (call) => call[0] === API_ROUTES.updateCompraById(10) && call[1]?.method === "PUT"
            );
            expect(updateCall).toBeTruthy();
            const requestConfig = updateCall?.[1] as { method?: string; body?: string };
            expect(requestConfig).toEqual(expect.objectContaining({ method: "PUT" }));

            const body = JSON.parse(requestConfig.body || "{}");
            expect(body.productos).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ id_producto: 7, cantidad_esperada: "3" }),
                    expect.objectContaining({ id_producto: 9, cantidad_esperada: "4", cantidad_llegada: "1" }),
                ])
            );
        });
    });

    it("no muestra boton eliminar para trabajador", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    compras: [
                        {
                            id_compra: 11,
                            id_negocio: 1,
                            fecha: "2026-04-03T10:00:00.000Z",
                            importe_total: 50,
                            estado: "pendiente",
                            proveedor: "Proveedor Dos",
                        },
                    ],
                    pagination: { page: 1, limit: 20, total: 1, has_more: false },
                }),
            });

        const { getByTestId, queryByTestId } = render(
            <Compras navigation={mockNavigation} route={mockRouteTrabajador} />
        );

        await waitFor(() => {
            expect(getByTestId("compras-item-0")).toBeTruthy();
        });

        expect(queryByTestId("compras-delete-button-11")).toBeNull();
        expect(queryByTestId("compras-edit-button-11")).toBeNull();
    });
});
