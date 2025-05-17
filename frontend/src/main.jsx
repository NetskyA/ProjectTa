// src/main.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import store from "./assets/store/index.js"; // Pastikan path ini benar
import "./index.css";
import ProtectedRoute from "./assets/page/component/ProtectedRoute.jsx";
import ErrorPage from "./assets/page/component/Error.jsx"; // Pastikan path import benar

// Halaman Login dan Dashboard Berdasarkan Role
import LoginPage from "./assets/page/login-all/Login.jsx";

// Halaman dan Menu Master Admin
import DashboardAdminMaster from "./assets/page/Master/dashboard-page/DashboardAdmin-Master.jsx";
import MenuLaporanMaster from "./assets/page/Master/menu-page/penjualan/MenuLaporan-Master.jsx";
import MenuImportMaster from "./assets/page/Master/menu-page/penjualan/MenuImport-Master.jsx";
import MenuImportPelunasanMaster from "./assets/page/Master/menu-page/pelunasan/MenuImportPelunasan-Master.jsx";
import MenuMasterUser from "./assets/page/Master/menu-page/master/insert-master-user/MenuMasterUser-Master.jsx";
// import MenuNotaPenjualanMaster from "./assets/page/Master/menu-page/penjualan/MenuNotaPenjualan-Master.jsx";
import MenuDetailNotaPenjualanMaster from "./assets/page/Master/menu-page/penjualan/MenuDetailNotaPenjualan-Master.jsx";
import MenuDetailNotaPenjualanPackingListMaster from "./assets/page/Master/menu-page/penjualan/MenuDetailNotaPenjualanPacking-Master.jsx";
import MenuNotaPenjualanCetakPackingMaster from "./assets/page/Master/menu-page/penjualan/MenuDetailNotaPenjualanCetakPacking-Master.jsx";
import MenuNotaPenjualanByNotaJualMaster from "./assets/page/Master/menu-page/penjualan/MenuDetailNotaPenjualanByNotaJual-Master.jsx";
import MenuLaporanPenjualanMaster from "./assets/page/Master/menu-page/laporan/laporan-penjualan/MenuLaporanPenjualan-Master.jsx";
import MenuLaporanDetailPenjualanAdminMaster from "./assets/page/Master/menu-page/laporan/laporan-penjualan/MenuLaporanDetailPenjualan-Master.jsx";

