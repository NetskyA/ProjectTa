const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

router.post("/listdatadepo", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_masterdepo()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getdatabarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/deletemasterdepo", async (req, res) => {
  try {
    const { id_depo } = req.body;
    if (!id_depo) {
      return res.status(400).json({
        success: false,
        message: "id_supplier tidak ditemukan di body.",
      });
    }

    // Panggil prosedur dengan replacements
    let results = await db.query("CALL procedure_delete_master_depo(?)", {
      replacements: [id_depo],
      type: QueryTypes.RAW,
    });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error saat memanggil procedure_delete_master_depo:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// INSERT (Create) Master Supplier
router.post("/insertmastersupplier", async (req, res) => {
  const { nama_depo, alamat_depo, id_user } = req.body;
  // id_toko juga bisa dipassing jika dibutuhkan, namun procedure tidak menggunakannya.
  // Validasi input: hanya nama_depo, alamat_depo, dan id_user yang wajib ada.
  if (!nama_depo || !alamat_depo || !id_user) {
    return res.status(400).json({
      success: false,
      message: "Semua field (nama_depo, alamat_depo, id_user) diperlukan.",
    });
  }

  // Mulai transaction
  const transaction = await db.transaction();

  try {
    // Generate kode_depo secara otomatis dengan format "DP-XXXX"
    // Cari kode_depo terbesar yang sudah ada dengan prefix "DP-"
    let newKodeDepo = "";
    const results = await db.query(
      "SELECT kode_depo FROM master_depo WHERE kode_depo LIKE 'DP-%' ORDER BY kode_depo DESC LIMIT 1",
      { type: QueryTypes.SELECT, transaction }
    );

    if (results.length > 0) {
      const lastKode = results[0].kode_depo; // misalnya "DP-0001"
      const numPart = parseInt(lastKode.split("-")[1], 10);
      const newNum = (numPart + 1).toString().padStart(4, "0");
      newKodeDepo = `DP-${newNum}`;
    } else {
      // Jika tidak ada data, mulai dengan DP-0000
      newKodeDepo = "DP-0000";
    }

    console.log("Data akan di-insert:", {
      kode_depo: newKodeDepo,
      nama_depo,
      alamat_depo,
      createBy: id_user,
    });

    // Panggil prosedur tersimpan dengan parameter yang diperlukan:
    // p_kode_depo, p_nama_depo, p_alamat_depo, p_createBy
    await db.query("CALL procedure_insert_master_supplier(?, ?, ?, ?)", {
      replacements: [newKodeDepo, nama_depo, alamat_depo, id_user],
      type: QueryTypes.RAW,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_insert_master_supplier sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Supplier berhasil ditambahkan.",
    });
  } catch (error) {
    // Rollback transaction jika terjadi error
    await transaction.rollback();
    console.error("Error saat insert Master Supplier:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal menyisipkan Master Supplier.",
    });
  }
});

router.post("/updatemastersupplier", async (req, res) => {
  let transaction;
  try {
    const { id_depo, kode_depo, nama_depo, alamat_depo, status } = req.body;

    // Validasi input
    if (!id_depo || !kode_depo || !nama_depo || !alamat_depo || status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Semua field (id_depo, kode_depo, nama_depo, alamat_depo, status) diperlukan.",
      });
    }

    // Mulai transaction
    transaction = await db.transaction();

    // Panggil prosedur update dengan parameter yang diperlukan
    await db.query("CALL procedure_update_master_supplier(?, ?, ?, ?, ?)", {
      replacements: [id_depo, kode_depo, nama_depo, alamat_depo, status],
      type: QueryTypes.RAW,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_update_master_supplier sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Supplier berhasil diupdate.",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update Master Supplier:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mengupdate Master Supplier.",
    });
  }
});


module.exports = router;
