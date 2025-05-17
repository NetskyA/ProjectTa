import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAkseMenusUser } from "../../../services/apiService";
import Loading from "../../component/Loading";
import Undefined from "../../component/Undefined";
import LogoSales from "../../../image/icon/penjualan.svg";
import LogoDashboard from "../../../image/icon/dashboard.svg";
import LogoPelunasan from "../../../image/icon/icon-pelunasan.svg";
import LogoLaporan from "../../../image/icon/icon-laporan.svg";
import LogoKeuangan from "../../../image/icon/icon-keuangan.svg"; // Tambahkan ikon untuk Keuangan
import LogoPembelian from "../../../image/icon/icon-pembelian.svg"; // Tambahkan ikon untuk Pembelian
import LogoMaster from "../../../image/icon/logo-master.svg";
import "aos/dist/aos.css";
import AOS from "aos";
export default function Navbarside({ role }) {
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const [isLaporanProgres, setIsLaporanProgres] = useState(false);
  const [isPelunasanOpen, setIsPelunasanOpen] = useState(false);
  const [isLaporanOpen, setIsLaporanOpen] = useState(false);
  const [isKeuanganOpen, setIsKeuanganOpen] = useState(false); // State untuk Keuangan
  const [isPembelianOpen, setIsPembelianOpen] = useState(false); // State untuk Pembelian
  const [isMasterOpenAdmin, setIsMasterOpenAdmin] = useState(false);
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allowedMenus, setAllowedMenus] = useState([]);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko);
  const token = useSelector((state) => state.auth.token);

  console.log("id_user:", id_user);
  console.log("id_toko:", id_toko);

  const toggleLaporanProgres = () => {
    setIsLaporanProgres(!isLaporanProgres);
  };

  const toggleMasterMenu = () => {
    setIsMasterOpen(!isMasterOpen);
  };

  const togglePelunasanMenu = () => {
    setIsPelunasanOpen(!isPelunasanOpen);
  };

  const toggleLaporanMenu = () => {
    setIsLaporanOpen(!isLaporanOpen);
  };

  const toggleKeuanganMenu = () => {
    setIsKeuanganOpen(!isKeuanganOpen);
  };

  const togglePembelianMenu = () => {
    setIsPembelianOpen(!isPembelianOpen);
  };

  const toggleMasterMenuAdmin = () => {
    setIsMasterOpenAdmin(!isMasterOpenAdmin);
  };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div className="w-44 mt-11" style={{ fontFamily: "sans-serif" }}>
      <ul>
        {/* Menu Utama Penjualan */}
        <li className="mt-11 pt-1 m-2">
          <div className="group">
            <button
              onClick={toggleLaporanProgres}
              className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
                isLaporanProgres
                  ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                  : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
              }`}
            >
              <img src={LogoDashboard} className="w-4 h-4 ml-2" alt="" />
              <span className="ml-1 text-xs font-medium">Dashboard</span>
            </button>
          </div>

          {/* Submenu */}
          {isLaporanProgres && (
            <ul className="mt-1 pl-0.5 relative">
              <li className="m-1" data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="/dashboard/master"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/master" ||
                    location.pathname === "/dashboard/master"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Progres
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* Menu Utama Laporan */}
        <li className="mt-0 pt-0 m-2">
          <div className="group">
            <button
              onClick={toggleLaporanMenu}
              className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
                isLaporanOpen
                  ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                  : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
              }`}
            >
              <img src={LogoLaporan} className="w-4 h-4 ml-2" alt="" />
              <span className="ml-1 text-xs font-medium">Laporan</span>
            </button>
          </div>

          {/* Submenu */}
          {isLaporanOpen && (
            <ul className="mt-1 pl-0.5 relative">
              <li className="m-1" data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/laporanpenjualan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/laporanpenjualan" ||
                    location.pathname ===
                      "/dashboard/master/menu/laporanpenjualan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Penjualan
                </Link>
              </li>
              <li className="m-1" data-aos="fade-right" data-aos-duration="1400">
                <Link
                  to="menu/laporan/databarang"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/databarang" ||
                    location.pathname ===
                      "/dashboard/master/menu/laporan/databarang"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Produk
                </Link>
              </li>
              <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                <Link
                  to="menu/laporan/stokbarang"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/laporanstok" ||
                    location.pathname ===
                      "/dashboard/master/menu/laporan/stokbarang"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan S. Bahan Baku
                </Link>
              </li>
              <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                <Link
                  to="menu/laporan/adonan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/adonan" ||
                    location.pathname ===
                      "/dashboard/master/menu/laporan/adonan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Adonan
                </Link>
              </li>
                            <li className="m-1" data-aos="fade-right" data-aos-duration="1000">
                <Link
                  to="menu/user/laporan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/master/menu/user/laporan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan User
                </Link>
              </li>
              <li className="m-1" data-aos="fade-right" data-aos-duration="2400">
                <Link
                  to="menu/laporan/pelanggan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pelanggan" ||
                    location.pathname === "/dashboard/master/menu/laporan/pelanggan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Pelanggan
                </Link>
              </li>
              <li className="m-1" data-aos="fade-right" data-aos-duration="1800">
                <Link
                  to="menu/laporan/satuan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/laporan/satuan" ||
                    location.pathname ===
                      "/dashboard/master/menu/laporan/satuan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Satuan
                </Link>
              </li>
              {/* <li className="m-1" data-aos="fade-right" data-aos-duration="2200">
                <Link
                  to="menu/laporan/role"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/role" ||
                    location.pathname === "/dashboard/master/menu/laporan/role"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Akses
                </Link>
              </li> */}

            </ul>
          )}
        </li>

        {/* Menu Utama Pembelian */}
        <li className="mt-0 pt-0 m-2">
          <div className="group">
            <button
              onClick={togglePembelianMenu}
              className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
                isPembelianOpen
                  ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                  : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
              }`}
            >
              <img
                src={LogoPembelian}
                className="w-4 h-4 ml-2"
                alt="Pembelian"
              />
              <span className="ml-1 text-xs font-medium">Pembelian</span>
            </button>
          </div>

          {isPembelianOpen && (
            <ul className="mt-1 pl-0.5 relative">
              {/* <li  className="m-1"  data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/pembelianbarang"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pembelianbarang" ||
                    location.pathname ===
                      "/dashboard/master/menu/pembelianbarang"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Pembelian Barang
                </Link>
              </li> */}
              <li className="m-1" data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/pembelianbarang"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pembelianbarang" ||
                    location.pathname ===
                      "/dashboard/master/menu/pembelianbarang"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Analisa & Pemesanan
                </Link>
              </li>
              {/* <li  className="m-1"  data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/notaretur/pembelian"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname ===
                      "/dashboard/menu/notaretur/pembelian" ||
                    location.pathname ===
                      "/dashboard/master/menu/notaretur/pembelian"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Retur Pembelian
                </Link>
              </li> */}
            </ul>
          )}
        </li>

        {/* Menu Utama Penjualan -=> Inmport Penjualan */}
        <li className="mt-0 pt-0 m-2">
          <div className="group">
            <button
              onClick={toggleKeuanganMenu}
              className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
                isKeuanganOpen
                  ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                  : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
              }`}
            >
              <img src={LogoKeuangan} className="w-4 h-4 ml-2" alt="Keuangan" />
              <span className="ml-1 text-xs font-medium">Penjualan</span>
            </button>
          </div>

          {isKeuanganOpen && (
            <ul className="mt-1 pl-0.5 relative">
              <li className="m-1" data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/import"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/import" ||
                    location.pathname === "/dashboard/master/menu/import"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Import Penjualan
                </Link>
              </li>
              {/* <li  className="m-1"  data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/pelunasankeuangan/piutang"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pelunasankeuangan/piutang" ||
                    location.pathname ===
                      "/dashboard/master/menu/pelunasankeuangan/piutang"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Pelunasan Piutang
                </Link>
              </li> */}
            </ul>
          )}
        </li>

        {/* Menu Utama Pelunasan */}
        {/* <li className="mt-0 pt-0 m-2">
          <div className="group">
            <button
              onClick={togglePelunasanMenu}
              className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
                isPelunasanOpen
                  ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                  : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
              }`}
            >
              <img src={LogoPelunasan} className="w-4 h-4 ml-2" alt="" />
              <span className="ml-1 text-xs font-medium">Pembelian</span>
            </button>
          </div>

          {isPelunasanOpen && (
            <ul className="mt-1 pl-0.5 relative">
              <li  className="m-1"  data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/import/pelunasan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/import/pelunasan" ||
                    location.pathname ===
                      "/dashboard/master/menu/import/pelunasan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Analisa & Pemesanan
                </Link>
              </li>
              <li  className="m-1"  data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/transaksi/pelunasan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname ===
                      "/dashboard/menu/transaksi/pelunasan" ||
                    location.pathname ===
                      "/dashboard/master/menu/transaksi/pelunasan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Transaksi Pelunasan
                </Link>
              </li>
              <li  className="m-1"  data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/pelunasan4"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pelunasan4" ||
                    location.pathname ===
                      "/dashboard/master/menu/pelunasan4"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Pelunasan 4
                </Link>
              </li>
              <li  className="m-1"  data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/pelunasan5"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pelunasan5" ||
                    location.pathname ===
                      "/dashboard/master/menu/pelunasan5"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Pelunasan 5
                </Link>
              </li>
            </ul>
          )}
        </li> */}

        {/* produksi */}
        <li className="mt-0 pt-0 m-2">
          <div className="group">
            <button
              onClick={toggleMasterMenu}
              className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
                isMasterOpen
                  ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                  : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
              }`}
            >
              <img src={LogoSales} className="w-4 h-4 ml-1.5" alt="" />
              <span className="ml-2 text-xs font-medium">Produksi</span>
            </button>
          </div>

          {/* Submenu */}
          {isMasterOpen && (
            <ul className="mt-1 pl-0.5 relative">
              {/*Import */}
              <li className="m-1" data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/salesorder"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/salesorder" ||
                    location.pathname === "/dashboard/master/menu/salesorder"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Sales Order
                </Link>
              </li>
              {/* Nota Penjualan */}
              <li className="m-1" data-aos="fade-right" data-aos-duration="1000">
                <Link
                  to="menu/gabunganpermintaan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname ===
                      "/dashboard/menu/gabunganpermintaan" ||
                    location.pathname ===
                      "/dashboard/master/menu/gabunganpermintaan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Gabungan Pemintaan
                </Link>
              </li>

              <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                <Link
                  to="menu/produksiproduk"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/produksiproduk" ||
                    location.pathname ===
                      "/dashboard/master/menu/produksiproduk"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Produksi Produk
                </Link>
              </li>

              <li className="m-1" data-aos="fade-right" data-aos-duration="2300">
                <Link
                  to="menu/buktipengeluaran"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/buktipengeluaran" ||
                    location.pathname ===
                      "/dashboard/master/menu/buktipengeluaran"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Bukti Pengeluran
                </Link>
              </li>
              <li className="m-1" data-aos="fade-right" data-aos-duration="2500">
                <Link
                  to="menu/notapenjualan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname ===
                      "/dashboard/menu/notapenjualan" ||
                    location.pathname ===
                      "/dashboard/master/menu/notapenjualan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Nota Penjualan
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* Menu Utama Master */}
        <li className="mt-0 pt-0 m-2">
          <div className="group">
            <button
              onClick={toggleMasterMenuAdmin}
              className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
                isPelunasanOpen
                  ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                  : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
              }`}
            >
              <img src={LogoMaster} className="w-4 h-4 ml-2" alt="master" />
              <span className="ml-1 text-xs font-medium">Master</span>
            </button>
          </div>

          {/* Submenu */}
          {isMasterOpenAdmin && (
            <ul className="mt-1 pl-0.5 relative">
              <li className="m-1" data-aos="fade-right" data-aos-duration="400">
                <Link
                  to="menu/user"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/master/menu/master-user"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Master User
                </Link>
              </li>
              <li className="m-1" data-aos="fade-right" data-aos-duration="1000">
                <Link
                  to="menu/databarang"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/master/menu/databarang"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Master Produk
                </Link>
              </li>

              <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                <Link
                  to="menu/masterbahanbaku"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname ===
                    "/dashboard/master/menu/masterbahanbaku"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Master Bahan Baku
                </Link>
              </li>
              <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                <Link
                  to="menu/masterstokbarang"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname ===
                    "/dashboard/master/menu/masterstokbarang"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Master S. Bahan Baku
                </Link>
              </li>
                            <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                <Link
                  to="menu/adonan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname ===
                    "/dashboard/master/menu/adonan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Master Adonan
                </Link>
              </li>
            

              {/* <li className="m-1" data-aos="fade-right" data-aos-duration="2400">
                <Link
                  to="menu/master/role"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/master/role" ||
                    location.pathname ===
                      "/dashboard/master/menu/master/role"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Master Akses
                </Link>
              </li> */}
              <li className="m-1" data-aos="fade-right" data-aos-duration="2400">
                <Link
                  to="menu/masterpelanggan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/masterpelanggan" ||
                    location.pathname ===
                      "/dashboard/master/menu/masterpelanggan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Master Pelanggan
                </Link>
              </li>
              <li className="m-1" data-aos="fade-right" data-aos-duration="2800">
                <Link
                  to="menu/master/satuan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/master/satuan" ||
                    location.pathname ===
                      "/dashboard/master/menu/master/satuan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Master Satuan
                </Link>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}
