import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createProducto, deleteProducto, getProductosByNegocio } from "../controllers/producto/productoController.js";

const router = express.Router();

router.post("/", authenticateToken, createProducto);
router.get("/:id_negocio", authenticateToken, getProductosByNegocio);
router.delete("/:id_producto", authenticateToken, deleteProducto);

export default router;
