export default (sequelize, Sequelize) => {
  const Player = sequelize.define(
    "player",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      teamId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      personId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      position: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      indexes: [
        { unique: true, fields: ["teamId", "personId"] },
        { unique: true, fields: ["teamId", "number"] },
      ],
    }
  );

  return Player;
};
