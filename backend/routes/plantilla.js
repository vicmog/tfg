import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createPlantilla, getPlantillas } from "../controllers/plantilla/plantillaController.js";

const router = express.Router();

router.get("/", authenticateToken, getPlantillas);
router.post("/", authenticateToken, createPlantilla);

export default router;
