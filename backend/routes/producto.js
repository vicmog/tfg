import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createProducto, getProductosByNegocio } from "../controllers/producto/productoController.js";

const router = express.Router();

router.post("/", authenticateToken, createProducto);
router.get("/:id_negocio", authenticateToken, getProductosByNegocio);

export default router;
