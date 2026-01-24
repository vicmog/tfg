import { authenticateToken } from "../authMiddleware.js";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("authenticateToken Middleware", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = { headers: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should return 401 if token is missing", () => {
        authenticateToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token no proporcionado" });
    });

    it("should return 403 if token is invalid", () => {
        req.headers.authorization = "Bearer invalidtoken";
        jwt.verify.mockImplementation((token, secret, cb) => cb(new Error("Invalid token"), null));

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Token inválido" });
    });

    it("should call next and set req.user if token is valid", () => {
        req.headers.authorization = "Bearer validtoken";
        const mockUser = { id_usuario: 1, nombre_usuario: "testuser" };
        jwt.verify.mockImplementation((token, secret, cb) => cb(null, mockUser));

        authenticateToken(req, res, next);

        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
    });
});
