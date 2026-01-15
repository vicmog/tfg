export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Usuario", {
    id_usuario: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    nombre_usuario: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    nombre: {
      type: Sequelize.STRING,
      allowNull: false
    },
    dni: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    telefono: {
      type: Sequelize.STRING
    },
    contrasena: {
      type: Sequelize.STRING,
      allowNull: false
    },
    consentimiento: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
  });

  await queryInterface.createTable("Negocio", {
    id_negocio: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    nombre: {
      type: Sequelize.STRING,
      allowNull: false
    },
    cif: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    plantilla: {
      type: Sequelize.TEXT
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
  });

  await queryInterface.createTable("UsuarioNegocio", {
    id_usuario: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Usuario",
        key: "id_usuario"
      },
      onDelete: "CASCADE"
    },
    id_negocio: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Negocio",
        key: "id_negocio"
      },
      onDelete: "CASCADE"
    },
    rol: {
      type: Sequelize.STRING,
      allowNull: false
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
  });

  await queryInterface.addConstraint("UsuarioNegocio", {
    fields: ["id_usuario", "id_negocio"],
    type: "primary key",
    name: "pk_usuario_negocio"
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("UsuarioNegocio");
  await queryInterface.dropTable("Negocio");
  await queryInterface.dropTable("Usuario");
}
