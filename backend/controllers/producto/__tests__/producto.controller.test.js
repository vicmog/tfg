import {
    createProducto,
    deleteProducto,
    getProductoById,
    getProductosByNegocio,
    searchProductosByNegocio,
    updateProducto,
} from "../productoController.js";
import { Producto } from "../../../models/Producto.js";
import { Proveedor } from "../../../models/Proveedor.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import {
    buildRes,
    createProductoReq,
    createProductoReqAdmin,
    createProductoReqPrecioInvalido,
    createProductoReqProveedorOtroNegocio,
    createProductoReqSinNombre,
    createProductoReqSinPermiso,
    createProductoReqSinReferencia,
    createProductoReqStockInvalido,
    deleteProductoReq,
    deleteProductoReqAdmin,
    deleteProductoReqSinAuth,
    deleteProductoReqSinPermiso,
    getProductosReq,
    getProductosReqSinPermiso,
    mockProductoData,
    mockProductoEntity,
    mockProductoEntityWithUpdate,
    mockProductos,
    mockProveedor,
    mockUsuarioAdmin,
    mockUsuarioJefe,
    mockUsuarioTrabajador,
    searchProductosReq,
    searchProductosReqSinPermiso,
    getProductoByIdReq,
    getProductoByIdReqSinPermiso,
    updateProductoReq,
    updateProductoReqProveedorOtroNegocio,
    updateProductoReqSinNombre,
    updateProductoReqSinPermiso,
} from "./data.js";

jest.mock("../../../models/Producto.js");
jest.mock("../../../models/Proveedor.js");
jest.mock("../../../models/UsuarioNegocio.js");

