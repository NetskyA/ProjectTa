//routes/masteruser.js

const express = require("express");
const { db } = require("../connection/database");
const { QueryTypes } = require("sequelize"); // Pastikan untuk mengimpor QueryTypes
const router = express.Router();

// GET Master User
router.post("/getmastertoko", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_master_toko()");
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil procedure_get_master_toko:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/getmastertokoonlymaster", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_master_toko_only_master()");
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil procedure_get_master_toko:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
