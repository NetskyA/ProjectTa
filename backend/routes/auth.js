// routes/auth.js

const express = require("express");
const router = express.Router();
const { db } = require("../connection/database");
const jwt = require("jsonwebtoken");

// Pastikan Anda memiliki dotenv atau cara lain untuk mengelola environment variables
require('dotenv').config();

router.post("/login", async (req, res) => {
  try {
    const { nama_user, password } = req.body;

    if (!nama_user || !password) {
      return res.status(400).json({
        message: "Nama user dan password harus diisi.",
      });
    }

    // Jalankan prosedur `procedure_login_user` menggunakan raw query
    const [results] = await db.query(
      `CALL procedure_login_user(:nama_user, :password)`,
      {
        replacements: {
          nama_user: nama_user,
          password: password,
        },
        type: db.QueryTypes.RAW,
      }
    );

    // Logging hasil dari prosedur untuk debugging
    // console.log(
    //   "Hasil dari procedure_login_user:",
    //   JSON.stringify(results, null, 2)
    // );

    let row;

    if (Array.isArray(results)) {
      if (results.length > 0) {
        row = results[0][0]; // Karena hasil CALL prosedur biasanya nested array
      }
    } else if (typeof results === "object" && results !== null) {
      row = results;
    }

    if (row) {
      // Cek apakah login berhasil berdasarkan keberadaan id_role, id_user, dan nama_user
      if (
        row.id_role !== undefined &&
        row.id_role !== null &&
        row.id_user !== undefined &&
        row.id_user !== null &&
        row.nama_user !== undefined &&
        row.nama_user !== null
      ) {
        // Login berhasil, buat JWT token
        const token = jwt.sign(
          {
            nama_user: row.nama_user,
            role: row.id_role,
            kode_toko: row.kode_toko,
            id_toko: row.id_toko,
            id_user: row.id_user,
          },
          process.env.JWT_SECRET, // Pastikan Anda memiliki JWT_SECRET di environment variables
          { expiresIn: process.env.JWT_EXPIRATION || "1h" }
        );

        return res.json({
          message: row.message,
          token,
          user: {
            nama_user: row.nama_user,
            id_role: row.id_role,
            kode_toko: row.kode_toko,
            id_toko: row.id_toko,
            id_user: row.id_user,
          },
        });
      } else {
        // Login gagal
        return res.status(401).json({
          message: row.message || "Login gagal.",
        });
      }
    } else {
      // Jika result tidak sesuai ekspektasi
      return res.status(500).json({
        message: "Tidak dapat memproses hasil login.",
      });
    }
  } catch (error) {
    console.error("Error login:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server.",
      error: error.message,
    });
  }
});

module.exports = router;