describe("ProductoController Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createProducto", () => {
        it("deberia crear producto correctamente para jefe", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Proveedor.findByPk).mockResolvedValue(mockProveedor);
            (Producto.create).mockResolvedValue(mockProductoData);

            const { res, jsonMock } = buildRes();

            await createProducto(createProductoReq, res);

            expect(Producto.create).toHaveBeenCalledWith({
                id_proveedor: 7,
                nombre: "Champu profesional",
                referencia: "CH-001",
                categoria: "Cosmetica",
                precio_compra: 5.25,
                precio_venta: 12.99,
                stock: 50,
                stock_minimo: 5,
                descripcion: "Uso diario",
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Producto creado correctamente",
                producto: mockProductoData,
            });
        });

        it("deberia crear producto correctamente para admin", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);
            (Proveedor.findByPk).mockResolvedValue(mockProveedor);
            (Producto.create).mockResolvedValue({ ...mockProductoData, nombre: "Mascarilla" });

            const { res } = buildRes();

            await createProducto(createProductoReqAdmin, res);

            expect(Producto.create).toHaveBeenCalledWith({
                id_proveedor: 7,
                nombre: "Mascarilla",
                referencia: "MSK-002",
                categoria: "Cosmetica",
                precio_compra: 4,
                precio_venta: 11,
                stock: 30,
                stock_minimo: 3,
                descripcion: null,
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("deberia fallar si falta nombre", async () => {
            const { res, jsonMock } = buildRes();

            await createProducto(createProductoReqSinNombre, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El nombre del producto es obligatorio",
            });
        });

        it("deberia fallar si falta referencia", async () => {
            const { res, jsonMock } = buildRes();

            await createProducto(createProductoReqSinReferencia, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "La referencia del producto es obligatoria",
            });
        });

        it("deberia fallar si el precio de venta es invalido", async () => {
            const { res, jsonMock } = buildRes();

            await createProducto(createProductoReqPrecioInvalido, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El precio de venta debe ser mayor que 0",
            });
        });

        it("deberia fallar si el stock es invalido", async () => {
            const { res, jsonMock } = buildRes();

            await createProducto(createProductoReqStockInvalido, res);

            expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El stock debe ser un número entero mayor o igual a 0",
            });
        });

        it("deberia fallar si el usuario no es jefe ni admin", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await createProducto(createProductoReqSinPermiso, res);

            expect(Producto.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar productos",
            });
        });

        it("deberia fallar si el proveedor no existe", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Proveedor.findByPk).mockResolvedValue(null);

            const { res, jsonMock } = buildRes();

            await createProducto(createProductoReq, res);

            expect(Producto.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Proveedor no encontrado",
            });
        });

        it("deberia fallar si el proveedor no pertenece al negocio", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Proveedor.findByPk).mockResolvedValue({ ...mockProveedor, id_negocio: 12 });

            const { res, jsonMock } = buildRes();

            await createProducto(createProductoReqProveedorOtroNegocio, res);

            expect(Producto.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El proveedor no pertenece al negocio seleccionado",
            });
        });
    });

    describe("getProductosByNegocio", () => {
        it("deberia devolver productos con proveedor", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Proveedor.findAll).mockResolvedValue([mockProveedor]);
            (Producto.findAll).mockResolvedValue(mockProductos);

            const { res, jsonMock } = buildRes();

            await getProductosByNegocio(getProductosReq, res);

            expect(Producto.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: [["createdAt", "DESC"]],
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Productos obtenidos correctamente",
                    productos: expect.any(Array),
                })
            );
        });

        it("deberia fallar si no tiene permisos", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await getProductosByNegocio(getProductosReqSinPermiso, res);

            expect(Producto.findAll).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar productos",
            });
        });
    });

    describe("searchProductosByNegocio", () => {
        it("deberia buscar productos por termino", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
            (Proveedor.findAll).mockResolvedValue([mockProveedor]);
            (Producto.findAll).mockResolvedValue([mockProductoData]);

            const { res, jsonMock } = buildRes();

            await searchProductosByNegocio(searchProductosReq, res);

            expect(Producto.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: [["createdAt", "DESC"]],
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Productos filtrados correctamente",
                    productos: expect.any(Array),
                })
            );
        });

        it("deberia fallar si no tiene permisos", async () => {
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await searchProductosByNegocio(searchProductosReqSinPermiso, res);

            expect(Producto.findAll).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar productos",
            });
        });
    });

    describe("getProductoById", () => {
        it("deberia devolver detalle de producto", async () => {
            (Producto.findByPk).mockResolvedValue(mockProductoData);
            (Proveedor.findByPk).mockResolvedValue(mockProveedor);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await getProductoById(getProductoByIdReq, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Producto obtenido correctamente",
                    producto: expect.objectContaining({
                        id_producto: 55,
                        proveedor_nombre: "Proveedor Norte",
                    }),
                })
            );
        });

        it("deberia fallar si no tiene permisos", async () => {
            (Producto.findByPk).mockResolvedValue(mockProductoData);
            (Proveedor.findByPk).mockResolvedValue(mockProveedor);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await getProductoById(getProductoByIdReqSinPermiso, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar productos",
            });
        });
    });

    describe("deleteProducto", () => {
        it("deberia eliminar producto correctamente para jefe", async () => {
            (Producto.findByPk).mockResolvedValue(mockProductoEntity);
            (Proveedor.findByPk).mockResolvedValue(mockProveedor);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await deleteProducto(deleteProductoReq, res);

            expect(mockProductoEntity.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Producto eliminado correctamente",
            });
        });

        it("deberia eliminar producto correctamente para admin", async () => {
            const producto = { ...mockProductoEntity, destroy: jest.fn() };
            (Producto.findByPk).mockResolvedValue(producto);
            (Proveedor.findByPk).mockResolvedValue(mockProveedor);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);

            const { res } = buildRes();

            await deleteProducto(deleteProductoReqAdmin, res);

            expect(producto.destroy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("deberia fallar si no esta autenticado", async () => {
            const { res, jsonMock } = buildRes();

            await deleteProducto(deleteProductoReqSinAuth, res);

            expect(Producto.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Usuario no autenticado",
            });
        });

        it("deberia fallar si no tiene permisos", async () => {
            (Producto.findByPk).mockResolvedValue(mockProductoEntity);
            (Proveedor.findByPk).mockResolvedValue(mockProveedor);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await deleteProducto(deleteProductoReqSinPermiso, res);

            expect(mockProductoEntity.destroy).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar productos",
            });
        });
    });

    describe("updateProducto", () => {
        it("deberia actualizar producto correctamente para jefe", async () => {
            const producto = {
                ...mockProductoEntityWithUpdate,
                update: jest.fn(async function updateProductoMock(fields) {
                    Object.assign(this, fields);
                    return this;
                }),
            };

            (Producto.findByPk).mockResolvedValue(producto);
            (Proveedor.findByPk)
                .mockResolvedValueOnce(mockProveedor)
                .mockResolvedValueOnce(mockProveedor);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await updateProducto(updateProductoReq, res);

            expect(producto.update).toHaveBeenCalledWith({
                id_proveedor: 7,
                nombre: "Champu premium",
                referencia: "CH-001-NEW",
                categoria: "Cosmetica",
                precio_compra: 6.5,
                precio_venta: 13.99,
                stock: 45,
                stock_minimo: 4,
                descripcion: "Nueva formula",
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Producto actualizado correctamente",
                    producto: expect.objectContaining({
                        id_producto: 55,
                        nombre: "Champu premium",
                    }),
                })
            );
        });

        it("deberia fallar si no tiene permisos", async () => {
            const producto = { ...mockProductoEntityWithUpdate, update: jest.fn() };
            (Producto.findByPk).mockResolvedValue(producto);
            (Proveedor.findByPk).mockResolvedValue(mockProveedor);
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

            const { res, jsonMock } = buildRes();

            await updateProducto(updateProductoReqSinPermiso, res);

            expect(producto.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "No tienes permisos para gestionar productos",
            });
        });

        it("deberia fallar si falta nombre", async () => {
            const { res, jsonMock } = buildRes();

            await updateProducto(updateProductoReqSinNombre, res);

            expect(Producto.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El nombre del producto es obligatorio",
            });
        });

        it("deberia fallar si el proveedor no pertenece al negocio", async () => {
            const producto = { ...mockProductoEntityWithUpdate, update: jest.fn() };
            (Producto.findByPk).mockResolvedValue(producto);
            (Proveedor.findByPk)
                .mockResolvedValueOnce(mockProveedor)
                .mockResolvedValueOnce({ ...mockProveedor, id_proveedor: 999, id_negocio: 12 });
            (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);

            const { res, jsonMock } = buildRes();

            await updateProducto(updateProductoReqProveedorOtroNegocio, res);

            expect(producto.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "El proveedor no pertenece al negocio seleccionado",
            });
        });
    });
});
