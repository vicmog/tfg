import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createDescuento } from "../controllers/descuento/descuentoController.js";

const router = express.Router();

router.post("/", authenticateToken, createDescuento);

export default router;
