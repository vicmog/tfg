import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createProveedor, getProveedoresByNegocio } from "../controllers/proveedor/proveedorController.js";

const router = express.Router();

router.post("/", authenticateToken, createProveedor);
router.get("/:id_negocio", authenticateToken, getProveedoresByNegocio);

export default router;
