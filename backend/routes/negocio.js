import express from "express";
import { createNegocio, getNegocios, getNegocioById, updateNegocio, deleteNegocio } from "../controllers/negocioController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, createNegocio);
router.get("/", authenticateToken, getNegocios);
router.get("/:id", authenticateToken, getNegocioById);
router.put("/:id", authenticateToken, updateNegocio);
router.delete("/:id", authenticateToken, deleteNegocio);

export default router;
