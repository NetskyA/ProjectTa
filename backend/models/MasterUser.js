const { DataTypes } = require("sequelize");
const { db } = require("../connection/database");
const crypto = require("crypto");

const MasterUser = db.define(
  "MasterUser",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_role: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    kode_toko: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    kode_user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nama_user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    no_hp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alamat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "master_user",
    freezeTableName: true,
    timestamps: false,
  }
);

/**
 * Hook sebelum create user -> Hash password
 */
MasterUser.beforeCreate(async (user, options) => {
  user.password = crypto
    .createHash("sha256")
    .update(user.password)
    .digest("hex");
});

module.exports = MasterUser;
