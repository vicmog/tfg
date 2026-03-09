import { DataTypes } from "sequelize";

export async function up(queryInterface) {
    await queryInterface.addColumn("Servicio", "descripcion", {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
    });
}

export async function down(queryInterface) {
    await queryInterface.removeColumn("Servicio", "descripcion");
}