import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
	createProducto,
	deleteProducto,
	getProductoById,
	getProductosByNegocio,
	searchProductosByNegocio,
	updateProducto,
} from "../controllers/producto/productoController.js";

const router = express.Router();

router.post("/", authenticateToken, createProducto);
router.get("/:id_negocio", authenticateToken, getProductosByNegocio);
router.get("/:id_negocio/search", authenticateToken, searchProductosByNegocio);
router.get("/detalle/:id_producto", authenticateToken, getProductoById);
router.put("/:id_producto", authenticateToken, updateProducto);
router.delete("/:id_producto", authenticateToken, deleteProducto);

export default router;
