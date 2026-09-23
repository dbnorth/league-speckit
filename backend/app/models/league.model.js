export default (sequelize, Sequelize) => {
  const League = sequelize.define("league", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    },
    sport: {
      type: Sequelize.ENUM("soccer", "baseball", "volleyball", "football"),
      allowNull: false,
    },
  });

  return League;
};
