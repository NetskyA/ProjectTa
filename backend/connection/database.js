// connection/database.js

const { Sequelize } = require("sequelize");
const mysql = require('mysql2/promise');
const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: true, // true untuk menampilkan log SQL di console
  }
);

const initDB = async () => {
  try {
    await db.authenticate();
    console.log("Successfully connected to the database!");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

module.exports = { db, initDB };
