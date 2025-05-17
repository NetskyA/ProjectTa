// routes/notapenjualan.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

// Endpoint POST untuk All toko Nota Penjualan
router.post("/notapenjualan/all", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_penjualan_all()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint POST untuk All toko Nota Penjualan
router.post("/detailnotapenjualan/all", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_detail_penjualan_master_all()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint POST untuk Besttroli
router.post("/notapenjualan/besttroli", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_penjualan_besttroli()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results);  // Mengirimkan hasil query langsung
    } catch (error) {
      console.error("Error saat memanggil prosedur Besttroli:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Endpoint POST untuk Detail Noata Jual Besttroli
router.post("/detailnotapenjualan/besttroli", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_detail_penjualan_besttroli()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint POST untuk Etrolly
router.post("/notapenjualan/etrolly", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_penjualan_etrolly()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/detailnotapenjualan/etrolly", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_detail_penjualan_etrolly()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
  
// Endpoint POST untuk Kiumart
router.post("/notapenjualan/kiumart", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_penjualan_kiumart()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/detailnotapenjualan/kiumart", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_detail_penjualan_kiumart()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint POST untuk Bigtroli
router.post("/notapenjualan/bigtroli", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_penjualan_bigtroli()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/detailnotapenjualan/bigtroli", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_detail_penjualan_bigtroli()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// Endpoint POST untuk Nettroli
router.post("/notapenjualan/nettroli", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_penjualan_nettroli()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/detailnotapenjualan/nettroli", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_detail_penjualan_nettroli()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Besttroli:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint POST untuk Besttroli
router.post("/notapenjualan/master", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_penjualan_master()", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json(results);  // Mengirimkan hasil query langsung
  } catch (error) {
    console.error("Error saat memanggil prosedur Master:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint POST untuk Detail Noata Jual Besttroli
router.post("/detailnotapenjualan/master", async (req, res) => {
try {
  let results = await db.query("CALL procedure_get_detail_penjualan_master()", {
    type: QueryTypes.SELECT,
  });
  res.status(200).json(results);  // Mengirimkan hasil query langsung
} catch (error) {
  console.error("Error saat memanggil prosedur Master:", error);
  res.status(500).json({ success: false, message: error.message });
}
});

module.exports = router;
