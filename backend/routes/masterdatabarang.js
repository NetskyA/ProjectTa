//masterdatabarang.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

router.post("/listdatabarang", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_master_produk()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/deletemasterdatabarang", async (req, res) => {
    try {
      const { idproduk } = req.body;
      if (!idproduk) {
        return res.status(400).json({
          success: false,
          message: "idproduk tidak ditemukan di body.",
        });
      }
  
      // Panggil prosedur dengan replacements
      let results = await db.query("CALL procedure_delete_master_databarang(?)", {
        replacements: [idproduk],
        type: QueryTypes.RAW,
      });
  
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error("Error saat memanggil procedure_delete_master_databarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
});

async function generateKodeProduk(trx) {
  let prefix = 1;
  let counter = 1;

  while (true) {
    const number = String(counter).padStart(4, "0");
    const code = `C${prefix}${number}`;

    const [existing] = await db.query(
      "SELECT 1 FROM master_produk WHERE kode_produk = ? LIMIT 1",
      {
        replacements: [code],
        type: QueryTypes.SELECT,
        transaction: trx,
      }
    );

    if (!existing) return code;

    counter++;
    if (counter > 200) {
      counter = 1;
      prefix++;
    }
  }
}

  
router.post("/insertmasterdatabarang", async (req, res) => {
  const transaction = await db.transaction();
  try {
    const {
      id_lokasi,
      id_kategori_produk,
      id_kategori_bahan_baku,
      id_kategori_adonan_produk,
      id_kategori_filling_pertama,
      id_kategori_filling_kedua,
      id_kategori_topping_pertama,
      id_kategori_topping_kedua,
      nama_produk,
      id_kemasan,
      pajak,
      margin_kotor,
      satuan,
      createby,
      status,
    } = req.body;

    if (
      !id_lokasi ||
      !id_kategori_produk ||
      !id_kategori_bahan_baku ||
      !nama_produk ||
      !pajak ||
      !margin_kotor ||
      !satuan ||
      createby === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi.",
      });
    }

    // Generate kode_produk (otomatis & unik)
    const kode_produk = await generateKodeProduk(transaction);

    const result = await db.query(
      "CALL procedure_insert_master_produk(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      {
        replacements: [
          id_lokasi,
          id_kategori_produk,
          id_kategori_bahan_baku,
          id_kategori_adonan_produk,
          id_kategori_filling_pertama,
          id_kategori_filling_kedua,
          id_kategori_topping_pertama,
          id_kategori_topping_kedua,
          kode_produk,
          nama_produk,
          id_kemasan,
          parseFloat(pajak),
          parseFloat(margin_kotor),
          satuan,
          createby,
          status || 0,
        ],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    const id_produk = result[0]?.id_produk || null;

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Produk berhasil ditambahkan.",
      data: {
        id_produk,
        kode_produk,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error(" Gagal insert produk:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat insert produk.",
    });
  }
});

router.post("/updatemasterdatabarang", async (req, res) => {
  const transaction = await db.transaction();
  try {
    const {
      id_produk,
      id_kategori_adonan_produk = 0,
      id_kategori_filling_pertama = 0,
      id_kategori_filling_kedua = 0,
      id_kategori_topping_pertama = 0,
      id_kategori_topping_kedua = 0,
      pajak,
      margin_kotor,
    } = req.body;

    // Validasi minimal
    if (!id_produk || pajak === undefined || margin_kotor === undefined) {
      return res.status(400).json({
        success: false,
        message: "id_produk, pajak, dan margin_kotor wajib diisi.",
      });
    }

    // Debug: Log input data
    console.log("Update Master Produk Payload:", {
      id_produk,
      id_kategori_adonan_produk,
      id_kategori_filling_pertama,
      id_kategori_filling_kedua,
      id_kategori_topping_pertama,
      id_kategori_topping_kedua,
      pajak,
      margin_kotor,
    });

    // Panggil prosedur simpan
    await db.query(
      "CALL procedure_update_master_produk(?, ?, ?, ?, ?, ?, ?, ?)",
      {
        replacements: [
          parseInt(id_produk),
          parseInt(id_kategori_adonan_produk) || 0,
          parseInt(id_kategori_filling_pertama) || 0,
          parseInt(id_kategori_filling_kedua) || 0,
          parseInt(id_kategori_topping_pertama) || 0,
          parseInt(id_kategori_topping_kedua) || 0,
          parseFloat(Number(pajak).toFixed(2)),
          parseFloat(Number(margin_kotor).toFixed(2)),
        ],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Data produk berhasil diperbarui.",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error update master_produk:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat update data produk.",
    });
  }
});

module.exports = router;