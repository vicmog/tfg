import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import negocioRoutes from "./routes/negocio.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/v1/api/auth", authRoutes);
app.use("/v1/api/users", userRoutes);
app.use("/v1/api/negocios", negocioRoutes);

export default app;