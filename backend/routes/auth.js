import express from "express";
import { register, login, validateCode } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/validate-code", validateCode);


export default router;
