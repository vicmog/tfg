import express from "express";
import { getUserInfo, updateUser, searchUsers } from "../controllers/user/userController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/user/:id_usuario",authenticateToken, getUserInfo);
router.put("/user/:id_usuario",authenticateToken, updateUser);
router.get("/", authenticateToken, searchUsers);

export default router;
