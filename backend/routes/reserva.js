import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
	cancelReserva,
	createReserva,
	deleteReserva,
	getReservasByNegocio,
	updateReserva,
} from "../controllers/reserva/reservaController.js";

const router = express.Router();

router.post("/", authenticateToken, createReserva);
router.put("/:id_reserva", authenticateToken, updateReserva);
router.patch("/:id_reserva/cancel", authenticateToken, cancelReserva);
router.delete("/:id_reserva", authenticateToken, deleteReserva);
router.get("/:id_negocio", authenticateToken, getReservasByNegocio);

export default router;
