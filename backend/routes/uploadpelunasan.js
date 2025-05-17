// routes/uploadpelunasan.js
const express = require("express");
const { db } = require("../connection/database");
const { QueryTypes } = require("sequelize");
const router = express.Router();

// Utility function: Flatten hasil CALL procedure (sama seperti acuan)
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

// Endpoint untuk mendapatkan data history transaksi
router.post("/listdatahistorytransaksi/upload", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_history_transaksi()", {
      type: QueryTypes.SELECT,
    });
    const masterDataList = flattenProcedureResult(results);
    return res.status(200).json(masterDataList);
  } catch (error) {
    console.error("Error saat memanggil history transaksi:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Variabel global untuk kode pelunasan (counter)
let pelunasanCodeSuffix = 1; // Mulai dari 1

// Fungsi untuk generate kode pelunasan dengan format PP-YYMMDDNNNN
async function generateKodePelunasan(id_toko, transaction) {
  let kodePelunasan;
  let isUnique = false;
  while (!isUnique) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const counterStr = String(pelunasanCodeSuffix).padStart(4, "0");
    kodePelunasan = `NP-${year}${month}${day}${counterStr}`;

    // Cek apakah kodePelunasan sudah ada di tabel master_pelunasan
    const checkQuery = "SELECT COUNT(*) AS count FROM master_pelunasan WHERE kode_pelunasan = ?";
    const [checkResult] = await db.query(checkQuery, {
      replacements: [kodePelunasan],
      type: QueryTypes.SELECT,
      transaction,
    });

    if (parseInt(checkResult.count, 10) === 0) {
      isUnique = true;
    } else {
      pelunasanCodeSuffix++;
    }
  }
  return kodePelunasan;
}

// Endpoint untuk proses upload pelunasan
router.post("/pelunasan", async (req, res) => {
  const transaction = await db.transaction();
  try {
    // Data yang dikirim dari frontend
    // headerData: array of objek, masing-masing objek memiliki properti:
    // no_pemesanan, bank, biaya_admin, biaya_ongkir, biaya_affiliate, trade_promo, lain_lain
    const { 
      platform, 
      id_user, 
      id_toko, 
      id_marketplace, 
      headerData
    } = req.body;
    if (
      !platform ||
      !id_user ||
      !id_toko ||
      !id_marketplace ||
      !headerData ||
      !Array.isArray(headerData) ||
      headerData.length === 0
    ) {
      throw new Error("Data request tidak valid. Pastikan platform, id_user, id_toko, id_marketplace, dan headerData terisi.");
    }

    // Ambil data history transaksi dari prosedur
    const historyRes = await db.query("CALL procedure_get_history_transaksi()", {
      type: QueryTypes.SELECT,
      // transaction, // Tambahkan transaction jika diperlukan
    });
    const historyList = flattenProcedureResult(historyRes);

    // Ubah historyList menjadi map: key = no_pemesanan, value = array of history transaksi
    const historyMap = new Map();
    historyList.forEach(item => {
      const order = String(item.no_pemesanan).trim();
      if (historyMap.has(order)) {
        historyMap.get(order).push(item);
      } else {
        historyMap.set(order, [item]);
      }
    });

    // Grouping data dari headerData (data flat) berdasarkan no_pemesanan
    // dan menghitung breakdown serta totalPayment per no_pemesanan
    const groupedPayments = new Map();
    headerData.forEach(row => {
      const noPemesanan = String(row.no_pemesanan).trim();
      const bank = parseFloat(row.bank) || 0;
      const biayaAdmin = parseFloat(row.biaya_admin) || 0;
      const biayaOngkir = parseFloat(row.biaya_ongkir) || 0;
      const biayaAffiliate = parseFloat(row.biaya_affiliate) || 0;
      const tradePromo = parseFloat(row.trade_promo) || 0;
      const lainLain = parseFloat(row.lain_lain) || 0;
      const totalPayment = bank + biayaAdmin + biayaOngkir + biayaAffiliate + tradePromo + lainLain;

      if (groupedPayments.has(noPemesanan)) {
        let current = groupedPayments.get(noPemesanan);
        current.bank += bank;
        current.biayaAdmin += biayaAdmin;
        current.biayaOngkir += biayaOngkir;
        current.biayaAffiliate += biayaAffiliate;
        current.tradePromo += tradePromo;
        current.lainLain += lainLain;
        current.totalPayment += totalPayment;
        groupedPayments.set(noPemesanan, current);
      } else {
        groupedPayments.set(noPemesanan, { bank, biayaAdmin, biayaOngkir, biayaAffiliate, tradePromo, lainLain, totalPayment });
      }
    });

    // Proses setiap group (berdasarkan no_pemesanan)
    for (const [noPemesanan, aggregates] of groupedPayments.entries()) {
      let matchingHistory = historyMap.get(noPemesanan);
      if (!matchingHistory || matchingHistory.length === 0) {
        throw new Error(`No Pemesanan ${noPemesanan} tidak ditemukan di history transaksi.`);
      }
      // Buat kode pelunasan khusus untuk no_pemesanan ini
      const kodePelunasan = await generateKodePelunasan(id_toko, transaction);
      // Insert ke master pelunasan dengan parameter breakdown dan totalPayment
      await db.query(
        "CALL procedure_insert_master_pelunasan(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        {
          replacements: [
            kodePelunasan,
            noPemesanan,
            aggregates.bank,
            aggregates.biayaAdmin,
            aggregates.biayaOngkir,
            aggregates.biayaAffiliate,
            aggregates.tradePromo,
            aggregates.lainLain,
            aggregates.totalPayment,
            id_toko,
            id_marketplace,
            id_user
          ],
          transaction,
        }
      );
      // Update setiap record history_transaksi untuk no_pemesanan tersebut dengan nilai totalPayment
      for (const historyItem of matchingHistory) {
        await db.query("CALL procedure_update_history_transaksi(?, ?)", {
          replacements: [historyItem.id_h_transaksi, aggregates.totalPayment],
          transaction,
        });
      }
    }

    await transaction.commit();
    return res.status(200).json({ message: "Pelunasan berhasil diproses." });
  } catch (error) {
    await transaction.rollback();
    console.error("Error pada endpoint /pelunasan:", error);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
