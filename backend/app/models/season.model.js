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
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      leagueId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      gameDays: {
        type: Sequelize.JSON,
        allowNull: false,
        get() {
          const value = this.getDataValue("gameDays");
          if (Array.isArray(value)) {
            return value;
          }
          if (typeof value === "string") {
            try {
              const parsed = JSON.parse(value);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        },
      },
      gameTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      minDaysBetweenGames: {
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
