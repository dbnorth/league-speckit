export default (sequelize, Sequelize) => {
  const Team = sequelize.define(
    "team",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      leagueId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      indexes: [{ unique: true, fields: ["leagueId", "name"] }],
    }
  );

  return Team;
};
