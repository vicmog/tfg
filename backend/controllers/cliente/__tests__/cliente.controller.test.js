import { createCliente, deleteCliente, getClientesByNegocio, searchClientes, updateCliente } from "../clienteController.js";
import { Cliente } from "../../../models/Cliente.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";
import {
  buildRes,
  createClienteReq,
  createClienteReqSinAcceso,
  createClienteReqSinContacto,
  deleteClienteReq,
  deleteClienteReqSinAuth,
  getClientesReq,
  mockClienteConDestroy,
  mockClienteConUpdate,
  mockClienteData,
  mockClientesBusqueda,
  mockClienteListado,
  mockUsuarioEncontrado,
  searchClientesReq,
  searchClientesReqSinAcceso,
  searchClientesReqSinAuth,
  searchClientesReqSinTermino,
  updateClienteReq,
  updateClienteReqSinContacto,
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

  describe("deleteCliente", () => {
    it("debería eliminar cliente correctamente", async () => {
      (Cliente.findByPk).mockResolvedValue(mockClienteConDestroy);
      (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioEncontrado);

      const { res, jsonMock } = buildRes();

      await deleteCliente(deleteClienteReq, res);

      expect(Cliente.findByPk).toHaveBeenCalledWith("1");
      expect(mockClienteConDestroy.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Cliente eliminado correctamente",
      });
    });

    it("debería fallar si el usuario no está autenticado", async () => {
      const { res, jsonMock } = buildRes();

      await deleteCliente(deleteClienteReqSinAuth, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario no autenticado",
      });
    });

    it("debería fallar si el cliente no existe", async () => {
      (Cliente.findByPk).mockResolvedValue(null);

      const { res, jsonMock } = buildRes();

      await deleteCliente(deleteClienteReq, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Cliente no encontrado",
      });
    });

    it("debería fallar si no tiene acceso al negocio del cliente", async () => {
      (Cliente.findByPk).mockResolvedValue(mockClienteConDestroy);
      (UsuarioNegocio.findOne).mockResolvedValue(null);

      const { res, jsonMock } = buildRes();

      await deleteCliente(deleteClienteReq, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "No tienes acceso a este negocio",
      });
    });
  });

  describe("updateCliente", () => {
    it("debería actualizar cliente correctamente", async () => {
      (Cliente.findByPk).mockResolvedValue(mockClienteConUpdate);
      (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioEncontrado);

      const { res, jsonMock } = buildRes();

      await updateCliente(updateClienteReq, res);

      expect(Cliente.findByPk).toHaveBeenCalledWith("1");
      expect(mockClienteConUpdate.update).toHaveBeenCalledWith({
        nombre: "María",
        apellido1: "Ruiz",
        apellido2: "Gil",
        email: "maria@mail.com",
        numero_telefono: "600111222",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Cliente actualizado correctamente",
        cliente: {
          id_cliente: 1,
          id_negocio: 10,
          nombre: "María",
          apellido1: "Ruiz",
          apellido2: "Gil",
          email: null,
          numero_telefono: "600111222",
          bloqueado: false,
        },
      });
    });

    it("debería fallar si no hay contacto en actualización", async () => {
      const { res, jsonMock } = buildRes();

      await updateCliente(updateClienteReqSinContacto, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Debes indicar email o teléfono",
      });
    });
  });

  describe("searchClientes", () => {
    it("debería devolver clientes por nombre o teléfono", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioEncontrado);
      (Cliente.findAll).mockResolvedValue(mockClientesBusqueda);

      const { res, jsonMock } = buildRes();

      await searchClientes(searchClientesReq, res);

      expect(UsuarioNegocio.findOne).toHaveBeenCalledWith({
        where: { id_usuario: 1, id_negocio: "10" },
      });
      expect(Cliente.findAll).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        clientes: mockClientesBusqueda,
      });
    });

    it("debería devolver lista vacía si el término está vacío", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue(mockUsuarioEncontrado);
      const { res, jsonMock } = buildRes();

      await searchClientes(searchClientesReqSinTermino, res);

      expect(Cliente.findAll).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ clientes: [] });
    });

    it("debería fallar si el usuario no está autenticado", async () => {
      const { res, jsonMock } = buildRes();

      await searchClientes(searchClientesReqSinAuth, res);

      expect(UsuarioNegocio.findOne).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario no autenticado",
      });
    });

    it("debería fallar si no tiene acceso al negocio", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue(null);
      const { res, jsonMock } = buildRes();

      await searchClientes(searchClientesReqSinAcceso, res);

      expect(Cliente.findAll).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "No tienes acceso a este negocio",
      });
    });
  });
});
