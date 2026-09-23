export default (sequelize, Sequelize) => {
  const Faculty = sequelize.define("faculty", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    lastName: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    department: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
  });

  return Faculty;
};

