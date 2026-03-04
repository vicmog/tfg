import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createEmpleado, getEmpleadosByNegocio } from "../controllers/empleado/empleadoController.js";

const router = express.Router();

router.post("/", authenticateToken, createEmpleado);
router.get("/:id_negocio", authenticateToken, getEmpleadosByNegocio);

export default router;
