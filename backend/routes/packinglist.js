// packinglist.js

const express = require("express");
const { db } = require("../connection/database");
const { QueryTypes } = require("sequelize");
const router = express.Router();

// Endpoint utama untuk menyimpan packing list
router.post("/cetak/packinglist/all", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_cetak_packing_all()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur bigtroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// Endpoint untuk mencetak packing list Besttroli
router.post("/cetak/packinglist/besttroli", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_cetak_packing_bestroli()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint utama untuk menyimpan packing list
router.post("/cetak/packinglist/bigtroli", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_cetak_packing_bigtroli()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur bigtroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint utama untuk menyimpan packing list
router.post("/", async (req, res) => {
  const transaction = await db.transaction();
  try {
    // Ambil data dari body
    let { id_header_pemesanan, kodePackinglist } = req.body;

    console.log("Received id_header_pemesanan:", id_header_pemesanan);
    console.log("Received kodePackinglist:", kodePackinglist);

    // Validasi input
    if (!Array.isArray(id_header_pemesanan)) {
      throw new Error("id_header_pemesanan harus berupa array.");
    }
    if (id_header_pemesanan.length === 0) {
      throw new Error("id_header_pemesanan tidak boleh kosong.");
    }
    if (!kodePackinglist || typeof kodePackinglist !== "string") {
      throw new Error("kodePackinglist harus berupa string dan tidak boleh kosong.");
    }

    // Cek apakah kodePackinglist sudah ada untuk menghindari duplikasi
    const [existingPackingList] = await db.query(
      `SELECT COUNT(*) AS count FROM header_packinglist WHERE kode_packinglist = ?`,
      {
        replacements: [kodePackinglist],
        transaction,
      }
    );

    // Jika sudah ada, generate kode baru secara otomatis
    if (existingPackingList[0].count > 0) {
      let newKode;
      let isUnique = false;
      while (!isUnique) {
        newKode = `${kodePackinglist}-${Date.now()}`;
        const [checkExisting] = await db.query(
          `SELECT COUNT(*) AS count FROM header_packinglist WHERE kode_packinglist = ?`,
          {
            replacements: [newKode],
            transaction,
          }
        );
        if (checkExisting[0].count === 0) {
          isUnique = true;
        }
      }
      kodePackinglist = newKode;
      console.log("Generated new unique kodePackinglist:", kodePackinglist);
    }

    // Ambil status dari id_header_pemesanan yang dikirim
    const [statusRows] = await db.query(
      `SELECT id_header_pemesanan, status FROM header_pemesanan WHERE id_header_pemesanan IN (?)`,
      {
        replacements: [id_header_pemesanan],
        transaction,
      }
    );

    // Filter hanya id dengan status = 0 (misalnya 'Menunggu')
    const validIds = statusRows
      .filter((row) => row.status === 0)
      .map((row) => row.id_header_pemesanan);

    if (validIds.length === 0) {
      throw new Error("Tidak ada id_header_pemesanan dengan status 'Menunggu'.");
    }

    // Insert ke tabel header_packinglist dengan satu kodePackinglist
    await db.query(
      `INSERT INTO header_packinglist (kode_packinglist, status, createAt)
       VALUES (?, 1, NOW())`,
      {
        replacements: [kodePackinglist],
        transaction,
      }
    );

    // Ambil id_packinglist yang baru diinsert
    const [[{ id_packinglist: idPackinglist }]] = await db.query(
      `SELECT LAST_INSERT_ID() AS id_packinglist`,
      { transaction }
    );

    console.log("Generated idPackinglist:", idPackinglist);

    if (!idPackinglist) {
      throw new Error("Gagal mendapatkan ID header_packinglist.");
    }

    // Insert ke tabel detail_packinglist untuk setiap valid id_header_pemesanan
    const detailPromises = validIds.map((id) =>
      db.query(
        `INSERT INTO detail_packinglist (id_packinglist, id_header_pemesanan)
         VALUES (?, ?)`,
        {
          replacements: [idPackinglist, id],
          transaction,
        }
      )
    );

    await Promise.all(detailPromises);

    // Update status di header_pemesanan menjadi 1 (misalnya 'Dicetak') untuk validIds
    await db.query(
      `UPDATE header_pemesanan SET status = 1 WHERE id_header_pemesanan IN (?)`,
      {
        replacements: [validIds],
        transaction,
      }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Packing list berhasil disimpan.",
      kodePackinglist,
      idPackinglist,
      processedIds: validIds,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error dalam insert packing list:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan.",
    });
  }
});

module.exports = router;
