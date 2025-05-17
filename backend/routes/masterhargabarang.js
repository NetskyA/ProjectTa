const express = require("express");
const { QueryTypes } = require("sequelize");
const { db } = require("../connection/database");
const router = express.Router();

router.post("/harddeletemasterhargabarang", async (req, res) => {
  const t = await db.transaction();
  try {
    const { id_master_hargabarang, id_toko, id_marketplace, kode_barang } = req.body;

    const results = await db.query(
      "CALL procedure_hard_delete_master_hargabarang(:p_id_master_hargabarang, :p_id_toko, :p_id_marketplace, :p_kode_barang)",
      {
        replacements: {
          p_id_master_hargabarang: id_master_hargabarang,
          p_id_toko: id_toko,
          p_id_marketplace: id_marketplace,
          p_kode_barang: kode_barang,
        },
        type: QueryTypes.RAW,
        transaction: t,
      }
    );

    await t.commit();
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    await t.rollback();
    console.error("Error saat memanggil procedure_hard_delete_master_hargabarang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
