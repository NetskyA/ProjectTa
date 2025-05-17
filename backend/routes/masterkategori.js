const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();


router.post("/listdatakategori", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_masterkategori()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post("/listdataonlykategori", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_onlykategori()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
router.post("/deletemasterkategori", async (req, res) => {
  try {
    const {id_kategori} = req.body;
    if (!id_kategori) {
      return res.status(400).json({
        success: false,
        message: "id_supplier tidak ditemukan di body.",
      });
    }

    // Panggil prosedur dengan replacements
    let results = await db.query("CALL procedure_delete_master_kategori(?)", {
      replacements: [id_kategori],
      type: QueryTypes.RAW,
    });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error saat memanggil procedure_delete_master_kategori:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// INSERT (Create) Master Kategori
router.post("/insertmasterkategori", async (req, res) => {
  const {
    id_marketplace,
    id_toko,
    nama_kategori,
    biaya_admin,
    biaya_ongkir,
    biaya_admin_fleksibel,
    biaya_ongkir_fleksibel,
    periode_mulai,
    periode_akhir,
    id_user,
  } = req.body;

  // Validasi input: pastikan semua field wajib tersedia
  if (
    id_marketplace === undefined ||
    id_toko === undefined ||
    !nama_kategori ||
    biaya_admin === undefined ||
    biaya_admin_fleksibel === undefined ||
    biaya_ongkir === undefined ||
    biaya_ongkir_fleksibel === undefined ||
    !periode_mulai ||
    !periode_akhir ||
    id_user === undefined
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Semua field (id_marketplace, id_toko, nama_kategori, biaya_admin, biaya_admin_fleksibel, biaya_ongkir, biaya_ongkir_fleksibel, periode_mulai, periode_akhir, id_user) diperlukan.",
    });
  }

  // Mulai transaction
  const transaction = await db.transaction();

  try {
    console.log("Data akan di-insert:", {
      id_marketplace,
      id_toko,
      nama_kategori,
      biaya_admin,
      biaya_admin_fleksibel,
      biaya_ongkir,
      biaya_ongkir_fleksibel,
      periode_mulai,
      periode_akhir,
      createBy: id_user,
    });

    // Panggil prosedur tersimpan procedure_insert_master_kategori
    // Parameter: p_id_marketplace, p_id_toko, p_nama_kategori, p_biaya_admin, p_biaya_admin_fleksibel, p_biaya_ongkir, p_biaya_ongkir_fleksibel, p_periode_mulai, p_periode_akhir, p_createBy
    await db.query(
      "CALL procedure_insert_master_kategori(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      {
        replacements: [
          id_marketplace,
          id_toko,
          nama_kategori,
          biaya_admin,
          biaya_admin_fleksibel,
          biaya_ongkir,
          biaya_ongkir_fleksibel,
          periode_mulai,
          periode_akhir,
          id_user,
        ],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    // Commit transaction
    await transaction.commit();

    console.log("Prosedur procedure_insert_master_kategori sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Kategori berhasil ditambahkan.",
    });
  } catch (error) {
    // Rollback transaction jika terjadi error
    await transaction.rollback();
    console.error("Error saat insert Master Kategori:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gagal menyisipkan Master Kategori.",
    });
  }
});

const formatDatetime = (str) => {
  // Jika aslinya "2025-03-01T12:55", kita ubah jadi "2025-03-01 12:55:00"
  if (!str) return "";
  const [tanggal, jamMenit] = str.split("T"); // ["2025-03-01", "12:55"]
  return `${tanggal} ${jamMenit.length === 5 ? jamMenit + ":00" : jamMenit}`;
};

router.post("/updatemasterkategori", async (req, res) => {
  let transaction;
  try {
    const {
      id_kategori,
      id_marketplace,
      id_toko,
      nama_kategori,
      biaya_admin,
      biaya_admin_fleksibel,    // ✅ Tambahan
      biaya_ongkir,
      biaya_ongkir_fleksibel,   // ✅ Tambahan
      periode_mulai,
      periode_akhir,
      status,
    } = req.body;

    // Validasi input: semua field wajib ada
    if (
      !id_kategori ||
      id_marketplace === undefined ||
      id_toko === undefined ||
      !nama_kategori ||
      biaya_admin === undefined ||
      biaya_admin_fleksibel === undefined ||  // ✅ Validasi tambahan
      biaya_ongkir === undefined ||
      biaya_ongkir_fleksibel === undefined || // ✅ Validasi tambahan
      !periode_mulai ||
      !periode_akhir ||
      status === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Semua field (id_kategori, id_marketplace, id_toko, nama_kategori, biaya_admin, biaya_admin_fleksibel, biaya_ongkir, biaya_ongkir_fleksibel, periode_mulai, periode_akhir, status) diperlukan.",
      });
    }

    // Pastikan format "YYYY-MM-DD HH:MM:SS"
    const finalPeriodeMulai = formatDatetime(periode_mulai);
    const finalPeriodeAkhir = formatDatetime(periode_akhir);

    transaction = await db.transaction();

    // Panggil prosedur tersimpan procedure_update_master_kategori
    await db.query(
      "CALL procedure_update_master_kategori(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      {
        replacements: [
          id_kategori,
          id_marketplace,
          id_toko,
          nama_kategori,
          biaya_admin,
          biaya_admin_fleksibel,    // ✅ Passing tambahan
          biaya_ongkir,
          biaya_ongkir_fleksibel,   // ✅ Passing tambahan
          finalPeriodeMulai,
          finalPeriodeAkhir,
          status,
        ],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    await transaction.commit();

    console.log("Prosedur procedure_update_master_kategori sudah dipanggil.");
    return res.status(200).json({
      success: true,
      message: "Master Kategori berhasil diupdate.",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update Master Kategori:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal mengupdate Master Kategori.",
    });
  }
});


module.exports = router;