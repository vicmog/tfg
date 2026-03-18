import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
	createServicio,
	deleteServicio,
	getServiciosByNegocio,
	updateServicio,
	getServicioById,
	searchServicios,
} from "../controllers/servicio/servicioController.js";

const router = express.Router();

router.post("/", authenticateToken, createServicio);
router.get("/search", authenticateToken, searchServicios);
router.get("/detalle/:id_servicio", authenticateToken, getServicioById);
router.get("/:id_negocio", authenticateToken, getServiciosByNegocio);
router.put("/:id_servicio", authenticateToken, updateServicio);
router.delete("/:id_servicio", authenticateToken, deleteServicio);

export default router;