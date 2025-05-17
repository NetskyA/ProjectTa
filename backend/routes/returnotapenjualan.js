// routes/returnotapenjualan.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

// Endpoint POST untuk Retur All
router.post("/notapenjualan/retur/all", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_returnpenjualan_All()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint POST untuk Retur Besttroli
router.post("/notapenjualan/besttroli", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_returnpenjualan_besttroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/notapenjualan/bigtroli", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_returnpenjualan_bigtroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/notapenjualan/add/all", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_getnadd_returnpenjualan_all()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.post("/notapenjualan/add/besttroli", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_getnadd_returnpenjualan_besttroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/notapenjualan/add/bigtroli", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_getnadd_returnpenjualan_bigtroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint POST untuk detail retur All
router.post("/result/retur/all", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_retur_details_all()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint POST untuk detail retur Besttroli
router.post("/result/retur/besttroli", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_retur_details_besttroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint POST untuk detail retur Besttroli
router.post("/result/retur/bigtroli", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_retur_details_bigtroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/result/before/all", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_returbfr_details_all()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/result/before/besttroli", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_returbfr_details_besttroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/result/before/bigtroli", async (req, res) => {
  try {
    const results = await db.query(
      "CALL procedure_get_returbfr_details_bigtroli()",
      {
        type: QueryTypes.SELECT,
      }
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Utility flatten
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

// Endpoint POST untuk Insert Retur Nota Penjualan (Final)
router.post("/insertretur/notapenjualan", async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { kode_retur, status, createBy, items } = req.body;

    // 1. Validasi Input
    if (!kode_retur || typeof kode_retur !== "string") {
      throw new Error("kode_retur harus berupa string dan tidak boleh kosong.");
    }
    if (typeof status !== "number") {
      throw new Error("status harus berupa angka.");
    }
    if (!createBy || typeof createBy !== "string") {
      throw new Error("createBy harus berupa string dan tidak boleh kosong.");
    }
    if (!Array.isArray(items)) {
      throw new Error("items harus berupa array.");
    }
    if (items.length === 0) {
      throw new Error("items tidak boleh kosong.");
    }

    // 2. Cek Duplikasi kode_retur di header_retur
    const [existingRetur] = await db.query(
      `SELECT COUNT(*) AS count FROM header_retur WHERE kode_retur = ?`,
      {
        replacements: [kode_retur],
        type: QueryTypes.SELECT,
        transaction,
      }
    );
    if (existingRetur.count > 0) {
      throw new Error("kode_retur sudah digunakan. Harap gunakan kode yang unik.");
    }

    // 3. Validasi No Pemesanan Unik di detail_retur
    const noPemesananSet = new Set(items.map((item) => item.no_pemesanan));
    const noPemesananArray = Array.from(noPemesananSet);
    if (noPemesananArray.length > 0) {
      const queryPlaceholders = noPemesananArray.map(() => "?").join(", ");
      const existingNoPemesananRows = await db.query(
        `SELECT no_pemesanan FROM detail_retur WHERE no_pemesanan IN (${queryPlaceholders})`,
        {
          replacements: noPemesananArray,
          type: QueryTypes.SELECT,
          transaction,
        }
      );
      if (existingNoPemesananRows.length > 0) {
        const existingNoPemesanan = existingNoPemesananRows.map(
          (row) => row.no_pemesanan
        );
        throw new Error(
          `No Pemesanan berikut sudah memiliki retur: ${existingNoPemesanan.join(", ")}`
        );
      }
    }

    // 4. Insert ke header_retur (Stored Procedure InsertHeaderRetur)
    const statusHeader = 1; // misal 1 = 'Retur'
    await db.query(`CALL InsertHeaderRetur(?, ?)`, {
      replacements: [kode_retur, statusHeader],
      type: QueryTypes.RAW,
      transaction,
    });

    // 5. Ambil id_retur baru
    const [[{ id_retur }]] = await db.query(
      `SELECT LAST_INSERT_ID() AS id_retur`,
      { transaction }
    );
    if (!id_retur) {
      throw new Error("Gagal mendapatkan ID header_retur.");
    }

    // 6. Karena tidak menggunakan procedure_get_masterdatabarang,
    // kita asumsikan nilai netto sudah dipassing dari frontend di tiap item.
    // 6.b. Ambil seluruh data history_transaksi
    const historyRes = await db.query("CALL procedure_get_history_transaksi()", {
      type: QueryTypes.SELECT,
      // transaction: jika diperlukan
    });
    const historyList = flattenProcedureResult(historyRes);

    // 7. Proses setiap item retur
    for (const item of items) {
      // Pastikan field id_toko juga didestrukturisasi dari item
      const {
        id_header_pemesanan,
        no_pemesanan,
        kode_barang,
        gudang_asal,
        gudang_tujuan,
        qtyretur,
        kode_toko,
        id_marketplace, // dari frontend
        id_toko,       // dari frontend
        netto,         // nilai netto total (dipassing dari frontend)
        total_quantity // jumlah quantity sebelum retur (dibeli)
      } = item;

      // Validasi field item
      if (
        !id_header_pemesanan ||
        !no_pemesanan ||
        !kode_barang ||
        !gudang_asal ||
        !gudang_tujuan ||
        typeof qtyretur !== "number" ||
        !kode_toko ||
        !id_marketplace ||
        !id_toko ||
        netto === undefined ||
        netto === null ||
        total_quantity === undefined ||
        total_quantity === null
      ) {
        throw new Error(
          "Field item retur tidak lengkap/valid (id_header_pemesanan, no_pemesanan, kode_barang, gudang_asal, gudang_tujuan, qtyretur, kode_toko, id_marketplace, id_toko, netto, total_quantity)."
        );
      }

      const nettoValueFromFrontend = parseFloat(netto);
      if (isNaN(nettoValueFromFrontend) || nettoValueFromFrontend === 0) {
        throw new Error(
          `Nilai netto untuk kode_barang "${kode_barang}" dengan id_marketplace "${id_marketplace}" dan id_toko "${id_toko}" bernilai 0 atau tidak valid. Proses retur dihentikan.`
        );
      }

      const totalQty = parseFloat(total_quantity);
      if (isNaN(totalQty) || totalQty <= 0) {
        throw new Error(
          `Total quantity untuk kode_barang "${kode_barang}" pada no pemesanan "${no_pemesanan}" tidak valid.`
        );
      }

      // Hitung unitPrice sebagai nilai netto per unit
      const unitPrice = nettoValueFromFrontend / totalQty;
      // Total Payment dihitung sebagai selisih antara netto total dengan (unitPrice * qtyretur)
      const totalPayment = nettoValueFromFrontend - (unitPrice * qtyretur);

      // 7.b. Update stok / Insert stokretur sesuai dengan gudang_tujuan
      if (gudang_tujuan === 1) {
        // Update master_stokbarang + insert ke master_stokretur
        await db.query(`CALL procedure_insert_stokretur_stokbarang(?, ?, ?)`, {
          replacements: [kode_toko, kode_barang, qtyretur],
          type: QueryTypes.RAW,
          transaction,
        });
        await db.query(`CALL procedure_insert_stokretur(?, ?, ?, ?, ?)`, {
          replacements: [kode_toko, kode_barang, qtyretur, gudang_asal, gudang_tujuan],
          type: QueryTypes.RAW,
          transaction,
        });
      } else if (gudang_tujuan === 2) {
        // Insert ke master_stokretur (tanpa update stokbarang)
        await db.query(`CALL procedure_insert_stokretur(?, ?, ?, ?, ?)`, {
          replacements: [kode_toko, kode_barang, qtyretur, gudang_asal, gudang_tujuan],
          type: QueryTypes.RAW,
          transaction,
        });
      } else {
        throw new Error(`gudang_tujuan dengan id ${gudang_tujuan} tidak valid.`);
      }

      // 7.c. Insert detail_retur
      await db.query(`CALL InsertDetailRetur(?, ?, ?, ?, ?, ?, ?, ?)`, {
        replacements: [
          id_retur,
          id_header_pemesanan,
          no_pemesanan,
          kode_barang,
          gudang_asal,
          gudang_tujuan,
          qtyretur,
          createBy,
        ],
        type: QueryTypes.RAW,
        transaction,
      });

      // 7.d. Update status di header_pemesanan (misal 1 = 'Retur')
      await db.query(
        `UPDATE header_pemesanan SET status = ? WHERE id_header_pemesanan = ?`,
        {
          replacements: [1, id_header_pemesanan],
          type: QueryTypes.UPDATE,
          transaction,
        }
      );

      // 7.e. Kurangi nominal di history_transaksi
      // Ambil data history_transaksi berdasarkan no_pemesanan
      const matchedHistories = historyList.filter(
        (h) => h.no_pemesanan === no_pemesanan
      );
      if (matchedHistories.length === 0) {
        throw new Error(
          `History transaksi untuk No Pemesanan "${no_pemesanan}" tidak ditemukan.`
        );
      }
      // Ambil entry terbaru (urut descending berdasarkan id_h_transaksi)
      matchedHistories.sort((a, b) => b.id_h_transaksi - a.id_h_transaksi);
      const { id_h_transaksi, total: currentTotal } = matchedHistories[0];
      const newTotal = currentTotal - totalPayment;

      await db.query("CALL procedure_update_history_total_transaksi(?, ?)", {
        replacements: [id_h_transaksi, totalPayment],
        type: QueryTypes.RAW,
        transaction,
      });
    }

    // 8. Commit Transaksi
    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Retur penjualan berhasil disimpan.",
      kode_retur,
      id_retur,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error dalam insert retur penjualan:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan.",
    });
  }
});

module.exports = router;