import MenuInsertMasterUser from "./assets/page/Master/menu-page/master/insert-master-user/MenuInsertMasterUser-Master.jsx";
import MenuLaporanMasterUser from "./assets/page/Master/menu-page/laporan/laporan-master-user/MenuLaporanMasterUser-Master.jsx";
import MenuUpdateMasterUser from "./assets/page/Master/menu-page/master/insert-master-user/MenuUpdateMasterUser-Master.jsx";
import MenuMasterDataBarang from "./assets/page/Master/menu-page/master/insert-master-databarang/MenuMasterDataBarang-Master.jsx";
import MenuInsertMasterDataBarang from "./assets/page/Master/menu-page/master/insert-master-databarang/MenuInsertMasterDataBarang-Master.jsx";
import MenuUpdateMasterDataBarang from "./assets/page/Master/menu-page/master/insert-master-databarang/MenuUpdateMasterDataBarang-Master.jsx";
import MenuMasterAkun from "./assets/page/Master/menu-page/master/insert-master_akun/MenuMasterAkun-Master.jsx";
import MenuInsertMasterAkun from "./assets/page/Master/menu-page/master/insert-master_akun/MenuInsertMasterAkun-Master.jsx";
import MenuUpdateMasterAkun from "./assets/page/Master/menu-page/master/insert-master_akun/MenuUpdateMasterAkun-Master.jsx"; 
import MenuMasterAkuntansi from "./assets/page/Master/menu-page/master/insert-master-akuntansi/MenuMasterAkuntansi-Master.jsx";
import MenuInsertMasterAkuntansi from "./assets/page/Master/menu-page/master/insert-master-akuntansi/MenuInsertMasterAkuntansi-Master.jsx";
import MenuUpdateMasterAkuntansi from "./assets/page/Master/menu-page/master/insert-master-akuntansi/MenuUpdateMasterAkuntansi-Master.jsx"; 
import MenuLaporanStokBarangMaster from "./assets/page/Master/menu-page/laporan/laporan-stokbarang/MenuLaporanStokBarang-Master.jsx";
import MenuLaporanMasterDataBarang from "./assets/page/Master/menu-page/laporan/laporan-master-databarang/MenuLaporanMasterDataBarang-Master.jsx";
import MenuLaporanDetailUpdateDataBarang from "./assets/page/Master/menu-page/laporan/laporan-master-databarang/MenuLaporanUpdateMasterDataBarang-Master.jsx";
import MenuLaporanMasterMarketPlace from "./assets/page/Master/menu-page/laporan/laporan-marketplace/MenuLaporanMasterMarketPlace-Master.jsx";
import MenuLaporanMasterKategori from "./assets/page/Master/menu-page/laporan/laporan-kategori/MenuLaporanMasterKategori-Master.jsx";
import MenuLaporanMasterRole from "./assets/page/Master/menu-page/laporan/laporan-master-role/MenuLaporanMasterRole-Master.jsx";
import MenuLaporanMasterToko from "./assets/page/Master/menu-page/laporan/laporan-master-toko/MenuLaporanMasterToko-Master.jsx";
import MenuLaporanMasterDepo from "./assets/page/Master/menu-page/laporan/laporan-master-depo/MenuLaporanMasterDepo-Master.jsx";
import MenuLaporanMasterSatuan from "./assets/page/Master/menu-page/laporan/laporan-master-satuan/MenuLaporanSatuan-Master.jsx";
import MenuLaporanKartuStokBarangMaster from "./assets/page//Master/menu-page/laporan/laporan-kartu-stok/MenuLaporanKartuStokBarang-Master.jsx";
import MenuLaporanMasterPelanggan from "./assets/page/Master/menu-page/laporan/laporan-pelanggan/MenuLaporanMasterPelanggan-Master.jsx";
import MenuLaporanMasterAdonan from "./assets/page/Master/menu-page/laporan/laporan-master-adonan/MenulaporanMasterKategoriAdonan-Master.jsx";
import ManuLaporanDetailMasterAdonan from "./assets/page/Master/menu-page/laporan/laporan-master-adonan/MenuLaporanUpdateMasterKategori-Master.jsx";
import MenuPelunasanKeuanganPiutangMaster from "./assets/page/Master/menu-page/keuangan/keuangan-piutang/MenuPelunasanKeuanganPiutang-Master.jsx";
import MenuInsertPelunasanKeuanganHutangMaster from "./assets/page/Master/menu-page/keuangan/keuangan-piutang/MenuAddPelunasanKeuanganPiutang-Master.jsx";
import MenuMasterStokBarangMaster from "./assets/page/Master/menu-page/master/insert-master-stok/MenuMasterStokBarang-Master.jsx";
import MenuInsertMasterStokBarangMaster from "./assets/page/Master/menu-page/master/insert-master-stok/MenuInsertMasterStokBarang-Master.jsx";
import MenuUpdateMasterStokBarangMaster from "./assets/page/Master/menu-page/master/insert-master-stok/MenuUpdateMasterStokBarang-Master.jsx";
import MenuMasterDepo from "./assets/page/Master/menu-page/master/insert-master-supplier/MenuMasterSupplier-Master.jsx";
import MenuInsertMasterDepo from "./assets/page/Master/menu-page/master/insert-master-supplier/MenuInsertMasterSupplier-Master.jsx";
import MenuUpdateMasterDepo from "./assets/page/Master/menu-page/master/insert-master-supplier/MenuUpdateMasterSupplier-Master.jsx";
import MenuMasterGudang from "./assets/page/Master/menu-page/master/insert-master-gudang/MenuMasterGudang-Master.jsx";
import MenuInsertMasterGudang from "./assets/page/Master/menu-page/master/insert-master-gudang/MenuInsertMasterGudang-Master.jsx";
import MenuUpdateMasterGudang from "./assets/page/Master/menu-page/master/insert-master-gudang/MenuUpdateMasterGudang-Master.jsx";
import MenuMasterKategori from "./assets/page/Master/menu-page/master/insert-master-kategori/MenuMasterKategori-Master.jsx";
import MenuInsertMasterKategori from "./assets/page/Master/menu-page/master/insert-master-kategori/MenuInsertMasterKategori-Master.jsx";
import MenuUpdateMasterKategori from "./assets/page/Master/menu-page/master/insert-master-kategori/MenuUpdateMasterKategori-Master.jsx";
import MenuMasterMarkteplace from "./assets/page/Master/menu-page/master/insert-master-marketplace/MenuMasterMarketplace-Master.jsx";
import MenuInsertMasterMarketplace from "./assets/page/Master/menu-page/master/insert-master-marketplace/MenuInsertMasterMarketplace-Master.jsx";
import MenuUpdateMasterMarketplace from "./assets/page/Master/menu-page/master/insert-master-marketplace/MenuUpdateMasterMarketplace-Master.jsx";
import MenuMasterRole from "./assets/page/Master/menu-page/master/insert-master-role/MenuMasterRole-Master.jsx";
import MenuInsertMasterRole from "./assets/page/Master/menu-page/master/insert-master-role/MenuInsertMasterRole-Master.jsx";
import MenuUpdateMasterRole from "./assets/page/Master/menu-page/master/insert-master-role/MenuUpdateMasterRole-Master.jsx";
import MenuMasterSatuan from "./assets/page/Master/menu-page/master/insert-master-satuan/MenuMasterSatuan-Master.jsx";
import MenuInsertMasterSatuan from "./assets/page/Master/menu-page/master/insert-master-satuan/MenuInsertMasterSatuan-Master.jsx";
import MenuUpdateMasterSatuan from "./assets/page/Master/menu-page/master/insert-master-satuan/MenuUpdateMasterSatuan-Master.jsx";
import MenuReturAddNotaPenjualanMaster from "./assets/page/Master/menu-page/penjualan/MenuReturAddNotaPenjualan-Master.jsx";
import MenuReturDetailNotaPenjualanMaster from "./assets/page/Master/menu-page/penjualan/MenuReturNotaPenjualan-Master.jsx";
import MenuDetailReturDetailNotaPenjualanMaster from "./assets/page/Master/menu-page/penjualan/MenuReturByDetailNotaPenjualan-Master.jsx";
import MenuTransaksiPelunasanMaster from "./assets/page/Master/menu-page/pelunasan/MenuTransaksiPelunasan-Master.jsx"; 
import MenuReturDetailNotaPembelianMaster from "./assets/page/Master/menu-page/pembelian/retur-pembelian/MenuReturNotaPembelian-Master.jsx";
import MenuInsertReturDetailNotaPembelianMaster from "./assets/page/Master/menu-page/pembelian/retur-pembelian/MenuReturAddNotaPembelian-Master.jsx";
import MenuDetailReturDetailNotaPembelianMaster from "./assets/page/Master/menu-page/pembelian/retur-pembelian/MenuReturByDetailNotaPembelian-Master.jsx";

import MenuNotaPembelianBarangMaster from "./assets/page/Master/menu-page/pembelian/pembelian-barang/MenuNotaPembelian-Master.jsx";
import MenuNotaDetailPembelianBarangMaster from "./assets/page/Master/menu-page/pembelian/pembelian-barang/MenuDetailNotaPembelianByNotaJual-Master.jsx";
import MenuPembelianBarangAdminMaster from "./assets/page/Master/menu-page/pembelian/pembelian-barang/MenuAddPembelianBarang-Master.jsx";

//sales order
import MenuNotaSaleOrderMaster from "./assets/page/Master/menu-page/salesorder/MenuNotaSalesOrder-Master.jsx";
import MenuDetailNotaSalesOrderMaster from "./assets/page/Master/menu-page/salesorder/MenuDetailNotaSalesOrder-master.jsx";

//gabungan
import MenuGabunganPermintaanMaster from "./assets/page/Master/menu-page/gabunganpermintaan/MenuGabunganPermintaan-Master.jsx";
import MenuDetailGabunganPermintaanMaster from "./assets/page/Master/menu-page/gabunganpermintaan/MenuDetailGabunganPermintaan-Master.jsx";
import MenuAddGabunganPermintaanMaster from "./assets/page/Master/menu-page/gabunganpermintaan/MenuAddGabunganPermintaan-Master.jsx";

