const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();


router.post("/listmarketplace", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_mastermarketplace()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getstokbarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post("/deletemastermarketplace", async (req, res) => {
    try {
      const { id_marketplace  } = req.body;
      if (!id_marketplace) {
        return res.status(400).json({
          success: false,
          message: "id_marketplace tidak ditemukan di body.",
        });
      }
  
      // Panggil prosedur dengan replacements
      let results = await db.query("CALL procedure_delete_master_marketplace(?)", {
        replacements: [id_marketplace],
        type: QueryTypes.RAW,
      });
  
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error("Error saat memanggil procedure_delete_master_marketplace:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

// INSERT (Create) Master Marketplace
router.post("/insertmastermarketplace", async (req, res) => {
  const { nama_marketplace, alamat, id_user } = req.body;

  // Validasi input
  if (!nama_marketplace || !alamat || !id_user) {
    return res.status(400).json({
      success: false,
      message: "Semua field (nama_marketplace, alamat, id_user) diperlukan.",
    });
  }

  let transaction;
  try {
    // Mulai transaction
    transaction = await db.transaction();

    // Query untuk mencari kode_marketplace terakhir dengan prefix "MKP"
    // Agar menampilkan data misalnya "MKP6000"
    const results = await db.query(
      "SELECT kode_marketplace FROM master_marketplace WHERE kode_marketplace LIKE 'MKP%' ORDER BY kode_marketplace DESC LIMIT 1",
      { type: QueryTypes.SELECT, transaction }
    );

    let newKodeMarketplace = "";
    if (results.length > 0) {
      // Misalnya lastKode = "MKP6000"
      const lastKode = results[0].kode_marketplace;
      // Hilangkan prefix "MKP"
      const numericPart = lastKode.replace("MKP", ""); // "6000"
      // Konversi ke integer
      const numInt = parseInt(numericPart, 10); // 6000
      // Tambah 1000 (bukan +1)
      const newNum = numInt + 1000; // 7000
      // Jika Anda butuh tetap 4 digit, gunakan padStart(4, "0")
      // Namun jika melebihi 9999, akan jadi 5 digit, misalnya "MKP10000"
      newKodeMarketplace = `MKP${newNum.toString().padStart(4, "0")}`;
    } else {
      // Jika belum ada data, mulai dengan MKP0000
      newKodeMarketplace = "MKP0000";
    }

    console.log("Data akan di-insert:", {
      kode_marketplace: newKodeMarketplace,
      nama_marketplace,
      alamat,
      createBy: id_user,
    });

    // (Opsional) Cek duplikasi jika ingin benar-benar yakin kode tidak bentrok
    const dupCheck = await db.query(
      "SELECT 1 FROM master_marketplace WHERE kode_marketplace = ?",
      { replacements: [newKodeMarketplace], type: QueryTypes.SELECT, transaction }
    );
    if (dupCheck.length > 0) {
      // Jika sudah ada, handle misalnya error atau generate ulang
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Kode Marketplace ${newKodeMarketplace} sudah terdaftar.`,
      });
    }

    // Panggil prosedur tersimpan procedure_insert_master_marketplace
    // Pastikan parameter sesuai definisi prosedur: (p_kode_marketplace, p_nama_marketplace, p_alamat, p_createBy)
    await db.query("CALL procedure_insert_master_marketplace(?, ?, ?, ?)", {
      replacements: [newKodeMarketplace, nama_marketplace, alamat, id_user],
      type: QueryTypes.RAW,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_insert_master_marketplace sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Marketplace berhasil ditambahkan.",
    });
  } catch (error) {
    // Rollback transaction jika terjadi error
    if (transaction) await transaction.rollback();
    console.error("Error saat insert Master Marketplace:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal menyisipkan Master Marketplace.",
    });
  }
});

// UPDATE (Edit) Master Marketplace
router.post("/updatemastermarketplace", async (req, res) => {
  let transaction;
  try {
    const { id_marketplace, kode_marketplace, nama_marketplace, alamat, status } = req.body;

    // Validasi input: semua field wajib ada
    if (
      !id_marketplace ||
      !kode_marketplace ||
      !nama_marketplace ||
      !alamat ||
      status === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Semua field (id_marketplace, kode_marketplace, nama_marketplace, alamat, status) diperlukan.",
      });
    }

    // Mulai transaction
    transaction = await db.transaction();

    // Periksa apakah kode_marketplace sudah ada di table master_marketplace untuk marketplace lain
    const duplicateResults = await db.query(
      "SELECT id_marketplace FROM master_marketplace WHERE kode_marketplace = ? AND id_marketplace <> ?",
      {
        replacements: [kode_marketplace, id_marketplace],
        type: QueryTypes.SELECT,
        transaction,
      }
    );

    if (duplicateResults.length > 0) {
      // Jika kode_marketplace sudah ada untuk id yang berbeda, rollback dan kembalikan error
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Kode Marketplace sudah digunakan oleh marketplace lain.",
      });
    }

    // Panggil prosedur tersimpan procedure_update_master_marketplace
    // Parameter: p_id_marketplace, p_kode_marketplace, p_nama_marketplace, p_alamat, p_status
    await db.query("CALL procedure_update_master_marketplace(?, ?, ?, ?, ?)", {
      replacements: [id_marketplace, kode_marketplace, nama_marketplace, alamat, status],
      type: QueryTypes.RAW,
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_update_master_marketplace sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Marketplace berhasil diupdate.",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update Master Marketplace:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mengupdate Master Marketplace.",
    });
  }
});

  
module.exports = router;