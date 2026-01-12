import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(express.json());

// Configuración de PostgreSQL
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: "db", // nombre del servicio PostgreSQL en docker-compose
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

// Test de conexión a la DB
pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL"))
  .catch(err => console.error("❌ Error DB:", err));

// Ruta de prueba
app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW() AS now");
  res.json({ message: "API funcionando", time: result.rows[0].now });
});

// Levantar servidor
const PORT = process.env.BACKEND_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
