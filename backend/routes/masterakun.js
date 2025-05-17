const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

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

// GET data akun (menggunakan procedure_get_master_akun)
router.post("/dataakun", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_master_akun()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getdatabarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/deletemasterakun", async (req, res) => {
    try {
      const { id_master_akun } = req.body;
      if (!id_master_akun) {
        return res.status(400).json({
          success: false,
          message: "id_master_akun tidak ditemukan di body.",
        });
      }
  
      // Panggil prosedur dengan replacements
      let results = await db.query("CALL procedure_delete_master_akun(?)", {
        replacements: [id_master_akun],
        type: QueryTypes.RAW,
      });
  
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error("Error saat memanggil procedure_delete_master_akun:", error);
      res.status(500).json({ success: false, message: error.message });
    }
});

// router untuk insert master akun
router.post("/insertmasterakun", async (req, res) => {
  const { nama_akun, kode_akun, created_by, id_toko } = req.body;

  // Validasi input
  if (!nama_akun || !kode_akun || !created_by || !id_toko) {
    return res.status(400).json({
      success: false,
      message: "Semua field (nama_akun, kode_akun, created_by, id_toko) diperlukan.",
    });
  }

  try {
    // Cek apakah kode_akun sudah ada di master_akun menggunakan procedure_get_master_akun
    const existingRes = await db.query("CALL procedure_get_master_akun()", {
      type: QueryTypes.SELECT,
    });
    const existingList = flattenProcedureResult(existingRes);
    const exists = existingList.some(
      (item) => item.kode_akun && item.kode_akun === kode_akun
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Kode Akun sudah ada di master akun.",
      });
    }

    // Mulai transaction
    const transaction = await db.transaction();

    try {
      // Memanggil stored procedure untuk insert master akun
      // Perhatikan urutan replacements: [nama_akun, kode_akun, id_toko, created_by]
      await db.query("CALL procedure_insert_master_akun(?, ?, ?, ?)", {
        replacements: [nama_akun, kode_akun, id_toko, created_by],
        type: QueryTypes.RAW,
        transaction,
      });

      // Commit transaction jika semua proses berhasil
      await transaction.commit();

      console.log("Procedure procedure_insert_master_akun sudah dipanggil.");
      return res.status(200).json({
        success: true,
        message: "Master Akun berhasil ditambahkan.",
      });
    } catch (error) {
      // Rollback transaction jika terjadi error
      await transaction.rollback();
      console.error("Error saat insert Master Akun:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Gagal menyisipkan Master Akun.",
      });
    }
  } catch (transactionError) {
    console.error("Error saat membuat transaction atau cek kode_akun:", transactionError);
    return res.status(500).json({
      success: false,
      message: transactionError.message || "Gagal membuat transaction.",
    });
  }
});

router.post("/updatemasterakun", async (req, res) => {
  try {
    // Perbarui payload untuk menyertakan id_toko
    const { id_master_akun, nama_akun, kode_akun, id_toko, status } = req.body;

    // Validasi input
    if (!id_master_akun || !nama_akun || !kode_akun || !id_toko || status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Semua field (id_master_akun, nama_akun, kode_akun, id_toko, status) diperlukan.",
      });
    }

    // Cek apakah kode_akun sudah ada di master_akun, kecuali untuk data dengan id_master_akun yang sama
    const existingRes = await db.query("CALL procedure_get_master_akun()", {
      type: QueryTypes.SELECT,
    });
    const existingList = flattenProcedureResult(existingRes);
    const duplicate = existingList.find(
      (item) =>
        item.kode_akun === kode_akun &&
        parseInt(item.id_master_akun, 10) !== parseInt(id_master_akun, 10)
    );
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Kode Akun sudah ada di master akun.",
      });
    }

    // Mulai transaction
    const transaction = await db.transaction();

    try {
      // Panggil stored procedure untuk update master akun dengan parameter id_toko
      await db.query("CALL procedure_update_master_akun(?, ?, ?, ?, ?)", {
        replacements: [id_master_akun, nama_akun, kode_akun, id_toko, status],
        type: QueryTypes.RAW,
        transaction,
      });

      // Commit transaction jika update berhasil
      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Master Akun berhasil diperbarui.",
      });
    } catch (error) {
      // Rollback transaction jika terjadi error
      await transaction.rollback();
      console.error("Error saat update Master Akun:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Gagal mengupdate Master Akun.",
      });
    }
  } catch (err) {
    console.error("Error di endpoint updatemasterakun:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan server.",
    });
  }
});

module.exports = router;
