import { DataTypes } from "sequelize";

export async function up(queryInterface) {
    await queryInterface.addColumn("Proveedor", "cif_nif", {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    });

    await queryInterface.addColumn("Proveedor", "contacto", {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    });

    await queryInterface.addColumn("Proveedor", "tipo_proveedor", {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    });
}

export async function down(queryInterface) {
    await queryInterface.removeColumn("Proveedor", "tipo_proveedor");
    await queryInterface.removeColumn("Proveedor", "contacto");
    await queryInterface.removeColumn("Proveedor", "cif_nif");
}
