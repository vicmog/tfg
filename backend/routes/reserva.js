import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createReserva, getReservasByNegocio } from "../controllers/reserva/reservaController.js";

const router = express.Router();

router.post("/", authenticateToken, createReserva);
router.get("/:id_negocio", authenticateToken, getReservasByNegocio);

export default router;
