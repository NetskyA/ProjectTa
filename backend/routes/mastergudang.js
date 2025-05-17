const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

router.post("/listdatagudang", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_master_gudang()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getdatabarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/deletemastergudang", async (req, res) => {
  try {
    const { id_gudang  } = req.body;
    if (!id_gudang) {
      return res.status(400).json({
        success: false,
        message: "id_supplier tidak ditemukan di body.",
      });
    }

    // Panggil prosedur dengan replacements
    let results = await db.query("CALL procedure_delete_master_gudang(?)", {
      replacements: [id_gudang],
      type: QueryTypes.RAW,
    });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error saat memanggil procedure_delete_master_gudang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// INSERT (Create) Master Gudang
router.post("/insertmastergudang", async (req, res) => {
  const { nama_gudang, alamat, id_user } = req.body;
  // Validasi input: pastikan nama_gudang, alamat, dan id_user tersedia
  if (!nama_gudang || !alamat || !id_user) {
    return res.status(400).json({
      success: false,
      message: "Semua field (nama_gudang, alamat, id_user) diperlukan.",
    });
  }

  // Mulai transaction
  const transaction = await db.transaction();

  try {
    // Generate kode_gudang secara otomatis dengan format "GD-XXXX"
    // Cari kode_gudang terbesar yang sudah ada dengan prefix "GD-"
    let newKodeGudang = "";
    const results = await db.query(
      "SELECT kode_gudang FROM master_gudang WHERE kode_gudang LIKE 'GD-%' ORDER BY kode_gudang DESC LIMIT 1",
      { type: QueryTypes.SELECT, transaction }
    );

    if (results.length > 0) {
      const lastKode = results[0].kode_gudang; // misalnya "GD-0001"
      const numPart = parseInt(lastKode.split("-")[1], 10);
      const newNum = (numPart + 1).toString().padStart(4, "0");
      newKodeGudang = `GD-${newNum}`;
    } else {
      // Jika tidak ada data, mulai dengan GD-0000
      newKodeGudang = "GD-0000";
    }

    console.log("Data akan di-insert:", {
      kode_gudang: newKodeGudang,
      nama_gudang,
      alamat,
      createBy: id_user,
    });

    // Panggil prosedur tersimpan procedure_insert_master_gudang
    // Parameter: p_kode_gudang, p_nama_gudang, p_alamat, p_createBy
    await db.query("CALL procedure_insert_master_gudang(?, ?, ?, ?)", {
      replacements: [newKodeGudang, nama_gudang, alamat, id_user],
      type: QueryTypes.RAW,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_insert_master_gudang sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Gudang berhasil ditambahkan.",
    });
  } catch (error) {
    // Rollback transaction jika terjadi error
    await transaction.rollback();
    console.error("Error saat insert Master Gudang:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal menyisipkan Master Gudang.",
    });
  }
});

router.post("/updatemastergudang", async (req, res) => {
  let transaction;
  try {
    const { id_gudang, kode_gudang, nama_gudang, alamat, status } = req.body;

    // Validasi input: semua field wajib ada
    if (!id_gudang || !kode_gudang || !nama_gudang || !alamat || status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Semua field (id_gudang, kode_gudang, nama_gudang, alamat, status) diperlukan.",
      });
    }

    // Mulai transaction
    transaction = await db.transaction();

    // Periksa apakah kode_gudang sudah ada di table master_gudang untuk gudang lain
    const duplicateResults = await db.query(
      "SELECT id_gudang FROM master_gudang WHERE kode_gudang = ? AND id_gudang <> ?",
      {
        replacements: [kode_gudang, id_gudang],
        type: QueryTypes.SELECT,
        transaction,
      }
    );

    if (duplicateResults.length > 0) {
      // Jika kode_gudang sudah ada untuk id yang berbeda, rollback dan kembalikan error
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Kode Gudang sudah digunakan oleh gudang lain.",
      });
    }

    // Panggil prosedur tersimpan procedure_update_master_gudang
    // Parameter: p_id_gudang, p_kode_gudang, p_nama_gudang, p_alamat, p_status
    await db.query("CALL procedure_update_master_gudang(?, ?, ?, ?, ?)", {
      replacements: [id_gudang, kode_gudang, nama_gudang, alamat, status],
      type: QueryTypes.RAW,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_update_master_gudang sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Gudang berhasil diupdate.",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update Master Gudang:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mengupdate Master Gudang.",
    });
  }
});


module.exports = router;
