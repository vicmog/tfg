import express from "express";
import { register, login, validateCode, resetPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/validate-code", validateCode);
router.post("/reset-password", resetPassword);


export default router;
