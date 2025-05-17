const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();


router.post("/listdatarole", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_masterrole()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post("/deletemasterrole", async (req, res) => {
    try {
      const { id_role  } = req.body;
      if (!id_role) {
        return res.status(400).json({
          success: false,
          message: "id_supplier tidak ditemukan di body.",
        });
      }
  
      // Panggil prosedur dengan replacements
      let results = await db.query("CALL procedure_delete_master_role(?)", {
        replacements: [id_role],
        type: QueryTypes.RAW,
      });
  
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error("Error saat memanggil procedure_delete_master_gudang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // INSERT (Create) Master Role
router.post("/insertmasterrole", async (req, res) => {
  const { nama_role, id_user } = req.body;
  // Validasi input: pastikan nama_role dan id_user tersedia
  if (!nama_role || !id_user) {
    return res.status(400).json({
      success: false,
      message: "Semua field (nama_role, id_user) diperlukan.",
    });
  }

  let transaction;
  try {
    // Mulai transaction
    transaction = await db.transaction();

    // 1. Cari kode_role terbesar di table master_role (pastikan kolom kode_role menyimpan angka string)
    //    Menggunakan CAST(kode_role AS UNSIGNED) agar sorting numerik
    //    Lalu ORDER BY DESC, LIMIT 1
    const results = await db.query(
      "SELECT kode_role FROM master_role ORDER BY CAST(kode_role AS UNSIGNED) DESC LIMIT 1",
      { type: QueryTypes.SELECT, transaction }
    );

    let newKodeRole = "";
    if (results.length > 0) {
      // Misalnya lastKode = "2"
      const lastKode = results[0].kode_role; 
      const lastNum = parseInt(lastKode, 10); // misalnya 2
      newKodeRole = (lastNum + 1).toString(); // "3"
    } else {
      // Jika tidak ada data sama sekali, mulai dengan "1"
      newKodeRole = "1";
    }

    // 2. Cek apakah kode_role ini sudah ada (race condition/duplikasi)
    //    Kalau sudah ada, increment lagi
    //    (Lakukan loop sampai dapat kode unik)
    let isDuplicate = true;
    while (isDuplicate) {
      const dupCheck = await db.query(
        "SELECT 1 FROM master_role WHERE kode_role = ?",
        { replacements: [newKodeRole], type: QueryTypes.SELECT, transaction }
      );
      if (dupCheck.length > 0) {
        // Kode ini sudah ada, increment lagi
        newKodeRole = (parseInt(newKodeRole, 10) + 1).toString();
      } else {
        // Sudah tidak duplikat
        isDuplicate = false;
      }
    }

    console.log("Data akan di-insert:", {
      kode_role: newKodeRole,
      nama_role,
      createBy: id_user,
    });

    // 3. Panggil prosedur tersimpan procedure_insert_master_role
    //    Parameter: p_kode_role, p_nama_role, p_createBy
    await db.query("CALL procedure_insert_master_role(?, ?, ?)", {
      replacements: [newKodeRole, nama_role, id_user],
      type: QueryTypes.RAW,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_insert_master_role sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Role berhasil ditambahkan.",
    });
  } catch (error) {
    // Rollback transaction jika terjadi error
    if (transaction) await transaction.rollback();
    console.error("Error saat insert Master Role:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal menyisipkan Master Role.",
    });
  }
});

// UPDATE (Edit) Master Role
router.post("/updatemasterrole", async (req, res) => {
  let transaction;
  try {
    const { id_role, kode_role, nama_role, status } = req.body;

    // Validasi input: semua field wajib ada
    // (id_role, kode_role, nama_role, status) sesuai procedure_update_master_role
    if (
      !id_role ||
      !kode_role ||
      !nama_role ||
      status === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Semua field (id_role, kode_role, nama_role, status) diperlukan.",
      });
    }

    // Mulai transaction
    transaction = await db.transaction();

    // Periksa apakah kode_role sudah ada di table master_role untuk role lain
    const duplicateResults = await db.query(
      "SELECT id_role FROM master_role WHERE kode_role = ? AND id_role <> ?",
      {
        replacements: [kode_role, id_role],
        type: QueryTypes.SELECT,
        transaction,
      }
    );

    if (duplicateResults.length > 0) {
      // Jika kode_role sudah ada untuk id yang berbeda, rollback dan kembalikan error
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Kode Role sudah digunakan oleh role lain.",
      });
    }

    // Panggil prosedur tersimpan procedure_update_master_role
    // Parameter: p_id_role, p_kode_role, p_nama_role, p_status
    await db.query("CALL procedure_update_master_role(?, ?, ?, ?)", {
      replacements: [id_role, kode_role, nama_role, status],
      type: QueryTypes.RAW,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_update_master_role sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Role berhasil diupdate.",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update Master Role:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mengupdate Master Role.",
    });
  }
});

  
module.exports = router;