//routes/masteruser.js

const express = require("express");
const { db } = require("../connection/database");
const { QueryTypes } = require("sequelize"); // Pastikan untuk mengimpor QueryTypes
const router = express.Router();

// GET Master User
router.post("/getmasterrole", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_masterrole()");
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil procedure_get_master_user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
