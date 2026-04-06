import { createCompra, deleteCompra, getCompraById, getCompras, updateCompra } from "../compraController.js";
import { Compra } from "../../../models/Compra.js";
import { CompraProducto } from "../../../models/CompraProducto.js";
import { Producto } from "../../../models/Producto.js";
import { Proveedor } from "../../../models/Proveedor.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import { sequelize } from "../../../models/db.js";
import {
    buildRes,
    createCompraReq,
    createCompraReqAdmin,
    createCompraReqCantidadEsperadaInvalida,
    createCompraReqCantidadLlegadaInvalida,
    createCompraReqProductoDuplicado,
    createCompraReqProductoFueraNegocio,
    createCompraReqSinFecha,
    createCompraReqSinPermiso,
    createCompraReqSinProductos,
    mockProductos,
    mockProveedores,
    mockUsuarioAdmin,
    mockUsuarioJefe,
    mockUsuarioTrabajador,
    updateCompraReq,
    updateCompraReqCompletada,
    updateCompraReqSinFecha,
    updateCompraReqSinPermiso,
} from "./data.js";

jest.mock("../../../models/Compra.js");
jest.mock("../../../models/CompraProducto.js");
jest.mock("../../../models/Producto.js");
jest.mock("../../../models/Proveedor.js");
jest.mock("../../../models/UsuarioNegocio.js");

