import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createPlantilla } from "../controllers/plantilla/plantillaController.js";

const router = express.Router();

router.post("/", authenticateToken, createPlantilla);

export default router;
