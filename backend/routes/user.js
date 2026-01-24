import express from "express";
import { getUserInfo, updateUser } from "../controllers/userController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/user/:id_usuario",authenticateToken, getUserInfo);
router.put("/user/:id_usuario",authenticateToken, updateUser);

export default router;
