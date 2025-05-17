// routes/laporanpenjualan.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

      // Endpoint POST untukk
  router.post("/nota/penjualan", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_master_nota_penjualan()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results); // Mengirimkan hasil query langsung
    } catch (error) {
      console.error("Error saat memanggil prosedur Etrolly:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

router.post("/updatecetaknotapenjualan", async (req, res) => {
  let transaction;
  try {
    const { id_master_nota_penjualan, id_master_bukti_pengeluaran } = req.body;

    // Validasi input
    if (!id_master_nota_penjualan || !id_master_bukti_pengeluaran) {
      return res.status(400).json({
        success: false,
        message:
          "Field 'id_master_nota_penjualan' dan 'id_master_bukti_pengeluaran' wajib diisi.",
      });
    }

    transaction = await db.transaction();

    // Panggil prosedur yang diperbarui dengan dua parameter
    await db.query(
      "CALL procedure_update_status_cetak_nota_penjualan(?, ?)",
      {
        replacements: [id_master_nota_penjualan, id_master_bukti_pengeluaran],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Status cetak nota penjualan berhasil diperbarui.",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Gagal memperbarui status cetak nota:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan saat update status cetak.",
    });
  }
});


module.exports = router;

