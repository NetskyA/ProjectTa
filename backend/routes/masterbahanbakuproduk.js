//masterdatabarang.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

router.post("/listbahanbakuproduk", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_bahan_baku_produk()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
});

let localCounter = 1;
async function generateKodeBahanBaku(trx) {
  while (true) {
    const code = `A${String(localCounter++).padStart(6, "0")}`;
    const [dupe] = await db.query(
      `SELECT 1 FROM master_bahan_baku WHERE kode_bahan_baku = ? LIMIT 1`,
      {
        replacements: [code],
        type: QueryTypes.SELECT,
        transaction: trx,
      }
    );
    if (!dupe) return code;
  }
}

// Endpoint insert master bahan baku
router.post("/insert/master/bahanbaku", async (req, res) => {
  const trx = await db.transaction();
  try {
    const {
      id_user,
      id_lokasi,
      id_kategori_bahan_baku,
      nama_bahan_baku,
      stok_bahan_baku,
      id_satuan,
      harga_beli_barang,
    } = req.body || {};

    // Validasi minimum
    if (
      !id_user ||
      !id_lokasi ||
      !id_kategori_bahan_baku ||
      !nama_bahan_baku ||
      !id_satuan
    ) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: "Payload tidak lengkap atau tidak valid.",
      });
    }

    // Set default jika tidak ada
    const stok = typeof stok_bahan_baku === "number" ? stok_bahan_baku : 0;
    const harga = typeof harga_beli_barang === "number" ? harga_beli_barang : 0;
    const total_harga = stok * harga;

    const kode_bahan_baku = await generateKodeBahanBaku(trx);

    const [insertRows] = await db.query(
      `CALL procedure_insert_master_bahan_baku(
        :p_id_lokasi,
        :p_id_kategori_bahan_baku,
        :p_kode_bahan_baku,
        :p_nama_bahan_baku,
        :p_stok_bahan_baku,
        :p_id_satuan,
        :p_harga_beli_barang,
        :p_total_harga,
        :p_createby,
        :p_status
      );`,
      {
        replacements: {
          p_id_lokasi: id_lokasi,
          p_id_kategori_bahan_baku: id_kategori_bahan_baku,
          p_kode_bahan_baku: kode_bahan_baku,
          p_nama_bahan_baku: nama_bahan_baku,
          p_stok_bahan_baku: stok,
          p_id_satuan: id_satuan,
          p_harga_beli_barang: harga,
          p_total_harga: total_harga,
          p_createby: id_user,
          p_status: 0,
        },
        type: QueryTypes.SELECT,
        transaction: trx,
      }
    );

    const id_bahan_baku = insertRows[0]?.id_bahan_baku;

    await trx.commit();
    return res.status(201).json({
      success: true,
      message: "Master bahan baku berhasil disimpan.",
      id_bahan_baku,
      kode_bahan_baku,
    });
  } catch (err) {
    await trx.rollback();
    console.error("Error insert master bahan baku:", err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error.",
    });
  }
});

router.post("/updatemasterbahanbaku", async (req, res) => {
  let transaction;
  try {
    const {
      id_bahan_baku,
      id_kategori_bahan_baku,
      kode_bahan_baku,
      nama_bahan_baku,
      id_satuan,
      id_lokasi,
    } = req.body;

    // Validasi input
    if (
      !id_bahan_baku ||
      !id_kategori_bahan_baku ||
      !kode_bahan_baku ||
      !nama_bahan_baku ||
      !id_satuan ||
      !id_lokasi
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi.",
      });
    }

    // Mulai transaksi
    transaction = await db.transaction();

    // Panggil prosedur update
await db.query(
  `CALL procedure_update_master_bahan_baku(
    :p_id_bahan_baku,
    :p_id_kategori_bahan_baku,
    :p_kode_bahan_baku,
    :p_nama_bahan_baku,
    :p_id_satuan,
    :p_id_lokasi
  );`,
  {
    replacements: {
      p_id_bahan_baku: id_bahan_baku,
      p_id_kategori_bahan_baku: id_kategori_bahan_baku,
      p_kode_bahan_baku: kode_bahan_baku,
      p_nama_bahan_baku: nama_bahan_baku,
      p_id_satuan: id_satuan,
      p_id_lokasi: id_lokasi,
    },
    type: QueryTypes.RAW,
    transaction,
  }
);


    // Commit
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Master bahan baku berhasil diperbarui.",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error update master bahan baku:", err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan saat update.",
    });
  }
});

router.post("/updatemasterstokhargabahanbaku", async (req, res) => {
  let transaction;
  try {
    const {
      id_bahan_baku,
      stok_bahan_baku,
      harga_beli_barang,
      total_harga,
    } = req.body;

    // Validasi input
    if (
      !id_bahan_baku ||
      stok_bahan_baku == null ||
      harga_beli_barang == null ||
      total_harga == null
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi.",
      });
    }

    // Validasi angka (tidak boleh negatif atau nol semua)
    if (
      isNaN(stok_bahan_baku) || stok_bahan_baku < 0 ||
      isNaN(harga_beli_barang) || harga_beli_barang < 0 ||
      isNaN(total_harga) || total_harga < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Nilai stok, harga beli, dan total harga harus berupa angka positif.",
      });
    }

    // Mulai transaksi
    transaction = await db.transaction();

    // Panggil prosedur update
    await db.query(
      `CALL procedure_update_master_harga_stok_bahan_baku(
        :p_id_bahan_baku,
        :p_stok_bahan_baku,
        :p_harga_beli_barang,
        :p_total_harga
      );`,
      {
        replacements: {
          p_id_bahan_baku: id_bahan_baku,
          p_stok_bahan_baku: stok_bahan_baku,
          p_harga_beli_barang: harga_beli_barang,
          p_total_harga: total_harga,
        },
        type: QueryTypes.RAW,
        transaction,
      }
    );

    // Commit transaksi
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Stok dan harga bahan baku berhasil diperbarui.",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error update stok/harga bahan baku:", err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan saat update.",
    });
  }
});

router.post("/deletemasterbahanbaku", async (req, res) => {
  try {
    const { idbahanbaku } = req.body;
    if (!idbahanbaku || isNaN(idbahanbaku)) {
      return res.status(400).json({
        success: false,
        message: "ID bahan baku tidak valid.",
      });
    }

    console.log("Calling procedure with idbahanbaku:", idbahanbaku);

    await db.query("CALL procedure_update_status_master_bahan_baku(?)", {
      replacements: [Number(idbahanbaku)],
      type: QueryTypes.RAW,
    });

    return res.status(200).json({
      success: true,
      message: `Bahan baku ID ${idbahanbaku} berhasil dinonaktifkan.`,
    });
  } catch (error) {
    console.error("❌ Gagal saat delete bahan baku:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server.",
    });
  }
});



module.exports = router;