import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createTipoGasto, deleteTipoGasto, getTiposGastoByNegocio } from "../controllers/tipogasto/tipogastoController.js";

const router = express.Router();

router.post("/", authenticateToken, createTipoGasto);
router.get("/:id_negocio", authenticateToken, getTiposGastoByNegocio);
router.delete("/:id_tipo_gasto", authenticateToken, deleteTipoGasto);

export default router;