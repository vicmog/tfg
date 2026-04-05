import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createCompra, getCompraById, getCompras } from "../controllers/compra/compraController.js";

const router = express.Router();

router.post("/", authenticateToken, createCompra);
router.get("/", authenticateToken, getCompras);
router.get("/:id_compra", authenticateToken, getCompraById);

export default router;
