//routes/masteruser.js

const express = require("express");
const { db } = require("../connection/database");
const { QueryTypes } = require("sequelize"); // Pastikan untuk mengimpor QueryTypes
const router = express.Router();

router.post("/listdatahistorytransaksi", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_history_transaksi()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

module.exports = router;
