const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

router.post("/liststok", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_master_bahan_baku()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getstokbarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper untuk flatten hasil procedure
function flattenProcedureResult(results) {
  let finalArray = [];
  if (Array.isArray(results) && results.length > 0) {
    if (
      typeof results[0] === "object" &&
      !Array.isArray(results[0]) &&
      Object.keys(results[0]).length > 0
    ) {
      finalArray = Object.values(results[0]);
    } else {
      finalArray = results;
    }
  } else {
    finalArray = Array.isArray(results) ? results : Object.values(results);
  }
  return finalArray;
}

// INSERT (Create) Master Stok Barang
router.post("/insertmasterstokbarang", async (req, res) => {
  const { kode_toko, kode_barang, stok_barang, status_barang } = req.body;

  // Validasi input (stok_barang bisa bernilai 0, jadi periksa secara eksplisit)
  if (
    !kode_toko ||
    !kode_barang ||
    (stok_barang === undefined || stok_barang === null) ||
    !status_barang
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Semua field (kode_toko, kode_barang, stok_barang, status_barang) diperlukan.',
    });
  }

  try {
    // Cek apakah kode_barang sudah ada di master_stokbarang untuk toko tersebut
    const existingRes = await db.query(
      "CALL procedure_get_masterstokbarang()",
      {
        type: QueryTypes.SELECT,
      }
    );
    
    const existingList = flattenProcedureResult(existingRes);
    // Cek apakah ada record dengan kode_barang yang sama
    const exists = existingList.some(
      (item) => item.kode_barang && item.kode_barang === kode_barang
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Kode Barang sudah ada di master stok barang.",
      });
    }

    // Mulai transaction
    const transaction = await db.transaction();

    try {
      // Log data untuk debugging
      console.log("Data stok akan di-insert:", {
        kode_toko,
        kode_barang,
        stok_barang,
        status_barang,
      });

      // Panggil stored procedure untuk insert master stok barang
      await db.query("CALL procedure_insert_master_stok(?, ?, ?, ?)", {
        replacements: [kode_toko, kode_barang, stok_barang, status_barang],
        type: QueryTypes.RAW,
        transaction, // sertakan transaction
      });

      // Commit transaction jika semua proses berhasil
      await transaction.commit();

      console.log("Procedure procedure_insert_master_stok sudah dipanggil.");
      return res.status(200).json({
        success: true,
        message: "Master Stok Barang berhasil ditambahkan.",
      });
    } catch (error) {
      // Rollback transaction jika terjadi error
      await transaction.rollback();
      console.error("Error saat insert Master Stok Barang:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Gagal menyisipkan Master Stok Barang.",
      });
    }
  } catch (transactionError) {
    console.error("Error saat membuat transaction atau cek kode_barang:", transactionError);
    return res.status(500).json({
      success: false,
      message: transactionError.message || "Gagal membuat transaction.",
    });
  }
});

router.post("/updatemasterstokbarang", async (req, res) => {
  try {
    const { kode_toko, kode_barang, stok_barang } = req.body;

    // Validasi input
    if (!kode_toko || !kode_barang || stok_barang == null) {
      return res.status(400).json({
        success: false,
        message:
          "Field (kode_toko, kode_barang, stok_barang) diperlukan untuk update stok.",
      });
    }

    // Mulai transaction
    const transaction = await db.transaction();

    try {
      // Cek apakah data stok dengan (kode_toko, kode_barang) ada
      const existingRes = await db.query(
        "CALL procedure_get_masterstokbarang()",
        {
          type: QueryTypes.SELECT,
          transaction,
        }
      );

      // Flatten agar mudah dioperasikan
      const existingList = flattenProcedureResult(existingRes);
      // Cari record yang sesuai
      const foundRow = existingList.find(
        (row) =>
          row.kode_toko === kode_toko &&
          row.kode_barang === kode_barang
      );
      if (!foundRow) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Data stok dengan kode_toko & kode_barang tersebut tidak ditemukan.",
        });
      }

      // Gunakan nilai stok_barang yang dikirim dari frontend sebagai nilai final
      const finalStok = parseInt(stok_barang, 10);

      // Update master_stokbarang secara langsung dengan nilai finalStok
      await db.query(
        `UPDATE master_stokbarang
         SET stok_barang = :finalStok
         WHERE kode_toko = :kodeToko
           AND kode_barang = :kodeBarang`,
        {
          replacements: {
            finalStok,
            kodeToko: kode_toko,
            kodeBarang: kode_barang,
          },
          type: QueryTypes.UPDATE,
          transaction,
        }
      );

      // Commit transaction
      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Stok barang berhasil diupdate.",
      });
    } catch (error) {
      // Rollback jika terjadi error
      await transaction.rollback();
      console.error("Error update stok_barang:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Gagal update stok_barang.",
      });
    }
  } catch (err) {
    console.error("Error di endpoint updatemasterstokbarang:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan server.",
    });
  }
});
module.exports = router;
