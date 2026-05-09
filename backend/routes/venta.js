import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
    createVenta,
    deleteVenta,
    getVentasByNegocio,
    getVentaById,
    sendVentaEmail,
    updateVenta,
} from "../controllers/venta/ventaController.js";

const router = express.Router();


router.post("/", authenticateToken, createVenta);
router.get("/:id_negocio", authenticateToken, getVentasByNegocio);
router.get("/detalle/:id_venta", authenticateToken, getVentaById);
router.put("/:id_venta", authenticateToken, updateVenta);
router.post("/:id_venta/send-email", authenticateToken, sendVentaEmail);
router.delete("/:id_venta", authenticateToken, deleteVenta);

export default router;
