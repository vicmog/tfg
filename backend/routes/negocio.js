import express from "express";
import { createNegocio, getNegocios, getNegocioById, updateNegocio, deleteNegocio, getUsersByNegocioId, addUserToNegocio } from "../controllers/negocio/negocioController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, createNegocio);
router.get("/", authenticateToken, getNegocios);
router.get("/users/:id", authenticateToken, getUsersByNegocioId);
router.post("/users/:id", authenticateToken, addUserToNegocio);
router.get("/:id", authenticateToken, getNegocioById);
router.put("/:id", authenticateToken, updateNegocio);
router.delete("/:id", authenticateToken, deleteNegocio);

export default router;
