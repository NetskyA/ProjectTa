// routes/mastersatuan.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();


router.post("/satuanbarang", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_mastersatuan()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

router.post("/deletemastersatuan", async (req, res) => {
  try {
    const { id_satuan } = req.body;
    if (!id_satuan) {
      return res.status(400).json({
        success: false,
        message: "id_supplier tidak ditemukan di body.",
      });
    }

    // Panggil prosedur dengan replacements
    let results = await db.query("CALL procedure_delete_master_satuan(?)", {
      replacements: [id_satuan ],
      type: QueryTypes.RAW,
    });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error saat memanggil procedure_delete_master_satuan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// INSERT (Create) Master Satuan
router.post("/insertmastersatuan", async (req, res) => {
  const { nama_satuan, id_user } = req.body;
  // Validasi input: pastikan nama_satuan dan id_user tersedia
  if (!nama_satuan || !id_user) {
    return res.status(400).json({
      success: false,
      message: "Semua field (nama_satuan, id_user) diperlukan.",
    });
  }

  let transaction;
  try {
    // Mulai transaction
    transaction = await db.transaction();

    // 1. Cari kode_satuan terbesar dengan prefix "KS"
    //    SELECT kode_satuan FROM master_satuan
    //    WHERE kode_satuan LIKE 'KS%'
    //    ORDER BY kode_satuan DESC LIMIT 1
    const results = await db.query(
      "SELECT kode_satuan FROM master_satuan WHERE kode_satuan LIKE 'KS%' ORDER BY kode_satuan DESC LIMIT 1",
      { type: QueryTypes.SELECT, transaction }
    );

    let newKodeSatuan = "";
    if (results.length > 0) {
      // Misalnya lastKode = "KS0001"
      const lastKode = results[0].kode_satuan; // "KS0001"
      // Ambil angka di belakang prefix "KS"
      const numericPart = lastKode.replace("KS", ""); // "0001"
      const numInt = parseInt(numericPart, 10); // 1
      const newNum = numInt + 1; // 2
      // Format ke 4 digit (misal 2 => "0002")
      newKodeSatuan = `KS${newNum.toString().padStart(4, "0")}`; // "KS0002"
    } else {
      // Jika belum ada data, mulai dengan "KS0000"
      newKodeSatuan = "KS0000";
    }

    // 2. Cek apakah kode_satuan sudah terdaftar (race condition/duplikasi)
    //    Jika sudah ada, increment lagi sampai dapat kode unik
    let isDuplicate = true;
    while (isDuplicate) {
      const dupCheck = await db.query(
        "SELECT 1 FROM master_satuan WHERE kode_satuan = ?",
        { replacements: [newKodeSatuan], type: QueryTypes.SELECT, transaction }
      );
      if (dupCheck.length > 0) {
        // Sudah ada, increment lagi
        const numericPart = newKodeSatuan.replace("KS", ""); // "0002"
        const numInt = parseInt(numericPart, 10); // 2
        const nextNum = numInt + 1; // 3
        newKodeSatuan = `KS${nextNum.toString().padStart(4, "0")}`; // "KS0003"
      } else {
        // Tidak duplikat, lanjut
        isDuplicate = false;
      }
    }

    console.log("Data akan di-insert:", {
      kode_satuan: newKodeSatuan,
      nama_satuan,
      createBy: id_user,
    });

    // 3. Panggil prosedur tersimpan procedure_insert_master_satuan
    //    Pastikan definisi prosedur: procedure_insert_master_satuan(p_kode_satuan, p_nama_satuan, p_createBy)
    await db.query("CALL procedure_insert_master_satuan(?, ?, ?)", {
      replacements: [newKodeSatuan, nama_satuan, id_user],
      type: QueryTypes.RAW,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_insert_master_satuan sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Satuan berhasil ditambahkan.",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error saat insert Master Satuan:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal menyisipkan Master Satuan.",
    });
  }
});

// UPDATE (Edit) Master Satuan
router.post("/updatemastersatuan", async (req, res) => {
  let transaction;
  try {
    const { id_satuan, kode_satuan, nama_satuan, status } = req.body;

    // Validasi input: semua field wajib ada
    // (id_satuan, kode_satuan, nama_satuan, status) sesuai procedure_update_master_satuan
    if (!id_satuan || !kode_satuan || !nama_satuan || status === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Semua field (id_satuan, kode_satuan, nama_satuan, status) diperlukan.",
      });
    }

    // Mulai transaction
    transaction = await db.transaction();

    // 1. Cek apakah kode_satuan sudah ada di table master_satuan untuk satuan lain
    //    Jika ada record dengan kode_satuan yang sama dan id_satuan berbeda,
    //    berarti terjadi duplikasi yang tidak diperbolehkan.
    let duplicateResults = await db.query(
      "SELECT id_satuan FROM master_satuan WHERE kode_satuan = ? AND id_satuan <> ?",
      {
        replacements: [kode_satuan, id_satuan],
        type: QueryTypes.SELECT,
        transaction,
      }
    );

    // === ALGORITMA GENERATE KODE JIKA TERJADI DUPLIKASI ===
    // Penjelasan:
    // - Jika kode_satuan "KS0001" sudah dipakai ID lain, maka increment → "KS0002", cek lagi.
    // - Loop sampai ketemu kode_satuan yang tidak dipakai record lain.
    let newKodeSatuan = kode_satuan;
    while (duplicateResults.length > 0) {
      // Ambil angka di belakang prefix (misalnya "KS0001" → "0001" → int 1)
      // Sesuaikan prefix jika Anda memakai "KS"
      const numericPart = newKodeSatuan.replace("KS", ""); 
      const numInt = parseInt(numericPart, 10) || 0; 
      const nextNum = numInt + 1; 
      newKodeSatuan = `KS${nextNum.toString().padStart(4, "0")}`; 

      // Cek lagi duplikasinya dengan kode_satuan yang baru
      duplicateResults = await db.query(
        "SELECT id_satuan FROM master_satuan WHERE kode_satuan = ? AND id_satuan <> ?",
        {
          replacements: [newKodeSatuan, id_satuan],
          type: QueryTypes.SELECT,
          transaction,
        }
      );
    }

    // 2. Panggil prosedur tersimpan procedure_update_master_satuan
    //    Parameter: p_id_satuan, p_kode_satuan, p_nama_satuan, p_status
    await db.query("CALL procedure_update_master_satuan(?, ?, ?, ?)", {
      replacements: [id_satuan, newKodeSatuan, nama_satuan, status],
      type: QueryTypes.RAW,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_update_master_satuan sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: `Master Satuan berhasil diupdate`,
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update Master Satuan:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mengupdate Master Satuan.",
    });
  }
});


module.exports = router;