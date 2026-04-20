import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createPlantilla, deletePlantilla, getPlantillas, updatePlantilla } from "../controllers/plantilla/plantillaController.js";

const router = express.Router();

router.get("/", authenticateToken, getPlantillas);
router.post("/", authenticateToken, createPlantilla);
router.put("/:id_plantilla", authenticateToken, updatePlantilla);
router.delete("/:id_plantilla", authenticateToken, deletePlantilla);

export default router;
