import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createPlantilla, getPlantillas, updatePlantilla } from "../controllers/plantilla/plantillaController.js";

const router = express.Router();

router.get("/", authenticateToken, getPlantillas);
router.post("/", authenticateToken, createPlantilla);
router.put("/:id_plantilla", authenticateToken, updatePlantilla);

export default router;
