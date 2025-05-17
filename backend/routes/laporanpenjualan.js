// routes/laporanpenjualan.js

const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

  // Endpoint POST untukk master
  router.post("/toko/master", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_master_penjualan()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results); // Mengirimkan hasil query langsung
    } catch (error) {
      console.error("Error saat memanggil prosedur Etrolly:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  router.post("/toko/master/penjualan/progres", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_progres_pembelian()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results); // Mengirimkan hasil query langsung
    } catch (error) {
      console.error("Error saat memanggil prosedur Etrolly:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });


  // Endpoint POST untukk 
  router.post("/toko/master/all", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_penjualan_produk()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results); // Mengirimkan hasil query langsung
    } catch (error) {
      console.error("Error saat memanggil prosedur Etrolly:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post("/toko/master/penjualan/detailed", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_all_penjualan_detailed()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results); // Mengirimkan hasil query langsung
    } catch (error) {
      console.error("Error saat memanggil prosedur Etrolly:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post("/toko/master/penjualan/analisa/detailed", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_analisa_detail_penjualan()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results); // Mengirimkan hasil query langsung
    } catch (error) {
      console.error("Error saat memanggil prosedur Etrolly:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });


      
module.exports = router;

