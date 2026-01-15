import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { sequelize } from "./models/index.js";

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/v1/api/auth", authRoutes);

sequelize.authenticate().then(() => console.log("DB conectada")).catch(console.error);

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