//produksi
import MenuProduksiPordukMaster from "./assets/page/Master/menu-page/produksiproduk/MenuProduksiProduk-Master.jsx";
import MenuAddProduksiProdukMaster from "./assets/page/Master/menu-page/produksiproduk/MenuAddProduksiProduk-Master.jsx";
import MenuDetailProduksiProdukMaster from "./assets/page/Master/menu-page/produksiproduk/MenuDetailProduksiProduk-Master.jsx";

// bukti pengeluaran
import MenuBuktiPengeluaranMaster from "./assets/page/Master/menu-page/buktipengeluaran/MenuBuktiPengeluaran-Master.jsx";
import MenuAddBuktiPengeluaranMaster from "./assets/page/Master/menu-page/buktipengeluaran/MenuDetailBuktiPengeluaran-Master.jsx";

//notajual
import MenuNotaPenjualanMaster from "./assets/page/Master/menu-page/notajual/MenuNotaPenjualanJual-Master.jsx";
import MenuDetailNotaPenjualanJualMaster from "./assets/page/Master/menu-page/notajual/MenuDetailNotaPenjualanJual-Master.jsx";

import MenuAdonanMaster from "./assets/page/Master/menu-page/master/insert-master-adonan/MenuMasterKategoriAdonan-Master.jsx";
import MenuInsertAdonanMaster from "./assets/page/Master/menu-page/master/insert-master-adonan/MenuInsertMasterKategori-Master.jsx";
import MenuUpdateAdonanMaster from "./assets/page/Master/menu-page/master/insert-master-adonan/MenuUpdateMasterKategori-Master.jsx";

//bahan baku
import MenuMasterBahanBaku from "./assets/page/Master/menu-page/master/insert-master-bahan-baku/MenuMasterBahanBaku-Master.jsx";
import MenuInsertMasterBahanBaku from "./assets/page/Master/menu-page/master/insert-master-bahan-baku/MenuInsertMasterBahanBaku-Master.jsx";
import MenuUpdateMasterBahanBaku from "./assets/page/Master/menu-page/master/insert-master-bahan-baku/MenuUpdateMasterBahanBaku-Master.jsx";

//pelanggam
import MenuMasterPelanggan from "./assets/page/Master/menu-page/master/insert-master-pelanggan/MenuMasterPelanggan-Master.jsx";
import MenuInsertMasterPelanggan from "./assets/page/Master/menu-page/master/insert-master-pelanggan/MenuInsertMasterPelanggan-Master.jsx";
import MenuUpdateMasterPelanggan from "./assets/page/Master/menu-page/master/insert-master-pelanggan/MenuUpdateMasterPelanggan-Master.jsx";



