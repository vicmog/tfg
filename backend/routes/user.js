import express from "express";
import { getUserInfo, updateUser } from "../controllers/userController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/user",authenticateToken, getUserInfo);
router.put("/user",authenticateToken, updateUser);

export default router;
