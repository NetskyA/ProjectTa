const express       = require("express");
const { QueryTypes } = require("sequelize");
const { db }        = require("../connection/database");
const router = express.Router();


router.post("/master/gabungan/permintaan", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_master_gabungan_pemintaan()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/detail/gabungan/permintaan", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_master_detail_gabungan_pemintaan()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/pengecekan/gabungan/permintaan", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_pengecekan_gp()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


/* ───── generator kode: GB.{kode_kitchen}.{YYMMDD}{####} ───── */
let counterLocal = 1;
async function generateKodeGP(kitchenCode, trx) {
  while (true) {
    const now = new Date();
    const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
    const seq = String(counterLocal++).padStart(4, "0");
    const code = `GB.${kitchenCode}.${ymd}.${seq}`;

    const [dup] = await db.query(
      "SELECT 1 FROM master_gabungan_pemintaan WHERE kode_gabungan_permintaan = ? LIMIT 1",
      { replacements: [code], type: QueryTypes.SELECT, transaction: trx }
    );
    if (!dup) return code;
  }
}

/* ───── POST  /insert/gabungan/permintaan ───── */
router.post("/insert/gabungan/permintaan", async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id_user, header = {}, detail = [] } = req.body || {};

    if (!id_user || !header.id_kitchen || !Array.isArray(detail) || !detail.length) {
      await trx.rollback();
      return res.status(200).json({ success: false, message: "Payload tidak lengkap." });
    }

    const { id_kitchen, kode_lokasi_kitchen = "", tanggal_verifikasi_gb = null } = header;

    const qtyPerProduk = {};
    detail.forEach(d =>
      (d.products || []).forEach(p => {
        qtyPerProduk[p.kode_produk] = (qtyPerProduk[p.kode_produk] || 0) + Number(p.quantity || 0);
      })
    );

    const kekurangan = {};
    for (const [kodeProduk, qty] of Object.entries(qtyPerProduk)) {
      const [raw] = await db.query(
        "CALL procedure_cek_ketersediaan_bahan_baku(:kp,:qt);",
        {
          replacements: { kp: kodeProduk, qt: qty },
          type: QueryTypes.SELECT,
          transaction: trx
        }
      );
      (Array.isArray(raw) ? raw : Object.values(raw))
        .filter(r => Number(r.selisih_stok) < 0)
        .forEach(r => {
          if (!kekurangan[kodeProduk]) kekurangan[kodeProduk] = new Set();
          kekurangan[kodeProduk].add(r.nama_bahan_baku);
        });
    }

    if (Object.keys(kekurangan).length) {
      await trx.rollback();
      const msg = Object.entries(kekurangan)
        .map(([kp, set]) => `${kp}: ${[...set].slice(0, 2).join(", ")}${set.size > 2 ? ", …" : ""}`)
        .join("; ");
      return res.status(200).json({ success: false, message: `Stok bahan baku tidak cukup – ${msg}.` });
    }

    let kitchenCode = kode_lokasi_kitchen;
    if (!kitchenCode) {
      const [kRaw] = await db.query(
        "SELECT kode_lokasi FROM master_lokasi_kitchen WHERE id_lokasi = ? LIMIT 1",
        { replacements: [id_kitchen], type: QueryTypes.SELECT, transaction: trx }
      );
      kitchenCode = kRaw?.kode_lokasi || id_kitchen;
    }
    const kodeGP = await generateKodeGP(kitchenCode, trx);
const tglVerif = tanggal_verifikasi_gb || null;

    const [hdr] = await db.query(
      "CALL procedure_insert_master_gabungan_pemintaan(:k,:ik,:tgl,0,0,:cb);",
      {
        replacements: {
          k: kodeGP,
          ik: id_kitchen,
          tgl: tglVerif,
          cb: id_user
        },
        type: QueryTypes.SELECT,
        transaction: trx
      }
    );
    const id_header = hdr[0]?.id_master_gabungan_pemintaan;
    if (!id_header) {
      await trx.rollback();
      return res.status(200).json({ success: false, message: "Gagal insert header GP." });
    }

    for (const d of detail) {
      await db.query(
        "CALL procedure_insert_detail_gabungan_pemintaan(:idh,:kgp,:ipp,:iso,:nom);",
        {
          replacements: {
            idh: id_header,
            kgp: kodeGP,
            ipp: d.id_master_pesanan_pembelian,
            iso: d.id_master_sales_order,
            nom: d.nominal_permintaan || 0
          },
          type: QueryTypes.RAW,
          transaction: trx
        }
      );
    }

    const idSOList = detail.map(d => d.id_master_sales_order).join(",");
    await db.query("CALL procedure_update_status_gabungan_sales_order(:lst);", {
      replacements: { lst: idSOList },
      type: QueryTypes.RAW,
      transaction: trx
    });

    await trx.commit();
    return res.status(201).json({
      success: true,
      message: "Gabungan permintaan berhasil disimpan.",
      kode_gp: kodeGP,
      id_header
    });
  } catch (err) {
    await trx.rollback();
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

router.post("/updategptanggalverifikasi", async (req, res) => {
    let transaction;
  
    try {
      const {
        id_master_gabungan_pemintaan,
        tanggal_verifikasi_gb           // format: "YYYY-MM-DD HH:mm:ss"
      } = req.body;
  
      // ------ validasi input -------------------------------------------------
      if (
        id_master_gabungan_pemintaan === undefined ||
        !tanggal_verifikasi_gb
      ) {
        return res.status(400).json({
          success : false,
          message : "Field (id_master_gabungan_pemintaan, tanggal_verifikasi_gb) wajib diisi."
        });
      }
  
      // ------ mulai transaksi -----------------------------------------------
      transaction = await db.transaction();
  
      // Pastikan GP exist – opsional tapi bagus untuk guard
      const [gp] = await db.query(
        `SELECT id_master_gabungan_pemintaan
           FROM master_gabungan_pemintaan
          WHERE id_master_gabungan_pemintaan = ?
          LIMIT 1`,
        {
          replacements : [id_master_gabungan_pemintaan],
          type         : QueryTypes.SELECT,
          transaction
        }
      );
  
      if (!gp) {
        await transaction.rollback();
        return res.status(404).json({
          success : false,
          message : "Gabungan permintaan tidak ditemukan."
        });
      }
  
      // ------ panggil prosedur MySQL ----------------------------------------
      await db.query(
        "CALL procedure_update_status_gabungan(?, ?)",
        {
          replacements : [
            id_master_gabungan_pemintaan,
            tanggal_verifikasi_gb
          ],
          type         : QueryTypes.RAW,
          transaction
        }
      );
  
      await transaction.commit();
      return res.status(200).json({
        success : true,
        message : "Status gabungan & tanggal verifikasi berhasil diperbarui."
      });
  
    } catch (err) {
      if (transaction) await transaction.rollback();
      console.error("Error update status gabungan:", err);
  
      return res.status(500).json({
        success : false,
        message : err.message || "Gagal memperbarui status gabungan."
      });
    }
});

module.exports = router;
