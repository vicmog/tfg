import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
    createRecurso,
    deleteRecurso,
    getRecursoById,
    getRecursosByNegocio,
    updateRecurso,
} from "../controllers/recurso/recursoController.js";

const router = express.Router();

router.post("/", authenticateToken, createRecurso);
router.get("/detalle/:id_recurso", authenticateToken, getRecursoById);
router.get("/:id_negocio", authenticateToken, getRecursosByNegocio);
router.put("/:id_recurso", authenticateToken, updateRecurso);
router.delete("/:id_recurso", authenticateToken, deleteRecurso);

export default router;
