// databarang.js

const express = require("express");
const {QueryTypes} = require('sequelize')
const router = express.Router();
const { db } = require("../connection/database"); // Koneksi database

router.post("/get-data", async (req, res) => {
    try {
        let [results] = await db.query(
            "CALL procedure_get_master_databarang()",
            {type: QueryTypes.SELECT}
        );

        res.status(200).json(results);  // Kirim hanya data produk
    } catch (error) {
        console.error("Error fetching data: ", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// routes/databarang.js
router.post("/update-stok-batch", async (req, res) => {
    try {
      const items = req.body;
  
      // Logging seluruh data yang dikirim frontend
      console.log("Data items yang diterima di backend:", items);
  
      for (const item of items) {
        // Destructuring
        const { kode_toko, kode_barang, total_quantity } = item;
  
        // Logging per item
        console.log(
          `- Memperbarui stok: toko = ${kode_toko}, barang = ${kode_barang}, qty = ${total_quantity}`
        );
  
        // Pastikan total_quantity diubah ke integer/number (kalau dibutuhkan)
        const qty = parseInt(total_quantity, 10) || 0;
  
        // Panggil stored procedure
        await db.query("CALL procedure_update_stokbarang(?, ?, ?)", {
          replacements: [kode_toko, kode_barang, qty],
          type: QueryTypes.RAW,
        });
      }
  
      return res.status(200).json({
        message: "Stok barang berhasil diupdate",
      });
    } catch (error) {
      console.error("Error update stok batch:", error);
      return res.status(500).json({
        message: "Terjadi kesalahan saat update stok",
        error: error.message,
      });
    }
  });
  
module.exports = router;
