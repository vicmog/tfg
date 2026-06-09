import { Op } from "sequelize";
import { Descuento } from "../models/Descuento.js";
import { sequelize } from "../models/db.js";

const INTERVAL_MS = 24 * 60 * 60 * 1000; 

async function deleteExpiredDiscounts() {
  try {
    await sequelize.authenticate();
    const now = new Date();
    const deleted = await Descuento.destroy({
      where: {
        fecha_fin: { [Op.lt]: now },
      },
    });

    if (deleted) {
      console.log(`Eliminados ${deleted} descuentos caducados`);
    } else {
      console.log("No hay descuentos caducados");
    }
  } catch (err) {
    console.error("Error al eliminar descuentos caducados:", err);
  }
}


deleteExpiredDiscounts();
setInterval(deleteExpiredDiscounts, INTERVAL_MS);

export default deleteExpiredDiscounts;
