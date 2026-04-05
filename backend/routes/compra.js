import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createCompra } from "../controllers/compra/compraController.js";

const router = express.Router();

router.post("/", authenticateToken, createCompra);

export default router;
