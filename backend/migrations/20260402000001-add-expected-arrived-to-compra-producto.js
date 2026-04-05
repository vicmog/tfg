import { DataTypes } from "sequelize";

export async function up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.addColumn(
            "CompraProducto",
            "cantidad_esperada",
            {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            { transaction }
        );

        await queryInterface.addColumn(
            "CompraProducto",
            "cantidad_llegada",
            {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            { transaction }
        );

        await queryInterface.sequelize.query(
            "UPDATE \"CompraProducto\" SET \"cantidad_esperada\" = \"cantidad\"",
            { transaction }
        );

        await queryInterface.removeColumn("CompraProducto", "cantidad", { transaction });
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.addColumn(
            "CompraProducto",
            "cantidad",
            {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            { transaction }
        );

        await queryInterface.sequelize.query(
            "UPDATE \"CompraProducto\" SET \"cantidad\" = \"cantidad_esperada\"",
            { transaction }
        );

        await queryInterface.removeColumn("CompraProducto", "cantidad_llegada", { transaction });
        await queryInterface.removeColumn("CompraProducto", "cantidad_esperada", { transaction });
    });
}
