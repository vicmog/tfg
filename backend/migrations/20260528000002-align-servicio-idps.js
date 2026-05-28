import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  const table = await queryInterface.describeTable("Servicio");

  if (!table.id_ps) {
    await queryInterface.addColumn("Servicio", "id_ps", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "ProductoServicio", key: "id_ps" },
      onDelete: "CASCADE",
    });
  }

  await queryInterface.sequelize.query(`
    ALTER TABLE "ServicioReserva"
    DROP CONSTRAINT IF EXISTS "ServicioReserva_id_servicio_fkey"
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE "ServicioReserva"
    DROP CONSTRAINT IF EXISTS "ServicioReserva_id_ps_fkey"
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE "ServicioReserva"
    ADD CONSTRAINT "ServicioReserva_id_ps_fkey"
    FOREIGN KEY ("id_ps") REFERENCES "Servicio"("id_ps") ON DELETE CASCADE
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE "Servicio"
    DROP CONSTRAINT IF EXISTS "Servicio_pkey"
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE "Servicio"
    ADD PRIMARY KEY ("id_ps")
  `);

  const updatedTable = await queryInterface.describeTable("Servicio");

  if (updatedTable.id_ps) {
    await queryInterface.changeColumn("Servicio", "id_ps", {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "ProductoServicio", key: "id_ps" },
      onDelete: "CASCADE",
    });
  }

  if (updatedTable.id_servicio) {
    await queryInterface.removeColumn("Servicio", "id_servicio");
  }
}

export async function down(queryInterface) {
  const table = await queryInterface.describeTable("Servicio");

  if (!table.id_servicio) {
    await queryInterface.addColumn("Servicio", "id_servicio", {
      type: DataTypes.INTEGER,
      allowNull: true,
      autoIncrement: true,
      primaryKey: true,
    });
  }

  await queryInterface.sequelize.query(`
    ALTER TABLE "Servicio"
    DROP CONSTRAINT IF EXISTS "Servicio_pkey"
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE "Servicio"
    ADD PRIMARY KEY ("id_servicio")
  `);

  const updatedTable = await queryInterface.describeTable("Servicio");

  if (updatedTable.id_servicio) {
    await queryInterface.changeColumn("Servicio", "id_servicio", {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    });
  }

  await queryInterface.sequelize.query(`
    ALTER TABLE "ServicioReserva"
    DROP CONSTRAINT IF EXISTS "ServicioReserva_id_ps_fkey"
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE "ServicioReserva"
    ADD CONSTRAINT "ServicioReserva_id_servicio_fkey"
    FOREIGN KEY ("id_servicio") REFERENCES "Servicio"("id_servicio") ON DELETE CASCADE
  `);
}