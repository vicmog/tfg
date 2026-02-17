import { register, login, validateCode,resetPassword  } from "../authController.js";
import { Usuario } from "../../../models/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendValidationEmail } from "../../../utils/mailer.js";
import { buildRes, registerBody } from "./data.js";


jest.mock("../../../models/Usuario.js");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../../../utils/mailer.js", () => ({ sendValidationEmail: jest.fn().mockResolvedValue({}), sendNewPasswordEmail: jest.fn().mockResolvedValue({}) }));

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
        codigo_validacion: "123456",
        validacion: false,
      });

      const req = {
        body: registerBody,
      };

      const { res, jsonMock } = buildRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Usuario registrado correctamente",
        userId: 1,
      });
      expect(Usuario.create).toHaveBeenCalled();
      expect(sendValidationEmail).toHaveBeenCalledWith("test@test.com", expect.any(String), "testuser");
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
        validacion: true,
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

    it("debería devolver UsuarioNoValidado si el usuario no está validado", async () => {
      (Usuario.findOne).mockResolvedValue({
        id_usuario: 2,
        nombre_usuario: "username",
        email: "test@test.com",
        contrasena: "hashedpassword",
        validacion: false,
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
      expect(jsonMock).toHaveBeenCalledWith({ id_usuario: 2, token: "mocked-jwt-token", message: "UsuarioNoValidado" });
    });
  });

  describe("validateCode", () => {
    it("debería validar correctamente y devolver token", async () => {
      const mockUser = {
        id_usuario: 5,
        nombre_usuario: "u5",
        codigo_validacion: "999999",
        validacion: false,
        save: jest.fn().mockResolvedValue(true),
      };
      (Usuario.findOne).mockResolvedValue(mockUser);
      (jwt.sign).mockReturnValue("signed-token");

      const req = { body: { id_usuario: 5, codigo_validacion: "999999" } };
      const jsonMock = jest.fn();
      const res = { status: jest.fn(() => ({ json: jsonMock })) };

      await validateCode(req, res);

      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { id_usuario: 5 } });
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ id_usuario: 5, token: "signed-token" });
    });

    it("debería devolver error si el código es inválido", async () => {
      const mockUser = { id_usuario: 6, codigo_validacion: "111111" };
      (Usuario.findOne).mockResolvedValue(mockUser);

      const req = { body: { id_usuario: 6, codigo_validacion: "222222" } };
      const jsonMock = jest.fn();
      const res = { status: jest.fn(() => ({ json: jsonMock })) };

      await validateCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Código inválido" });
    });

    it("debería devolver error si el usuario no existe", async () => {
      (Usuario.findOne).mockResolvedValue(null);

      const req = { body: { id_usuario: 999, codigo_validacion: "000000" } };
      const jsonMock = jest.fn();
      const res = { status: jest.fn(() => ({ json: jsonMock })) };

      await validateCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Usuario no encontrado" });
    });

    it("debería devolver error si faltan campos", async () => {
      const req = { body: { id_usuario: null } };
      const jsonMock = jest.fn();
      const res = { status: jest.fn(() => ({ json: jsonMock })) };

      await validateCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Faltan campos obligatorios" });
    });
  });

  describe("resetPassword", () => {
    it("debería devolver 404 si el usuario no existe", async () => {
      (Usuario.findOne).mockResolvedValue(null);

      const req = { body: { nombre_usuario: 'noexiste' } };
      const jsonMock = jest.fn();
      const res = { status: jest.fn(() => ({ json: jsonMock })) };

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });

    it("debería generar nueva contraseña, guardarla y enviar email", async () => {
      const mockUser = { id_usuario: 10, nombre_usuario: 'u10', email: 'u10@test.com', save: jest.fn().mockResolvedValue(true) };
      (Usuario.findOne).mockResolvedValue(mockUser);

      const req = { body: { nombre_usuario: 'u10' } };
      const jsonMock = jest.fn();
      const res = { status: jest.fn(() => ({ json: jsonMock })) };

      await resetPassword(req, res);

      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { nombre_usuario: 'u10' } });
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Nueva contraseña generada y enviada al email asociado" });
    });
  });
});