import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import leagueModel from "./league.model.js";
import personModel from "./person.model.js";
import teamModel from "./team.model.js";
import playerModel from "./player.model.js";
import seasonModel from "./season.model.js";
import gameModel from "./game.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.league = leagueModel(sequelize, Sequelize);
db.person = personModel(sequelize, Sequelize);
db.team = teamModel(sequelize, Sequelize);
db.player = playerModel(sequelize, Sequelize);
db.season = seasonModel(sequelize, Sequelize);
db.game = gameModel(sequelize, Sequelize);

db.user.hasMany(db.session, {
  foreignKey: "userId",
  as: "sessions",
  onDelete: "CASCADE",
});

db.session.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

db.person.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
  onDelete: "SET NULL",
});

db.user.hasOne(db.person, {
  foreignKey: "userId",
  as: "person",
});

db.team.belongsTo(db.league, {
  foreignKey: "leagueId",
  as: "league",
  onDelete: "RESTRICT",
});

db.season.belongsTo(db.league, {
  foreignKey: "leagueId",
  as: "league",
  onDelete: "RESTRICT",
});

db.league.hasMany(db.season, {
  foreignKey: "leagueId",
  as: "seasons",
});

db.league.hasMany(db.team, {
  foreignKey: "leagueId",
  as: "teams",
});

db.player.belongsTo(db.team, {
  foreignKey: "teamId",
  as: "team",
  onDelete: "CASCADE",
});

db.player.belongsTo(db.person, {
  foreignKey: "personId",
  as: "person",
  onDelete: "RESTRICT",
});

db.team.hasMany(db.player, {
  foreignKey: "teamId",
  as: "players",
  onDelete: "CASCADE",
});

db.person.hasMany(db.player, {
  foreignKey: "personId",
  as: "players",
});

db.game.belongsTo(db.season, {
  foreignKey: "seasonId",
  as: "season",
  onDelete: "RESTRICT",
});

db.season.hasMany(db.game, {
  foreignKey: "seasonId",
  as: "games",
});

db.game.belongsTo(db.team, {
  foreignKey: "homeTeamId",
  as: "homeTeam",
  onDelete: "RESTRICT",
});

db.game.belongsTo(db.team, {
  foreignKey: "visitingTeamId",
  as: "visitingTeam",
  onDelete: "RESTRICT",
});

db.team.hasMany(db.game, {
  foreignKey: "homeTeamId",
  as: "homeGames",
});

db.team.hasMany(db.game, {
  foreignKey: "visitingTeamId",
  as: "visitingGames",
});

export default db;
