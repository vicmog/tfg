import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/v1/api/auth", authRoutes);

const PORT = process.env.BACKEND_PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
