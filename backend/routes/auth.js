import express from "express";
import { register, login, getUserInfo, updateUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/user", getUserInfo);
router.put("/user", updateUser);

export default router;
