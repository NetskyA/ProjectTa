// routes/pembelian.js
const express      = require("express");
const { QueryTypes } = require("sequelize");
const { db }       = require("../connection/database");
const router       = express.Router();

// 1) GET header pembelian
router.post("/data/header/pembelianbarang", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_header_pembelian_barang()",
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json(results[0]);
  } catch (err) {
    console.error("Error get header:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2) GET detail pembelian
router.post("/data/detail/pembelianbarang", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_detail_pembelian_barang()",
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json(results[0]);
  } catch (err) {
    console.error("Error get detail:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// let localCounter = 1;
// async function generateKodePO(kodeSalesOrder, trx) {
//   while (true) {
//     const now = new Date();
//     const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
//     const seq = String(localCounter++).padStart(4, "0");
//     const code = `PO.${kodeSalesOrder}.${ymd}.1.${seq}`;
//     const [dupe] = await db.query(
//       "SELECT 1 FROM master_pesanan_pembelian WHERE kode_pesanan_pembelian = ? LIMIT 1",
//       { replacements: [code], type: QueryTypes.SELECT, transaction: trx }
//     );
//     if (!dupe) return code;
//   }
// }

// router.post("/insert/pesanan/pembelian", async (req, res) => {
//   const trx = await db.transaction();
//   try {
//     // ── 1️⃣ Destructure payload
//     const {
//       id_user,
//       id_toko,
//       kode_sales_order,
//       id_store,
//       id_kitchen,
//       jenis_pesanan,
//       id_pelanggan_external = 0,
//       kode_pelanggan_external = "",
//       catatan = "-",
//       tanggal_transaksi,
//       tanggal_kirim,
//       detailData,
//     } = req.body;

//     // ── 2️⃣ Validasi minimal keberadaan (allow zero for kode_sales_order)
//     if (
//       id_user             == null ||
//       id_toko             == null ||
//       kode_sales_order    == null ||   // cek keberadaan, bukan truthiness
//       id_store            == null ||
//       id_kitchen          == null ||
//       jenis_pesanan       == null ||
//       !tanggal_transaksi ||
//       !tanggal_kirim     ||
//       !Array.isArray(detailData) ||
//       detailData.length === 0
//     ) {
//       throw new Error("Payload tidak lengkap.");
//     }

//     // ── 3️⃣ Generate kode PO
//     const kodePO = await generateKodePO(String(kode_sales_order), trx);

//     // ── 4️⃣ Insert header via SP
//     const [[headerRs]] = await db.query(
//       `CALL procedure_insert_master_pesanan_pembelian(
//          :p_kode_pesanan_pembelian,
//          :p_kode_sales_order,
//          :p_id_kitchen,
//          :p_jenis_pesanan,
//          :p_id_store,
//          :p_id_pelanggan_external,
//          :p_catatan,
//          :p_tanggal_transaksi,
//          :p_tanggal_kirim,
//          NULL,0,0,0,
//          :p_createby
//       );`,
//       {
//         replacements: {
//           p_kode_pesanan_pembelian : kodePO,
//           p_kode_sales_order       : kode_sales_order,
//           p_id_kitchen             : id_kitchen,
//           p_jenis_pesanan          : jenis_pesanan,
//           p_id_store               : id_store,
//           p_id_pelanggan_external,
//           p_catatan                : catatan.trim(),
//           p_tanggal_transaksi,
//           p_tanggal_kirim,
//           p_createby               : id_user,
//         },
//         type       : QueryTypes.RAW,
//         transaction: trx,
//       }
//     );
//     const id_master_pesanan_pembelian = headerRs?.id_master_pesanan_pembelian;
//     if (!id_master_pesanan_pembelian) {
//       throw new Error("Gagal menyimpan header pesanan.");
//     }

//     // ── 5️⃣ CEK STOK BAHAN BAKU
//     for (const { kode_produk, quantity } of detailData) {
//       const rows = await db.query(
//         "CALL procedure_cek_ketersediaan_bahan_baku(:kode, :qty);",
//         {
//           replacements: { kode: kode_produk, qty: quantity },
//           type       : QueryTypes.SELECT,
//           transaction: trx
//         }
//       );
//       const kurang = rows.filter(r =>
//         (r.status_ketersediaan || "").trim().toLowerCase() === "kurang"
//       );
//       if (kurang.length > 0) {
//         await trx.rollback();
//         const daftar = kurang
//           .map(b => `${b.nama_bahan_baku} (butuh ${b.total_kebutuhan}, stok ${b.stok_bahan_baku})`)
//           .join("; ");
//         return res.status(400).json({
//           success     : false,
//           message     : `Stok tidak mencukupi untuk ${kode_produk}: ${daftar}`,
//           bahan_kurang: kurang
//         });
//       }
//     }

//     // ── 6️⃣ Insert detail via SP
//     for (const d of detailData) {
//       await db.query(
//         `CALL procedure_insert_master_detail_pesanan_pembelian(
//            :p_id_master_pesanan_pembelian,
//            :p_kode_pesanan_pembelian,
//            :p_kode_sales_order,
//            :p_id_kategori_produk,
//            :p_id_kategori_bahan_baku,
//            :p_id_kategori_adonan_produk,
//            :p_id_kategori_filling_pertama,
//            :p_id_kategori_filling_kedua,
//            :p_id_kategori_topping_pertama,
//            :p_id_kategori_topping_kedua,
//            :p_kode_produk,
//            :p_nama_produk,
//            :p_quantity,
//            :p_harga_jual
//         );`,
//         {
//           replacements: {
//             p_id_master_pesanan_pembelian,
//             p_kode_pesanan_pembelian: kodePO,
//             p_kode_sales_order      : kode_sales_order,
//             p_id_kategori_produk      : d.id_kategori_produk,
//             p_id_kategori_bahan_baku  : d.id_kategori_bahan_baku,
//             p_id_kategori_adonan_produk: d.id_kategori_adonan_produk,
//             p_id_kategori_filling_pertama: d.id_kategori_filling_pertama,
//             p_id_kategori_filling_kedua : d.id_kategori_filling_kedua,
//             p_id_kategori_topping_pertama: d.id_kategori_topping_pertama,
//             p_id_kategori_topping_kedua: d.id_kategori_topping_kedua,
//             p_kode_produk           : d.kode_produk,
//             p_nama_produk           : d.nama_produk,
//             p_quantity              : d.quantity,
//             p_harga_jual            : d.harga_jual,
//           },
//           type       : QueryTypes.RAW,
//           transaction: trx,
//         }
//       );
//     }

//     // ── 7️⃣ Commit dan respon sukses
//     await trx.commit();
//     return res.status(201).json({
//       success  : true,
//       message  : "Pesanan pembelian berhasil disimpan.",
//       kode_po  : kodePO,
//       id_header: id_master_pesanan_pembelian
//     });

//   } catch (err) {
//     await trx.rollback();
//     console.error("Insert Error:", err);
//     return res.status(500).json({
//       success: false,
//       message: err.message || "Internal Server Error"
//     });
//   }
// });

module.exports = router;
