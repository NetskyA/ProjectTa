const express       = require("express");
const { QueryTypes } = require("sequelize");
const { db }        = require("../connection/database");
const router = express.Router();
const sequelize = require("../connection/database");



router.post("/data/bukti/pengeluaran", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_master_bukti_pengeluaran()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/detail/bukti/pengeluaran", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_master_detail_bukti_pengeluaran()",
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

    // 1) insert ke master_produksi
    const [hdr] = await db.query(
      "CALL procedure_insert_master_produksi(:kode, :tgl, 0, 0, :cb);",
      {
        replacements: {
          kode: kodeProduksi,
          tgl: tanggal_verifikasi_pr,
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

let _localCounter = 1;
async function generateBuktiCode(kitchenCode, transaction) {
  while (true) {
    const now = new Date();
    const ymd = now
      .toISOString()
      .slice(2, 10)
      .replace(/-/g, "");
    const seq = String(_localCounter++).padStart(4, "0");
    const candidate = `BK.${kitchenCode}.${ymd}.${seq}`;

    // ensure uniqueness
    const [found] = await db.query(
      `SELECT 1 
         FROM master_bukti_pengeluaran 
        WHERE kode_bukti_pengeluaran = ? 
        LIMIT 1`,
      {
        replacements: [candidate],
        type: QueryTypes.SELECT,
        transaction,
      }
    );
    if (!found) return candidate;
  }
}

let counterLocal2 = 1;
async function generateKodeNotaPenjualan(kitchenCode, trx) {
  while (true) {
    const now = new Date();
    const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
    const seq = String(counterLocal2++).padStart(4, "0");
    const code = `JL.${kitchenCode}.${ymd}.${seq}`;

    const [dup] = await db.query(
      "SELECT 1 FROM master_nota_penjualan WHERE kode_master_nota_penjualan = ? LIMIT 1",
      { replacements: [code], type: QueryTypes.SELECT, transaction: trx }
    );
    if (!dup) return code;
  }
}


router.post("/updatebkstatuskode", async (req, res) => {
  let transaction;
  try {
    const {
      productionId,
      buktiId,
      kitchenCode,
      items,
      createby, // alias id_user dari frontend
    } = req.body;

    // 🔎 Validasi input
    if (!productionId || !buktiId || !kitchenCode || !createby) {
      return res.status(400).json({
        success: false,
        message:
          "`productionId`, `buktiId`, `kitchenCode`, dan `createby` semuanya wajib diisi.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Field `items` harus berupa array dan tidak boleh kosong.",
      });
    }

    // 1️⃣ Mulai transaksi
    transaction = await db.transaction();

    // 2️⃣ Validasi data produksi
    const [prodCheck] = await db.query(
      `SELECT id_master_produksi FROM master_produksi WHERE id_master_produksi = ? LIMIT 1`,
      {
        replacements: [productionId],
        type: QueryTypes.SELECT,
        transaction,
      }
    );
    if (!prodCheck) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Data produksi tidak ditemukan.",
      });
    }

    // 3️⃣ Validasi bukti pengeluaran
    const [buktiCheck] = await db.query(
      `SELECT id_master_bukti_pengeluaran FROM master_bukti_pengeluaran WHERE id_master_bukti_pengeluaran = ? LIMIT 1`,
      {
        replacements: [buktiId],
        type: QueryTypes.SELECT,
        transaction,
      }
    );
    if (!buktiCheck) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Bukti pengeluaran tidak ditemukan.",
      });
    }

    // 4️⃣ Generate kode bukti pengeluaran
    const newBuktiCode = await generateBuktiCode(kitchenCode, transaction);

    // 5️⃣ Jalankan prosedur update status dan kode bukti pengeluaran
    await db.query(`CALL procedure_update_status_kode_pengeluaran(?, ?, ?)`, {
      replacements: [productionId, buktiId, newBuktiCode],
      type: QueryTypes.RAW,
      transaction,
    });

    // 6️⃣ Generate kode nota penjualan
    const newNotaCode = await generateKodeNotaPenjualan(kitchenCode, transaction);

    // 7️⃣ Insert ke master_nota_penjualan
    const resultNota = await db.query(
      `CALL procedure_insert_master_nota_penjualan(?, ?, ?, ?, ?)`,
      {
        replacements: [
          newNotaCode,
          buktiId,
          0, // status_cetak default
          1, // status_nota_penjualan aktif
          createby, // ✅ dari req.body
        ],
        type: QueryTypes.RAW,
        transaction,
      }
    );

let idNota;

// tangani bentuk tunggal maupun nested
if (Array.isArray(resultNota)) {
  if (resultNota.length > 0) {
    const row = Array.isArray(resultNota[0]) ? resultNota[0][0] : resultNota[0];
    idNota = row?.id_master_nota_penjualan || row?.ID_MASTER_NOTA_PENJUALAN;
  }
}

if (!idNota) {
  console.error("Gagal mengambil id dari procedure_insert_master_nota_penjualan", resultNota);
  throw new Error("Gagal menyisipkan master_nota_penjualan.");
}




    // 8️⃣ Insert detail ke master_detail_nota_penjualan
    for (const item of items) {
      const { id_master_pesanan_pembelian, id_master_sales_order } = item;
      if (id_master_pesanan_pembelian && id_master_sales_order) {
        await db.query(`CALL procedure_insert_master_detail_nota_penjualan(?, ?, ?, ?)`, {
          replacements: [
            idNota,
            buktiId,
            id_master_pesanan_pembelian,
            id_master_sales_order,
          ],
          type: QueryTypes.RAW,
          transaction,
        });
      }
    }

    // 9️⃣ Commit dan response sukses
    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Verifikasi bukti & nota penjualan berhasil.",
      kode_bukti_pengeluaran: newBuktiCode,
      kode_nota_penjualan: newNotaCode,
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error pada proses verifikasi:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan internal server.",
    });
  }
});


module.exports = router;
