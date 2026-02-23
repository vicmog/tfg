import express from "express";
import { createCliente, getClientesByNegocio } from "../controllers/cliente/clienteController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, createCliente);
router.get("/:id_negocio", authenticateToken, getClientesByNegocio);

export default router;
