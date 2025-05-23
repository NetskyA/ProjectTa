//index.js

const express = require("express");
const dotenv = require("dotenv");
require("dotenv").config();
const cors = require("cors");
const { initDB } = require("./connection/database");

// Routes
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const uploadPelunasanRoutes = require("./routes/uploadpelunasan");
const dataBarangRoutes = require("./routes/databarang");
const notaPenjualanRoutes = require("./routes/notapenjualan");
const packinglistRoutes = require("./routes/packinglist");
const laporanPenjualanRoutes = require("./routes/laporanpenjualan");
const returNotaPenjualanRoutes = require("./routes/returnotapenjualan");

const role = require("./routes/role");
const aksesUser = require("./routes/masteraksesuser");
const dataMenu = require("./routes/mastermenu");
const toko = require("./routes/toko");
const masterUser = require("./routes/masteruser");
const stokBarang = require("./routes/masterstokbarang");
const stokBarangRetur = require("./routes/masterstokretur");
const dataBarang = require("./routes/masterdatabarang");
const dataHargaBarang = require("./routes/masterhargabarang");
const dataMarketplace = require("./routes/mastermarketplace");
const dataKategori = require("./routes/masterkategori");
const dataRole = require("./routes/masterrole");
const dataToko = require("./routes/mastertoko");
const dataDepo = require("./routes/masterdepo");
const dataSatuan = require("./routes/mastersatuan");
const dataSatuanKategori = require("./routes/mastersatuankategori");
const dataGudang = require("./routes/mastergudang");
const dataHistoryTransaksi = require("./routes/masterhistorytransaksi");
const dataAkun = require("./routes/masterakun");
const dataAkuntansi = require("./routes/masterakuntansi");
const dataLaporanKartuStok = require("./routes/laporankartustok");
const dataPelunasanPenjualan = require("./routes/pelunasanpenjualan");
const pembelianbarang = require("./routes/pembelianbarang");
const dataReturPembelian = require("./routes/returnotapembelian");

//penjualan ta
const datapembayaran = require("./routes/masterjenispembayaran");
const datajenistransaksi = require("./routes/masterjenistransaksi");
const datalokasi = require("./routes/masterlokasi");
const datapesananpembelian = require("./routes/masterpesananpembelian");
const datajenispesanan = require("./routes/masterjenispesanan");
const datakategoriproduk = require("./routes/masterkategoriproduk");
const dataadonanproudkt = require("./routes/masteradonanproduk");
const databahanbakuproduk = require("./routes/masterbahanbakuproduk");
const datasalesorder = require("./routes/mastersalesorder");
const datagabunganpermintaan = require("./routes/mastergabunganpermintaan");
const dataproduksiproduk = require("./routes/masterproduksiproduk");
const databuktipengeluaran = require("./routes/masterbuktipengeluaran");
const datahsitoryterpenuhi = require("./routes/masterhistoryterpenuhi");
const dataKategoriBahanBaku = require("./routes/masterkategoribahanbaku");
const dataNotaPenjualan = require("./routes/masternotapenjualan");
const app = express();
// app.use(express.json());
// app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(
  cors({
    origin: "http://localhost:5173",   // alamat Vite
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // credentials: true,                 // kalau nanti pakai cookie / auth header
  })
);
app.use(express.json({ limit: "50mb" }));          // ⇐ naikkan sesuai kebutuhan
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


// Penggunaan CORS (sesuaikan origin dengan alamat Frontend Anda)

// Routing
app.use("/", notaPenjualanRoutes);
app.use("/retur", returNotaPenjualanRoutes);
app.use("/data", masterUser);
app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);
app.use("/uploadpelunasan", uploadPelunasanRoutes);
app.use("/databarang", dataBarangRoutes);
app.use("/packinglist", packinglistRoutes);
app.use("/laporanpenjualan", laporanPenjualanRoutes);
app.use("/role", role);
app.use("/toko", toko);
app.use("/stokbarang", stokBarang);
app.use("/stokretur", stokBarangRetur);
app.use("/masterdatabarang", dataBarang);
app.use("/mastermarketplace", dataMarketplace);
app.use("/masterkategori", dataKategori);
app.use("/masterrole", dataRole);
app.use("/mastertoko", dataToko);
app.use("/masterdepo", dataDepo);
app.use("/mastergudang", dataGudang);
app.use("/mastersatuan", dataSatuan);
app.use("/mastersatuankategori", dataSatuanKategori);
app.use("/masterhistorytransaksi", dataHistoryTransaksi);
app.use("/pelunasanpenjualan", dataPelunasanPenjualan);
app.use("/pembelianbarang", pembelianbarang);
app.use("/masterakun", dataAkun);
app.use("/masterakuntansi", dataAkuntansi);
app.use("/masteraksesuser", aksesUser);
app.use("/mastermenu", dataMenu);
app.use("/masterhargabarang", dataHargaBarang);
app.use("/laporankartustok", dataLaporanKartuStok);
app.use("/returpembelian", dataReturPembelian);

//penjualan ta
app.use("/masterjenispembayaran", datapembayaran);
app.use("/masterjenistransaksi", datajenistransaksi);
app.use("/masterlokasi", datalokasi);
app.use("/masterpesananpembelian", datapesananpembelian);
app.use("/masterjenispesanan", datajenispesanan);
app.use("/masterkategoriproduk", datakategoriproduk);
app.use("/masteradonanproduk", dataadonanproudkt);
app.use("/masterbahanbakuproduk", databahanbakuproduk);
app.use("/mastersalesorder", datasalesorder);
app.use("/mastergabunganpermintaan", datagabunganpermintaan);
app.use("/masterproduksiproduk", dataproduksiproduk);
app.use("/masterbuktipengeluaran", databuktipengeluaran);
app.use("/masterhistoryterpenuhi", datahsitoryterpenuhi);
app.use("/masterkategoribahanbaku", dataKategoriBahanBaku);
app.use("/masternotapenjualan", dataNotaPenjualan);
const startServer = async () => {
  try {
    await initDB();
    console.log("Database synced!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
