export default (sequelize, Sequelize) => {
  const Season = sequelize.define(
    "season",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATE,
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

  return Season;
};
