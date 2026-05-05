import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createGasto, deleteGasto, getGastosByNegocio } from "../controllers/gasto/gastoController.js";

const router = express.Router();

router.post("/", authenticateToken, createGasto);
router.get("/:id_negocio", authenticateToken, getGastosByNegocio);
router.delete("/:id_gasto", authenticateToken, deleteGasto);

export default router;