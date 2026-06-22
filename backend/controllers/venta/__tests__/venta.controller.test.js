import { createVenta } from "../ventaController.js";
import { sequelize } from "../../../models/db.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import { Cliente } from "../../../models/Cliente.js";
import { ProductoServicio } from "../../../models/ProductoServicio.js";
import { Venta } from "../../../models/Venta.js";
import { Producto } from "../../../models/Producto.js";
import { ProductoServicioVenta } from "../../../models/ProductoServicioVenta.js";

jest.mock("../../../models/UsuarioNegocio.js");
jest.mock("../../../models/Cliente.js");
jest.mock("../../../models/ProductoServicio.js");
jest.mock("../../../models/Venta.js");
jest.mock("../../../models/Producto.js");
jest.mock("../../../models/ProductoServicioVenta.js");

const buildRes = () => {
  const jsonMock = jest.fn();
  const res = {
    status: jest.fn(() => ({ json: jsonMock })),
  };

  return { res, jsonMock };
};

describe("VentaController - createVenta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("permite registrar una venta a un trabajador del negocio", async () => {
    const transaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    const transactionSpy = jest.spyOn(sequelize, "transaction").mockResolvedValue(transaction);

    UsuarioNegocio.findOne.mockResolvedValue({ id_usuario: 3, id_negocio: 10, rol: "trabajador" });
    Cliente.findByPk.mockResolvedValue({ id_cliente: 20, id_negocio: 10 });
    ProductoServicio.findByPk.mockResolvedValue({
      id_ps: 7,
      tipo: "PRODUCTO",
      precio: 25,
      producto: { stock: 10 },
      servicio: null,
    });
    Venta.create.mockResolvedValue({
      id_venta: 99,
      id_cliente: 20,
      fecha: new Date("2026-06-22T10:00:00.000Z"),
      precio_total: 25,
      tipo: "producto",
      estado: "completada",
      createdAt: new Date("2026-06-22T10:00:00.000Z"),
      updatedAt: new Date("2026-06-22T10:00:00.000Z"),
    });
    Producto.update.mockResolvedValue([1]);
    ProductoServicioVenta.create.mockResolvedValue({});

    const { res, jsonMock } = buildRes();

    await createVenta(
      {
        user: { id_usuario: 3 },
        body: {
          id_negocio: 10,
          id_cliente: 20,
          fecha: "2026-06-22T10:00:00.000Z",
          items: [{ id_ps: 7, tipo: "PRODUCTO", cantidad: 1 }],
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Venta registrada correctamente",
      venta: expect.objectContaining({
        id_venta: 99,
        id_cliente: 20,
        precio_total: 25,
        tipo: "producto",
      }),
    });
    expect(UsuarioNegocio.findOne).toHaveBeenCalledWith({
      where: { id_usuario: 3, id_negocio: 10 },
    });
    expect(transactionSpy).toHaveBeenCalled();

    transactionSpy.mockRestore();
  });
});