import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
	completeReserva,
	cancelReserva,
	createReserva,
	deleteReserva,
	getReservasByNegocio,
	updateReserva,
	hacerCaja,
} from "../controllers/reserva/reservaController.js";

const router = express.Router();

router.post("/", authenticateToken, createReserva);
router.put("/:id_reserva", authenticateToken, updateReserva);
router.patch("/:id_reserva/cancel", authenticateToken, cancelReserva);
router.patch("/:id_reserva/complete", authenticateToken, completeReserva);
router.post("/:id_negocio/hacer-caja", authenticateToken, hacerCaja);
router.delete("/:id_reserva", authenticateToken, deleteReserva);
router.get("/:id_negocio", authenticateToken, getReservasByNegocio);

export default router;
