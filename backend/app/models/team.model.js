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
      homeField: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      managerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      indexes: [{ unique: true, fields: ["leagueId", "name"] }],
    }
  );

  return Team;
};
