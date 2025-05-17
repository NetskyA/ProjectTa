/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from "react";
import LineGraph from "../../../image/icon/chart-column.svg";
import BarGraph from "../../../image/icon/chart-line.svg";
import LogoExcel from "../../../image/icon/excel-document.svg";
import LogoProduksi from "../../../image/icon/logo-cooking.svg";
import LogoSelesai from "../../../image/icon/logo-check.svg";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbarside from "../../Bigtroli/navbar/Navbarside-Bigtroli.jsx";
import NavbarUp from "../../Bigtroli/navbar/NavbarUp-Bigtroli.jsx";
import Footer from "../../component/Footer";
import axios from "axios";
import { clearAuth } from "../../../store/index.js";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  getLaporanPenjualanDetailMasterAll,
  getLaporanPenjualanMasterProgress,
  getLaporanStokBarangAll,
} from "../../../../assets/services/apiService";

import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* ───── constant & helper ───── */
const parseDateID = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const MIN_QTY = 50;
const LOW_STOCK_MAX = 2000;
const MS_DAY = 24 * 60 * 60 * 1000;

/* ─────────────────── component ──────────────────── */
export default function DashboardAdminKitchen() {
  /* routing & auth */
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { role, username } = useSelector((s) => s.auth);

  const greet = () => {
    const h = new Date().getHours();
    return h >= 5 && h < 11
      ? "Selamat pagi"
      : h >= 11 && h < 15
      ? "Selamat siang"
      : h >= 15 && h < 19
      ? "Selamat sore"
      : "Selamat malam";
  };
  const isMainPath = location.pathname === "/dashboard/adminkitchen";

  /* ───── state ───── */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* pendapatan & produk */
  const [timeSeries, setTimeSeries] = useState([]);
  const [productData, setProductData] = useState({
    daily: [],
    monthly: [],
    yearly: [],
  });

  /* stok rendah */
  const [stokBarangData, setStokBarangData] = useState([]);
  const [exportStokSB, setExportStokSB] = useState([]);

  /* posisi pesanan */
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("ALL"); // ALL | PRODUKSI | SELESAI
  const [weekSpan, setWeekSpan] = useState(7); // 7 | 14

  /* chart option */
  const [revMode, setRevMode] = useState("daily");
  const [revType, setRevType] = useState("BarChart");
  const [prodMode, setProdMode] = useState("daily");
  const [prodType, setProdType] = useState("BarChart");
  const [stokType, setStokType] = useState("BarChart");

  /* alert */
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  /* ───── logout helper ───── */
  const handleLogout = () => {
    localStorage.clear();
    dispatch(clearAuth());
    delete axios.defaults.headers.common["Authorization"];
    navigate("/");
  };

  /* ───── fetch data once ───── */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        /* ── detail penjualan (grafik) */
        const penDet = await getLaporanPenjualanDetailMasterAll();
        // console.log("detail", penDet)
        const rows = Array.isArray(penDet)
          ? penDet.flatMap((o) => Object.values(o))
          : Object.values(penDet);

        const series = rows
          .filter((r) => r && typeof r === "object")
          .map((r) => ({
            date: r.tanggal_transaksi,
            rawTotal: +r.total_rp || 0,
            qty: +r.jumlah || 0,
            kode: r.kode_barang,
            nama: r.nama_produk,
          }))
          .sort((a, b) => parseDateID(a.date) - parseDateID(b.date));
        setTimeSeries(series);

        /* produk populer (≥50) */
        const buildTop = (arr) =>
          Object.values(
            arr.reduce((a, c) => {
              const k = c.kode;
              a[k] = a[k] || {
                namaproduk: `${k}-${c.nama.slice(0, 20)}`,
                qty: 0,
              };
              a[k].qty += c.qty;
              return a;
            }, {})
          )
            .filter((o) => o.qty >= MIN_QTY)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 15);

        setProductData({
          daily: buildTop(series),
          monthly: buildTop(
            series.map((o) => ({ ...o, date: o.date.slice(0, 7) }))
          ),
          yearly: buildTop(
            series.map((o) => ({ ...o, date: o.date.slice(0, 4) }))
          ),
        });

        /* ── stok rendah */
        const sbRes = await getLaporanStokBarangAll();
        const sbArr = Array.isArray(sbRes) ? sbRes : Object.values(sbRes);
        const low = sbArr.filter((i) => i.stok_bahan_baku <= LOW_STOCK_MAX);

        setExportStokSB(low);
        setStokBarangData(
          low.map((i) => ({
            namabarang: `${i.kode_bahan_baku}-${i.nama_bahan_baku.slice(
              0,
              50
            )}`,
            stok: i.stok_bahan_baku,
          }))
        );

        /* ── posisi pesanan (header) */
        const ordRaw = await getLaporanPenjualanMasterProgress();
        const rawData = Array.isArray(ordRaw) ? ordRaw[0] : ordRaw;

        const orderArr = Object.values(rawData)
          .filter((o) => o?.kode_pesanan_pembelian)
          .map((o) => ({
            id: o.id_master_pesanan_pembelian,
            no: o.kode_pesanan_pembelian,
            status: o.status_progres_text,
            rawStatus: o.status_progres,
          }));

        setOrders(orderArr);
      } catch (e) {
        console.error(e);
        setError(e.message || "Gagal mengambil data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ───── derivasi pendapatan ───── */
  const dailyRev = timeSeries;
  const monthlyRev = useMemo(() => {
    const m = {};
    timeSeries.forEach((t) => {
      const k = t.date.slice(0, 7);
      m[k] = (m[k] || 0) + t.rawTotal;
    });
    return Object.entries(m).map(([month, rawTotal]) => ({ month, rawTotal }));
  }, [timeSeries]);
  const yearlyRev = useMemo(() => {
    const y = {};
    timeSeries.forEach((t) => {
      const k = t.date.slice(0, 4);
      y[k] = (y[k] || 0) + t.rawTotal;
    });
    return Object.entries(y).map(([year, rawTotal]) => ({ year, rawTotal }));
  }, [timeSeries]);

  /* ───── filter pesanan: status & rentang minggu ───── */
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) =>
        orderFilter === "ALL"
          ? true
          : orderFilter === "PRODUKSI"
          ? o.rawStatus === 1
          : orderFilter === "SELESAI"
          ? o.rawStatus === 4
          : false
      )
      .sort((a, b) => b.date - a.date); // terbaru di atas
  }, [orders, orderFilter]);

  /* ───── generic export helper ───── */
  const exportToXLSX = (filename, data) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Sheet1");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), filename);
    setAlert({ message: "Export berhasil!", type: "success", visible: true });
    setTimeout(() => setAlert((a) => ({ ...a, visible: false })), 2000);
  };

  /* handlers export */
  const handleExportRevenue = () => {
    const map = { daily: dailyRev, monthly: monthlyRev, yearly: yearlyRev };
    const src = map[revMode] || [];
    exportToXLSX(
      `Pendapatan-${revMode}.xlsx`,
      src.map((d, i) => ({
        No: i + 1,
        Tanggal: d.date || d.month || d.year,
        Pendapatan: d.rawTotal,
      }))
    );
  };
  const handleExportProduct = () => {
    const src = productData[prodMode] || [];
    exportToXLSX(
      `ProdukTerbanyak-${prodMode}.xlsx`,
      src.map((d, i) => ({ No: i + 1, Produk: d.namaproduk, Qty: d.qty }))
    );
  };
  const handleExportStokLow = () => {
    if (!exportStokSB.length) return;
    exportToXLSX(
      "StokKurang.xlsx",
      exportStokSB.map((it, i) => ({
        No: i + 1,
        Kode: it.kode_bahan_baku,
        Nama: it.nama_bahan_baku,
        Stok: it.stok_bahan_baku,
        Satuan: it.nama_satuan,
      }))
    );
  };

  /* ───── renderer chart (pendapatan/prod/stok) ───── */
  const renderRevenueChart = () => {
    const dataMap = { daily: dailyRev, monthly: monthlyRev, yearly: yearlyRev };
    const data = dataMap[revMode] || [];
    const xKey =
      revMode === "daily" ? "date" : revMode === "monthly" ? "month" : "year";
    return revType === "BarChart" ? (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip formatter={(v) => v.toLocaleString("id-ID")} />
        <Legend />
        <Bar dataKey="rawTotal" fill="#4CAF50" name="Pendapatan (Rp)" />
      </BarChart>
    ) : (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip formatter={(v) => v.toLocaleString("id-ID")} />
        <Legend />
        <Line dataKey="rawTotal" stroke="#4CAF50" name="Pendapatan (Rp)" />
      </LineChart>
    );
  };
  const renderProductChart = () => {
    const data = productData[prodMode] || [];
    return prodType === "BarChart" ? (
      <BarChart layout="vertical" data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="namaproduk" fontSize={12} width={140} />
        <Tooltip />
        <Legend />
        <Bar dataKey="qty" fill="#2196F3" name="Qty (Pcs)" />
      </BarChart>
    ) : (
      <LineChart layout="vertical" data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="namaproduk" width={140} />
        <Tooltip />
        <Legend />
        <Line dataKey="qty" stroke="#2196F3" name="Qty (Pcs)" />
      </LineChart>
    );
  };
  const renderStokChart = () =>
    stokType === "BarChart" ? (
      <BarChart layout="vertical" data={stokBarangData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="namabarang" type="category" fontSize={12} width={140} />
        <Tooltip />
        <Legend />
        <Bar dataKey="stok" fill="#FF9800" name="Stok (gr)" />
      </BarChart>
    ) : (
      <LineChart layout="vertical" data={stokBarangData} height={20}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="namabarang" type="category" width={110} />
        <Tooltip />
        <Legend />
        <Line dataKey="stok" stroke="#FF9800" name="Stok (gr)" />
      </LineChart>
    );

  /* ───── UI ───── */
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {alert.visible && (
        <div className={`alert ${alert.type}`}>{alert.message}</div>
      )}

      {/* navbar atas */}
      <div className="fixed w-full z-10">
        <NavbarUp />
      </div>

      <div className="flex">
        {/* sidebar */}
        <div className="navbarside w-44 bg-gray-800 shadow-2xl fixed h-screen overflow-y-auto pb-8">
          <Navbarside role={role} />
        </div>

        {/* konten utama */}
        <div className="outlet ml-44 pl-2 -mt-3 mr-2 overflow-y-auto w-full">
          {isMainPath ? (
            <>
              <h2 className="text-2xl font-normal text-center capitalize mt-14 mb-2">
                {greet()}, Selamat Datang di Dashboard {username}
              </h2>

              {/* ROW 1 */}
              <div className="flex flex-wrap gap-2">
                {/* Pendapatan */}
                <div className="flex-1 min-w-[300px] bg-white p-2 shadow rounded">
                  <h3 className="text-md font-semibold">Penjualan Produk</h3>
                  <div className="flex justify-between items-center">
                    {/* type chart */}
                    <div>
                      <button
                        onClick={() => setRevType("BarChart")}
                        className={`px-1 py-1 ${
                          revType === "BarChart"
                            ? "bg-gray-300 rounded shadow"
                            : ""
                        }`}
                      >
                        <img src={LineGraph} className="h-5 w-5" alt="bar" />
                      </button>
                      <button
                        onClick={() => setRevType("LineChart")}
                        className={`px-1 py-1 ${
                          revType === "LineChart"
                            ? "bg-gray-300 rounded shadow"
                            : ""
                        }`}
                      >
                        <img src={BarGraph} className="h-5 w-5" alt="line" />
                      </button>
                    </div>
                    {/* mode & export */}
                    <div className="flex gap-1">
                      <button
                        onClick={handleExportRevenue}
                        title="Export ke Excel"
                      >
                        <img src={LogoExcel} className="w-8 h-8" alt="excel" />
                      </button>
                      {["daily", "monthly", "yearly"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setRevMode(m)}
                          className={`px-1 py-1 border rounded ${
                            revMode === m ? "bg-green-200" : ""
                          }`}
                        >
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                    style={{ fontSize: "12px" }}
                  >
                    {renderRevenueChart()}
                  </ResponsiveContainer>
                </div>

                {/* Produk populer */}
                <div className="flex-1 min-w-[300px] bg-white p-2 shadow rounded">
                  <h3 className="text-md font-semibold">
                    Penjualan Produk Terbanyak (≥ 50 pcs)
                  </h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <button
                        onClick={() => setProdType("BarChart")}
                        className={`px-1 py-1 ${
                          prodType === "BarChart"
                            ? "bg-gray-300 rounded shadow"
                            : ""
                        }`}
                      >
                        <img src={LineGraph} className="h-5 w-5" alt="bar" />
                      </button>
                      <button
                        onClick={() => setProdType("LineChart")}
                        className={`px-1 py-1 ${
                          prodType === "LineChart"
                            ? "bg-gray-300 rounded shadow"
                            : ""
                        }`}
                      >
                        <img src={BarGraph} className="h-5 w-5" alt="line" />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={handleExportProduct}
                        title="Export ke Excel"
                      >
                        <img src={LogoExcel} className="w-8 h-8" alt="excel" />
                      </button>
                      {["daily", "monthly", "yearly"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setProdMode(m)}
                          className={`px-1 py-1 border rounded ${
                            prodMode === m ? "bg-green-200" : ""
                          }`}
                        >
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                    style={{ fontSize: "11px" }}
                  >
                    {renderProductChart()}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ROW 2 */}
              <div className="flex flex-wrap gap-2 mt-4">
                {/* stok rendah */}
                <div className="flex-1 min-w-[300px] bg-white p-2 shadow rounded">
                  <h3 className="text-md font-semibold">
                    Stok Bahan Baku ≤ {LOW_STOCK_MAX.toLocaleString()} gr
                  </h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <button
                        onClick={() => setStokType("BarChart")}
                        className={`px-1 py-1 ${
                          stokType === "BarChart"
                            ? "bg-gray-300 rounded shadow"
                            : ""
                        }`}
                      >
                        <img src={LineGraph} className="h-5 w-5" alt="bar" />
                      </button>
                      <button
                        onClick={() => setStokType("LineChart")}
                        className={`px-1 py-1 ${
                          stokType === "LineChart"
                            ? "bg-gray-300 rounded shadow"
                            : ""
                        }`}
                      >
                        <img src={BarGraph} className="h-5 w-5" alt="line" />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={handleExportStokLow}
                        title="Export ke Excel"
                      >
                        <img src={LogoExcel} className="w-8 h-8" alt="excel" />
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                    style={{ fontSize: "11px" }}
                  >
                    {renderStokChart()}
                  </ResponsiveContainer>
                </div>

                {/* posisi pesanan */}
                <div className="flex-1 min-w-[300px] bg-white p-4 shadow rounded">
                  <div className="flex justify-between items-start">
                    <h3 className="text-md font-semibold">
                      Posisi Pesanan/hari ini
                    </h3>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                    {filteredOrders.map((o, i) => (
                      <div
                        key={i}
                        className="flex w-full min-w-0 cursor-pointer"
                        onDoubleClick={() =>
                          navigate(
                            `/dashboard/adminkitchen/menu/salesorder/detail/${o.id}`
                          )
                        }
                      >
                        <div
                          className={`px-2 h-10 w-52 flex items-center justify-center text-xs md:text-md font-semibold rounded-l ${
                            o.rawStatus === 4
                              ? "bg-lime-400 text-black"
                              : "bg-yellowshade text-black"
                          }`}
                        >
                          {o.no}
                        </div>
                        <div
                          className="px-2 h-10 flex items-center justify-center font-semibold text-white rounded-r bg-amber-500"
                          style={{ fontSize: "12px" }}
                        >
                          {o.status}
                        </div>
                      </div>
                    ))}

                    {!filteredOrders.length && (
                      <p className="text-sm text-gray-500 col-span-2">
                        Tidak ada pesanan.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Outlet />
          )}

          {loading && <p className="text-center mt-4">Loading…</p>}
          {error && <p className="text-center mt-4 text-red-500">{error}</p>}
        </div>
      </div>

      <Footer />
    </div>
  );
}
