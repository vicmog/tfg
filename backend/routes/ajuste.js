import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { getAjustesByNegocio, updateAjustesByNegocio } from "../controllers/ajuste/ajusteController.js";

const router = express.Router();

router.get("/:id_negocio", authenticateToken, getAjustesByNegocio);
router.put("/:id_negocio", authenticateToken, updateAjustesByNegocio);

export default router;
