// routes/salesorder.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();


router.post("/master/kategori/bahan/baku", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_master_kategori_bahan_baku()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });


module.exports = router;
