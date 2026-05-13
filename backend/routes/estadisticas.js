import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
    getDashboardStats,
    getSalesStats,
    getReservaStats,
    getProductStats,
    getServiceStats,
    getResourceStats,
    getGastoStats,
    getCompraStats,
} from "../controllers/estadisticas/estadisticasController.js";

const router = express.Router();

router.get("/dashboard/:id_negocio", authenticateToken, getDashboardStats);
router.get("/ventas/:id_negocio", authenticateToken, getSalesStats);
router.get("/reservas/:id_negocio", authenticateToken, getReservaStats);
router.get("/productos/:id_negocio", authenticateToken, getProductStats);
router.get("/servicios/:id_negocio", authenticateToken, getServiceStats);
router.get("/recursos/:id_negocio", authenticateToken, getResourceStats);
router.get("/gastos/:id_negocio", authenticateToken, getGastoStats);
router.get("/compras/:id_negocio", authenticateToken, getCompraStats);

export default router;
