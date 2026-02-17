import { getUserInfo, updateUser, searchUsers } from "../userController.js";
import { Usuario } from "../../../models/Usuario.js";
import bcrypt from "bcrypt";
import { baseUser, buildRes } from "./data.js";

jest.mock("../../../models/Usuario.js");
jest.mock("bcrypt");

describe("User Controller", () => {
  let res;
  let req;

  beforeEach(() => {
    res = buildRes();
    req = { params: {}, body: {} };
    jest.clearAllMocks();
  });

  describe("getUserInfo", () => {
    it("should return 400 if id_usuario is missing", async () => {
      await getUserInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Falta el id del usuario" });
    });

    it("should return 404 if user not found", async () => {
      req.params.id_usuario = 1;
      Usuario.findOne.mockResolvedValue(null);

      await getUserInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "El usuario no existe" });
    });

    it("should return 200 with user data", async () => {
      req.params.id_usuario = 1;
      const mockUser = baseUser;
      Usuario.findOne.mockResolvedValue(mockUser);

      await getUserInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("updateUser", () => {
    it("should return 400 if id_usuario is missing", async () => {
      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Falta el id del usuario" });
    });

    it("should return 404 if user does not exist", async () => {
      req.params.id_usuario = 1;
      Usuario.findOne.mockResolvedValue(null);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "El usuario no existe" });
    });

    it("should return 400 if email is taken", async () => {
      req.params.id_usuario = 1;
      req.body.email = "taken@test.com";

      const mockUser = { id_usuario: 1, email: "old@test.com", update: jest.fn() };
    
      Usuario.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(true);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "El email ya está en uso por otro usuario" });
    });

    it("should return 400 if current password does not match", async () => {
      req.params.id_usuario = 1;
      req.body.contrasena = "wrong";
      req.body.nuevacontrasena = "newpass";

      const mockUser = { 
        id_usuario: 1, 
        contrasena: "hashedpass", 
        update: jest.fn()
      };

      Usuario.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "La contraseña actual no coincide" });
    });

    it("should update user successfully with password change", async () => {
      req.params.id_usuario = 1;
      req.body = { 
        nombre: "NuevoNombre", 
        contrasena: "current", 
        nuevacontrasena: "newpass",
        email: "new@test.com"
      };

      const mockUser = { 
        id_usuario: 1,
        nombre_usuario: "user",
        nombre: "old",
        dni: "123",
        email: "old@test.com",
        numero_telefono: "600",
        contrasena: "hashedpass",
        update: jest.fn().mockResolvedValue({
          id_usuario: 1,
          nombre_usuario: "user",
          nombre: "NuevoNombre",
          dni: "123",
          email: "new@test.com",
          numero_telefono: "600"
        })
      };

      Usuario.findOne
        .mockResolvedValueOnce(mockUser) 
        .mockResolvedValueOnce(null);    

      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue("newhashedpass");

      await updateUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("newpass", 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Usuario actualizado correctamente",
        user: {
          id_usuario: 1,
          nombre_usuario: "user",
          nombre: "NuevoNombre",
          dni: "123",
          email: "new@test.com",
          numero_telefono: "600",
        }
      });
    });

    it("should update user successfully without password change", async () => {
      req.params.id_usuario = 1;
      req.body = { 
        nombre: "NuevoNombre",
        email: "new@test.com"
      };

      const mockUser = { 
        id_usuario: 1,
        nombre_usuario: "user",
        nombre: "old",
        dni: "123",
        email: "old@test.com",
        numero_telefono: "600",
        contrasena: "hashedpass",
        update: jest.fn().mockResolvedValue({
          id_usuario: 1,
          nombre_usuario: "user",
          nombre: "NuevoNombre",
          dni: "123",
          email: "new@test.com",
          numero_telefono: "600"
        })
      };

      Usuario.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Usuario actualizado correctamente",
        user: {
          id_usuario: 1,
          nombre_usuario: "user",
          nombre: "NuevoNombre",
          dni: "123",
          email: "new@test.com",
          numero_telefono: "600",
        }
      });
    });
  });

  describe("searchUsers", () => {
    it("should return empty list when search is empty", async () => {
      req.query = { search: "" };

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ usuarios: [] });
    });

    it("should return matching users", async () => {
      req.query = { search: "ana" };
      Usuario.findAll.mockResolvedValue([
        { id_usuario: 1, nombre_usuario: "ana1", nombre: "Ana" },
        { id_usuario: 2, nombre_usuario: "anabel", nombre: "Anabel" },
      ]);

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        usuarios: [
          { id_usuario: 1, nombre_usuario: "ana1", nombre: "Ana" },
          { id_usuario: 2, nombre_usuario: "anabel", nombre: "Anabel" },
        ]
      });
    });

    it("should handle server errors", async () => {
      req.query = { search: "ana" };
      Usuario.findAll.mockRejectedValue(new Error("DB error"));

      await searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error en el servidor" });
    });
  });
});
