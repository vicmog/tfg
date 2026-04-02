import { DataTypes } from "sequelize";

export async function up(queryInterface) {
    await queryInterface.addColumn("Compra", "id_negocio", {
        type: DataTypes.INTEGER,
        references: { model: "Negocio", key: "id_negocio" },
        onDelete: "CASCADE",
        allowNull: true,
    });
}

export async function down(queryInterface) {
    await queryInterface.removeColumn("Compra", "id_negocio");
}
