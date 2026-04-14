import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createReserva, getReservasByNegocio, updateReserva } from "../controllers/reserva/reservaController.js";

const router = express.Router();

router.post("/", authenticateToken, createReserva);
router.put("/:id_reserva", authenticateToken, updateReserva);
router.get("/:id_negocio", authenticateToken, getReservasByNegocio);

export default router;
