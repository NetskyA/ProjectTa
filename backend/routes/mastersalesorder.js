// routes/salesorder.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

router.post("/pengecekan/pembelian/so", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_check_pembelian_so()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/pengecekan/pembelian/so/kitchen", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_sales_order_kitchen()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/data/sales/order", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_master_sales_order()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Err get master pesanan:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/data/detail/sales/order", async (_req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_master_detail_sales_order()",
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
    let results = await db.query(
      "CALL procedure_get_master_detail_pesanan_pembelian()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getdatabarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.post("/insert/sales/order", async (req, res) => {
  const trx = await db.transaction();
  try {
    // 1️⃣ Destructure & validate payload
    const {
      id_user,
      master: {
        id_master_pesanan_pembelian,
        kode_sales_order,
        tanggal_verifikasi_so,
        status_batal,
        status_gabungan,
      } = {},
      detail,
    } = req.body || {};

    if (
      !id_user ||
      !id_master_pesanan_pembelian ||
      !kode_sales_order ||
      !tanggal_verifikasi_so ||
      typeof status_batal    !== "number" ||
      typeof status_gabungan !== "number" ||
      !Array.isArray(detail) ||
      detail.length === 0
    ) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: "Payload tidak lengkap atau tidak valid.",
      });
    }

    // 2️⃣ Insert ke master_sales_order
    const [soRows] = await db.query(
      `CALL procedure_insert_master_sales_order(
         :p_id_master_pesanan_pembelian,
         :p_kode_sales_order,
         :p_tanggal_verifikasi_so,
         :p_status_batal,
         :p_status_gabungan,
         :p_createby
       );`,
      {
        replacements: {
          p_id_master_pesanan_pembelian: id_master_pesanan_pembelian,
          p_kode_sales_order:            kode_sales_order,
          p_tanggal_verifikasi_so:       tanggal_verifikasi_so,
          p_status_batal:                status_batal,
          p_status_gabungan:             status_gabungan,
          p_createby:                    id_user,
        },
        type: QueryTypes.SELECT,
        transaction: trx,
      }
    );
    const id_master_sales_order = soRows[0]?.id_master_sales_order;
    if (!id_master_sales_order) {
      await trx.rollback();
      return res.status(500).json({
        success: false,
        message: "Gagal insert master_sales_order.",
      });
    }

    // 3️⃣ Update status di master_pesanan_pembelian
    await db.query(
      `CALL procedure_update_status_sales_order(:p_id_master_pesanan_pembelian);`,
      {
        replacements: {
          p_id_master_pesanan_pembelian: id_master_pesanan_pembelian,
        },
        type: QueryTypes.RAW,
        transaction: trx,
      }
    );

    // 4️⃣ Insert detail sales order
    for (const d of detail) {
      const {
        id_kategori_produk           = 0,
        id_kategori_bahan_baku       = 0,
        id_kategori_adonan_produk    = 0,
        id_kategori_filling_pertama  = 0,
        id_kategori_filling_kedua    = 0,
        id_kategori_topping_pertama  = 0,
        id_kategori_topping_kedua    = 0,
        kode_produk,
        nama_produk,
        quantity,
        harga_jual,
      } = d;

      if (!kode_produk || typeof quantity !== "number") {
        continue; // skip invalid
      }

      const quantity_terpenuhi = quantity;

      await db.query(
        `CALL procedure_insert_master_detail_sales_order(
           :p_id_master_sales_order,
           :p_id_master_pesanan_pembelian,
           :p_kode_sales_order,
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
           :p_quantity_terpenuhi,
           :p_harga_jual
         );`,
        {
          replacements: {
            p_id_master_sales_order:        id_master_sales_order,
            p_id_master_pesanan_pembelian:  id_master_pesanan_pembelian,
            p_kode_sales_order:             kode_sales_order,
            p_id_kategori_produk:           id_kategori_produk,
            p_id_kategori_bahan_baku:       id_kategori_bahan_baku,
            p_id_kategori_adonan_produk:    id_kategori_adonan_produk,
            p_id_kategori_filling_pertama:  id_kategori_filling_pertama,
            p_id_kategori_filling_kedua:    id_kategori_filling_kedua,
            p_id_kategori_topping_pertama:  id_kategori_topping_pertama,
            p_id_kategori_topping_kedua:    id_kategori_topping_kedua,
            p_kode_produk:                  kode_produk,
            p_nama_produk:                  nama_produk,
            p_quantity:                     quantity,
            p_quantity_terpenuhi:           quantity_terpenuhi,
            p_harga_jual:                   harga_jual,
          },
          type: QueryTypes.RAW,
          transaction: trx,
        }
      );
    }

    // 5️⃣ Commit transaksi
    await trx.commit();
    return res.status(201).json({
      success: true,
      message: "Sales order berhasil disimpan.",
      id_master_sales_order,
    });
  } catch (err) {
    await trx.rollback();
    console.error("Error insert sales order:", err.sqlMessage || err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error.",
    });
  }
});



