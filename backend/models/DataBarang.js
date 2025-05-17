// DataBarang.js

const { DataTypes } = require("sequelize");
const { db } = require("../connection/database");

const DataBarang = db.define(
  "DataBarang",
  {
    nama_barang: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jumlah: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    harga: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    no_pembeli: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    kode_pembelian: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tanggal_beli: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: true, // Tambahkan untuk mendukung createdAt dan updatedAt
  }
);


module.exports = DataBarang;
