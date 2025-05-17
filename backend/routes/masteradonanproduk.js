//masterdatabarang.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

router.post("/listadonan", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_master_adonan()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
});
    
router.post("/listdetailadonan", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_master_detail_adonan_produk()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/listadonanproduk", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_adonan_produk()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/insertmasteradonan", async (req, res) => {
  const trx = await db.transaction();
  try {
    const { nama_adonan, createby, status = 0, bahan_baku = [] } = req.body || {};

    // 1️⃣ Validasi payload awal
    if (!nama_adonan || typeof createby === "undefined" || !Array.isArray(bahan_baku) || bahan_baku.length === 0) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        message: "Field 'nama_adonan', 'createby', dan minimal 1 bahan_baku wajib diisi.",
      });
    }

    // 2️⃣ Insert ke master_kategori_adonan_produk
    const resultKategori = await db.query(
      "CALL procedure_insert_master_kategori_adonan_produk(:nama, :createby, :status)",
      {
        replacements: {
          nama: nama_adonan,
          createby,
          status,
        },
        type: db.QueryTypes.SELECT,
        transaction: trx,
      }
    );

    const id_kategori_adonan_produk =
      resultKategori?.[0]?.[0]?.id_kategori_adonan_produk ||
      resultKategori?.[0]?.[0]?.['LAST_INSERT_ID()'];

    if (!id_kategori_adonan_produk) {
      console.error("Hasil procedure_insert_master_kategori_adonan_produk:", resultKategori);
      await trx.rollback();
      return res.status(500).json({
        success: false,
        message: "Gagal mendapatkan ID kategori adonan dari hasil prosedur.",
      });
    }

    // 3️⃣ Insert bahan baku ke master_adonan_produk
    for (const bahan of bahan_baku) {
      const { id_bahan_baku, jumlah_kebutuhan } = bahan;

      if (!id_bahan_baku || isNaN(jumlah_kebutuhan)) {
        await trx.rollback();
        return res.status(400).json({
          success: false,
          message: "Data bahan baku tidak valid. Periksa id_bahan_baku & jumlah_kebutuhan.",
        });
      }

      await db.query(
        "CALL procedure_insert_master_adonan_produk(:id_kategori, :id_bahan, :jumlah, :createby, :status)",
        {
          replacements: {
            id_kategori: id_kategori_adonan_produk,
            id_bahan: id_bahan_baku,
            jumlah: parseFloat(jumlah_kebutuhan),
            createby,
            status,
          },
          type: db.QueryTypes.RAW,
          transaction: trx,
        }
      );
    }

    // 4️⃣ Commit transaksi jika semua sukses
    await trx.commit();
    return res.status(201).json({
      success: true,
      message: "Adonan dan bahan baku berhasil disimpan.",
      id_kategori_adonan_produk,
    });

  } catch (error) {
    await trx.rollback();
    console.error("Gagal insert adonan:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat insert adonan.",
    });
  }
});

router.post("/updateadonanbahanbaku", async (req, res) => {
  let transaction;
  try {
    const { id_user, data = [] } = req.body;

    if (!id_user || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Field 'id_user' dan array 'data' wajib diisi.",
      });
    }

    transaction = await db.transaction();

    for (const item of data) {
      const {
        id_adonan_produk,
        id_bahan_baku,
        id_kategori_adonan_produk,
        jumlah_kebutuhan,
        status = 0
      } = item;

      if (
        !id_bahan_baku ||
        !id_kategori_adonan_produk ||
        isNaN(jumlah_kebutuhan)
      ) {
        throw new Error("Data tidak lengkap atau tidak valid.");
      }

      // Jika ID adonan produk tersedia, update
      if (id_adonan_produk) {
        await db.query("CALL procedure_update_master_adonan_produk(?, ?, ?, ?)", {
          replacements: [
            id_adonan_produk,
            id_bahan_baku,
            id_kategori_adonan_produk,
            jumlah_kebutuhan
          ],
          type: QueryTypes.RAW,
          transaction
        });
      } else {
        // Jika belum ada ID (data baru), lakukan insert
        await db.query(
          "CALL procedure_insert_master_adonan_produk(?, ?, ?, ?, ?)",
          {
            replacements: [
              id_kategori_adonan_produk,
              id_bahan_baku,
              jumlah_kebutuhan,
              id_user,
              status
            ],
            type: QueryTypes.RAW,
            transaction
          }
        );
      }
    }

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: "Data adonan berhasil diupdate atau ditambahkan.",
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error saat update adonan:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal memperbarui data adonan.",
    });
  }
});

router.post("/deletemasterkategoriadonan", async (req, res) => {
    try {
      const { idkategoriadonanproduk  } = req.body;
      if (!idkategoriadonanproduk) {
        return res.status(400).json({
          success: false,
          message: "idproduk tidak ditemukan di body.",
        });
      }
  
      // Panggil prosedur dengan replacements
      let results = await db.query("CALL procedure_delete_master_kategori_adonan_produk(?)", {
        replacements: [idkategoriadonanproduk],
        type: QueryTypes.RAW,
      });
  
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error("Error saat memanggil procedure_delete_master_databarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/deletemasteradonanproduk", async (req, res) => {
    try {
      const { idadonanproduk } = req.body;
      if (!idadonanproduk) {
        return res.status(400).json({
          success: false,
          message: "idadonanproduk tidak ditemukan di body.",
        });
      }
  
      // Panggil prosedur dengan replacements
      let results = await db.query("CALL procedure_delete_master_adonan_produk(?)", {
        replacements: [idadonanproduk],
        type: QueryTypes.RAW,
      });
  
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error("Error saat memanggil procedure_delete_master_adonan_produk:", error);
      res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;