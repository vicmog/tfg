import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Producto", {
    id_producto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_proveedor: {
      type: DataTypes.INTEGER,
      references: { model: "Proveedor", key: "id_proveedor" },
      onDelete: "CASCADE",
      allowNull: false
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.STRING },
    precio_compra: { type: DataTypes.FLOAT, allowNull: false },
    precio_venta: { type: DataTypes.FLOAT, allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    stock_minimo: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Producto");
}
