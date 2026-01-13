import { pool } from "../models/db.js";

export const testController = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error de conexión a la base de datos" });
  }
};
