import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createProducto } from "../controllers/producto/productoController.js";

const router = express.Router();

router.post("/", authenticateToken, createProducto);

export default router;
