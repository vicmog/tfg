import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
	createProveedor,
	deleteProveedor,
	getProveedoresByNegocio,
} from "../controllers/proveedor/proveedorController.js";

const router = express.Router();

router.post("/", authenticateToken, createProveedor);
router.get("/:id_negocio", authenticateToken, getProveedoresByNegocio);
router.delete("/:id_proveedor", authenticateToken, deleteProveedor);

export default router;
