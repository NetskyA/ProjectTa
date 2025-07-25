// Navbarside-adminpembelian.jsx

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAkseMenusUser } from "../../../services/apiService";
import Loading from "../../component/Loading";
import Undefined from "../../component/Undefined";
import LogoSales from "../../../image/icon/icon-sales.svg";
import LogoPelunasan from "../../../image/icon/icon-pelunasan.svg";
import LogoLaporan from "../../../image/icon/icon-laporan.svg";
import LogoKeuangan from "../../../image/icon/icon-keuangan.svg"; // Ikon Keuangan
import LogoPembelian from "../../../image/icon/icon-pembelian.svg"; // Ikon Pembelian
import LogoMaster from "../../../image/icon/logo-master.svg";
import LogoDashboard from "../../../image/icon/icon-dashboard.svg"; // Ikon Dashboard
import "aos/dist/aos.css";
import AOS from "aos";

export default function Navbarside({ role }) {
  const [isLaporanProgres, setIsLaporanProgres] = useState(false);
  const [isPenjualanOpen, setIsPenjualanOpen] = useState(false);
  const [isPelunasanOpen, setIsPelunasanOpen] = useState(false);
  const [isLaporanOpen, setIsLaporanOpen] = useState(false);
  const [isKeuanganOpen, setIsKeuanganOpen] = useState(false);
  const [isPembelianOpen, setIsPembelianOpen] = useState(false);
  const [isProduksiOpen, setIsProduksiOpen] = useState(false);
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allowedMenus, setAllowedMenus] = useState([]);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user);
  const id_toko = useSelector((state) => state.auth.id_toko);
  const token = useSelector((state) => state.auth.token);

  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);

  // Fungsi pembantu untuk cek akses berdasarkan nama menu
  const hasAccess = (menuName) => {
    return allowedMenus.some((item) => item.nama_menu === menuName);
  };
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Dapatkan semua data hak akses user dari backend
        const hakAksesMenu = await getAkseMenusUser();
        // Ubah objek menjadi array
        const menuArray = Object.values(hakAksesMenu);
        // Filter berdasarkan id_user dari Redux
        const filteredMenus = menuArray.filter(
          (item) => Number(item.id_user) === Number(id_user)
        );
        setAllowedMenus(filteredMenus);
        setError(null);
      } catch (err) {
        console.error("Error dalam mengambil data hak akses:", err);
        setError(err.message || "Gagal mengambil data hak akses.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id_toko, id_user]);

  const toggleLaporanProgres = () => {
    setIsLaporanProgres(!isLaporanProgres);
  };
  const togglePenjualanMenu = () => {
    setIsPenjualanOpen(!isPenjualanOpen);
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
  const toggleProduksiMenu = () => {
    setIsProduksiOpen(!isProduksiOpen);
  };

  const toggleMasterMenu = () => {
    setIsMasterOpen(!isMasterOpen);
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Undefined message={error} />;
  }

  return (
    <div className="w-44 mt-11" style={{ fontFamily: "sans-serif" }}>
      <ul>
        {/* Menu Utama Laporan */}
        {hasAccess("Dashboard") && (
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
                <img src={LogoDashboard} className="w-4 h-4 ml-2" alt="Laporan" />
                <span className="ml-1 text-xs font-medium">Dashboard</span>
              </button>
            </div>

            {/* Submenu Laporan */}
            {isLaporanProgres && (
              <ul className="mt-1 pl-0.5 relative">
                {hasAccess("Laporan Progres") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="1000">
                    <Link
                      to="/dashboard/adminpembelian"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/adminpembelian" ||
                        location.pathname === "/dashboard/adminpembelian"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Laporan Progres
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
        )}

        {hasAccess("Laporan") && (
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
                <img src={LogoLaporan} className="w-4 h-4 ml-2" alt="Laporan" />
                <span className="ml-1 text-xs font-medium">Laporan</span>
              </button>
            </div>

            {/* Submenu Laporan */}
            {isLaporanOpen && (
              <ul className="mt-1 pl-0.5 relative" >
                {hasAccess("Laporan Penjualan") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="400">
                    <Link
                      to="menu/laporanpenjualan"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/laporanpenjualan" ||
                        location.pathname ===
                          "/dashboard/adminpembelian/menu/laporanpenjualan"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Laporan Penjualan
                    </Link>
                  </li>
                )}
                {hasAccess("Laporan Produk") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="1000">
                    <Link
                      to="menu/laporanmasterbarang"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname ===
                          "/dashboard/menu/laporanmasterbarang" ||
                        location.pathname ===
                          "/dashboard/adminpembelian/menu/laporanmasterbarang"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Laporan Produk
                    </Link>
                  </li>
                )}
                {hasAccess("Laporan S.Bahan Baku") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                    <Link
                      to="menu/laporanmasterbarangstok"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname ===
                          "/dashboard/menu/laporanmasterbarangstok" ||
                        location.pathname ===
                          "/dashboard/adminpembelian/menu/laporanmasterbarangstok"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Laporan S. Bahan Baku
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
        )}

        
        {/* Menu Utama Pembelian */}
        {hasAccess("Pembelian") && (
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
                <img src={LogoPembelian} className="w-4 h-4 ml-2" alt="Pembelian" />
                <span className="ml-1 text-xs font-medium">Pembelian</span>
              </button>
            </div>

            {/* Submenu Pembelian */}
            {isPembelianOpen && (
              <ul className="mt-1 pl-0.5 relative">
                {hasAccess("Analisa & Pemesanan") && (
                  <li className="m-1"  data-aos="fade-right" data-aos-duration="1000">
                    <Link
                      to="menu/notapembelian"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/notapembelian" ||
                        location.pathname === "/dashboard/adminpembelian/menu/notapembelian"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Analisa & Pemesanan
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
        )}

        {/* Menu Utama Penjualan */}
        {hasAccess("Penjualan") && (
          <li className="mt-0 pt-0 m-2">
            <div className="group">
              <button
                onClick={togglePenjualanMenu}
                className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
                  isPenjualanOpen
                    ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                    : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                }`}
              >
                <img src={LogoSales} className="w-4 h-4 ml-2" alt="Penjualan" />
                <span className="ml-1 text-xs font-medium">Penjualan</span>
              </button>
            </div>

            {/* Submenu Penjualan */}
            {isPenjualanOpen && (
              <ul className="mt-1 pl-0.5 relative">
                {hasAccess("Import Penjualan") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="1000">
                    <Link
                      to="menu/import"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/import" ||
                        location.pathname === "/dashboard/adminpembelian/menu/import"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Import Penjualan
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
        )}


        {/* Menu Utama Pembelian */}
        {/* {hasAccess("Produksi") && (
          <li className="mt-0 pt-0 m-2">
            <div className="group">
              <button
                onClick={toggleProduksiMenu}
                className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
                  isProduksiOpen
                    ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                    : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                }`}
              >
                <img src={LogoPembelian} className="w-4 h-4 ml-2" alt="Pembelian" />
                <span className="ml-1 text-xs font-medium">Produksi</span>
              </button>
            </div>

            {isProduksiOpen&& (
              <ul className="mt-1 pl-0.5 relative">
                {hasAccess("Sales Order") && (
                  <li className="m-1"  data-aos="fade-right" data-aos-duration="1600">
                    <Link
                      to="menu/pembelianbarang"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/pembelianbarang" ||
                        location.pathname === "/dashboard/adminpembelian/menu/pembelianbarang"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Sales Order
                    </Link>
                  </li>
                )}
                {hasAccess("Gabungan permintaan") && (
                  <li className="m-1"  data-aos="fade-right" data-aos-duration="1600">
                    <Link
                      to="menu/pembelianbarang"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/pembelianbarang" ||
                        location.pathname === "/dashboard/adminpembelian/menu/pembelianbarang"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Gabungan Permintaan
                    </Link>
                  </li>
                )}
                {hasAccess("Produksi Produk") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                    <Link
                      to="menu/pembelianbarang"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/pembelianbarang" ||
                        location.pathname === "/dashboard/adminpembelian/menu/pembelianbarang"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Produksi Produk
                    </Link>
                  </li>
                )}
                {hasAccess("Bukti Pengeluaran") && (
                  <li className="m-1"  data-aos="fade-right" data-aos-duration="1600">
                    <Link
                      to="menu/pembelianbarang"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/pembelianbarang" ||
                        location.pathname === "/dashboard/adminpembelian/menu/pembelianbarang"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Bukti Pengeluaran
                    </Link>
                  </li>
                )}
                {hasAccess("Nota Pembelian") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                    <Link
                      to="menu/pembelianbarang"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/pembelianbarang" ||
                        location.pathname === "/dashboard/adminpembelian/menu/pembelianbarang"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Nota Pembelian
                    </Link>
                  </li>
                )}

              </ul>
            )}
          </li>
        )} */}

        {/* Menu Utama Master */}
        {hasAccess("Master") && (
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
                <img src={LogoMaster} className="w-4 h-4 ml-2" alt="Master" />
                <span className="ml-1 text-xs font-medium">Master</span>
              </button>
            </div>

            {/* Submenu Master */}
            {isMasterOpen && (
              <ul className="mt-1 pl-0.5 relative">
                {hasAccess("Master Produk") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="400">
                    <Link
                      to="menu/masterdatabarang"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/masterdatabarang" ||
                        location.pathname === "/dashboard/adminpembelian/menu/masterdatabarang"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Master Produk
                    </Link>
                  </li>
                )}
                {hasAccess("Master Adonan") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="1000">
                    <Link
                      to="menu/masterkategori"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/masterkategori" ||
                        location.pathname === "/dashboard/adminpembelian/menu/masterkategori"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Master Adonan
                    </Link>
                  </li>
                )}
                {hasAccess("Master Akun") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                    <Link
                      to="menu/masterakun"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/masterakun" ||
                        location.pathname === "/dashboard/adminpembelian/menu/masterakun"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Master Akun
                    </Link>
                  </li>
                )}
                {hasAccess("Master Akuntansi") && (
                  <li className="m-1" data-aos="fade-right" data-aos-duration="1600">
                    <Link
                      to="menu/masterakuntansi"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/masterakuntansi" ||
                        location.pathname === "/dashboard/adminpembelian/menu/masterakuntansi"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Master Akuntansi
                    </Link>
                  </li>
                )}
                {hasAccess("Master Kategori") && (
                  <li className="m-1">
                    <Link
                      to="menu/masterkategori"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/masterkategori" ||
                        location.pathname === "/dashboard/adminpembelian/menu/masterkategori"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Master Kategori
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
        )}

        {/* Menu Utama Pelunasan */}
        {hasAccess("Pelunasan") && (
          <li className="mt-0 pt-0 m-2">
            <div className="group">
              <button
                onClick={togglePelunasanMenu}
                className={`w-full flex items-center py-1 font-normal text-left text-white bg-blue-600 hover:text-white ${
                  isPelunasanOpen
                    ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                    : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                }`}
              >
                <img
                  src={LogoPelunasan}
                  className="w-4 h-4 ml-2"
                  alt="Pelunasan"
                />
                <span className="ml-1 text-xs font-medium">Pelunasan</span>
              </button>
            </div>

            {/* Submenu Pelunasan */}
            {isPelunasanOpen && (
              <ul className="mt-1 pl-0.5 relative">
                {hasAccess("Import Pelunasan") && (
                  <li className="m-1">
                    <Link
                      to="menu/import/pelunasan"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/import/pelunasan" ||
                        location.pathname ===
                          "/dashboard/adminpembelian/menu/import/pelunasan"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Import Pelunasan
                    </Link>
                  </li>
                )}
                {hasAccess("Transaksi Pelunasan") && (
                  <li className="m-1">
                    <Link
                      to="menu/transaksi/pelunasan"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname === "/dashboard/menu/transaksi/pelunasan" ||
                        location.pathname === "/dashboard/adminpembelian/menu/transaksi/pelunasan"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Transaksi Pelunasan
                    </Link>
                  </li>
                )}
               
              </ul>
            )}
          </li>
        )}

        {/* Menu Utama Keuangan */}
        {hasAccess("Keuangan") && (
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
                <span className="ml-1 text-xs font-medium">Keuangan</span>
              </button>
            </div>

            {/* Submenu Keuangan */}
            {isKeuanganOpen && (
              <ul className="mt-1 pl-0.5 relative">
                {hasAccess("Pelunasan Piutang") && (
                  <li className="m-1">
                    <Link
                      to="menu/pelunasankeuangan/piutang"
                      className={`block py-1 px-2 text-xs text-white rounded-sm ${
                        location.pathname ===
                          "/dashboard/menu/pelunasankeuangan/piutang" ||
                        location.pathname ===
                          "/dashboard/adminpembelian/menu/pelunasankeuangan/piutang"
                          ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                          : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                      }`}
                    >
                      Pelunasan Piutang
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
        )}

      </ul>
    </div>
  );
}