// Halaman dan Menu Admin Basetroli
import DashboardAdminAdminPembelian from "./assets/page/Basetroli/dashboard-page/DashboardAdmin-Basetroli.jsx";
import MenuLaporanAdminPembelian from "./assets/page/Basetroli/menu-page/laporan/MenuLaporan-Basetroli.jsx";
import MenuImportAdminPembelian from "./assets/page/Basetroli/menu-page/Penjualan/import-penjualan/MenuImport-Basetroli.jsx";
import MenuImportPelunasanAdminPembelian from "./assets/page/Basetroli/menu-page/pelunasan/MenuImportPelunasan-Basetroli.jsx";
import MenuNotaPenjualanAdminPembelian from "./assets/page/Basetroli/menu-page/Penjualan/nota-jual/MenuNotaPenjualan-Basetroli.jsx";
import MenuDetailNotaPenjualanAdminPembelian from "./assets/page/Basetroli/menu-page/Penjualan/packing-list/MenuDetailNotaPenjualanPacking-Basetroli.jsx";
import MenuReturAddNotaPenjualanAdminPembelian from "./assets/page/Basetroli/menu-page/Penjualan/retur-penjualan/MenuReturAddNotaPenjualan-Basetroli.jsx";
import MenuReturDetailNotaPenjualanAdminPembelian from "./assets/page/Basetroli/menu-page/Penjualan/retur-penjualan/MenuReturNotaPenjualan-Basetroli.jsx";
import MenuDetailReturDetailNotaPenjualanAdminPembelian from "./assets/page/Basetroli/menu-page/Penjualan/retur-penjualan/MenuReturByDetailNotaPenjualan-Basetroli.jsx";
import MenuLaporanPenjualanAdminPembelian from "./assets/page/Basetroli/menu-page/laporan/MenuLaporanPembelian-Basetroli.jsx";
import MenuLaporanDetailPenjualanAdminPembelian from "./assets/page/Basetroli/menu-page/laporan/MenuLaporanDetailPembelian-Basetroli.jsx";
import MenuLaporanMasterBarangAdminPembelian from "./assets/page/Basetroli/menu-page/laporan/MenuLaporanMasterBarang-Basetroli.jsx";
import MenuLaporanMasterBarangStokAdminPembelian from  "./assets/page/Basetroli/menu-page/laporan/MenuLaporanMasterStokBarang-Basetroli.jsx";
import MenuLaporanKartuStokBarangAdminPembelian from "./assets/page/Basetroli/menu-page/laporan/MenuLaporanKartuStokBarang-Basetroli.jsx";
import MenuLaporanMasterBarangStokReturAdminPembelian from "./assets/page/Basetroli/menu-page/laporan/MenuLaporanMasterStokBarangRetur-Basetroli.jsx";
import MenuNotaPenjualanByNotaJualAdminPembelian from "./assets/page/Basetroli/menu-page/Penjualan/nota-jual/MenuDetailNotaPenjualanByNotaJual-Basetroli.jsx";
import MenuNotaPenjualanCetakPackingAdminPembelian from "./assets/page/Basetroli/menu-page/Penjualan/packing-list/MenuDetailNotaPenjualanCetakPacking-Basetroli.jsx";
import MenuPelunasanKeuanganHutangAdminPembelian from "./assets/page/Basetroli/menu-page/keuangan/keuangan-hutang/MenuPelunasanKeuanganHutang-Basetroli.jsx";
import MenuPelunasanKeuanganPiutangAdminPembelian from "./assets/page/Basetroli/menu-page/keuangan/keuangan-piutang/MenuPelunasanKeuanganPiutang-Basetroli.jsx";
import MenuInsertPelunasanKeuanganPiutangAdminPembelian from "./assets/page/Basetroli/menu-page/keuangan/keuangan-piutang/MenuAddPelunasanKeuanganPiutang-Basetroli.jsx";
import MenuPembelianBarangAdminPembelian from "./assets/page/Basetroli/menu-page/Pembelian/pembelian-barang/MenuAddPembelianBarang-Basetroli.jsx";
import MenuInsertMasterDataBarangAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-data-barang/MenuInsertMasterDataBarang-Basetroli.jsx";
import MenuUpdateMasterDataBarangAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-data-barang/MenuUpdateMasterDataBarang-Basetroli.jsx";
import MenuMasterDataBarangAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-data-barang/MenuMasterDataBarang-Basetroli.jsx";
import MenuInsertMasterStokBarangAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-stok-barang/MenuInsertMasterStokBarang-Basetroli.jsx";
import MenuUpdateMasterStokBarangAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-stok-barang/MenuUpdateMasterStokBarang-Basetroli.jsx";
import MenuMasterStokBarangAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-stok-barang/MenuMasterStokBarang-Basetroli.jsx";
import MenuNotaPembelianBarang from "./assets/page/Basetroli/menu-page/Pembelian/pembelian-barang/MenuNotaPembelian-Basetroli.jsx";
import MenuNotaDetailPembelianBarang from "./assets/page/Basetroli/menu-page/Pembelian/pembelian-barang/MenuDetailNotaPembelianByNotaJual-Basetroli.jsx";
import MenuMasterAkunAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-akun/MenuMasterAkun-Basetroli.jsx";
import MenuInsertMasterAkunAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-akun/MenuInsertMasterAkun-Basetroli.jsx";
import MenuUpdateMasterAkunAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-akun/MenuUpdateMasterAkun-Basetroli.jsx";
import MenuMasterAkuntansiAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-akuntansi/MenuMasterAkuntansi-Basetroli.jsx";
import MenuInsertMasterAkuntansiAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-akuntansi/MenuInsertMasterAkuntansi-Basetroli.jsx";
import MenuUpdateMasterAkuntansiAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-akuntansi/MenuUpdateMasterAkuntansi-Basetroli.jsx";
import MenuLaporanKategoriAdminPembelian from "./assets/page/Basetroli/menu-page/laporan/MenuLaporanMasterKategori-Basetroli.jsx";
import MenuMasterKategoriAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-kategori/MenuMasterKategoriAdonan-Basetroli.jsx";
import MenuInsertMasterKategoriAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-kategori/MenuInsertMasterKategori-Basetroli.jsx";
import MenuUpdateMasterKategoriAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-kategori/MenuUpdateMasterKategori-Basetroli.jsx";
import MenuMasterReturJualAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-retur-jual/MenuMasterReturJual-Basetroli.jsx";
import MenuInsertMasterReturJualAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-retur-jual/MenuInsertMasterReturJual-Basetroli.jsx";
import MenuUpdateMasterReturJualAdminPembelian from "./assets/page/Basetroli/menu-page/master/master-retur-jual/MenuUpdateMasterReturJual-Basetroli.jsx";
import MenuTransaksiPelunasanAdminPembelian from "./assets/page/Basetroli/menu-page/pelunasan/MenuTransaksiPelunasan-Basetroli.jsx";
import MenuReturDetailNotaPembelianAdminPembelian from "./assets/page/Basetroli/menu-page/Pembelian/retur-pembelian/MenuReturNotaPembelian-Basetroli.jsx";
import MenuInsertReturDetailNotaPembelianAdminPembelian from "./assets/page/Basetroli/menu-page/Pembelian/retur-pembelian/MenuReturAddNotaPembelian-Basetroli.jsx";
import MenuDetailReturDetailNotaPembelianAdminPembelian from "./assets/page/Basetroli/menu-page/Pembelian/retur-pembelian/MenuReturByDetailNotaPembelian-Basetroli.jsx";


