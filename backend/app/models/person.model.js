export default (sequelize, Sequelize) => {
  const Person = sequelize.define("person", {
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
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    },
    birthDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    gender: {
      type: Sequelize.ENUM("male", "female", "other"),
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: true,
    },
  });

  return Person;
};
