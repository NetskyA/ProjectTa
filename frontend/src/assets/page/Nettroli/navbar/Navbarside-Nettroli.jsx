import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import LogoSales from "../../../image/icon/icon-sales.svg";
import LogoPelunasan from "../../../image/icon/icon-pelunasan.svg";
import LogoLaporan from "../../../image/icon/icon-laporan.svg";

export default function Navbarside({ role }) {
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const [isPelunasanOpen, setIsPelunasanOpen] = useState(false);
  const [isLaporanOpen, setIsLaporanOpen] = useState(false);
  const location = useLocation();

  const toggleMasterMenu = () => {
    setIsMasterOpen(!isMasterOpen);
  };

  const togglePelunasanMenu = () => {
    setIsPelunasanOpen(!isPelunasanOpen);
  };

  const toggleLaporanMenu = () => {
    setIsLaporanOpen(!isLaporanOpen);
  };

  return (
    <div className="w-38" style={{ fontFamily: "sans-serif" }}>
      <ul>
        <li className="mt-14 pt-1 m-2">
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
              <li className="m-1">
                <Link
                  to="menu/laporanpenjualan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/laporanpenjualan" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/laporanpenjualan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Penjualan
                </Link>
              </li>
              <li className="m-1">
                <Link
                  to="menu/laporanpackinglist"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname ===
                      "/dashboard/menu/laporanpackinglist" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/laporanpackinglist"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Packing List
                </Link>
              </li>
              <li className="m-1">
                <Link
                  to="menu/laporanstok"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/laporanstok" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/laporanstok"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Stock
                </Link>
              </li>
              <li className="m-1">
                <Link
                  to="menu/laporanretur"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/laporanretur" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/laporanretur"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Laporan Retur
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* Menu Utama Penjualan */}
        <li className="mt-0 pt-0 m-2">
          <div className="group">
            <button
              onClick={toggleMasterMenu}
              className={`w-full flex items-center py-0.5 font-normal text-left text-white bg-blue-600 hover:text-white ${
                isMasterOpen
                  ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                  : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
              }`}
            >
              <img src={LogoSales} className="w-3 h-3 ml-2" alt="" />

              <span className="ml-2 text-sm font-medium">Penjualan</span>
            </button>
          </div>

          {/* Submenu */}
          {isMasterOpen && (
            <ul className="mt-1 relative">
              {/*Laporan */}
              {/* <li className="m-1">
                <Link
                  to="menu/laporan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/laporan" ||
                    location.pathname === "/dashboard/master-admin/menu/laporan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Menu Laporan
                </Link>
              </li> */}

              {/*Import */}
              <li className="m-1">
                <Link
                  to="menu/import"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/import" ||
                    location.pathname === "/dashboard/master-admin/menu/import"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Menu Import
                </Link>
              </li>

              <li className="m-1">
                <Link
                  to="menu/notapenjualan"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/notapenjualan" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/notapenjualan"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Nota Penjualan
                </Link>
              </li>

              <li className="m-1">
                <Link
                  to="menu/notapenjualan/detail"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname ===
                      "/dashboard/menu/notapenjualan/detail" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/notapenjualan/detail"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Packing List
                </Link>
              </li>

              <li className="m-1">
                <Link
                  to="menu/notapenjualan/batal"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname ===
                      "/dashboard/menu/notapenjualan/batal" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/notapenjualan/batal"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Batal Packing List
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* Menu Utama Pelunasan */}
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
              <img src={LogoPelunasan} className="w-4 h-4 ml-2" alt="" />
              <span className="ml-1 text-xs font-medium">Pelunasan</span>
            </button>
          </div>

          {/* Submenu */}
          {isPelunasanOpen && (
            <ul className="mt-1 pl-0.5 relative">
              <li className="m-1">
                <Link
                  to="menu/pelunasan1"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pelunasan1" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/pelunasan1"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Pelunasan 1
                </Link>
              </li>
              <li className="m-1">
                <Link
                  to="menu/pelunasan2"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pelunasan2" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/pelunasan2"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Pelunasan 2
                </Link>
              </li>
              <li className="m-1">
                <Link
                  to="menu/pelunasan3"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pelunasan3" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/pelunasan3"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Pelunasan 3
                </Link>
              </li>
              <li className="m-1">
                <Link
                  to="menu/pelunasan4"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pelunasan4" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/pelunasan4"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Pelunasan 4
                </Link>
              </li>
              <li className="m-1">
                <Link
                  to="menu/pelunasan5"
                  className={`block py-1 px-2 text-xs text-white rounded-sm ${
                    location.pathname === "/dashboard/menu/pelunasan5" ||
                    location.pathname ===
                      "/dashboard/master-admin/menu/pelunasan5"
                      ? "bg-slate-100 bg-opacity-30 rounded-sm hover:bg-blue-900"
                      : "hover:bg-blue-900 bg-opacity-30 rounded-sm"
                  }`}
                >
                  Pelunasan 5
                </Link>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}
