import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import {
	createTipoGasto,
	deleteTipoGasto,
	getTiposGastoByNegocio,
	updateTipoGasto,
} from "../controllers/tipogasto/tipogastoController.js";

const router = express.Router();

router.post("/", authenticateToken, createTipoGasto);
router.get("/:id_negocio", authenticateToken, getTiposGastoByNegocio);
router.put("/:id_tipo_gasto", authenticateToken, updateTipoGasto);
router.delete("/:id_tipo_gasto", authenticateToken, deleteTipoGasto);

export default router;