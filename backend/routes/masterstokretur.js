const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

router.post("/liststokretur", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_masterstokretur()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getstokbarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/liststokretur/besttroli", async (req, res) => {
  try {
    let results = await db.query(
      "CALL procedure_get_masterstokretur_besttroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getstokbarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/liststokretur/bigtroli", async (req, res) => {
  try {
    let results = await db.query(
      "CALL procedure_get_masterstokretur_bigtroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getstokbarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/liststokretur/onlybs/all", async (req, res) => {
  try {
    let results = await db.query(
      "CALL procedure_get_masterstokretur_onlybs_all()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getstokbarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/liststokretur/onlybs/besttroli", async (req, res) => {
  try {
    let results = await db.query(
      "CALL procedure_get_masterstokretur_onlybs_besttroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getstokbarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/liststokretur/onlybs/bigtroli", async (req, res) => {
  try {
    let results = await db.query(
      "CALL procedure_get_masterstokretur_onlybs_bigtroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error saat memanggil prosedur getstokbarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

function flattenProcedureResult(results) {
  let finalArray = [];
  if (Array.isArray(results) && results.length > 0) {
    if (
      typeof results[0] === "object" &&
      !Array.isArray(results[0]) &&
      Object.keys(results[0]).length > 0
    ) {
      finalArray = Object.values(results[0]);
    } else {
      finalArray = results;
    }
  } else {
    finalArray = Array.isArray(results) ? results : Object.values(results);
  }
  return finalArray;
}

router.post("/updatestokreturjual", async (req, res) => {
  // Mulai transaksi
  const t = await db.transaction();
  try {
    const { 
      id_stokretur, 
      stok_barang, 
      gudang_tujuan,
      kode_toko,      // hanya untuk keperluan validasi (jika diperlukan)
      kode_barang,    // hanya untuk keperluan validasi (jika diperlukan)
      qty             // diperlukan untuk gudang 1
    } = req.body;

    // Validasi parameter dasar
    if (
      typeof id_stokretur !== "number" ||
      typeof stok_barang !== "number" ||
      typeof gudang_tujuan !== "number"
    ) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Parameter tidak valid. id_stokretur, stok_barang, dan gudang_tujuan harus berupa angka."
      });
    }

    // Jika gudang tujuan adalah 1, pastikan parameter tambahan valid
    if (gudang_tujuan === 1) {
      if (
        typeof kode_toko !== "string" ||
        typeof kode_barang !== "string" ||
        typeof qty !== "number"
      ) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message:
            "Untuk gudang tujuan 1, kode_toko dan kode_barang harus berupa string serta qty berupa angka."
        });
      }
    }

    // Pengecekan data master stok menggunakan prosedur tanpa parameter
    const checkResultRaw = await db.query(
      "CALL procedure_get_masterstokretur()",
      {
        type: QueryTypes.RAW,
        transaction: t
      }
    );
    const checkResult = flattenProcedureResult(checkResultRaw);
    if (!checkResult || checkResult.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Data tidak ditemukan untuk kombinasi kode_toko dan kode_barang."
      });
    }

    // Proses update berdasarkan nilai gudang_tujuan
    let results;
    if (gudang_tujuan === 1) {
      // Untuk gudang 1, jalankan procedure_update_stokbarang dengan replacements (di sini diperlukan untuk menyisipkan nilai)
      results = await db.query(
        "CALL procedure_update_stokbarang(:kode_toko, :kode_barang, :qty)",
        {
          replacements: { kode_toko, kode_barang, qty },
          type: QueryTypes.RAW,
          transaction: t
        }
      );
    } else if (gudang_tujuan === 2) {
      // Untuk gudang 2, jalankan procedure_update_stokretur
      results = await db.query(
        "CALL procedure_update_stokretur(:id_stokretur, :stok_barang, :gudang_tujuan)",
        {
          replacements: { id_stokretur, stok_barang, gudang_tujuan },
          type: QueryTypes.RAW,
          transaction: t
        }
      );
    } else {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Gudang tujuan tidak valid. Hanya menerima nilai 1 atau 2."
      });
    }

    // Commit transaksi jika semua proses berhasil
    await t.commit();
    return res.status(200).json({
      success: true,
      message:
        gudang_tujuan === 1
          ? "Stok retur dan stok barang berhasil diupdate pada gudang 1."
          : "Stok retur berhasil diupdate pada gudang 2.",
      data: results,
    });
  } catch (error) {
    // Rollback transaksi jika terjadi error
    await t.rollback();
    console.error("Error saat update stok retur:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat mengupdate data stok retur."
    });
  }
});

module.exports = router;
