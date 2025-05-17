const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();


router.post("/kartu/stok/all", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_laporan_kartu_stok_all()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

  router.post("/kartu/stok/besttroli", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_laporan_kartu_stokbesttroli()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.post("/kartu/stok/bigtroli", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_laporan_kartu_stokbigtroli()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;