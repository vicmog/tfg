import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createServicio, getServiciosByNegocio } from "../controllers/servicio/servicioController.js";

const router = express.Router();

router.post("/", authenticateToken, createServicio);
router.get("/:id_negocio", authenticateToken, getServiciosByNegocio);

export default router;