//routes/masteruser.js

const express = require("express");
const { db } = require("../connection/database");
const { QueryTypes } = require("sequelize"); // Pastikan untuk mengimpor QueryTypes
const router = express.Router();

// GET pelunasan penjualan All
router.post("/pelunasan/penjualan/all", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_pelunasan_penjualan_all()");
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil procedure_get_master_toko:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET pelunasan penjualan besttroli
router.post("/pelunasan/penjualan/besttroli", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_pelunasan_penjualan_besttroli()");
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil procedure_get_master_toko:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET pelunasan penjualan bigtroli
router.post("/pelunasan/penjualan/bigtroli", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_pelunasan_penjualan_bigtroli()");
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil procedure_get_master_toko:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
