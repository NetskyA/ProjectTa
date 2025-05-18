const express       = require("express");
const { QueryTypes } = require("sequelize");
const { db }        = require("../connection/database");
const router = express.Router();
const sequelize = require("../connection/database");



router.post("/data/produksi/produk", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_master_produksi()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/detail/produksi/produk", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_master_detail_produksi()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});



let counterLocal = 1;
async function generateKodeProduksi(kitchenCode, trx) {
  while (true) {
    const now = new Date();
    const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
    const seq = String(counterLocal++).padStart(4, "0");
    const code = `PR2.${kitchenCode}.${ymd}.${seq}`;

    const [dup] = await db.query(
      "SELECT 1 FROM master_produksi WHERE kode_master_produksi = ? LIMIT 1",
      { replacements: [code], type: QueryTypes.SELECT, transaction: trx }
    );
    if (!dup) return code;
  }
}

/* ───── POST  /insert/produksi/produk ───── */
router.post("/insert/produksi/produk", async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id_user, header = {}, detail = [] } = req.body || {};

    // validasi payload dasar
    if (
      !id_user ||
      !header.id_kitchen ||
      !header.id_master_gabungan_pemintaan ||
      !Array.isArray(detail) ||
      detail.length === 0
    ) {
      await trx.rollback();
      return res.status(400).json({ success: false, message: "Payload tidak lengkap." });
    }

    const {
      id_kitchen,
      kode_lokasi_kitchen = "",
      tanggal_verifikasi_pr = null,
      id_master_gabungan_pemintaan,
      kode_gabungan_permintaan = ""
    } = header;

    // cari kode kitchen jika belum disediakan
    let kitchenCode = kode_lokasi_kitchen;
    if (!kitchenCode) {
      const [kRaw] = await db.query(
        "SELECT kode_lokasi FROM master_lokasi_kitchen WHERE id_lokasi = ? LIMIT 1",
        { replacements: [id_kitchen], type: QueryTypes.SELECT, transaction: trx }
      );
      kitchenCode = kRaw?.kode_lokasi || String(id_kitchen);
    }

    // generate kode produksi unik
    const kodeProduksi = await generateKodeProduksi(kitchenCode, trx);
const tanggalVerifikasiValid = (
  tanggal_verifikasi_pr && tanggal_verifikasi_pr !== "0"
    ? new Date(tanggal_verifikasi_pr)
    : null
);

    // 1) insert ke master_produksi
    const [hdr] = await db.query(
      "CALL procedure_insert_master_produksi(:kode, :tgl, 0, 0, :cb);",
      {
        replacements: {
          kode: kodeProduksi,
          tgl: tanggalVerifikasiValid,
          cb: id_user
        },
        type: QueryTypes.SELECT,
        transaction: trx
      }
    );
    const idProduksi = hdr[0]?.id_master_produksi;
    if (!idProduksi) {
      await trx.rollback();
      return res.status(500).json({ success: false, message: "Gagal insert header produksi." });
    }

    // 2) insert tiap baris detail ke master_detail_produksi
    for (const d of detail) {
      await db.query(
        `CALL procedure_insert_master_detail_produksi(
          :imp,   -- p_id_master_produksi
          :imgp,  -- p_id_master_gabungan_pemintaan
          :kgp,   -- p_kode_gabungan_permintaan
          :pb,    -- p_id_master_pesanan_pembelian
          :so     -- p_id_master_sales_order
        );`,
        {
          replacements: {
            imp: idProduksi,
            imgp: id_master_gabungan_pemintaan,
            kgp: kode_gabungan_permintaan,
            pb: d.id_master_pesanan_pembelian,
            so: d.id_master_sales_order
          },
          type: QueryTypes.SELECT,
          transaction: trx
        }
      );
    }

    // 3) update status_produksi pada master_gabungan_pemintaan
    await db.query(
      "CALL procedure_update_status_produksi_gabungan(:igp);",
      {
        replacements: { igp: id_master_gabungan_pemintaan },
        type: QueryTypes.RAW,
        transaction: trx
      }
    );

    await trx.commit();
    return res.status(201).json({
      success: true,
      message: "Produksi berhasil disimpan.",
      kode_produksi: kodeProduksi,
      id_produksi: idProduksi
    });

  } catch (err) {
    await trx.rollback();
    console.error("Error insert produksi:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// router.post("/updateprtanggalverifikasi", async (req, res) => {
//   let transaction;

//   try {
//     const { id_master_produksi, tanggal_verifikasi_pr } = req.body;

//     /* ── 1. Validasi input ──────────────────────────────────────────────── */
//     if (id_master_produksi === undefined || !tanggal_verifikasi_pr) {
//       return res.status(400).json({
//         success : false,
//         message : "Field (id_master_produksi, tanggal_verifikasi_pr) wajib diisi."
//       });
//     }

//     /* ── 2. Mulai transaksi ─────────────────────────────────────────────── */
//     transaction = await db.transaction();

//     /* optional guard: pastikan baris exist */
//     const [row] = await db.query(
//       `SELECT id_master_produksi
//          FROM master_produksi
//         WHERE id_master_produksi = ?
//         LIMIT 1`,
//       {
//         replacements : [id_master_produksi],
//         type         : QueryTypes.SELECT,
//         transaction
//       }
//     );

//     if (!row) {
//       await transaction.rollback();
//       return res.status(404).json({
//         success : false,
//         message : "Data produksi tidak ditemukan."
//       });
//     }

//     /* ── 3. Panggil prosedur MySQL ─────────────────────────────────────── */
//     await db.query(
//       "CALL procedure_update_status_tanggal_produksi(?, ?)",
//       {
//         replacements : [id_master_produksi, tanggal_verifikasi_pr],
//         type         : QueryTypes.RAW,
//         transaction
//       }
//     );

//     await transaction.commit();
//     return res.status(200).json({
//       success : true,
//       message : "Status produksi & tanggal verifikasi berhasil diperbarui."
//     });

//   } catch (err) {
//     if (transaction) await transaction.rollback();
//     console.error("Error update status produksi:", err);

//     return res.status(500).json({
//       success : false,
//       message : err.message || "Gagal memperbarui status produksi."
//     });
//   }
// });

router.post("/updateprtanggalverifikasi", async (req, res) => {
  let transaction;

  try {
    const {
      id_master_produksi,
      tanggal_verifikasi_pr   = 0,
      kode_bukti_pengeluaran   = 0,
      status_bukti_pengeluaran = 0,
      createby,
      details,
      bahanBakuList
    } = req.body;

    // 1) Validasi input
    if (
      id_master_produksi === undefined ||
      createby            === undefined ||
      !Array.isArray(details) ||
      !Array.isArray(bahanBakuList)
    ) {
      return res.status(400).json({
        success: false,
        message: "Field (id_master_produksi, createby, details, bahanBakuList) wajib diisi."
      });
    }

    // 2) Mulai transaksi → PENTING: harus sebelum semua db.query yang butuh transaction
    transaction = await db.transaction();

    // 3) Cek keberadaan master_produksi
    const [prod] = await db.query(
      `SELECT id_master_produksi
         FROM master_produksi
        WHERE id_master_produksi = ?
        LIMIT 1`,
      {
        replacements: [id_master_produksi],
        type: QueryTypes.SELECT,
        transaction
      }
    );
    if (!prod) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Data produksi tidak ditemukan."
      });
    }

    // 4) Update status & tanggal verifikasi produksi
    await db.query(
      "CALL procedure_update_status_tanggal_produksi(?, ?)",
      {
        replacements: [id_master_produksi, tanggal_verifikasi_pr],
        transaction
      }
    );

    // 5) Insert master bukti pengeluaran & ambil ID-nya dengan cek aman
    const insertBkRes = await db.query(
      "CALL procedure_insert_master_bukti_pengeluaran(?, ?, ?, ?, ?)",
      {
        replacements: [
          kode_bukti_pengeluaran,
          id_master_produksi,
          tanggal_verifikasi_pr,
          status_bukti_pengeluaran,
          createby
        ],
        transaction
      }
    );
    // Hasil bisa nested array, jadi cek dulu:
    const rows = Array.isArray(insertBkRes[0]) ? insertBkRes[0] : insertBkRes;
    const idMasterBukti = rows[0]?.id_master_bukti_pengeluaran;
    if (!idMasterBukti) {
      throw new Error("Gagal mendapatkan ID bukti pengeluaran.");
    }

    // 6) Insert detail bukti pengeluaran
    for (const { id_master_pesanan_pembelian, id_master_sales_order } of details) {
      await db.query(
        "CALL procedure_insert_master_detail_bukti_pengeluaran(?, ?, ?)",
        {
          replacements: [
            idMasterBukti,
            id_master_pesanan_pembelian,
            id_master_sales_order
          ],
          transaction
        }
      );
    }

    // 7) Update stok bahan baku
    for (const { id_bahan_baku, jumlah_dipotong } of bahanBakuList) {
      await db.query(
        "CALL procedure_pemotongan_stok_bb_produksi(?, ?)",
        {
          replacements: [id_bahan_baku, jumlah_dipotong],
          transaction
        }
      );
    }

    // 8) Commit transaksi
    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Produksi diverifikasi, bukti pengeluaran & stok berhasil diperbarui."
    });

  } catch (err) {
    // Jika transaction sudah terbuat, rollback
    if (transaction) await transaction.rollback();
    console.error("Error update status produksi + bukti pengeluaran:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal memproses verifikasi produksi."
    });
  }
});



module.exports = router;
