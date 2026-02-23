import { createCliente, getClientesByNegocio } from "../clienteController.js";
import { Cliente } from "../../../models/Cliente.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import {
  buildRes,
  createClienteReq,
  createClienteReqSinAcceso,
  createClienteReqSinContacto,
  getClientesReq,
  mockClienteData,
  mockClienteListado,
  mockUsuarioEncontrado,
} from "./data.js";

jest.mock("../../../models/Cliente.js");
jest.mock("../../../models/UsuarioNegocio.js");

describe("ClienteController Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCliente", () => {
    it("debería crear cliente correctamente", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioEncontrado);
      (Cliente.create).mockResolvedValue(mockClienteData);
      const { res, jsonMock } = buildRes();

      await createCliente(createClienteReq, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Cliente.create).toHaveBeenCalledWith({
        id_negocio: 10,
        nombre: "Ana",
        apellido1: "López",
        apellido2: null,
        email: "ana@mail.com",
        numero_telefono: null,
      });
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Cliente creado correctamente",
        cliente: {
          id_cliente: 3,
          id_negocio: 10,
          nombre: "Ana",
          apellido1: "López",
          apellido2: null,
          email: "ana@mail.com",
          numero_telefono: null,
          bloqueado: false,
        },
      });
    });

    it("debería fallar si no hay contacto", async () => {
      const { res, jsonMock } = buildRes();

      await createCliente(createClienteReqSinContacto, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Debes indicar email o teléfono",
      });
    });

    it("debería fallar si no tiene acceso al negocio", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue(null);

      const { res, jsonMock } = buildRes();

      await createCliente(createClienteReqSinAcceso, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "No tienes acceso a este negocio",
      });
    });
  });

  describe("getClientesByNegocio", () => {
    it("debería devolver clientes del negocio", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioEncontrado);
      (Cliente.findAll).mockResolvedValue([mockClienteListado]);

      const { res, jsonMock } = buildRes();

      await getClientesByNegocio(getClientesReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Cliente.findAll).toHaveBeenCalledWith({
        where: { id_negocio: "10" },
        order: [["createdAt", "DESC"]],
      });
      expect(jsonMock).toHaveBeenCalledWith({
        clientes: [
          mockClienteListado,
        ],
      });
    });
  });
});