// Halaman dan Menu Admin Bigtorlly
import DashboardAdminAdminKitchen from "./assets/page/Bigtroli/dashboard-page/DashboardAdmin-Bigtroli.jsx";
import MenuLaporanAdminKitchen from "./assets/page/Bigtroli/menu-page/laporan/MenuLaporan-Bigtroli.jsx";
import MenuImportAdminKitchen from "./assets/page/Bigtroli/menu-page/penjualan/import-penjualan/MenuImport-Bigtroli.jsx";
import MenuImportPelunasanAdminKitchen from "./assets/page/Bigtroli/menu-page/pelunasan/MenuImportPelunasan-Basetroli.jsx";
import MenuNotaPenjualanAdminKitchen from "./assets/page/Bigtroli/menu-page/penjualan/nota-jual/MenuNotaPenjualan-Bigtroli.jsx";
import MenuDetailNotaPenjualanAdminKitchen from "./assets/page/Bigtroli/menu-page/penjualan/packing-list/MenuDetailNotaPenjualanPacking-Bigtroli.jsx"
import MenuReturAddNotaPenjualanAdminKitchen from "./assets/page/Bigtroli/menu-page/penjualan/retur-penjualan/MenuReturAddNotaPenjualan-Bigtroli.jsx";
import MenuReturDetailNotaPenjualanAdminKitchen from "./assets/page/Bigtroli/menu-page/penjualan/retur-penjualan/MenuReturNotaPenjualan-Bigtroli.jsx";
import MenuDetailReturDetailNotaPenjualanAdminKitchen from "./assets/page/Bigtroli/menu-page/penjualan/retur-penjualan/MenuReturByDetailNotaPenjualan-Bigtroli.jsx";
// import MenuLaporanPenjualanAdminKitchen from "./assets/page/Bigtroli/menu-page/laporan/MenuLaporanPenjualan-Bigtroli.jsx";
import MenuLaporanMasterBarangAdminKitchen from "./assets/page/Bigtroli/menu-page/laporan/MenuLaporanMasterBarang-Bigtroli.jsx";
import MenuMasterDataBarangAdminKitchen from "./assets/page/Bigtroli/menu-page/master/master-data-barang/MenuMasterDataBarang-Bigtroli.jsx";
import MenuLaporanMasterBarangStokAdminKitchen from  "./assets/page/Bigtroli/menu-page/laporan/MenuLaporanMasterStokBarang-Bigtroli.jsx";
import MenuLaporanKartuStokBarangAdminKitchen from "./assets/page/Bigtroli/menu-page/laporan/MenuLaporanKartuStokBarang-Bigtroli.jsx";
import MenuLaporanMasterBarangStokReturAdminKitchen from "./assets/page/Bigtroli/menu-page/laporan/MenuLaporanMasterStokBarangRetur-Bigtroli.jsx";
import MenuNotaPenjualanByNotaJualAdminKitchen from "./assets/page/Bigtroli/menu-page/penjualan/nota-jual/MenuDetailNotaPenjualanByNotaJual-Bigtroli.jsx";
import MenuNotaPenjualanCetakPackingAdminKitchen from "./assets/page/Bigtroli/menu-page/penjualan/packing-list/MenuDetailNotaPenjualanCetakPacking-Bigtroli.jsx";
import MenuPelunasanKeuanganAdminKitchen from "./assets/page/Bigtroli/menu-page/keuangan/MenuPelunasanKeuangan-Bigtroli.jsx";
import MenuInsertMasterDataBarangAdminKitchen from "./assets/page/Bigtroli/menu-page/master/master-data-barang/MenuInsertMasterDataBarang-Bigtroli.jsx";
import MenuUpdateMasterDataBarangAdminKitchen from "./assets/page/Bigtroli/menu-page/master/master-data-barang/MenuUpdateMasterDataBarang-Bigtroli.jsx";
import MenuLaporanPenjualanAdminKitchen from "./assets/page/Bigtroli/menu-page/laporan/MenuLaporanPembelian-Bigtroli.jsx";
import MenuLaporanDetailPenjualanAdminKitchen from "./assets/page/Bigtroli/menu-page/laporan/MenuLaporanDetailPembelian-Bigtroli.jsx";
import MenuMasterKategoriAdminKitchen from "./assets/page/Bigtroli/menu-page/master/master-kategori/MenuMasterKategoriAdonan-Bigtroli.jsx";
import MenuInsertMasterKategoriAdminKitchen from "./assets/page/Bigtroli/menu-page/master/master-kategori/MenuInsertMasterKategori-Bigtroli.jsx";
import MenuNotaSaleOrder from "./assets/page/Bigtroli/menu-page/salesorder/MenuNotaSalesOrder-Bigtroli.jsx";
import MenuDetailNotaSalesOrder from "./assets/page/Bigtroli/menu-page/salesorder/MenuDetailNotaSalesOrder-Bigtroli.jsx";
import MenuGabunganPermintaan from "./assets/page/Bigtroli/menu-page/gabunganpermintaan/MenuGabunganPermintaan-Bigtroli.jsx";
import MenuDetailGabunganPermintaan from "./assets/page/Bigtroli/menu-page/gabunganpermintaan/MenuDetailGabunganPermintaan-Bigtroli.jsx";
import MenuAddGabunganPermintaan from "./assets/page/Bigtroli/menu-page/gabunganpermintaan/MenuAddGabunganPermintaan-Bigtroli.jsx";
import MenuProduksiPorduk from "./assets/page/Bigtroli/menu-page/produksiproduk/MenuProduksiProduk-Bigtroli.jsx";
import MenuAddProduksiProduk from "./assets/page/Bigtroli/menu-page/produksiproduk/MenuAddProduksiProduk-Bigtroli.jsx";
import MenuDetailProduksiProduk from "./assets/page/Bigtroli/menu-page/produksiproduk/MenuDetailProduksiProduk-Bigtroli.jsx";
import MenuBuktiPengeluaran from "./assets/page/Bigtroli/menu-page/buktipengeluaran/MenuBuktiPengeluaran-Bigtroli.jsx";
import MenuAddBuktiPengeluaran from "./assets/page/Bigtroli/menu-page/buktipengeluaran/MenuDetailBuktiPengeluaran-Bigtroli.jsx";
import MenuNotaPenjualan from "./assets/page/Bigtroli/menu-page/notajual/MenuNotaPenjualanJual-Bigtroli.jsx";
import MenuDetailNotaPenjulan from "./assets/page/Bigtroli/menu-page/notajual/MenuDetailNotaPenjualanJual-Bigtroli.jsx";


// Import axios
import axios from "axios";

