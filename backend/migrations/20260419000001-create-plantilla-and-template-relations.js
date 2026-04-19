import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("Plantilla", {
    id_plantilla: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });

  await queryInterface.createTable("ServicioPlantilla", {
    id_servicio_plantilla: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_plantilla: {
      type: DataTypes.INTEGER,
      references: { model: "Plantilla", key: "id_plantilla" },
      onDelete: "CASCADE",
      allowNull: false,
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    precio: { type: DataTypes.FLOAT, allowNull: false },
    duracion: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });

  await queryInterface.createTable("RecursoPlantilla", {
    id_recurso_plantilla: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_plantilla: {
      type: DataTypes.INTEGER,
      references: { model: "Plantilla", key: "id_plantilla" },
      onDelete: "CASCADE",
      allowNull: false,
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    capacidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false }
  });

  const negocioTable = await queryInterface.describeTable("Negocio");
  if (!negocioTable.id_plantilla) {
    await queryInterface.addColumn("Negocio", "id_plantilla", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Plantilla", key: "id_plantilla" },
      onDelete: "SET NULL",
    });
  }
}

export async function down(queryInterface) {
  const negocioTable = await queryInterface.describeTable("Negocio");
  if (negocioTable.id_plantilla) {
    await queryInterface.removeColumn("Negocio", "id_plantilla");
  }

  await queryInterface.dropTable("RecursoPlantilla");
  await queryInterface.dropTable("ServicioPlantilla");
  await queryInterface.dropTable("Plantilla");
}
