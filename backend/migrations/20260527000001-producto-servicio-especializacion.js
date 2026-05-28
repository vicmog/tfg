import { DataTypes, QueryTypes } from "sequelize";

export async function up(queryInterface) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // Crear la tabla padre ProductoServicio (sin poblar datos)
    await queryInterface.createTable(
      "ProductoServicio",
      {
        id_ps: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_negocio: {
          type: DataTypes.INTEGER,
          references: { model: "Negocio", key: "id_negocio" },
          onDelete: "CASCADE",
          allowNull: false,
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
        precio: { type: DataTypes.FLOAT, allowNull: false },
        tipo: { type: DataTypes.ENUM("PRODUCTO", "SERVICIO"), allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false },
      },
      { transaction }
    );

    // Añadir columna id_ps a Producto y Servicio para la futura especialización.
    // No se tocan ni se migran datos aquí; el usuario limpiará la BD manualmente.
    await queryInterface.addColumn("Producto", "id_ps", {
      type: DataTypes.INTEGER,
      allowNull: true,
    }, { transaction });

    await queryInterface.addColumn("Servicio", "id_ps", {
      type: DataTypes.INTEGER,
      allowNull: true,
    }, { transaction });

    await queryInterface.addIndex("Producto", ["id_ps"], {
      unique: true,
      name: "Producto_id_ps_unique",
      transaction,
    });

    await queryInterface.addIndex("Servicio", ["id_ps"], {
      unique: true,
      name: "Servicio_id_ps_unique",
      transaction,
    });

    // Crear tabla unificada de detalle de venta; no se migran filas antiguas.
    await queryInterface.createTable(
      "ProductoServicioVenta",
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_venta: {
          type: DataTypes.INTEGER,
          references: { model: "Venta", key: "id_venta" },
          onDelete: "CASCADE",
          allowNull: false,
        },
        id_ps: {
          type: DataTypes.INTEGER,
          references: { model: "ProductoServicio", key: "id_ps" },
          onDelete: "CASCADE",
          allowNull: false,
        },
        cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        precio_unitario: { type: DataTypes.FLOAT, allowNull: false },
        subtotal: { type: DataTypes.FLOAT, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
      },
      { transaction }
    );

    // Agregar nuevo valor enum a Venta.tipo si existe
    await queryInterface.sequelize.query(
      `DO $$
       BEGIN
         IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Venta_tipo') THEN
           ALTER TYPE "enum_Venta_tipo" ADD VALUE IF NOT EXISTS 'mixta';
         END IF;
       END $$;`,
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down(queryInterface) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "ProductoServicioVenta"`, { transaction });
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "ProductoServicio"`, { transaction });

    await queryInterface.removeIndex("Producto", "Producto_id_ps_unique", { transaction });
    await queryInterface.removeIndex("Servicio", "Servicio_id_ps_unique", { transaction });
    await queryInterface.removeColumn("Producto", "id_ps", { transaction });
    await queryInterface.removeColumn("Servicio", "id_ps", { transaction });

    await queryInterface.sequelize.query(`ALTER TABLE "Descuento" DROP CONSTRAINT IF EXISTS "Descuento_id_producto_fkey"`, { transaction });
    await queryInterface.sequelize.query(`ALTER TABLE "CompraProducto" DROP CONSTRAINT IF EXISTS "CompraProducto_id_producto_fkey"`, { transaction });

    await queryInterface.sequelize.query(
      `ALTER TABLE "Descuento" ADD CONSTRAINT "Descuento_id_producto_fkey"
       FOREIGN KEY (id_producto) REFERENCES "Producto"(id_producto) ON DELETE CASCADE`,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "CompraProducto" ADD CONSTRAINT "CompraProducto_id_producto_fkey"
       FOREIGN KEY (id_producto) REFERENCES "Producto"(id_producto) ON DELETE CASCADE`,
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}