describe("CompraController Unit Tests", () => {
    let transactionSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        transactionSpy = jest.spyOn(sequelize, "transaction").mockImplementation(async (callback) => callback({}));
    });

    afterEach(() => {
        transactionSpy.mockRestore();
    });

    it("deberia crear compra correctamente para jefe", async () => {
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioJefe);
        Producto.findAll.mockResolvedValue(mockProductos);
        Proveedor.findAll.mockResolvedValue(mockProveedores);
        Compra.create.mockResolvedValue({
            id_compra: 50,
            id_negocio: 10,
            descripcion: "Reposicion mensual",
            fecha: new Date("2026-04-02T10:00:00.000Z"),
            importe_total: 62,
            estado: "pendiente",
        });

        const { res, jsonMock } = buildRes();

        await createCompra(createCompraReq, res);

        expect(Compra.create).toHaveBeenCalledWith(
            expect.objectContaining({
                id_negocio: 10,
                estado: "pendiente",
                importe_total: 62,
            }),
            expect.any(Object)
        );
        expect(CompraProducto.bulkCreate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ id_producto: 7, cantidad_esperada: 10, cantidad_llegada: 0 }),
                expect.objectContaining({ id_producto: 9, cantidad_esperada: 4, cantidad_llegada: 1 }),
            ]),
            expect.any(Object)
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Compra registrada correctamente",
                compra: expect.objectContaining({ id_compra: 50, estado: "pendiente" }),
            })
        );
    });

    it("deberia crear compra correctamente para admin", async () => {
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioAdmin);
        Producto.findAll.mockResolvedValue([mockProductos[0]]);
        Proveedor.findAll.mockResolvedValue([mockProveedores[0]]);
        Compra.create.mockResolvedValue({
            id_compra: 51,
            id_negocio: 10,
            descripcion: "Reposicion mensual",
            fecha: new Date("2026-04-02T10:00:00.000Z"),
            importe_total: 50,
            estado: "pendiente",
        });

        const req = {
            ...createCompraReqAdmin,
            body: {
                ...createCompraReqAdmin.body,
                productos: [{ id_producto: 7, cantidad_esperada: 10, cantidad_llegada: 0 }],
            },
        };
        const { res } = buildRes();

        await createCompra(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("deberia crear compra como completada cuando todo llega", async () => {
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioJefe);
        Producto.findAll.mockResolvedValue([mockProductos[0]]);
        Proveedor.findAll.mockResolvedValue([mockProveedores[0]]);
        Compra.create.mockResolvedValue({
            id_compra: 60,
            id_negocio: 10,
            descripcion: "Compra completa",
            fecha: new Date("2026-04-02T10:00:00.000Z"),
            importe_total: 50,
            estado: "completada",
        });

        const req = {
            ...createCompraReq,
            body: {
                ...createCompraReq.body,
                productos: [{ id_producto: 7, cantidad_esperada: 10, cantidad_llegada: 10 }],
            },
        };
        const { res } = buildRes();

        await createCompra(req, res);

        expect(Compra.create).toHaveBeenCalledWith(
            expect.objectContaining({ estado: "completada" }),
            expect.any(Object)
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("deberia fallar si no tiene permisos", async () => {
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioTrabajador);
        const { res, jsonMock } = buildRes();

        await createCompra(createCompraReqSinPermiso, res);

        expect(Compra.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "No tienes permisos para gestionar compras",
        });
    });

    it("deberia fallar si no hay productos", async () => {
        const { res, jsonMock } = buildRes();

        await createCompra(createCompraReqSinProductos, res);

        expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Debes indicar al menos un producto",
        });
    });

    it("deberia fallar si la fecha no viene informada", async () => {
        const { res, jsonMock } = buildRes();

        await createCompra(createCompraReqSinFecha, res);

        expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "La fecha de compra es obligatoria",
        });
    });

    it("deberia fallar si cantidad esperada es invalida", async () => {
        const { res, jsonMock } = buildRes();

        await createCompra(createCompraReqCantidadEsperadaInvalida, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "La cantidad esperada debe ser un entero mayor que 0",
        });
    });

    it("deberia fallar si cantidad llegada supera la esperada", async () => {
        const { res, jsonMock } = buildRes();

        await createCompra(createCompraReqCantidadLlegadaInvalida, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "La cantidad llegada no puede ser mayor que la esperada",
        });
    });

    it("deberia fallar si hay productos duplicados", async () => {
        const { res, jsonMock } = buildRes();

        await createCompra(createCompraReqProductoDuplicado, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "No se pueden repetir productos en la misma compra",
        });
    });

    it("deberia fallar si hay producto fuera del negocio", async () => {
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioJefe);
        Producto.findAll.mockResolvedValue(mockProductos);
        Proveedor.findAll.mockResolvedValue([
            mockProveedores[0],
            { id_proveedor: 21, id_negocio: 999 },
        ]);
        const { res, jsonMock } = buildRes();

        await createCompra(createCompraReqProductoFueraNegocio, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Hay productos que no pertenecen al negocio seleccionado",
        });
    });

    it("deberia listar compras por negocio ordenadas por fecha", async () => {
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioJefe);
        Compra.findAndCountAll.mockResolvedValue({
            rows: [
                {
                    id_compra: 100,
                    id_negocio: 10,
                    descripcion: "Reposicion 1",
                    fecha: new Date("2026-04-03T10:00:00.000Z"),
                    importe_total: 32,
                    estado: "pendiente",
                },
            ],
            count: 1,
        });
        CompraProducto.findAll.mockResolvedValue([
            { id_compra: 100, id_producto: 7, cantidad_esperada: 2, cantidad_llegada: 1 },
        ]);
        Producto.findAll.mockResolvedValue([
            { id_producto: 7, id_proveedor: 20, nombre: "Champu" },
        ]);
        Proveedor.findAll.mockResolvedValue([
            { id_proveedor: 20, nombre: "Proveedor Norte" },
        ]);

        const { res, jsonMock } = buildRes();
        const req = {
            user: { id_usuario: 1 },
            query: { id_negocio: "10", page: "1", limit: "20", sort_by: "fecha", sort_order: "desc" },
        };

        await getCompras(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Compras obtenidas correctamente",
                compras: [
                    expect.objectContaining({
                        id_compra: 100,
                        proveedor: "Proveedor Norte",
                    }),
                ],
                pagination: expect.objectContaining({ total: 1, has_more: false }),
            })
        );
    });

    it("deberia obtener el detalle de una compra por id", async () => {
        Compra.findOne.mockResolvedValue({
            id_compra: 100,
            id_negocio: 10,
            descripcion: "Detalle compra",
            fecha: new Date("2026-04-03T10:00:00.000Z"),
            importe_total: 32,
            estado: "pendiente",
        });
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioJefe);
        CompraProducto.findAll.mockResolvedValue([
            { id_compra: 100, id_producto: 7, cantidad_esperada: 2, cantidad_llegada: 1 },
        ]);
        Producto.findAll.mockResolvedValue([
            { id_producto: 7, id_proveedor: 20, nombre: "Champu" },
        ]);
        Proveedor.findAll.mockResolvedValue([
            { id_proveedor: 20, nombre: "Proveedor Norte" },
        ]);

        const { res, jsonMock } = buildRes();
        const req = {
            user: { id_usuario: 1 },
            params: { id_compra: "100" },
        };

        await getCompraById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Compra obtenida correctamente",
                compra: expect.objectContaining({
                    id_compra: 100,
                    proveedor: "Proveedor Norte",
                    productos: [expect.objectContaining({ id_producto: 7 })],
                }),
            })
        );
    });

    it("deberia devolver 404 cuando la compra no existe", async () => {
        Compra.findOne.mockResolvedValue(null);
        const { res, jsonMock } = buildRes();

        await getCompraById(
            {
                user: { id_usuario: 1 },
                params: { id_compra: "999" },
            },
            res
        );

        expect(res.status).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Compra no encontrada",
        });
    });

    it("deberia eliminar compra correctamente para jefe", async () => {
        const destroyMock = jest.fn().mockResolvedValue(undefined);
        Compra.findOne.mockResolvedValue({
            id_compra: 100,
            id_negocio: 10,
            destroy: destroyMock,
        });
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioJefe);

        const { res, jsonMock } = buildRes();

        await deleteCompra(
            {
                user: { id_usuario: 1 },
                params: { id_compra: "100" },
            },
            res
        );

        expect(destroyMock).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Compra eliminada correctamente",
        });
    });

    it("deberia actualizar compra correctamente para jefe", async () => {
        const updateMock = jest.fn().mockImplementation(async (payload) => ({
            ...payload,
        }));

        Compra.findOne.mockResolvedValue({
            id_compra: 50,
            id_negocio: 10,
            estado: "pendiente",
            update: updateMock,
        });
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioJefe);
        Producto.findAll.mockResolvedValue(mockProductos);
        Proveedor.findAll.mockResolvedValue(mockProveedores);

        const { res, jsonMock } = buildRes();

        await updateCompra(updateCompraReq, res);

        expect(updateMock).toHaveBeenCalledWith(
            expect.objectContaining({
                descripcion: "Compra actualizada",
                importe_total: 36,
            }),
            expect.any(Object)
        );
        expect(CompraProducto.destroy).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id_compra: 50 },
            })
        );
        expect(CompraProducto.bulkCreate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ id_producto: 7, cantidad_esperada: 6 }),
            ]),
            expect.any(Object)
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Compra actualizada correctamente",
                compra: expect.objectContaining({ id_compra: 50, id_negocio: 10 }),
            })
        );
    });

    it("deberia fallar al actualizar compra sin permisos", async () => {
        Compra.findOne.mockResolvedValue({
            id_compra: 50,
            id_negocio: 10,
            estado: "pendiente",
            update: jest.fn(),
        });
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioTrabajador);
        const { res, jsonMock } = buildRes();

        await updateCompra(updateCompraReqSinPermiso, res);

        expect(CompraProducto.destroy).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "No tienes permisos para gestionar compras",
        });
    });

    it("deberia marcar compra como completada al actualizar cantidades", async () => {
        const updateMock = jest.fn().mockImplementation(async (payload) => ({ ...payload }));

        Compra.findOne.mockResolvedValue({
            id_compra: 50,
            id_negocio: 10,
            estado: "pendiente",
            update: updateMock,
        });
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioJefe);
        Producto.findAll.mockResolvedValue(mockProductos);
        Proveedor.findAll.mockResolvedValue(mockProveedores);

        const { res } = buildRes();

        await updateCompra(updateCompraReqCompletada, res);

        expect(updateMock).toHaveBeenCalledWith(
            expect.objectContaining({ estado: "completada" }),
            expect.any(Object)
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("deberia fallar al actualizar compra sin fecha", async () => {
        const { res, jsonMock } = buildRes();

        await updateCompra(updateCompraReqSinFecha, res);

        expect(Compra.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "La fecha de compra es obligatoria",
        });
    });

    it("deberia fallar al eliminar compra sin permisos", async () => {
        const destroyMock = jest.fn().mockResolvedValue(undefined);
        Compra.findOne.mockResolvedValue({
            id_compra: 101,
            id_negocio: 10,
            destroy: destroyMock,
        });
        UsuarioNegocio.findOne.mockResolvedValue(mockUsuarioTrabajador);

        const { res, jsonMock } = buildRes();

        await deleteCompra(
            {
                user: { id_usuario: 3 },
                params: { id_compra: "101" },
            },
            res
        );

        expect(destroyMock).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "No tienes permisos para gestionar compras",
        });
    });

    it("deberia fallar al eliminar compra inexistente", async () => {
        Compra.findOne.mockResolvedValue(null);
        const { res, jsonMock } = buildRes();

        await deleteCompra(
            {
                user: { id_usuario: 1 },
                params: { id_compra: "999" },
            },
            res
        );

        expect(res.status).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Compra no encontrada",
        });
    });
});
