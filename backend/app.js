import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/v1/api/auth", authRoutes);

export default app;