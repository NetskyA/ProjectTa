//routes/masteruser.js

const express = require('express');
const router = express.Router();
const { db } = require('../connection/database'); // Pastikan ini koneksi ke DB
const { QueryTypes } = require('sequelize');      // Jika menggunakan Sequelize
const crypto = require('crypto'); // Untuk SHA256 hashing

// GET Master User
router.post("/getmasteruser", async (req, res) => {
  try {
    let results = await db.query("CALL procedure_get_master_user()");
    res.status(200).json(results);
  } catch (error) {
    console.error("Error saat memanggil procedure_get_master_user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/pelanggan/external", async (req, res) => {
    try {
      let results = await db.query("CALL procedure_get_master_pelanggan_external()", {
        type: QueryTypes.SELECT,
      });
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error saat memanggil prosedur getdatabarang:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

// DELETE (Soft Delete) Master User

router.post("/deletemasteruser", async (req, res) => {
  try {
    const { id_user } = req.body;
    if (!id_user) {
      return res.status(400).json({
        success: false,
        message: "id_user tidak ditemukan di body.",
      });
    }

    // Panggil prosedur dengan replacements
    let results = await db.query("CALL procedure_delete_master_user(?)", {
      replacements: [id_user],
      type: QueryTypes.RAW,
    });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error saat memanggil procedure_delete_master_user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// INSERT (Create) Master User dan Hak Akses
router.post('/insertmasteruser', async (req, res) => {
  const transaction = await db.transaction();
  try {
    const {
      kode_role,   // Field ini digunakan sebagai p_id_role dalam prosedur
      kode_toko,
      nama_user,
      password,    // Password mentah, tanpa hash (prosedur akan meng-hash-nya)
      no_hp,
      alamat,
      id_menu,     // Array of id_menu (hak akses)
    } = req.body;

    // Validasi input
    if (!kode_role || !kode_toko || !nama_user || !password || !no_hp || !alamat) {
      return res.status(400).json({
        success: false,
        message:
          'Semua field (kode_role, kode_toko, nama_user, password, no_hp, alamat) diperlukan.',
      });
    }

    // Default status = 0
    const status = 0;

    console.log('Data akan di-insert ke master_user:', {
      kode_role,
      kode_toko,
      nama_user,
      password,  // Password dikirim mentah ke MySQL; prosedur akan meng-hash-nya
      no_hp,
      alamat,
      status,
    });

    // Panggil prosedur tersimpan untuk insert master_user.
    // Prosedur procedure_insert_master_user harus mengembalikan id_user melalui SELECT LAST_INSERT_ID() AS id_user;
    const results = await db.query(
      'CALL procedure_insert_master_user(?, ?, ?, ?, ?, ?, ?)',
      {
        replacements: [
          kode_role,    // p_id_role
          kode_toko,    // p_kode_toko
          nama_user,    // p_nama_user
          password,     // p_password, akan di-hash di dalam prosedur
          no_hp,        // p_no_hp
          alamat,       // p_alamat
          status,       // p_status
        ],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    // Pastikan prosedur mengembalikan id_user, misalnya: results[0].id_user
    // Tergantung struktur hasil query, kita ambil dari results[0]
    const id_user = results[0].id_user;
    console.log('id_user yang didapat dari procedure_insert_master_user:', id_user);

    // Jika kombinasi kode_role dan kode_toko bukan (1, TK0000)
    // dan terdapat hak akses (id_menu) yang dipilih, lakukan insert ke master_akses_user
    if (!(kode_role === "1" && kode_toko === "TK0000") &&
        Array.isArray(id_menu) && id_menu.length > 0) {
      for (const menuId of id_menu) {
        await db.query(
          'CALL procedure_insert_master_akses_user(?, ?)',
          {
            replacements: [
              id_user,  // p_id_user
              menuId,   // p_id_menu
            ],
            type: QueryTypes.RAW,
            transaction,
          }
        );
      }
    }

    await transaction.commit();
    console.log('Transaksi insert master user dan hak akses berhasil.');

    return res.status(200).json({
      success: true,
      message: 'Master User berhasil ditambahkan.',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error saat insert Master User:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal menyisipkan Master User.',
    });
  }
});


router.post('/updatemasteruser', async (req, res) => {
  const transaction = await db.transaction();
  try {
    const {
      id_user,
      kode_role,  // ex: "0" atau "1"
      kode_toko,
      nama_user,
      no_hp,
      alamat,
      password,
      status,
      id_menu,    // Array hak akses, misalnya [1,2,3,...] atau bisa null
    } = req.body;

    // Validasi required fields
    if (
      !id_user ||
      kode_role === undefined ||
      !kode_toko ||
      !nama_user ||
      !no_hp ||
      !alamat
    ) {
      return res.status(400).json({
        success: false,
        message: 'Semua field diperlukan!',
      });
    }

    // Convert kode_role dan status ke integer
    const id_role = parseInt(kode_role);
    const user_status = parseInt(status);

    // Validate status value
    if (![0, 1].includes(user_status)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus 0 (Aktif) atau 1 (Non-Aktif).',
      });
    }

    // Jika frontend tidak mengirim password (kosong) maka kirim null
    const passwordToSend = (password && password.trim() !== '') ? password : null;

    // Update data user melalui prosedur tersimpan
    await db.query(
      'CALL procedure_update_master_user(?, ?, ?, ?, ?, ?, ?, ?)',
      {
        replacements: [
          id_user,         // p_id_user
          id_role,         // p_id_role
          kode_toko,       // p_kode_toko
          nama_user,       // p_nama_user
          no_hp,           // p_no_hp
          alamat,          // p_alamat
          passwordToSend,  // p_password
          user_status,     // p_status
        ],
        type: QueryTypes.RAW,
        transaction,
      }
    );

    // Jika kombinasi kode_role dan kode_toko bukan (1, TK0000),
    // lakukan sinkronisasi hak akses
    if (!(kode_role === "1" && kode_toko === "TK0000")) {
      // Hapus semua hak akses lama untuk user ini
      await db.query(
        'DELETE FROM master_akses_user WHERE id_user = ?',
        {
          replacements: [id_user],
          type: QueryTypes.RAW,
          transaction,
        }
      );

      // Pastikan id_menu adalah array; jika bukan, set ke array kosong
      const menuArray = Array.isArray(id_menu) ? id_menu : [];
      // Lakukan filter untuk menghilangkan nilai null
      const filteredMenus = menuArray.filter((menuId) => menuId !== null);
      if (filteredMenus.length > 0) {
        for (const menuId of filteredMenus) {
          await db.query(
            'CALL procedure_update_master_akses_user(?, ?)',
            {
              replacements: [
                id_user, // p_id_user
                menuId,  // p_id_menu
              ],
              type: QueryTypes.RAW,
              transaction,
            }
          );
        }
      }
    }
    // Jika kombinasi adalah (1, TK0000), maka tidak dilakukan sinkronisasi hak akses

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: 'Master User berhasil diperbarui!',
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Error update master user', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui Master User.',
    });
  }
});


let localCounter = 1;
async function generateKodePelanggan(trx) {
  while (true) {
    const code = `PL${String(localCounter++).padStart(4, "0")}`;
    const [dupe] = await db.query(
      `SELECT 1 FROM master_pelanggan_external WHERE kode_pelanggan_external = ? LIMIT 1`,
      {
        replacements: [code],
        type: QueryTypes.SELECT,
        transaction: trx,
      }
    );
    if (!dupe) return code;
  }
}

// Endpoint insert master pelanggan external
router.post("/insert/master/pelangganexternal", async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id_user, nama_pelanggan, alamat } = req.body || {};

    // Validasi input
if (!id_user || !nama_pelanggan || !alamat) {
  await trx.rollback();
  return res.status(400).json({
    success: false,
    message: "Payload tidak lengkap. Harap isi nama, alamat, dan user.",
  });
}


const kode_pelanggan = await generateKodePelanggan(trx);
const nama_pelanggan_upper = nama_pelanggan.toUpperCase();
const alamat_upper = alamat.toUpperCase();
    // Simpan pelanggan ke DB
const [insertResult] = await db.query(
  `INSERT INTO master_pelanggan_external (
    kode_pelanggan_external, nama_pelanggan_external, alamat, createby, createat, status
  ) VALUES (?, ?, ?, ?, NOW(), 0)`,
  {
    replacements: [kode_pelanggan, nama_pelanggan_upper, alamat_upper, id_user],
    type: QueryTypes.INSERT,
    transaction: trx,
  }
);

    await trx.commit();
    return res.status(201).json({
      success: true,
      message: "Pelanggan external berhasil disimpan.",
      id_pelanggan: insertResult,
      kode_pelanggan,
    });
  } catch (err) {
    await trx.rollback();
    console.error("❌ Error insert pelanggan external:", err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error.",
    });
  }
});

router.post("/update/master/pelangganexternal", async (req, res) => {
  let transaction;
  try {
    const {
      id_master_pelanggan_external,
      nama_pelanggan,
      alamat,
    } = req.body;

    // Validasi input
    if (
      !id_master_pelanggan_external ||
      !nama_pelanggan ||
      !alamat
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi.",
      });
    }

    // Ubah ke huruf kapital
    const nama_pelanggan_upper = nama_pelanggan.toUpperCase();
    const alamat_upper = alamat.toUpperCase();

    // Mulai transaksi
    transaction = await db.transaction();

    // Panggil prosedur update
    await db.query(
      `CALL procedure_update_master_pelanggan_external(
        :p_id_master_pelanggan_external,
        :p_nama_pelanggan_external,
        :p_alamat
      );`,
      {
        replacements: {
          p_id_master_pelanggan_external: id_master_pelanggan_external,
          p_nama_pelanggan_external: nama_pelanggan_upper,
          p_alamat: alamat_upper,
        },
        type: QueryTypes.RAW,
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Data pelanggan berhasil diperbarui.",
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error update pelanggan external:", err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Terjadi kesalahan saat update.",
    });
  }
});

router.post("/delete/master/pelangganexternal", async (req, res) => {
  try {
    const { id_master_pelanggan_external } = req.body;

    if (!id_master_pelanggan_external || isNaN(id_master_pelanggan_external)) {
      return res.status(400).json({
        success: false,
        message: "ID pelanggan tidak valid.",
      });
    }

    console.log("Menjalankan prosedur untuk ID pelanggan:", id_master_pelanggan_external);

    await db.query("CALL procedure_update_status_master_pelanggan_external(:p_id_master_pelanggan_external)", {
      replacements: {
        p_id_master_pelanggan_external: Number(id_master_pelanggan_external),
      },
      type: QueryTypes.RAW,
    });

    return res.status(200).json({
      success: true,
      message: `Pelanggan dengan ID ${id_master_pelanggan_external} berhasil dinonaktifkan.`,
    });
  } catch (error) {
    console.error("❌ Gagal menonaktifkan pelanggan:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan server.",
    });
  }
});


module.exports = router;
