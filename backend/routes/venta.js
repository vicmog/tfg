import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
    createVenta,
    deleteVenta,
    getVentasByNegocio,
    sendVentaEmail,
} from "../controllers/venta/ventaController.js";

const router = express.Router();


router.post("/", authenticateToken, createVenta);
router.get("/:id_negocio", authenticateToken, getVentasByNegocio);
router.post("/:id_venta/send-email", authenticateToken, sendVentaEmail);
router.delete("/:id_venta", authenticateToken, deleteVenta);

export default router;
