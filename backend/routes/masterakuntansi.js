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

// GET data master akun akuntansi (menggunakan procedure_get_master_akun_akuntansi)
router.post("/data/akuntansi", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_master_akun_akuntansi()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur get data akun akuntansi:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE Master Akun Akuntansi
router.post("/deletemaster/akuntansi", async (req, res) => {
  try {
    const { id_master_akun_akuntansi } = req.body;
    if (!id_master_akun_akuntansi) {
      return res.status(400).json({
        success: false,
        message: "id_master_akun_akuntansi tidak ditemukan di body.",
      });
    }
    let results = await db.query("CALL procedure_delete_master_akun_akuntansi(?)", {
      replacements: [id_master_akun_akuntansi],
      type: QueryTypes.RAW,
    });
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error saat memanggil procedure_delete_master_akun_akuntansi:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint INSERT Master Akun Akuntansi (dengan generate kode_akun_akuntansi dan menyertakan id_toko)
router.post("/insertmaster/akuntansi", async (req, res) => {
  // Catatan: Frontend tidak mengirimkan kode_akun_akuntansi (karena di-generate)
  const { id_master_akun, id_toko, nama_akun_akuntansi, saldo_awal, deskripsi, created_by } = req.body;
  
  // Validasi input
  if (!id_master_akun || !id_toko || !nama_akun_akuntansi || saldo_awal === undefined || saldo_awal === null || !deskripsi || !created_by) {
    return res.status(400).json({
      success: false,
      message: "Semua field (id_master_akun, id_toko, nama_akun_akuntansi, saldo_awal, deskripsi, created_by) diperlukan.",
    });
  }
  
  try {
    // Generate kode_akun_akuntansi berdasarkan id_master_akun, id_toko dan sequence
    // Hitung jumlah data yang sudah ada untuk id_master_akun tertentu
    const countRes = await db.query(
      "SELECT COUNT(*) as count FROM master_akun_akuntansi WHERE id_master_akun = ?",
      {
        replacements: [id_master_akun],
        type: QueryTypes.SELECT,
      }
    );
    const count = countRes[0].count;
    const newSequence = String(count + 1).padStart(2, '0'); // misal "01", "02", dst.
    // kode_akun_akuntansi dihasilkan dengan format: {id_master_akun}.{id_toko}.{newSequence}
    const kode_akun_akuntansi = `${id_master_akun}.${id_toko}.${newSequence}`;
    
    // Mulai transaction
    const transaction = await db.transaction();
    try {
      // Panggil procedure_insert_master_akun_akuntansi dengan parameter yang sudah digenerate
      await db.query("CALL procedure_insert_master_akun_akuntansi(?, ?, ?, ?, ?, ?, ?)", {
        replacements: [id_master_akun, kode_akun_akuntansi, id_toko, nama_akun_akuntansi, saldo_awal, deskripsi, created_by],
        type: QueryTypes.RAW,
        transaction,
      });
      await transaction.commit();
      console.log("Procedure procedure_insert_master_akun_akuntansi sudah dipanggil dengan kode:", kode_akun_akuntansi);
      return res.status(200).json({
        success: true,
        message: "Master Akun Akuntansi berhasil ditambahkan.",
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error saat insert Master Akun Akuntansi:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Gagal menyisipkan Master Akun Akuntansi.",
      });
    }
  } catch (transactionError) {
    console.error("Error saat cek atau membuat transaction:", transactionError);
    return res.status(500).json({
      success: false,
      message: transactionError.message || "Gagal membuat transaction.",
    });
  }
});

router.post("/updatemaster/akuntansi", async (req, res) => {
  const {
    id_master_akun_akuntansi,
    id_master_akun,
    id_toko,
    kode_akun_akuntansi,
    nama_akun_akuntansi,
    saldo_awal,
    deskripsi,
    status
  } = req.body;

  // Validasi input
  if (
    !id_master_akun_akuntansi ||
    !id_master_akun ||
    !id_toko ||                          // Pastikan id_toko wajib
    !kode_akun_akuntansi ||
    !nama_akun_akuntansi ||
    saldo_awal === undefined ||
    deskripsi === undefined ||
    status === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "Field (id_master_akun_akuntansi, id_master_akun, id_toko, kode_akun_akuntansi, nama_akun_akuntansi, saldo_awal, deskripsi, status) diperlukan.",
    });
  }

  try {
    // 1) Cek apakah kode_akun_akuntansi sudah ada pada record lain (opsional)
    const existingRes = await db.query("CALL procedure_get_master_akun_akuntansi()", {
      type: QueryTypes.SELECT,
    });
    const existingList = flattenProcedureResult(existingRes);

    const duplicate = existingList.find(
      (item) =>
        item.kode_akun_akuntansi === kode_akun_akuntansi &&
        parseInt(item.id_master_akun_akuntansi, 10) !== parseInt(id_master_akun_akuntansi, 10)
    );
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Kode Akun Akuntansi sudah ada pada record lain.",
      });
    }

    // 2) Mulai transaction
    const transaction = await db.transaction();
    try {
      // 3) Panggil procedure_update_master_akun_akuntansi
      //    Pastikan urutan replacements sesuai parameter di procedure
      await db.query(
        "CALL procedure_update_master_akun_akuntansi(?, ?, ?, ?, ?, ?, ?, ?)",
        {
          replacements: [
            id_master_akun_akuntansi,
            id_master_akun,
            kode_akun_akuntansi,
            nama_akun_akuntansi,
            saldo_awal,
            deskripsi,
            id_toko, // <- param ke-7
            status   // <- param ke-8
          ],
          type: QueryTypes.RAW,
          transaction
        }
      );

      await transaction.commit();
      console.log("procedure_update_master_akun_akuntansi sudah dipanggil.");

      return res.status(200).json({
        success: true,
        message: "Master Akun Akuntansi berhasil diperbarui.",
      });

    } catch (error) {
      // Jika ada error saat eksekusi procedure
      await transaction.rollback();
      console.error("Error saat update Master Akun Akuntansi:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Gagal mengupdate Master Akun Akuntansi.",
      });
    }

  } catch (err) {
    // Jika ada error di luar transaction
    console.error("Error di endpoint updatemaster/akuntansi:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan server.",
    });
  }
});
  
module.exports = router;
