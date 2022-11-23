const { DataTypes, UUIDV4 } = require("sequelize");
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = sequelize => {
  // defino el modelo
  sequelize.define(
    "recipe",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: UUIDV4
      },
      img: {
        type: DataTypes.STRING
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      healthScore: {
        type: DataTypes.INTEGER
      },
      steps: {
        type: DataTypes.TEXT
      }
    },
    { timestamps: false }
  );
};
