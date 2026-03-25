import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
	createProveedor,
	deleteProveedor,
	getProveedoresByNegocio,
	updateProveedor,
} from "../controllers/proveedor/proveedorController.js";

const router = express.Router();

router.post("/", authenticateToken, createProveedor);
router.get("/:id_negocio", authenticateToken, getProveedoresByNegocio);
router.put("/:id_proveedor", authenticateToken, updateProveedor);
router.delete("/:id_proveedor", authenticateToken, deleteProveedor);

export default router;
