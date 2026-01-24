import { register, login } from "../authController.js";
import { Usuario } from "../../models/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../../models/Usuario.js");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("AuthController Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("debería registrar un usuario correctamente", async () => {
      (Usuario.findOne).mockResolvedValue(null);
      (Usuario.create).mockResolvedValue({
        id_usuario: 1,
        nombre_usuario: "testuser",
        nombre: "Test User",
        dni: "12345678X",
        email: "test@test.com",
      });

      const req = {
        body: {
          nombre_usuario: "testuser",
          nombre: "Test User",
          dni: "12345678X",
          email: "test@test.com",
          contrasena: "123456",
          consentimiento: true,
        },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario registrado correctamente",
        userId: 1,
      });
      expect(Usuario.create).toHaveBeenCalled();
    });

    it("debería fallar si el email ya existe", async () => {
      (Usuario.findOne).mockResolvedValue({ id_usuario: 1 });
      const req = {
        body: {
          nombre_usuario: "testuser",
          nombre: "Test User",
          dni: "12345678X",
          email: "test@test.com",
          contrasena: "123456",
          consentimiento: true,
        },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario ya registrado con este nombre de usuario",
      });
    });
  });


  describe("login", () => {
    it("debería devolver token al login correcto", async () => {
      (Usuario.findOne).mockResolvedValue({
        id_usuario: 1,
        nombre_usuario: "username",
        email: "test@test.com",
        contrasena: "hashedpassword",
      });

      (bcrypt.compare).mockResolvedValue(true);
      (jwt.sign).mockReturnValue("mocked-jwt-token");

      const req = {
        body: { nombre_usuario: "username", contrasena: "123456" },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        id_usuario: 1,
        token: "mocked-jwt-token",
      });
      expect(Usuario.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
    });

    it("debería fallar si la contraseña es incorrecta", async () => {
      (Usuario.findOne).mockResolvedValue({
        id_usuario: 1,
        nombre_usuario: "username",
        email: "test@test.com",
        contrasena: "hashedpassword",
      });

      (bcrypt.compare).mockResolvedValue(false);

      const req = {
        body: { nombre_usuario: "test", contrasena: "wrongpassword" },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Contraseña incorrecta",
      });
    });

    it("debería fallar si el usuario no existe", async () => {
      (Usuario.findOne).mockResolvedValue(null);

      const req = {
        body: { nombre_usuario: "username", contrasena: "123456" },
      };

      const jsonMock = jest.fn();
      const res = {
        status: jest.fn(() => ({ json: jsonMock })),
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario no encontrado",
      });
    });
  });
});