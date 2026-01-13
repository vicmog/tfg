import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import exampleRoutes from "./routes/routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", exampleRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
