import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createEmpleado, deleteEmpleado, getEmpleadosByNegocio } from "../controllers/empleado/empleadoController.js";

const router = express.Router();

router.post("/", authenticateToken, createEmpleado);
router.get("/:id_negocio", authenticateToken, getEmpleadosByNegocio);
router.delete("/:id_empleado", authenticateToken, deleteEmpleado);

export default router;
