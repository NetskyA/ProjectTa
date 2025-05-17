// routes/upload.js
const express = require("express");
const { db } = require("../connection/database");
const { QueryTypes } = require("sequelize");

const router = express.Router();

/* --------------------------------------------------------------------------
   Helper: ubah nilai Excel → format SQL 'YYYY-MM-DD'
-------------------------------------------------------------------------- */
function toSQLDate(value) {
  if (!value) throw new Error("Tanggal transaksi kosong.");

  // 1) Date object
  if (value instanceof Date && !isNaN(value)) {
    return value.toISOString().slice(0, 10);
  }

  // 2) 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  // 3) 'M/D/YYYY' / 'MM/DD/YYYY'
  const parts = String(value).split(/[\/\-]/);
  if (parts.length === 3) {
    let [m, d, y] = parts.map((p) => p.trim());
    if (y.length === 2) y = `20${y}`;
    if (m.length === 1) m = `0${m}`;
    if (d.length === 1) d = `0${d}`;
    if (+m >= 1 && +m <= 12 && +d >= 1 && +d <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  throw new Error(`Format tanggal tidak dikenali: "${value}"`);
}

/* =========================================================================
   POST /  – insert master & detail penjualan
   ====================================================================== */
router.post("/", async (req, res) => {
  const trx = await db.transaction();
  try {
    console.log("=== [DEBUG] route /upload-penjualan ===");

    const { id_user, id_toko, headerData } = req.body;

    if (!id_user || !id_toko || !Array.isArray(headerData) || headerData.length === 0) {
      throw new Error("Request tidak valid: butuh id_user, id_toko, headerData[].");
    }

    /* ---------- loop tiap master ---------- */
    for (const [idx, master] of headerData.entries()) {
      const {
        tanggal_transaksi,
        no_transaksi,
        id_jenis_transaksi,
        no_pesanan_penjualan,
        no_surat_jalan,
        id_syarat_bayar,
        id_lokasi,
        id_kitchen,          // 🔹 ditambahkan
        grand_total,
        details = [],
      } = master;

      if (details.length === 0) {
        throw new Error(`Master index ${idx} (${no_transaksi}) tidak memiliki detail.`);
      }

      const sqlDate = toSQLDate(tanggal_transaksi);

      /* —— insert master —— */
      const [masterRes] = await db.query(
        "CALL procedure_insert_master_penjualan(?,?,?,?,?,?,?,?,?,?)",
        {
          // urutan argumen harus sesuai prosedur di DB
          replacements: [
            sqlDate,                                       // 1 - p_tanggal_transaksi (DATE)
            no_transaksi,                                  // 2
            id_jenis_transaksi,                            // 3
            no_pesanan_penjualan,                          // 4
            no_surat_jalan,                                // 5
            id_syarat_bayar,                               // 6
            id_lokasi,                                     // 7
            id_kitchen,                                    // 8 🔹 argumen baru
            parseFloat(String(grand_total).replace(/,/g, "")) || 0, // 9
            id_user,                                       // 10 - createby
          ],
          transaction: trx,
        }
      );

      const idMaster =
        (Array.isArray(masterRes) ? masterRes[0]?.id_master_penjualan : null) ||
        masterRes?.id_master_penjualan;

      if (!idMaster) {
        throw new Error(`Gagal mendapatkan id_master_penjualan untuk "${no_transaksi}".`);
      }

      /* —— insert semua detail —— */
      for (const det of details) {
        await db.query("CALL procedure_insert_detail_penjualan(?,?,?,?,?,?,?,?)", {
          replacements: [
            idMaster,
            det.kode_barang,
            det.id_satuan,
            parseInt(det.jumlah, 10) || 0,
            parseFloat(String(det.harga).replace(/,/g, "")) || 0,
            parseFloat(det.discount) || 0,
            parseFloat(String(det.hpp_satuan).replace(/,/g, "")) || 0,
            id_user,
          ],
          transaction: trx,
        });
      }
    }

    /* ---------- commit ---------- */
    await trx.commit();
    return res.status(201).json({ message: "Data penjualan berhasil disimpan." });
  } catch (error) {
    try { await trx.rollback(); } catch (rbErr) { console.error("Rollback error:", rbErr); }
    console.error("Upload-penjualan error:", error);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
