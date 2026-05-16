import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Ajuste", {
    id_ajuste: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_negocio: {
      type: DataTypes.INTEGER,
      references: { model: "Negocio", key: "id_negocio" },
      onDelete: "CASCADE",
      allowNull: false,
      unique: true,
    },
    modulo_gastos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_clientes: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_empleados: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_servicios: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_recursos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_productos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_proveedores: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_compras: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_descuentos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_ventas: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_reservas: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    modulo_estadisticas: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.sequelize.query(`
    INSERT INTO "Ajuste" (
      "id_negocio",
      "modulo_gastos",
      "modulo_clientes",
      "modulo_empleados",
      "modulo_servicios",
      "modulo_recursos",
      "modulo_productos",
      "modulo_proveedores",
      "modulo_compras",
      "modulo_descuentos",
      "modulo_ventas",
      "modulo_reservas",
      "modulo_estadisticas",
      "createdAt",
      "updatedAt"
    )
    SELECT
      n."id_negocio",
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      NOW(),
      NOW()
    FROM "Negocio" n;
  `);
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Ajuste");
}
