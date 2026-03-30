import { createDescuento } from "../descuentoController.js";
import { Descuento } from "../../../models/Descuento.js";
import { Producto } from "../../../models/Producto.js";
import { Proveedor } from "../../../models/Proveedor.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import {
    buildRes,
    createDescuentoReq,
    createDescuentoReqAdmin,
    createDescuentoReqPorcentajeInvalido,
    createDescuentoReqSinAuth,
    createDescuentoReqSinPermiso,
    createDescuentoReqSinProducto,
    mockDescuento,
    mockProducto,
    mockProveedor,
    mockUsuarioAdmin,
    mockUsuarioJefe,
    mockUsuarioTrabajador,
} from "./data.js";

jest.mock("../../../models/Descuento.js");
jest.mock("../../../models/Producto.js");
jest.mock("../../../models/Proveedor.js");
jest.mock("../../../models/UsuarioNegocio.js");

describe("DescuentoController Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("deberia crear descuento correctamente para jefe", async () => {
        (Producto.findByPk).mockResolvedValue(mockProducto);
        (Proveedor.findByPk).mockResolvedValue(mockProveedor);
        (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioJefe);
        (Descuento.create).mockResolvedValue(mockDescuento);

        const { res, jsonMock } = buildRes();

        await createDescuento(createDescuentoReq, res);

        expect(Descuento.create).toHaveBeenCalledWith({
            id_producto: 55,
            porcentaje_descuento: 15,
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Descuento aplicado correctamente",
            descuento: mockDescuento,
        });
    });

    it("deberia crear descuento correctamente para admin", async () => {
        (Producto.findByPk).mockResolvedValue(mockProducto);
        (Proveedor.findByPk).mockResolvedValue(mockProveedor);
        (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioAdmin);
        (Descuento.create).mockResolvedValue({ ...mockDescuento, porcentaje_descuento: 25 });

        const { res } = buildRes();

        await createDescuento(createDescuentoReqAdmin, res);

        expect(Descuento.create).toHaveBeenCalledWith({
            id_producto: 55,
            porcentaje_descuento: 25,
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("deberia fallar si no esta autenticado", async () => {
        const { res, jsonMock } = buildRes();

        await createDescuento(createDescuentoReqSinAuth, res);

        expect(Producto.findByPk).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Usuario no autenticado",
        });
    });

    it("deberia fallar si falta producto", async () => {
        const { res, jsonMock } = buildRes();

        await createDescuento(createDescuentoReqSinProducto, res);

        expect(Producto.findByPk).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "El producto es obligatorio",
        });
    });

    it("deberia fallar si porcentaje es invalido", async () => {
        const { res, jsonMock } = buildRes();

        await createDescuento(createDescuentoReqPorcentajeInvalido, res);

        expect(Producto.findByPk).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "El porcentaje de descuento debe ser mayor que 0 y menor o igual a 100",
        });
    });

    it("deberia fallar si no tiene permisos", async () => {
        (Producto.findByPk).mockResolvedValue(mockProducto);
        (Proveedor.findByPk).mockResolvedValue(mockProveedor);
        (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioTrabajador);

        const { res, jsonMock } = buildRes();

        await createDescuento(createDescuentoReqSinPermiso, res);

        expect(Descuento.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "No tienes permisos para gestionar descuentos",
        });
    });
});
