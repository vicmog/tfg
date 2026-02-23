import express from "express";
import { createCliente, deleteCliente, getClientesByNegocio } from "../controllers/cliente/clienteController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, createCliente);
router.get("/:id_negocio", authenticateToken, getClientesByNegocio);
router.delete("/:id_cliente", authenticateToken, deleteCliente);

export default router;
