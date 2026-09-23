export default (sequelize, Sequelize) => {
  const Game = sequelize.define("game", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    seasonId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    gameDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: Sequelize.TIME,
      allowNull: false,
    },
    location: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    homeTeamId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    visitingTeamId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    homeTeamScore: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    visitingTeamScore: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });

  return Game;
};
