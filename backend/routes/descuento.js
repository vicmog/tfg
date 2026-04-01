import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createDescuento, getDescuentosByProducto, getDescuentosByNegocio } from "../controllers/descuento/descuentoController.js";

const router = express.Router();

router.post("/", authenticateToken, createDescuento);
router.get("/negocio/:id_negocio", authenticateToken, getDescuentosByNegocio);
router.get("/:id_producto", authenticateToken, getDescuentosByProducto);

export default router;
