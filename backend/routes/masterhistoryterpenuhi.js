// routes/salesorder.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

router.post("/history/terpenuhi", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_master_history_update_terpenuhi()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
