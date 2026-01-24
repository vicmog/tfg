import { getUserInfo, updateUser } from "../../controllers/userController.js";
import { Usuario } from "../../models/Usuario.js";
import bcrypt from "bcrypt";

jest.mock("../../models/Usuario.js");
jest.mock("bcrypt");

describe("User Controller", () => {

    let res;
    let req;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        req = { body: {} };
        jest.clearAllMocks();
    });


    describe("getUserInfo", () => {
        it("should return 400 if id_usuario is missing", async () => {
            await getUserInfo(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Falta el id del usuario" });
        });

        it("should return 404 if user not found", async () => {
            req.body.id_usuario = 1;
            Usuario.findOne.mockResolvedValue(null);

            await getUserInfo(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "El usuario no existe" });
        });

        it("should return 200 with user data", async () => {
            req.body.id_usuario = 1;
            const mockUser = {
                id_usuario: 1,
                nombre_usuario: "testuser",
                nombre: "Test",
                dni: "12345678",
                email: "test@test.com",
                numero_telefono: "600123456",
            };
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
            req.body.id_usuario = 1;
            Usuario.findOne.mockResolvedValue(null);

            await updateUser(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "El usuario no existe" });
        });

        it("should return 400 if email is taken", async () => {
            req.body = { id_usuario: 1, email: "taken@test.com" };
            const mockUser = { id_usuario: 1, email: "old@test.com", update: jest.fn() };
            Usuario.findOne
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce(true);     
            await updateUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "El email ya está en uso por otro usuario" });
        });

        it("should update user successfully", async () => {
            req.body = { id_usuario: 1, nombre: "NuevoNombre", email: "new@test.com" };
            const mockUser = { 
                id_usuario: 1, 
                nombre_usuario: "user", 
                nombre: "old", 
                dni: "123", 
                email: "old@test.com", 
                numero_telefono: "600", 
                contrasena: "hashed", 
                update: jest.fn().mockResolvedValue({
                    id_usuario: 1, nombre_usuario: "user", nombre: "NuevoNombre", dni: "123", email: "new@test.com", numero_telefono: "600"
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
});
