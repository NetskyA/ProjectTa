// routes/pesananpembelain.js

const express       = require("express");
const { QueryTypes }= require("sequelize");
const { db }        = require("../connection/database");
const router        = express.Router();

router.post("/data/all", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_master_pesanan_pembelian()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/data/all/detailed", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_master_detail_pesanan_pembelian()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });






// ─── helper: generate kode PO unik ───────────────────────────────────────────
let localCounter = 1;
async function generateKodePO(storeCode, pelangganPart, trx) {
  while (true) {
    const now  = new Date();
    const ymd  = now.toISOString().slice(2,10).replace(/-/g,""); // YYMMDD
    const seq  = String(localCounter++).padStart(4,"0");
    const part = (pelangganPart && pelangganPart !== "") ? pelangganPart : "1";
    const code = `PO.${storeCode}.${ymd}.${part}.${seq}`;

    const [dupe] = await db.query(
      "SELECT 1 FROM master_pesanan_pembelian WHERE kode_pesanan_pembelian = ? LIMIT 1",
      { 
        replacements: [code], 
        type: QueryTypes.SELECT, 
        transaction: trx 
      }
    );
    if (!dupe) return code;
  }
}

// ─── endpoint insert pesanan pembelian ───────────────────────────────────────
router.post("/insert/pesanan/pembelian", async (req, res) => {
  const trx = await db.transaction();
  try {
    // 1️⃣ Validasi payload
    const { id_user, id_toko, master, detail } = req.body || {};
    if (
      !id_user ||
      !id_toko ||
      typeof master !== "object" ||
      !Array.isArray(detail) ||
      detail.length === 0
    ) {
      await trx.rollback();
      return res.status(200).json({
        success: false,
        message: "Payload tidak lengkap."
      });
    }

    // 2️⃣ Mapping master → params
    const salesOrderParam   = master.kode_sales_order ?? 0;
    const storeCode         = master.id_kode_store;  // e.g. "L007"
    const id_store          = master.id_store       ?? master.toko?.kode_lokasi;
    const id_kitchen        = master.id_kitchen     ?? master.kitchen?.kode_lokasi;
    const jenis_pesanan     = master.jenis_pesanan  ?? master.jenis_pembelian?.id_master_jenis_pesanan;
    const pelangganPart     = master.kode_pelanggan_external ?? "";
    const id_pelanggan_ext  = master.id_pelanggan_external ?? 0;
    const catatan           = master.catatan?.trim() ?? "-";
    const tgl_transaksi     = master.tanggal_transaksi;
    const tgl_kirim         = master.tanggal_kirim;

    // 3️⃣ Validasi field master
    if (
      !storeCode ||
      !id_store ||
      !id_kitchen ||
      !jenis_pesanan ||
      !tgl_transaksi ||
      !tgl_kirim
    ) {
      await trx.rollback();
      return res.status(200).json({
        success: false,
        message: "Field master tidak valid/kurang."
      });
    }

    // 4️⃣ Cek stok bahan baku untuk tiap detail, kumpulkan per produk
    const missingMap = {}; // { kode_produk: Set<nama_bahan> }
    for (const d of detail) {
      const { kode_produk, quantity } = d;
      if (!kode_produk || !quantity) continue;

      const [cekRaw] = await db.query(
        `CALL procedure_cek_ketersediaan_bahan_baku(:p_kode_produk, :p_quantity);`,
        {
          replacements: { p_kode_produk: kode_produk, p_quantity: quantity },
          type: QueryTypes.SELECT,
          transaction: trx
        }
      );

      const cekRows = Array.isArray(cekRaw) ? cekRaw : Object.values(cekRaw);
      const kurang  = cekRows.filter(r => Number(r.selisih_stok) < 0);

      if (kurang.length) {
        if (!missingMap[kode_produk]) {
          missingMap[kode_produk] = new Set();
        }
        kurang.forEach(r => missingMap[kode_produk].add(r.nama_bahan_baku));
      }
    }

    // Jika ada stok kurang, rollback dan kirim warning
    const produkKurang = Object.keys(missingMap);
    if (produkKurang.length) {
      await trx.rollback();

      // Build message: untuk tiap produk, trim max 3 bahan, sisanya "..."
      const parts = produkKurang.map(kode => {
        const bahanArr = Array.from(missingMap[kode]);
        const tampil   = bahanArr.slice(0, 1).join(", ");
        const more     = bahanArr.length > 3 ? ", ..." : "";
        return `${kode}: ${tampil}${more}`;
      });

      const message = `Stok bahan baku tidak mencukupi: ${parts.join("; ")}. Cek laporan stok atau master adonan.`;
      return res.status(200).json({
        success: false,
        message
      });
    }

    // 5️⃣ Generate kode PO
    const kodePO = await generateKodePO(storeCode, pelangganPart, trx);

    // 6️⃣ Insert header via stored procedure
    const [hdrRows] = await db.query(
      `CALL procedure_insert_master_pesanan_pembelian(
         :p_kode_pesanan_pembelian,
         :p_kode_sales_order,
         :p_id_kitchen,
         :p_jenis_pesanan,
         :p_id_store,
         :p_id_pelanggan_external,
         :p_catatan,
         :p_tanggal_transaksi,
         :p_tanggal_kirim,
         NULL,0,1,0,:p_createby
       );`,
      {
        replacements: {
          p_kode_pesanan_pembelian: kodePO,
          p_kode_sales_order       : salesOrderParam,
          p_id_kitchen             : id_kitchen,
          p_jenis_pesanan          : jenis_pesanan,
          p_id_store               : id_store,
          p_id_pelanggan_external  : id_pelanggan_ext,
          p_catatan                : catatan,
          p_tanggal_transaksi      : tgl_transaksi,
          p_tanggal_kirim          : tgl_kirim,
          p_createby               : id_user
        },
        type: QueryTypes.SELECT,
        transaction: trx
      }
    );
    const id_header = hdrRows[0]?.id_master_pesanan_pembelian;
    if (!id_header) {
      await trx.rollback();
      return res.status(200).json({
        success: false,
        message: "Gagal insert header pesanan."
      });
    }

    // 7️⃣ Insert detail via stored procedure
    for (const d of detail) {
      const {
        kode_produk,
        nama_produk,
        id_kategori_produk          = 0,
        id_kategori_bahan_baku      = 0,
        id_kategori_adonan_produk   = 0,
        id_kategori_filling_pertama = 0,
        id_kategori_filling_kedua   = 0,
        id_kategori_topping_pertama = 0,
        id_kategori_topping_kedua   = 0,
        quantity,
        harga_jual
      } = d;
      if (!kode_produk || !quantity) continue;

      await db.query(
        `CALL procedure_insert_master_detail_pesanan_pembelian(
           :p_id_header,
           :p_kode_po,
           :p_kode_so,
           :p_id_kategori_produk,
           :p_id_kategori_bahan_baku,
           :p_id_kategori_adonan_produk,
           :p_id_kategori_filling_pertama,
           :p_id_kategori_filling_kedua,
           :p_id_kategori_topping_pertama,
           :p_id_kategori_topping_kedua,
           :p_kode_produk,
           :p_nama_produk,
           :p_quantity,
           :p_harga_jual
         );`,
        {
          replacements: {
            p_id_header                   : id_header,
            p_kode_po                     : kodePO,
            p_kode_so                     : salesOrderParam,
            p_id_kategori_produk          : id_kategori_produk,
            p_id_kategori_bahan_baku      : id_kategori_bahan_baku,
            p_id_kategori_adonan_produk   : id_kategori_adonan_produk,
            p_id_kategori_filling_pertama : id_kategori_filling_pertama,
            p_id_kategori_filling_kedua   : id_kategori_filling_kedua,
            p_id_kategori_topping_pertama : id_kategori_topping_pertama,
            p_id_kategori_topping_kedua   : id_kategori_topping_kedua,
            p_kode_produk                 : kode_produk,
            p_nama_produk                 : nama_produk,
            p_quantity                    : quantity,
            p_harga_jual                  : harga_jual
          },
          type: QueryTypes.RAW,
          transaction: trx
        }
      );
    }

    // 8️⃣ Commit transaksi
    await trx.commit();
    return res.status(201).json({
      success: true,
      message: "Pesanan pembelian berhasil disimpan.",
      kode_po: kodePO,
      id_header
    });

  } catch (err) {
    await trx.rollback();
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
});







// 1. Update jumlah pembelian detail pesanan
// routes/masterPesananPembelian.js
router.post("/updatejumlahpembelian", async (req, res) => {
  let transaction;
  try {
    const {
      kode_barang,
      id_master_detail_pesanan_pembelian,
      quantity,
      catatan
    } = req.body;

    if (
      !kode_barang ||
      id_master_detail_pesanan_pembelian === undefined ||
      quantity === undefined ||
      catatan === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Semua field (kode_barang, id_master_detail_pesanan_pembelian, quantity, catatan) diperlukan.",
      });
    }

    transaction = await db.transaction();

    // Panggil cek stok
    const cekResult = await db.query(
      "CALL procedure_cek_ketersediaan_bahan_baku(?, ?)",
      {
        replacements: [kode_barang, Number(quantity)],
        type: QueryTypes.RAW,
        transaction,
      }
    );
    // flatten hasil ke array of rows
    let hasilCek;
    if (Array.isArray(cekResult[0]) && Array.isArray(cekResult[0][0])) {
      hasilCek = cekResult[0][0];
    } else if (Array.isArray(cekResult[0])) {
      hasilCek = cekResult[0];
    } else {
      hasilCek = cekResult;
    }

    const kurangRows = hasilCek.filter(r => r.status_ketersediaan === "Kurang");
    if (kurangRows.length) {
      // unique nama bahan
      const bahanKurang = [...new Set(kurangRows.map(r => r.nama_bahan_baku))];
      // ambil maksimal 3
      const tampilBahan = bahanKurang.slice(0, 1).join(", ");
      // jika lebih dari 3, tambahkan ellipsis
      const more = bahanKurang.length > 3 ? ", ..." : "";
      const daftarBahan = tampilBahan + more;
    
      const message = `Stok bahan baku tidak mencukupi: ${kode_barang}. (${daftarBahan}). Cek laporan stok atau master adonan.`;
    
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Jika stok cukup, lanjut update
    await db.query(
      "CALL procedure_update_jumlah_pembelian_detail_pesanan(?, ?, ?)",
      {
        replacements: [
          id_master_detail_pesanan_pembelian,
          Number(quantity),
          catatan
        ],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Jumlah pembelian detail pesanan berhasil diupdate.",
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update jumlah pembelian:", err);
    return res.status(500).json({
      success: false,
      message: "Gagal mengupdate jumlah pembelian detail pesanan.",
    });
  }
});




// 2. Update status pesanan pembelian (batal)
router.post("/updatestatuspesananpembelian", async (req, res) => {
  let transaction;
  try {
    const { id_master_pesanan_pembelian } = req.body;

    // Validasi input
    if (!id_master_pesanan_pembelian) {
      return res.status(400).json({
        success: false,
        message: "Field id_master_pesanan_pembelian diperlukan.",
      });
    }

    // Mulai transaction
    transaction = await db.transaction();

    // Panggil prosedur batal pesanan
    await db.query(
      "CALL procedure_batal_pesanan_pembelian(?)",
      {
        replacements: [id_master_pesanan_pembelian],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    // Commit transaction
    await transaction.commit();

    console.log(
      "Prosedur procedure_batal_pesanan_pembelian sudah dipanggil."
    );
    return res.status(200).json({
      success: true,
      message:
        "Status pesanan pembelian berhasil diubah menjadi batal.",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update status pesanan pembelian:", err);
    return res.status(500).json({
      success: false,
      message:
        err.message || "Gagal mengupdate status pesanan pembelian.",
    });
  }
});


// counter in‐memory untuk sequence
let localCounter2 = 1;
async function generateKodeSO(kitchenCode, pelangganPart, trx) {
  while (true) {
    const now = new Date();
    const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
    const seq = String(localCounter2++).padStart(4, "0");
    const part = pelangganPart && pelangganPart !== "" ? pelangganPart : "1";
    const code = `SO.${kitchenCode}.${ymd}.${part}.${seq}`;

    const [dupe] = await db.query(
      `SELECT 1 
         FROM master_pesanan_pembelian 
        WHERE kode_sales_order = ? 
        LIMIT 1`,
      {
        replacements: [code],
        type: QueryTypes.SELECT,
        transaction: trx,
      }
    );
    if (!dupe) return code;
  }
}

router.post("/updatesotanggalverpemesanan", async (req, res) => {
  let transaction;
  try {
    const { id_master_pesanan_pembelian, tanggal_verifikasi_ap } = req.body;
    if (
      id_master_pesanan_pembelian === undefined ||
      !tanggal_verifikasi_ap
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Semua field (id_master_pesanan_pembelian, tanggal_verifikasi_ap) diperlukan.",
      });
    }

    transaction = await db.transaction();

    // 1) Ambil id_kitchen & id_pelanggan_external dari pesanan
    const [order] = await db.query(
      `SELECT id_kitchen, id_pelanggan_external
         FROM master_pesanan_pembelian 
        WHERE id_master_pesanan_pembelian = ?
        LIMIT 1`,
      {
        replacements: [id_master_pesanan_pembelian],
        type: QueryTypes.SELECT,
        transaction,
      }
    );
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Pesanan pembelian tidak ditemukan.",
      });
    }

    // 2) Ambil kode_lokasi untuk kitchen
    const [lokasi] = await db.query(
      `SELECT kode_lokasi 
         FROM master_lokasi 
        WHERE id_lokasi = ? 
        LIMIT 1`,
      {
        replacements: [order.id_kitchen],
        type: QueryTypes.SELECT,
        transaction,
      }
    );
    if (!lokasi) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Kode lokasi kitchen tidak ditemukan.",
      });
    }

    // 3) Tentukan pelangganPart:
    //    jika order.id_pelanggan_external ada, cari kode di master_pelanggan
    //    kalau tidak ada atau lookup gagal → "1"
    let pelangganPart = "1";
    if (order.id_pelanggan_external) {
      const [pel] = await db.query(
        `SELECT kode_pelanggan_external 
           FROM master_pelanggan_external 
          WHERE id_master_pelanggan_external = ?
          LIMIT 1`,
        {
          replacements: [order.id_pelanggan_external],
          type: QueryTypes.SELECT,
          transaction,
        }
      );
      if (pel && pel.kode_pelanggan_external) {
        pelangganPart = pel.kode_pelanggan_external;
      }
    }

    // 4) Generate kode_sales_order
    const kode_sales_order = await generateKodeSO(
      lokasi.kode_lokasi,
      pelangganPart,
      transaction
    );

    // 5) Panggil prosedur update Sales Order & tanggal verifikasi AP
    await db.query(
      "CALL procedure_update_so_tanggal_pesanan(?, ?, ?)",
      {
        replacements: [
          id_master_pesanan_pembelian,
          kode_sales_order,
          tanggal_verifikasi_ap,
        ],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Sales Order dan tanggal verifikasi AP berhasil diupdate.",
      data: { kode_sales_order },
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update SO & tanggal verifikasi AP:", err);
    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Gagal mengupdate Sales Order dan tanggal verifikasi AP.",
    });
  }
});


module.exports = router;
