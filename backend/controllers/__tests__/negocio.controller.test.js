import { createNegocio, getNegocios, getNegocioById, updateNegocio, deleteNegocio } from "../negocioController.js";
import { Negocio } from "../../models/Negocio.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { Op } from "sequelize";

jest.mock("../../models/Negocio.js");
jest.mock("../../models/UsuarioNegocio.js");

describe("NegocioController Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createNegocio", () => {
    it("debería crear un negocio correctamente", async () => {
      (Negocio.findOne).mockResolvedValue(null);
      (Negocio.create).mockResolvedValue({
        id_negocio: 1,
        nombre: "Mi Negocio",
        CIF: "B12345678",
        plantilla: 0,
      });
      (UsuarioNegocio.create).mockResolvedValue({});

      const req = {
        body: {
          nombre: "Mi Negocio",
          CIF: "B12345678",
        },
        user: { id_usuario: 2 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await createNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Negocio creado correctamente",
        negocio: {
          id_negocio: 1,
          nombre: "Mi Negocio",
          CIF: "B12345678",
          plantilla: 0,
        },
      });
      expect(Negocio.create).toHaveBeenCalledWith({
        nombre: "Mi Negocio",
        CIF: "B12345678",
        plantilla: 0,
      });
      expect(UsuarioNegocio.create).toHaveBeenCalledTimes(2);
      expect(UsuarioNegocio.create).toHaveBeenCalledWith({
        id_usuario: 2,
        id_negocio: 1,
        rol: "jefe",
      });
      expect(UsuarioNegocio.create).toHaveBeenCalledWith({
        id_usuario: 1,
        id_negocio: 1,
        rol: "admin",
      });
    });

    it("debería crear negocio sin duplicar admin si el creador es admin", async () => {
      (Negocio.findOne).mockResolvedValue(null);
      (Negocio.create).mockResolvedValue({
        id_negocio: 1,
        nombre: "Mi Negocio",
        CIF: "B12345678",
        plantilla: 0,
      });
      (UsuarioNegocio.create).mockResolvedValue({});

      const req = {
        body: {
          nombre: "Mi Negocio",
          CIF: "B12345678",
        },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await createNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(UsuarioNegocio.create).toHaveBeenCalledTimes(1);
      expect(UsuarioNegocio.create).toHaveBeenCalledWith({
        id_usuario: 1,
        id_negocio: 1,
        rol: "jefe",
      });
    });

    it("debería fallar si falta el nombre", async () => {
      const req = {
        body: { CIF: "B12345678" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await createNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "El nombre del negocio es obligatorio",
      });
    });

    it("debería fallar si falta el CIF", async () => {
      const req = {
        body: { nombre: "Mi Negocio" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await createNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "El CIF es obligatorio",
      });
    });

    it("debería fallar si el usuario no está autenticado", async () => {
      const req = {
        body: { nombre: "Mi Negocio", CIF: "B12345678" },
        user: null,
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await createNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario no autenticado",
      });
    });

    it("debería fallar si el CIF ya existe", async () => {
      (Negocio.findOne).mockResolvedValue({ id_negocio: 99, CIF: "B12345678" });

      const req = {
        body: { nombre: "Mi Negocio", CIF: "B12345678" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await createNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Ya existe un negocio con este CIF",
      });
    });

    it("debería manejar errores del servidor", async () => {
      (Negocio.findOne).mockRejectedValue(new Error("DB error"));

      const req = {
        body: { nombre: "Mi Negocio", CIF: "B12345678" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await createNegocio(req, res);
      consoleSpy.mockRestore();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Error en el servidor",
      });
    });
  });

  describe("getNegocios", () => {
    it("debería obtener los negocios del usuario", async () => {
      (UsuarioNegocio.findAll).mockResolvedValue([
        { id_usuario: 1, id_negocio: 1, rol: "jefe" },
        { id_usuario: 1, id_negocio: 2, rol: "trabajador" },
      ]);
      (Negocio.findAll).mockResolvedValue([
        { id_negocio: 1, nombre: "Negocio 1", CIF: "A11111111", plantilla: 0 },
        { id_negocio: 2, nombre: "Negocio 2", CIF: "B22222222", plantilla: 0 },
      ]);

      const req = {
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await getNegocios(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        negocios: [
          { id_negocio: 1, nombre: "Negocio 1", CIF: "A11111111", plantilla: 0, rol: "jefe" },
          { id_negocio: 2, nombre: "Negocio 2", CIF: "B22222222", plantilla: 0, rol: "trabajador" },
        ],
      });
    });

    it("debería filtrar negocios por nombre o CIF", async () => {
      (UsuarioNegocio.findAll).mockResolvedValue([
        { id_usuario: 1, id_negocio: 1, rol: "jefe" },
        { id_usuario: 1, id_negocio: 2, rol: "trabajador" },
      ]);
      (Negocio.findAll).mockResolvedValue([
        { id_negocio: 2, nombre: "Negocio 2", CIF: "B22222222", plantilla: 0 },
      ]);

      const req = {
        user: { id_usuario: 1 },
        query: { search: "B22" },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await getNegocios(req, res);

      const whereClause = (Negocio.findAll).mock.calls[0][0].where;
      expect(whereClause[Op.or]).toHaveLength(2);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        negocios: [
          { id_negocio: 2, nombre: "Negocio 2", CIF: "B22222222", plantilla: 0, rol: "trabajador" },
        ],
      });
    });

    it("debería devolver array vacío si el usuario no tiene negocios", async () => {
      (UsuarioNegocio.findAll).mockResolvedValue([]);

      const req = {
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await getNegocios(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ negocios: [] });
    });

    it("debería fallar si el usuario no está autenticado", async () => {
      const req = {
        user: null,
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await getNegocios(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario no autenticado",
      });
    });

    it("debería manejar errores del servidor", async () => {
      (UsuarioNegocio.findAll).mockRejectedValue(new Error("DB error"));

      const req = {
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await getNegocios(req, res);
      consoleSpy.mockRestore();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Error en el servidor",
      });
    });
  });

  describe("getNegocioById", () => {
    it("debería obtener un negocio por ID correctamente", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, id_negocio: 1, rol: "jefe" });
      (Negocio.findByPk).mockResolvedValue({
        id_negocio: 1,
        nombre: "Mi Negocio",
        CIF: "B12345678",
        plantilla: 0,
      });

      const req = {
        params: { id: "1" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await getNegocioById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        negocio: {
          id_negocio: 1,
          nombre: "Mi Negocio",
          CIF: "B12345678",
          plantilla: 0,
          rol: "jefe",
        },
      });
    });

    it("debería fallar si el usuario no tiene acceso al negocio", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue(null);

      const req = {
        params: { id: "1" },
        user: { id_usuario: 2 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await getNegocioById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "No tienes acceso a este negocio",
      });
    });

    it("debería fallar si el negocio no existe", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, id_negocio: 1, rol: "jefe" });
      (Negocio.findByPk).mockResolvedValue(null);

      const req = {
        params: { id: "999" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await getNegocioById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Negocio no encontrado",
      });
    });

    it("debería fallar si el usuario no está autenticado", async () => {
      const req = {
        params: { id: "1" },
        user: null,
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await getNegocioById(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario no autenticado",
      });
    });

    it("debería manejar errores del servidor", async () => {
      (UsuarioNegocio.findOne).mockRejectedValue(new Error("DB error"));

      const req = {
        params: { id: "1" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await getNegocioById(req, res);
      consoleSpy.mockRestore();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Error en el servidor",
      });
    });
  });

  describe("updateNegocio", () => {
    it("debería actualizar el nombre del negocio correctamente", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, id_negocio: 1, rol: "jefe" });
      const mockNegocio = {
        id_negocio: 1,
        nombre: "Negocio Actualizado",
        CIF: "B12345678",
        plantilla: 0,
        update: jest.fn().mockResolvedValue(true),
      };
      (Negocio.findByPk).mockResolvedValue(mockNegocio);

      const req = {
        params: { id: "1" },
        body: { nombre: "Negocio Actualizado" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await updateNegocio(req, res);

      expect(mockNegocio.update).toHaveBeenCalledWith({ nombre: "Negocio Actualizado" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Negocio actualizado correctamente",
        negocio: {
          id_negocio: 1,
          nombre: "Negocio Actualizado",
          CIF: "B12345678",
          plantilla: 0,
        },
      });
    });

    it("debería permitir a admin actualizar el negocio", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, id_negocio: 1, rol: "admin" });
      const mockNegocio = {
        id_negocio: 1,
        nombre: "Negocio Admin",
        CIF: "B12345678",
        plantilla: 0,
        update: jest.fn().mockResolvedValue(true),
      };
      (Negocio.findByPk).mockResolvedValue(mockNegocio);

      const req = {
        params: { id: "1" },
        body: { nombre: "Negocio Admin" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await updateNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("debería fallar si el usuario no tiene permisos", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 2, id_negocio: 1, rol: "trabajador" });

      const req = {
        params: { id: "1" },
        body: { nombre: "Nuevo Nombre" },
        user: { id_usuario: 2 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await updateNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "No tienes permisos para editar este negocio",
      });
    });

    it("debería fallar si falta el nombre", async () => {
      const req = {
        params: { id: "1" },
        body: {},
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await updateNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "El nombre del negocio es obligatorio",
      });
    });

    it("debería fallar si el negocio no existe", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, id_negocio: 1, rol: "jefe" });
      (Negocio.findByPk).mockResolvedValue(null);

      const req = {
        params: { id: "999" },
        body: { nombre: "Nuevo Nombre" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await updateNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Negocio no encontrado",
      });
    });

    it("debería fallar si el usuario no está autenticado", async () => {
      const req = {
        params: { id: "1" },
        body: { nombre: "Nuevo Nombre" },
        user: null,
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await updateNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario no autenticado",
      });
    });

    it("debería manejar errores del servidor", async () => {
      (UsuarioNegocio.findOne).mockRejectedValue(new Error("DB error"));

      const req = {
        params: { id: "1" },
        body: { nombre: "Nuevo Nombre" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await updateNegocio(req, res);
      consoleSpy.mockRestore();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Error en el servidor",
      });
    });
  });

  describe("deleteNegocio", () => {
    it("debería eliminar el negocio correctamente", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, id_negocio: 1, rol: "jefe" });
      (UsuarioNegocio.destroy).mockResolvedValue(1);
      const mockNegocio = {
        id_negocio: 1,
        nombre: "Mi Negocio",
        destroy: jest.fn().mockResolvedValue(true),
      };
      (Negocio.findByPk).mockResolvedValue(mockNegocio);

      const req = {
        params: { id: "1" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await deleteNegocio(req, res);

      expect(UsuarioNegocio.destroy).toHaveBeenCalledWith({ where: { id_negocio: "1" } });
      expect(mockNegocio.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Negocio eliminado correctamente",
      });
    });

    it("debería permitir a admin eliminar el negocio", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, id_negocio: 1, rol: "admin" });
      (UsuarioNegocio.destroy).mockResolvedValue(1);
      const mockNegocio = {
        id_negocio: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };
      (Negocio.findByPk).mockResolvedValue(mockNegocio);

      const req = {
        params: { id: "1" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await deleteNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("debería fallar si el usuario no tiene permisos", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 2, id_negocio: 1, rol: "trabajador" });

      const req = {
        params: { id: "1" },
        user: { id_usuario: 2 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await deleteNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "No tienes permisos para eliminar este negocio",
      });
    });

    it("debería fallar si el negocio no existe", async () => {
      (UsuarioNegocio.findOne).mockResolvedValue({ id_usuario: 1, id_negocio: 1, rol: "jefe" });
      (Negocio.findByPk).mockResolvedValue(null);

      const req = {
        params: { id: "999" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await deleteNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Negocio no encontrado",
      });
    });

    it("debería fallar si el usuario no está autenticado", async () => {
      const req = {
        params: { id: "1" },
        user: null,
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await deleteNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario no autenticado",
      });
    });

    it("debería manejar errores del servidor", async () => {
      (UsuarioNegocio.findOne).mockRejectedValue(new Error("DB error"));

      const req = {
        params: { id: "1" },
        user: { id_usuario: 1 },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await deleteNegocio(req, res);
      consoleSpy.mockRestore();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Error en el servidor",
      });
    });
  });
});
