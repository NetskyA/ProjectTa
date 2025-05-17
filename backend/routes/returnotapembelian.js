const express = require("express");
const router = express.Router();
const { QueryTypes } = require("sequelize");

// db is your Sequelize instance from ../connection/database
const { db } = require("../connection/database");

// =======================
// GET Header Retur Pembelian
// =======================
router.post("/headerretur/pembelian", async (req, res) => {
  try {

    const [rawResults] = await db.query(
      "CALL procedure_get_header_retur_pembelian()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(rawResults);
  } catch (error) {
    console.error("Error saat memanggil procedure_get_header_retur_pembelian:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =======================
// GET Detail Retur Pembelian
// =======================
router.post("/detailretur/pembelian", async (req, res) => {
  try {
    const [rawResults] = await db.query(
      "CALL procedure_get_detail_retur_pembelian()",
      { type: QueryTypes.SELECT }
    );
    res.status(200).json(rawResults);
  } catch (error) {
    console.error("Error saat memanggil procedure_get_detail_retur_pembelian:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/insertretur/notapembelian", async (req, res) => {
    const { createBy, items } = req.body;
  
    if (!createBy || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Payload tidak valid (createBy dan items dibutuhkan).",
      });
    }
  
    // Gunakan id_toko dari items[0] untuk insert header
    const id_toko = items[0].id_toko;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  
    const kodeReturPembelian = `RB-${id_toko}${year}${month}${day}${suffix}`;
    const p_status = 0;
  
    const t = await db.transaction();
  
    try {
      // Insert Header Retur dengan OUT parameter
      await db.query(
        "CALL procedure_insert_header_retur_pembelian(:p_kode, :p_toko, :p_createBy, :p_status, @id_retur_pembelian);",
        {
          replacements: {
            p_kode: kodeReturPembelian,
            p_toko: id_toko,
            p_createBy: createBy,
            p_status,
          },
          transaction: t,
        }
      );
  
      // Ambil id_retur_pembelian dari OUT parameter
      const [[{ id_retur_pembelian }]] = await db.query(
        "SELECT @id_retur_pembelian as id_retur_pembelian;",
        { transaction: t }
      );
  
      if (!id_retur_pembelian) {
        throw new Error("Gagal mendapatkan id_retur_pembelian setelah insert header.");
      }
  
      // Loop insert detail retur + update stok
      for (const item of items) {
        await db.query(
          `CALL procedure_insert_detail_retur_pembelian(
            :p_id_retur_pembelian,
            :p_id_header_pembelian,
            :p_kode_pembelian,
            :p_id_toko,
            :p_kode_barang,
            :p_qtyBeli,
            :p_qtyReturBeli,
            :p_id_depo,
            :p_createBy
          )`,
          {
            replacements: {
              p_id_retur_pembelian: id_retur_pembelian,
              p_id_header_pembelian: item.id_header_pembelian,
              p_kode_pembelian: item.kode_pembelian,
              p_id_toko: item.id_toko, // gunakan id_toko untuk insert detail
              p_kode_barang: item.kode_barang,
              p_qtyBeli: item.qtyBeli,
              p_qtyReturBeli: item.qtyReturBeli,
              p_id_depo: item.id_depo,
              p_createBy: createBy,
            },
            transaction: t,
          }
        );
  
        // Update stok barang menggunakan kode_toko yang telah dicocokkan
        await db.query(
          "CALL procedure_update_stokbarang(:p_toko, :p_barang, :p_qty)",
          {
            replacements: {
              p_toko: item.kode_toko, // gunakan kode_toko dari payload
              p_barang: item.kode_barang,
              p_qty: item.qtyReturBeli,
            },
            transaction: t,
          }
        );
      }
  
      await t.commit();
  
      return res.json({
        success: true,
        id_retur_pembelian,
        kode_retur_pembelian: kodeReturPembelian,
        message: "Retur pembelian berhasil disimpan.",
      });
    } catch (error) {
      await t.rollback();
      console.error("Error insert retur pembelian:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan saat proses retur.",
      });
    }
  });
  
  
module.exports = router;
