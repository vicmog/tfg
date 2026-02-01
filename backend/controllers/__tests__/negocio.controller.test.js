import { createNegocio, getNegocios } from "../negocioController.js";
import { Negocio } from "../../models/Negocio.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";

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
      // Debe crear relación para el usuario creador y para el admin (id=1)
      expect(UsuarioNegocio.create).toHaveBeenCalledTimes(2);
      expect(UsuarioNegocio.create).toHaveBeenCalledWith({
        id_usuario: 2,
        id_negocio: 1,
        rol: "Jefe",
      });
      expect(UsuarioNegocio.create).toHaveBeenCalledWith({
        id_usuario: 1,
        id_negocio: 1,
        rol: "Admin",
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
        user: { id_usuario: 1 }, // El admin crea el negocio
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await createNegocio(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      // Solo debe crear una relación (no duplicar admin)
      expect(UsuarioNegocio.create).toHaveBeenCalledTimes(1);
      expect(UsuarioNegocio.create).toHaveBeenCalledWith({
        id_usuario: 1,
        id_negocio: 1,
        rol: "Jefe",
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
        { id_usuario: 1, id_negocio: 1, rol: "Jefe" },
        { id_usuario: 1, id_negocio: 2, rol: "Empleado" },
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
          { id_negocio: 1, nombre: "Negocio 1", CIF: "A11111111", plantilla: 0, rol: "Jefe" },
          { id_negocio: 2, nombre: "Negocio 2", CIF: "B22222222", plantilla: 0, rol: "Empleado" },
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
});
