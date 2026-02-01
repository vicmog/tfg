import express from "express";
import { createNegocio, getNegocios } from "../controllers/negocioController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, createNegocio);
router.get("/", authenticateToken, getNegocios);

export default router;
