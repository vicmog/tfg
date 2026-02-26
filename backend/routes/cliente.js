import express from "express";
import { createCliente, deleteCliente, getClientesByNegocio, updateCliente, searchClientes } from "../controllers/cliente/clienteController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, createCliente);
router.get("/:id_negocio", authenticateToken, getClientesByNegocio);
router.put("/:id_cliente", authenticateToken, updateCliente);
router.delete("/:id_cliente", authenticateToken, deleteCliente);
router.get("/:id_negocio/search", authenticateToken, searchClientes);


export default router;