// Router Configuration
const router = createBrowserRouter([
  // Route Login Utama
  {
    path: "/",
    element: <LoginPage />, // LoginPage dinamis untuk semua user
  },

  // Route untuk Master Admin (role=1) (TK000)
  {
    path: "/dashboard/master",
    element: (
      <ProtectedRoute requiredRoles={[1, 2]} requiredKodeToko="TK0000">
        <DashboardAdminMaster />
      </ProtectedRoute>
    ),
    children: [
      { path: "menu/laporan", element: <MenuLaporanMaster /> },
      { path: "menu/import", element: <MenuImportMaster /> },
      { path: "menu/import/pelunasan", element: <MenuImportPelunasanMaster /> },
      { path: "menu/user", element: <MenuMasterUser /> },
      { path: "menu/databarang", element: <MenuMasterDataBarang />},
      // { path : "menu/notapenjualan", element: <MenuNotaPenjualanMaster /> },
      { path : "menu/notapenjualan/detail", element: <MenuDetailNotaPenjualanMaster /> },
      { path : "menu/notapenjualan/packinglist", element: <MenuDetailNotaPenjualanPackingListMaster /> },
      { path : "menu/notapenjualan/cetakpackinglist", element: <MenuNotaPenjualanCetakPackingMaster /> },
      { path : "menu/notapenjualan/returpenjualan", element: <MenuReturDetailNotaPenjualanMaster /> },
      { path : "menu/notapenjualan/returpenjualan/proses/:id_retur", element: <MenuDetailReturDetailNotaPenjualanMaster /> },
      { path : "menu/notapenjualan/returpenjualan/add", element: <MenuReturAddNotaPenjualanMaster/> },
      { path : "menu/notapenjualan/notajual/:id_header_pemesanan",element: <MenuNotaPenjualanByNotaJualMaster/>},
      { path : "menu/laporanpenjualan", element: <MenuLaporanPenjualanMaster /> },
      { path : "menu/laporanpenjualan/detail/:id_master_penjualan", element: <MenuLaporanDetailPenjualanAdminMaster /> },
      { path : "menu/user/insert", element: <MenuInsertMasterUser /> },
      // { path : "menu/databarang/detail/:id_produk", element: <MenuInsertMasterDataBarang /> },
      { path : "menu/databarang/insert", element: <MenuInsertMasterDataBarang /> },
      { path : "menu/user/laporan", element: <MenuLaporanMasterUser /> },
      { path : "menu/user/update/:id_user", element: <MenuUpdateMasterUser /> },
      { path : "menu/databarang/update/:id_produk", element: <MenuUpdateMasterDataBarang /> },
      { path : "menu/laporan/stokbarang", element: <MenuLaporanStokBarangMaster /> },
      { path : "menu/laporan/databarang", element: <MenuLaporanMasterDataBarang/>},
      { path : "menu/laporan/databarang/detail/:id_produk", element: <MenuLaporanDetailUpdateDataBarang />},
      { path : "menu/laporan/marketplace", element: <MenuLaporanMasterMarketPlace/>},
      { path : "menu/laporan/kategori", element: <MenuLaporanMasterKategori/>},
      { path : "menu/laporan/role", element: <MenuLaporanMasterRole/>},
      { path : "menu/laporan/toko", element: <MenuLaporanMasterToko/>},
      { path : "menu/laporan/depo", element: <MenuLaporanMasterDepo/>},
      { path : "menu/laporan/satuan", element: <MenuLaporanMasterSatuan/>},
      { path : "menu/laporan/masterkartustok", element: <MenuLaporanKartuStokBarangMaster />},
      { path : "menu/laporan/pelanggan", element: <MenuLaporanMasterPelanggan />},
      { path : "menu/laporan/adonan", element: <MenuLaporanMasterAdonan />},
      { path : "menu/laporan/adonan/detail/:id_kategori_adonan_produk", element: <ManuLaporanDetailMasterAdonan />},
      { path : "menu/akun", element: <MenuMasterAkun/>},
      { path : "menu/akun/insert", element: <MenuInsertMasterAkun/>},
      { path : "menu/akun/update/:id_master_akun", element: <MenuUpdateMasterAkun /> },
      { path : "menu/akuntansi", element: <MenuMasterAkuntansi/>},
      { path : "menu/akuntansi/insert", element: <MenuInsertMasterAkuntansi/>},
      { path : "menu/akuntansi/update/:id_master_akun_akuntansi", element: <MenuUpdateMasterAkuntansi /> },
      { path: "menu/pelunasankeuangan/hutang", element: <MenuPelunasanKeuanganPiutangMaster /> },
      { path: "menu/pelunasankeuangan/hutang/insert", element: <MenuInsertPelunasanKeuanganHutangMaster /> },
      { path: "menu/masterstokbarang", element: <MenuMasterStokBarangMaster /> },
      { path: "menu/masterstokbarang/insert", element: <MenuInsertMasterStokBarangMaster /> },
      { path: "menu/masterstokbarang/update/:id_bahan_baku", element: <MenuUpdateMasterStokBarangMaster />},
      { path: "menu/master/depo", element: <MenuMasterDepo /> },
      { path: "menu/master/depo/insert", element: <MenuInsertMasterDepo /> },
      { path: "menu/master/depo/update/:id_depo", element: <MenuUpdateMasterDepo /> },
      { path: "menu/master/gudang", element: <MenuMasterGudang /> },
      { path: "menu/master/gudang/insert", element: <MenuInsertMasterGudang /> },
      { path: "menu/master/gudang/update/:id_gudang", element: <MenuUpdateMasterGudang /> },
      { path: "menu/master/kategori", element: <MenuMasterKategori /> },
      { path: "menu/master/kategori/insert", element: <MenuInsertMasterKategori /> },
      { path: "menu/master/kategori/update/:id_kategori", element: <MenuUpdateMasterKategori /> },
      { path: "menu/master/marketplace", element: <MenuMasterMarkteplace /> },
      { path: "menu/master/marketplace/insert", element: <MenuInsertMasterMarketplace /> },
      { path: "menu/master/marketplace/update/:id_marketplace", element: <MenuUpdateMasterMarketplace /> },
      { path: "menu/master/role", element: <MenuMasterRole /> },
      { path: "menu/master/role/insert", element: <MenuInsertMasterRole /> },
      { path: "menu/master/role/update/:id_role", element: <MenuUpdateMasterRole /> },
      { path: "menu/master/satuan", element: <MenuMasterSatuan /> },
      { path: "menu/master/satuan/insert", element: <MenuInsertMasterSatuan /> },
      { path: "menu/master/satuan/update/:id_satuan", element: <MenuUpdateMasterSatuan /> },
      { path: "menu/transaksi/pelunasan", element: <MenuTransaksiPelunasanMaster /> },


      { path: "menu/pembelianbarang", element: <MenuNotaPembelianBarangMaster /> },
      { path: "menu/pembelianbarang/detail/:id_master_pesanan_pembelian", element: <MenuNotaDetailPembelianBarangMaster /> },
      { path: "menu/pembelianbarang/add", element: <MenuPembelianBarangAdminMaster /> },

      { path: "menu/notaretur/pembelian", element: <MenuReturDetailNotaPembelianMaster /> },
      { path: "menu/notaretur/pembelian/add", element: <MenuInsertReturDetailNotaPembelianMaster /> },
      { path: "menu/notaretur/pembelian/proses/:id_retur_pembelian", element: <MenuDetailReturDetailNotaPembelianMaster /> },

      //salesordser
      { path: "menu/salesorder", element: <MenuNotaSaleOrderMaster /> },
      { path: "menu/salesorder/detail/:id_master_pesanan_pembelian", element: <MenuDetailNotaSalesOrderMaster /> },

      //gabungan
      { path: "menu/gabunganpermintaan", element: <MenuGabunganPermintaanMaster /> },
      { path: "menu/gabunganpermintaan/detail/:id_master_gabungan_pemintaan", element: <MenuDetailGabunganPermintaanMaster /> },
      { path: "menu/gabunganpermintaan/add", element: <MenuAddGabunganPermintaanMaster /> },

      //produksi
      { path: "menu/produksiproduk", element: <MenuProduksiPordukMaster /> },
      { path: "menu/produksiproduk/add", element: <MenuAddProduksiProdukMaster /> },
      { path: "menu/produksiproduk/detail/:id_master_produksi", element: <MenuDetailProduksiProdukMaster /> },

      // bukti pengeluaran
      { path: "menu/buktipengeluaran", element: <MenuBuktiPengeluaranMaster /> },
      { path: "menu/buktipengeluaran/detail/:id_master_bukti_pengeluaran", element: <MenuAddBuktiPengeluaranMaster /> },


      //notajual
      { path: "menu/notapenjualan", element: <MenuNotaPenjualanMaster /> },
      { path: "menu/notapenjualan/master/detail/:id_master_bukti_pengeluaran", element: <MenuDetailNotaPenjualanJualMaster /> },

      //menu adoanan
      { path: "menu/adonan", element: <MenuAdonanMaster /> },
      { path: "menu/adonan/insert", element: <MenuInsertAdonanMaster /> },
      { path: "menu/adonan/update/:id_kategori_adonan_produk", element: <MenuUpdateAdonanMaster /> },

      { path: "menu/masterbahanbaku", element: <MenuMasterBahanBaku /> },
      { path: "menu/masterbahanbaku/insert", element: <MenuInsertMasterBahanBaku /> },
      { path: "menu/masterbahanbaku/update/:id_bahan_baku", element: <MenuUpdateMasterBahanBaku /> },

      { path: "menu/masterpelanggan", element: <MenuMasterPelanggan /> },
      { path: "menu/masterpelanggan/insert", element: <MenuInsertMasterPelanggan /> },
      { path: "menu/masterpelanggan/update/:id_master_pelanggan_external", element: <MenuUpdateMasterPelanggan /> },

    ],
  },

  // Route untuk Admin Pembelian (TK002)
  {
    path: "/dashboard/adminpembelian",
    element: (
      <ProtectedRoute requiredRole={0} requiredKodeToko="TK2000">
        <DashboardAdminAdminPembelian/>
      </ProtectedRoute>
    ),
    children: [
      { path: "menu/laporan", element: <MenuLaporanAdminPembelian /> },
      { path: "menu/import", element: <MenuImportAdminPembelian /> },
      { path: "menu/import/pelunasan", element: <MenuImportPelunasanAdminPembelian /> },
      { path: "menu/notapenjualan", element: <MenuNotaPenjualanAdminPembelian /> },
      { path: "menu/notapenjualan/detail", element: <MenuDetailNotaPenjualanAdminPembelian /> },
      { path: "menu/notapenjualan/cetakpacking", element: <MenuNotaPenjualanCetakPackingAdminPembelian /> },
      { path: "menu/notapenjualan/returpenjualan", element: <MenuReturDetailNotaPenjualanAdminPembelian /> },
      { path: "menu/notapenjualan/returpenjualan/proses/:id_retur", element: <MenuDetailReturDetailNotaPenjualanAdminPembelian/> },
      { path: "menu/laporanpenjualan", element: <MenuLaporanPenjualanAdminPembelian /> },
      { path: "menu/laporanpenjualan/detail/:id_master_penjualan", element: <MenuLaporanDetailPenjualanAdminPembelian /> },
      { path: "menu/laporanmasterbarang", element: <MenuLaporanMasterBarangAdminPembelian /> },
      { path: "menu/laporanmasterbarangstok", element: <MenuLaporanMasterBarangStokAdminPembelian />},
      { path: "menu/laporanmasterkartustok", element: <MenuLaporanKartuStokBarangAdminPembelian />},
      { path: "menu/laporanmasterbarangstokretur", element: <MenuLaporanMasterBarangStokReturAdminPembelian/>},
      { path: "menu/laporanmasterkategori", element: <MenuLaporanKategoriAdminPembelian /> },
      { path: "menu/notapenjualan/notajual/:id_header_pemesanan",element: <MenuNotaPenjualanByNotaJualAdminPembelian/>},
      { path: "menu/notapenjualan/returpenjualan/add", element: <MenuReturAddNotaPenjualanAdminPembelian /> },
      { path: "menu/pelunasankeuangan/piutang", element: <MenuPelunasanKeuanganPiutangAdminPembelian/> },
      { path: "menu/transaksi/pelunasan", element: <MenuTransaksiPelunasanAdminPembelian/> },
      { path: "menu/pelunasankeuangan/hutang", element: <MenuPelunasanKeuanganHutangAdminPembelian /> },
      { path: "menu/pelunasankeuangan/hutang/insert", element: <MenuInsertPelunasanKeuanganPiutangAdminPembelian /> },
      { path: "menu/pembelianbarang", element: <MenuPembelianBarangAdminPembelian /> },
      { path: "menu/masterdatabarang", element: <MenuMasterDataBarangAdminPembelian/> },
      { path: "menu/masterdatabarang/detail/:id_produk", element: <MenuInsertMasterDataBarangAdminPembelian/> },
      { path: "menu/masterdatabarang/update/:idbarang", element: <MenuUpdateMasterDataBarangAdminPembelian /> },
      { path: "menu/masterstokbarang", element: <MenuMasterStokBarangAdminPembelian /> },
      { path: "menu/masterstokbarang/insert", element: <MenuInsertMasterStokBarangAdminPembelian /> },
      { path: "menu/masterstokbarang/update/:idstokbarang", element: <MenuUpdateMasterStokBarangAdminPembelian/> },
      { path: "menu/notapembelian", element: <MenuNotaPembelianBarang /> },
      { path: "menu/notapembelian/detail/:id_master_pesanan_pembelian", element: <MenuNotaDetailPembelianBarang /> },
      { path: "menu/masterakun", element: <MenuMasterAkunAdminPembelian/> },
      { path: "menu/masterakun/insert", element: <MenuInsertMasterAkunAdminPembelian /> },
      { path: "menu/masterakun/update/:id_master_akun", element: <MenuUpdateMasterAkunAdminPembelian /> },
      { path: "menu/masterakuntansi", element: <MenuMasterAkuntansiAdminPembelian /> },
      { path: "menu/masterakuntansi/insert", element: <MenuInsertMasterAkuntansiAdminPembelian /> },
      { path: "menu/masterakuntansi/update/:id_master_akun_akuntansi", element: <MenuUpdateMasterAkuntansiAdminPembelian/> },
      { path: "menu/masterkategori", element: <MenuMasterKategoriAdminPembelian/> },
      { path: "menu/masterkategori/insert", element: <MenuUpdateMasterKategoriAdminPembelian /> },
      { path: "menu/masterkategori/detail/:id_kategori_adonan_produk", element: <MenuInsertMasterKategoriAdminPembelian /> },
      { path: "menu/masterreturjual", element: <MenuMasterReturJualAdminPembelian /> },
      { path: "menu/masterreturjual/insert", element: <MenuInsertMasterReturJualAdminPembelian /> },
      { path: "menu/masterreturjual/update/:id_stokretur", element: <MenuUpdateMasterReturJualAdminPembelian /> },
      { path: "menu/notaretur/pembelian", element: <MenuReturDetailNotaPembelianAdminPembelian /> },
      { path: "menu/notaretur/pembelian/add", element: <MenuInsertReturDetailNotaPembelianAdminPembelian /> },
      { path: "menu/notaretur/pembelian/proses/:id_retur_pembelian", element: <MenuDetailReturDetailNotaPembelianAdminPembelian /> },
    ],
  },

    // Route untuk Admin Kitchen(TK004)
    {
      path: "/dashboard/adminkitchen",
    element: (
      <ProtectedRoute requiredRole={0} requiredKodeToko="TK4000">
        <DashboardAdminAdminKitchen />
      </ProtectedRoute>
    ),
      children: [
        { path: "menu/laporan", element: <MenuLaporanAdminKitchen /> },
        { path: "menu/import", element: <MenuImportAdminKitchen /> },
        { path: "menu/import/pelunasan", element: <MenuImportPelunasanAdminKitchen /> },
        { path: "menu/notapenjualan", element: <MenuNotaPenjualanAdminKitchen /> },
        { path: "menu/notapenjualan/detail", element: <MenuDetailNotaPenjualanAdminKitchen /> },
        { path: "menu/notapenjualan/cetakpacking", element: <MenuNotaPenjualanCetakPackingAdminKitchen /> },
        { path: "menu/notapenjualan/returpenjualan", element: <MenuReturDetailNotaPenjualanAdminKitchen /> },
        { path: "menu/notapenjualan/returpenjualan/proses/:id_retur", element: <MenuDetailReturDetailNotaPenjualanAdminKitchen /> },
        // { path: "menu/laporanpenjualan", element: <MenuLaporanPenjualanAdminKitchen /> },
        { path: "menu/masterdatabarang/detail/:id_produk", element: <MenuInsertMasterDataBarangAdminKitchen/> },
        { path: "menu/masterdatabarang", element: <MenuMasterDataBarangAdminKitchen/> },
        { path: "menu/masterdatabarang/update/:idbarang", element: <MenuUpdateMasterDataBarangAdminKitchen/> },
        { path: "menu/laporanmasterbarang", element: <MenuLaporanMasterBarangAdminKitchen /> },
        { path: "menu/laporanmasterbarangstok", element: <MenuLaporanMasterBarangStokAdminKitchen />},
        { path: "menu/laporanmasterkartustok", element: <MenuLaporanKartuStokBarangAdminKitchen />},
        { path: "menu/laporanmasterbarangstokretur", element: <MenuLaporanMasterBarangStokReturAdminKitchen />},
        { path: "menu/notapenjualan/notajual/:id_header_pemesanan",element: <MenuNotaPenjualanByNotaJualAdminKitchen />},
        { path: "menu/notapenjualan/returpenjualan/add", element: <MenuReturAddNotaPenjualanAdminKitchen /> },
        { path: "menu/masterkategori", element: <MenuMasterKategoriAdminKitchen/> },
        { path: "menu/masterkategori/detail/:id_kategori_adonan_produk", element: <MenuInsertMasterKategoriAdminKitchen /> },

        { path: "menu/pelunasankeuangan", element: <MenuPelunasanKeuanganAdminKitchen/> },
        { path: "menu/laporanpenjualan", element: <MenuLaporanPenjualanAdminKitchen/> },
        { path: "menu/laporanpenjualan/detail/:id_master_penjualan", element: <MenuLaporanDetailPenjualanAdminKitchen /> },
        { path: "menu/salesorder", element: <MenuNotaSaleOrder /> },
        { path: "menu/salesorder/detail/:id_master_pesanan_pembelian", element: <MenuDetailNotaSalesOrder /> },
        { path: "menu/gabunganpermintaan", element: <MenuGabunganPermintaan /> },
        { path: "menu/gabunganpermintaan/detail/:id_master_gabungan_pemintaan", element: <MenuDetailGabunganPermintaan /> },
        { path: "menu/gabunganpermintaan/add", element: <MenuAddGabunganPermintaan /> },
        { path: "menu/produksiproduk", element: <MenuProduksiPorduk /> },
        { path: "menu/produksiproduk/add", element: <MenuAddProduksiProduk /> },
        { path: "menu/produksiproduk/detail/:id_master_produksi", element: <MenuDetailProduksiProduk /> },
        { path: "menu/buktipengeluaran", element: <MenuBuktiPengeluaran /> },
        { path: "menu/buktipengeluaran/detail/:id_master_bukti_pengeluaran", element: <MenuAddBuktiPengeluaran /> },
        { path: "menu/notapenjualan/adminkitchen", element: <MenuNotaPenjualan /> },
        { path: "menu/notapenjualan/adminkitchen/detail/:id_master_bukti_pengeluaran", element: <MenuDetailNotaPenjulan /> },

      ],
    },

  // Route Error Page untuk path yang tidak dikenali
  {
    path: "*",
    element: <ErrorPage />,
  },
]);

// Komponen untuk menginisialisasi Axios dan Redux State
const AppInitializer = ({ children }) => {
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      // Set header Authorization untuk semua request Axios
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  return children;
};

// Main Application Component
const MainApp = () => {
  return (
    <AppInitializer>
      <RouterProvider router={router} />
    </AppInitializer>
  );
};

// Render ke DOM
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <MainApp />
    </Provider>
  </React.StrictMode>
);
