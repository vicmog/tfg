import { DataTypes } from "sequelize";

const addColumnIfMissing = async (queryInterface, tableName, columnName, columnDefinition) => {
    const table = await queryInterface.describeTable(tableName);
    if (!table[columnName]) {
        await queryInterface.addColumn(tableName, columnName, columnDefinition);
    }
};

const removeColumnIfExists = async (queryInterface, tableName, columnName) => {
    const table = await queryInterface.describeTable(tableName);
    if (table[columnName]) {
        await queryInterface.removeColumn(tableName, columnName);
    }
};

export async function up(queryInterface) {
    await addColumnIfMissing(queryInterface, "Servicio", "requiere_capacidad", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
}

export async function down(queryInterface) {
    await removeColumnIfExists(queryInterface, "Servicio", "requiere_capacidad");
}