// 1. Update jumlah pembelian detail pesanan
router.post("/updatejumlahpembelian", async (req, res) => {
  let transaction;
  try {
    const {
      kode_barang,
      id_master_detail_pesanan_pembelian,
      quantity,
      catatan,
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

    const kurangRows = hasilCek.filter(
      (r) => r.status_ketersediaan === "Kurang"
    );
    if (kurangRows.length) {
      // unique nama bahan
      const bahanKurang = [
        ...new Set(kurangRows.map((r) => r.nama_bahan_baku)),
      ];
      // ambil maksimal 3
      const tampilBahan = bahanKurang.slice(0, 1).join(", ");
      // jika lebih dari 3, tambahkan ellipsis
      const more = bahanKurang.length > 3 ? ", ..." : "";
      const daftarBahan = tampilBahan + more;

      const message = `Stok bahan baku tidak mencukupi: ${kode_barang}. (${daftarBahan}). Cek laporan stok atau master adonan.`;

      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Jika stok cukup, lanjut update
    await db.query(
      "CALL procedure_update_jumlah_pembelian_detail_pesanan(?, ?, ?)",
      {
        replacements: [
          id_master_detail_pesanan_pembelian,
          Number(quantity),
          catatan,
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

router.post("/updatestatussopembelian", async (req, res) => {
  let transaction;
  try {
    // 1️⃣ Terima dan validasi input
    const { id_master_pesanan_pembelian } = req.body || {};

    if (!id_master_pesanan_pembelian) {
      return res.status(400).json({
        success: false,
        message: "Field id_master_pesanan_pembelian diperlukan.",
      });
    }

    // 2️⃣ Mulai transaction
    transaction = await db.transaction();

    // 3️⃣ Panggil procedure_batal_sales_order_pembelian
    //    yang akan:
    //      • cari SO untuk pesanan ini (jika ada), batalkan SO & pesanan
    //      • atau jika belum ada SO, batalkan hanya pesanan
    await db.query(
      "CALL procedure_batal_sales_order_pembelian(?)",
      {
        replacements: [id_master_pesanan_pembelian],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    // 4️⃣ Commit
    await transaction.commit();

    console.log(
      `Prosedur procedure_batal_sales_order_pembelian dipanggil untuk Pesanan ${id_master_pesanan_pembelian}`
    );
    return res.status(200).json({
      success: true,
      message: "Sales Order (jika ada) dan Pesanan Pembelian berhasil dibatalkan.",
    });
  } catch (err) {
    // rollback jika error
    if (transaction) await transaction.rollback();
    console.error("Error saat batal sales order:", err);
    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Gagal memproses pembatalan Sales Order dan/atau Pesanan Pembelian.",
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
    if (id_master_pesanan_pembelian === undefined || !tanggal_verifikasi_ap) {
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
    await db.query("CALL procedure_update_so_tanggal_pesanan(?, ?, ?)", {
      replacements: [
        id_master_pesanan_pembelian,
        kode_sales_order,
        tanggal_verifikasi_ap,
      ],
      type: QueryTypes.RAW,
      transaction,
    });

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

router.post("/updatequantityall", async (req, res) => {
  let transaction;
  try {
    const {
      id_master_pesanan_pembelian,
      kode_produk,
      quantity_beli,
      quantity_terpenuhi,
      id_user,
    } = req.body || {};

    if (
      !id_master_pesanan_pembelian ||
      !kode_produk ||
      quantity_beli == null ||
      quantity_terpenuhi == null ||
      !id_user
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Field id_master_pesanan_pembelian, kode_produk, quantity_beli, quantity_terpenuhi, dan id_user semua diperlukan.",
      });
    }

    transaction = await db.transaction();

    // 1) Update di semua tabel
    await db.query(
      `CALL procedure_update_quantity_all(
         :pPesananId,
         :pKodeProduk,
         :pQty
       );`,
      {
        replacements: {
          pPesananId: id_master_pesanan_pembelian,
          pKodeProduk: kode_produk,
          pQty: quantity_terpenuhi,
        },
        type: QueryTypes.RAW,
        transaction,
      }
    );

    // 2) Simpan histori perubahan, sekarang dengan kode_produk
    const [historyResult] = await db.query(
      `CALL procedure_insert_history_update_terpenuhi(
         :pPesananId,
         :pKodeProduk,
         :pQtyBeli,
         :pQtyTerpenuhi,
         :pCreateBy
       );`,
      {
        replacements: {
          pPesananId: id_master_pesanan_pembelian,
          pKodeProduk: kode_produk,            // ← ditambahkan
          pQtyBeli: quantity_beli,
          pQtyTerpenuhi: quantity_terpenuhi,
          pCreateBy: id_user,
        },
        type: QueryTypes.SELECT,
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Update sukses",
      history_id: historyResult.id_master_history_update_terpenuhi,
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update quantity:", err);
    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Gagal memproses update quantity dan histori update.",
    });
  }
});

module.exports = router;
