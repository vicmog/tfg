import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // Reasignar las FKs legacy para que apunten a Producto.id_ps.
    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "Descuento" DROP CONSTRAINT IF EXISTS "Descuento_id_producto_fkey"`,
      { transaction }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "CompraProducto" DROP CONSTRAINT IF EXISTS "CompraProducto_id_producto_fkey"`,
      { transaction }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "VentaProducto" DROP CONSTRAINT IF EXISTS "VentaProducto_id_producto_fkey"`,
      { transaction }
    );

    // La tabla Producto ya contiene id_ps por la migración anterior.
    // Ahora lo convertimos en la PK real y eliminamos la PK legacy id_producto.
    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "Producto" DROP CONSTRAINT IF EXISTS "Producto_pkey"`,
      { transaction }
    );

    await queryInterface.changeColumn(
      "Producto",
      "id_ps",
      {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      { transaction }
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Producto" DROP COLUMN IF EXISTS "id_producto"`,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `DO $$
       BEGIN
         IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Descuento') THEN
           ALTER TABLE "Descuento"
           ADD CONSTRAINT "Descuento_id_producto_fkey"
           FOREIGN KEY (id_producto) REFERENCES "Producto"(id_ps) ON DELETE CASCADE;
         END IF;
       END $$;`,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `DO $$
       BEGIN
         IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CompraProducto') THEN
           ALTER TABLE "CompraProducto"
           ADD CONSTRAINT "CompraProducto_id_producto_fkey"
           FOREIGN KEY (id_producto) REFERENCES "Producto"(id_ps) ON DELETE CASCADE;
         END IF;
       END $$;`,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `DO $$
       BEGIN
         IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'VentaProducto') THEN
           ALTER TABLE "VentaProducto"
           ADD CONSTRAINT "VentaProducto_id_producto_fkey"
           FOREIGN KEY (id_producto) REFERENCES "Producto"(id_ps) ON DELETE CASCADE;
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
    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "Descuento" DROP CONSTRAINT IF EXISTS "Descuento_id_producto_fkey"`,
      { transaction }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "CompraProducto" DROP CONSTRAINT IF EXISTS "CompraProducto_id_producto_fkey"`,
      { transaction }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "VentaProducto" DROP CONSTRAINT IF EXISTS "VentaProducto_id_producto_fkey"`,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE IF EXISTS "Producto" DROP CONSTRAINT IF EXISTS "Producto_pkey"`,
      { transaction }
    );

    await queryInterface.addColumn(
      "Producto",
      "id_producto",
      {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      { transaction }
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Producto"
       ADD CONSTRAINT "Producto_pkey" PRIMARY KEY (id_producto)`,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `DO $$
       BEGIN
         IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Descuento') THEN
           ALTER TABLE "Descuento"
           ADD CONSTRAINT "Descuento_id_producto_fkey"
           FOREIGN KEY (id_producto) REFERENCES "Producto"(id_producto) ON DELETE CASCADE;
         END IF;
       END $$;`,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `DO $$
       BEGIN
         IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CompraProducto') THEN
           ALTER TABLE "CompraProducto"
           ADD CONSTRAINT "CompraProducto_id_producto_fkey"
           FOREIGN KEY (id_producto) REFERENCES "Producto"(id_producto) ON DELETE CASCADE;
         END IF;
       END $$;`,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `DO $$
       BEGIN
         IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'VentaProducto') THEN
           ALTER TABLE "VentaProducto"
           ADD CONSTRAINT "VentaProducto_id_producto_fkey"
           FOREIGN KEY (id_producto) REFERENCES "Producto"(id_producto) ON DELETE CASCADE;
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