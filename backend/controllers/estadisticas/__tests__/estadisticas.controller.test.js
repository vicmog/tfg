import { getCompraStats } from "../estadisticasController.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import { sequelize } from "../../../models/db.js";

jest.mock("../../../models/UsuarioNegocio.js");

const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};

describe("EstadisticasController - getCompraStats", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("deberia rechazar a un trabajador aunque tenga acceso al negocio", async () => {
        const querySpy = jest.spyOn(sequelize, "query");
        UsuarioNegocio.findOne.mockResolvedValue({ id_usuario: 1, id_negocio: 10, rol: "trabajador" });

        const { res, jsonMock } = buildRes();

        await getCompraStats({
            params: { id_negocio: "10" },
            query: { filter: "month", year: "2026", month: "6" },
            user: { id_usuario: 1 },
        }, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "No tienes acceso a este negocio",
        });
        expect(querySpy).not.toHaveBeenCalled();

        querySpy.mockRestore();
    });

    it("deberia usar id_ps en las consultas de compras y devolver estadisticas", async () => {
        const querySpy = jest.spyOn(sequelize, "query");
        querySpy
            .mockResolvedValueOnce([
                { fecha: "2026-06-01", cantidad: 2, total: 30 },
            ])
            .mockResolvedValueOnce([
                { estado: "completada", cantidad: 2, total: 30 },
            ])
            .mockResolvedValueOnce([
                {
                    id_producto: 7,
                    nombre: "Champu",
                    cantidad_esperada: "4",
                    cantidad_llegada: "3",
                    importe_total: "30",
                },
            ])
            .mockResolvedValueOnce([
                { periodo: "2026-06-01", compras: "30" },
            ])
            .mockResolvedValueOnce([
                { id_proveedor: 20, nombre: "Proveedor A", cantidad: 1, total: "30" },
            ]);

        UsuarioNegocio.findOne.mockResolvedValue({ id_usuario: 1, id_negocio: 10, rol: "jefe" });

        const { res, jsonMock } = buildRes();
        await getCompraStats({
            params: { id_negocio: "10" },
            query: { filter: "month", year: "2026", month: "6" },
            user: { id_usuario: 1 },
        }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            message: "Estadísticas de compras obtenidas correctamente",
            purchaseStats: expect.objectContaining({
                comprasPorDia: expect.any(Array),
                comprasPorEstado: expect.any(Array),
                productosMasComprados: expect.any(Array),
            }),
            compraChart: expect.objectContaining({
                mode: expect.any(String),
                compras: expect.any(Array),
            }),
            proveedoresTop: expect.any(Array),
        }));

        expect(querySpy.mock.calls[2][0]).toContain('JOIN "Producto" p ON cp.id_ps = p.id_ps');
        expect(querySpy.mock.calls[4][0]).toContain('JOIN "Producto" pr ON cp.id_ps = pr.id_ps');

        querySpy.mockRestore();
    });
});