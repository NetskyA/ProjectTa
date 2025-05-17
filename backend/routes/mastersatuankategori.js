// routes/mastersatuan.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

// Endpoint POST untuk Retur Besttroli
router.post("/satuankategoribarang", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_satuan_kategori()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;