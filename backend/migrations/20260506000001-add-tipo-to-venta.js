import { DataTypes, Op } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.addColumn("Venta", "tipo", {
    type: DataTypes.ENUM("producto", "servicio"),
    allowNull: true,
  });

  const ventasProducto = await queryInterface.sequelize.query(
    'SELECT DISTINCT "id_venta" FROM "VentaProducto"'
  );

  const ventasServicio = await queryInterface.sequelize.query(
    'SELECT DISTINCT "id_venta" FROM "VentaServicio"'
  );

  const productoIds = ventasProducto[0].map((venta) => venta.id_venta);
  const servicioIds = ventasServicio[0].map((venta) => venta.id_venta);

  if (productoIds.length > 0) {
    await queryInterface.bulkUpdate(
      "Venta",
      { tipo: "producto" },
      { id_venta: { [Op.in]: productoIds } }
    );
  }

  if (servicioIds.length > 0) {
    await queryInterface.bulkUpdate(
      "Venta",
      { tipo: "servicio" },
      { id_venta: { [Op.in]: servicioIds } }
    );
  }

  await queryInterface.sequelize.query(
    'UPDATE "Venta" SET "tipo" = :tipo WHERE "tipo" IS NULL',
    {
      replacements: { tipo: "producto" },
    }
  );

  await queryInterface.changeColumn("Venta", "tipo", {
    type: DataTypes.ENUM("producto", "servicio"),
    allowNull: false,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Venta", "tipo");
}