import { Router } from "express";
import { testController } from "../controllers/controller.js";

const router = Router();

router.get("/", testController);

export default router;
