import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createCompra, deleteCompra, getCompraById, getCompras } from "../controllers/compra/compraController.js";

const router = express.Router();

router.post("/", authenticateToken, createCompra);
router.get("/", authenticateToken, getCompras);
router.get("/:id_compra", authenticateToken, getCompraById);
router.delete("/:id_compra", authenticateToken, deleteCompra);

export default router;
