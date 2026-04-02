import { createCompra } from "../compraController.js";
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
    createCompraReqSinPermiso,
    createCompraReqSinProductos,
    mockProductos,
    mockProveedores,
    mockUsuarioAdmin,
    mockUsuarioJefe,
    mockUsuarioTrabajador,
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
});
