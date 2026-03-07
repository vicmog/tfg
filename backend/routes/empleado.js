import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createEmpleado, deleteEmpleado, getEmpleadoById, getEmpleadosByNegocio, searchEmpleados, updateEmpleado } from "../controllers/empleado/empleadoController.js";

const router = express.Router();

router.post("/", authenticateToken, createEmpleado);
router.get("/empleado/:id_empleado", authenticateToken, getEmpleadoById);
router.get("/:id_negocio/search", authenticateToken, searchEmpleados);
router.get("/:id_negocio", authenticateToken, getEmpleadosByNegocio);
router.put("/:id_empleado", authenticateToken, updateEmpleado);
router.delete("/:id_empleado", authenticateToken, deleteEmpleado);

export default router;
