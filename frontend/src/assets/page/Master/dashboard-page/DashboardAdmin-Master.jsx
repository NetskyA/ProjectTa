/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useRef } from "react";
import LineGraph from "../../../image/icon/chart-column.svg";
import BarGraph from "../../../image/icon/chart-line.svg";
import LogoExcel from "../../../image/icon/excel-document.svg";
import LogoMoney from "../../../image/icon/icon-money.svg";
import LogoStockUp from "../../../image/icon/icon-stockup.svg";
import Loading from "../../component/Loading.jsx";
import LogoStockDown from "../../../image/icon/icon-stokdown.svg";
import LogoBasket from "../../../image/icon/icon-basket.svg";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbarside from "../../Master/navbar/Navbarside-Master";
import NavbarUp from "../../Master/navbar/NavbarUp-Master";
import Footer from "../../component/Footer";
import axios from "axios";
import DialogTrueFalse from "../../component/DialogTrueFalse.jsx";
import { clearAuth } from "../../../store/index.js";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  getLaporanPenjualanDetailMasterAll,
  getLaporanPenjualanMasterProgress,
  getLaporanStokBarangAll,
  getMasterLokasiStore,
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

// Tempatkan FilterSelect di sini
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options || []);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      (options || []).filter((option) => {
        if (typeof option !== "string") return false;
        return option.toLowerCase().includes(inputValue.toLowerCase());
      })
    );
  }, [inputValue, options]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setInputValue(option);
    setShowOptions(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setShowOptions(true);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setShowOptions(false);
  };

  return (
    <div className="relative w-44" ref={wrapperRef}>
      <label className="block text-blue-900 font-semibold text-lg">
        {label}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowOptions(true)}
        className="border border-gray-300 text-xs rounded-md p-1 h-7 w-44"
        placeholder="Pilih atau ketik lokasi"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute top-6 mt-0.5 right-2 text-red-500 text-xl"
          title="Clear"
        >
          &times;
        </button>
      )}
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-40 w-44 bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1">
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              onClick={() => handleSelect(option)}
              className="px-1 py-1.5 hover:bg-gray-200 cursor-pointer text-xs"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      {showOptions && filteredOptions.length === 0 && (
        <div className="absolute z-10 w-44 bg-white border border-gray-300 rounded-md mt-1 p-2 text-xs text-gray-500">
          Tidak ada opsi
        </div>
      )}
    </div>
  );
}


/* ───── constant & helper ───── */
const parseDateID = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const MIN_QTY = 50;
const LOW_STOCK_MAX = 2000;
const MS_DAY = 24 * 60 * 60 * 1000;

/* ─────────────────── component ──────────────────── */
export default function DashboardAdminMaster() {
  /* routing & auth */
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { role, username } = useSelector((s) => s.auth);
  const id_user = useSelector((state) => state.auth.id_user); // Pastikan ini mengambil dari Redux state
  const id_toko = useSelector((state) => state.auth.id_toko); // Tetap diambil dari Redux state
  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);
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
  const isMainPath = location.pathname === "/dashboard/master";

  /* ───── state ───── */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lokasiList, setLokasiList] = useState([]);
  const [selectedLokasi, setSelectedLokasi] = useState("");

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
  const [kategoriData, setKategoriData] = useState([]);
  const [omzetHarian, setOmzetHarian] = useState([]);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [selectedOrderId, setSelectedOrderId] = useState(null);
const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false); 

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

  const handlePembelianBarang = () => {
  if (selectedOrderId) {
    navigate(`/dashboard/master/menu/pembelianbarang/detail/${selectedOrderId}`);
  }
};

const handleSalesOrder = () => {
  if (selectedOrderId) {
    navigate(`/dashboard/master/menu/salesorder/detail/${selectedOrderId}`);
  }
};

const handleCancelDialog = () => {
  setIsDialogOpen(false);
  setSelectedOrderId(null);
};


  /* alert */
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });
  const calculateSelisih = () => {
    if (omzetHarian.length < 2) return { persen: 0, selisih: 0 };

    const today = omzetHarian[0].omzet;
    const yesterday = omzetHarian[1].omzet;
    const selisih = today - yesterday;
    const persen = yesterday === 0 ? 100 : (selisih / yesterday) * 100;

    return { persen, selisih };
  };
  /* ───── logout helper ───── */
  const handleLogout = () => {
    localStorage.clear();
    dispatch(clearAuth());
    delete axios.defaults.headers.common["Authorization"];
    navigate("/");
  };

    // Fungsi untuk memformat rupiah
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };
  const cancelDelete = () => {
    setIsDialogOpen(false);
    setSelectedId(null);
  };
  /* ───── fetch data once ───── */
/* ───── fetch data once ───── */
useEffect(() => {
  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1️⃣ Fetch semua data API terlebih dahulu
      const penDet = await getLaporanPenjualanDetailMasterAll();
      const sbRes = await getLaporanStokBarangAll();
      const ordRaw = await getLaporanPenjualanMasterProgress();
      const lokasiRes = await getMasterLokasiStore();

      // 2️⃣ Proses data Penjualan Detail
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
          id_kategori_produk: r.id_kategori_produk,
          nama_kategori_produk: r.nama_kategori_produk,
          nama_lokasi: r.nama_lokasi ?? "",  // pastikan nama_lokasi ada
        }))
        .sort((a, b) => parseDateID(a.date) - parseDateID(b.date));

      const filteredSeries = selectedLokasi
        ? series.filter((item) => item.nama_lokasi === selectedLokasi)
        : series;

      setTimeSeries(filteredSeries);

      // 3️⃣ Proses data Stok Barang
      const sbArr = Array.isArray(sbRes) ? sbRes : Object.values(sbRes);
      const low = sbArr.filter((i) => i.stok_bahan_baku <= LOW_STOCK_MAX);

      setExportStokSB(low);
      setStokBarangData(
        low.map((i) => ({
          namabarang: `${i.kode_bahan_baku}-${i.nama_bahan_baku.slice(0, 50)}`,
          stok: i.stok_bahan_baku,
        }))
      );

      // 4️⃣ Proses data Progress Pesanan
      const rawData = Array.isArray(ordRaw) ? ordRaw[0] : ordRaw;
      const orderArr = Object.values(rawData)
        .filter((o) => o?.kode_pesanan_pembelian)
        .map((o) => ({
          id: o.id_master_pesanan_pembelian,
          no: o.kode_pesanan_pembelian,
          status: o.status_progres_text,
          rawStatus: o.status_progres,
          id_store: o.id_store,
          nama_lokasi: o.nama_lokasi ?? "",
        }));
      setOrders(orderArr);

      // 5️⃣ Proses penggabungan lokasi
// 5️⃣ Proses penggabungan lokasi berdasarkan master lokasi
const masterLokasiArr = Object.values(lokasiRes); // getMasterLokasiStore()
const masterLokasiMap = new Map(masterLokasiArr.map(l => [l.id_lokasi, l.nama_lokasi]));

// Gabungkan id_lokasi dari seluruh sumber
const lokasiDariPenjualan = rows.map((r) => r.id_lokasi).filter(Boolean);
const lokasiDariProgress = orderArr.map((o) => o.id_store).filter(Boolean);
const lokasiDariStok = sbArr.map((s) => s.id_lokasi).filter(Boolean);

// Gabungkan semua id_lokasi
const semuaIdLokasi = [...lokasiDariPenjualan, ...lokasiDariProgress, ...lokasiDariStok];

// Buat unique id_lokasi
const uniqueIdLokasi = Array.from(new Set(semuaIdLokasi));

// Filter hanya id_lokasi yang ada di master lokasi
const lokasiValid = uniqueIdLokasi
  .filter(id => masterLokasiMap.has(id))
  .map(id => ({
    id_lokasi: id,
    nama_lokasi: masterLokasiMap.get(id)
  }));

setLokasiList(lokasiValid);


      // 6️⃣ Proses omzet harian
// Ganti bagian omzet harian jadi:
const omzetPerTanggal = filteredSeries.reduce((acc, curr) => {
  const tanggal = curr.date;
  if (!acc[tanggal]) {
    acc[tanggal] = { tanggal, omzet: 0, transaksi: 0 };
  }
  acc[tanggal].omzet += curr.rawTotal;
  acc[tanggal].transaksi += 1;
  return acc;
}, {});


      const omzetArray = Object.values(omzetPerTanggal)
        .sort((a, b) => parseDateID(b.tanggal) - parseDateID(a.tanggal))
        .slice(0, 10);

      let twoDaysData = omzetArray.filter((v) => v.omzet > 0).slice(0, 2);
      if (twoDaysData.length < 2) {
        twoDaysData = [...twoDaysData, { tanggal: "-", omzet: 0, transaksi: 0 }];
      }
      setOmzetHarian(twoDaysData);

      // 7️⃣ Produk populer (≥50)
      const buildTop = (arr) =>
        Object.values(
          arr.reduce((a, c) => {
            const k = c.kode;
            a[k] = a[k] || { namaproduk: `${k}-${c.nama.slice(0, 20)}`, qty: 0 };
            a[k].qty += c.qty;
            return a;
          }, {})
        )
          .filter((o) => o.qty >= MIN_QTY)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 15);

      setProductData({
        daily: buildTop(series),
        monthly: buildTop(series.map((o) => ({ ...o, date: o.date.slice(0, 7) }))),
        yearly: buildTop(series.map((o) => ({ ...o, date: o.date.slice(0, 4) }))),
      });

      // 8️⃣ Kategori Penjualan
      const kategoriMap = {};
      series.forEach((item) => {
        const idKategori = item.id_kategori_produk ?? "UNKNOWN";
        const namaKategori = item.nama_kategori_produk ?? "Lainnya";
        if (!kategoriMap[idKategori]) {
          kategoriMap[idKategori] = {
            id_kategori_produk: idKategori,
            nama_kategori_produk: namaKategori,
            total_qty: 0,
          };
        }
        kategoriMap[idKategori].total_qty += item.qty;
      });
      const kategoriArray = Object.values(kategoriMap)
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 5);
      setKategoriData(kategoriArray);

    } catch (e) {
      console.error(e);
      setError(e.message || "Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  };
  fetchAll();
}, [selectedLokasi]);


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
    .filter((o) => {
      const statusMatch = orderFilter === "ALL"
        ? true
        : orderFilter === "PRODUKSI"
        ? o.rawStatus === 1
        : orderFilter === "SELESAI"
        ? o.rawStatus === 4
        : false;

      const lokasiMatch = selectedLokasi
        ? o.nama_lokasi === selectedLokasi
        : true;

      return statusMatch && lokasiMatch;
    })
    .sort((a, b) => b.date - a.date);
}, [orders, orderFilter, selectedLokasi]);


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

  const handleExportKategori = () => {
    if (!kategoriData.length) return;
    exportToXLSX(
      "PenjualanKategoriTertinggi.xlsx",
      kategoriData.map((it, i) => ({
        No: i + 1,
        Kategori: it.nama_kategori_produk,
        Qty: it.total_qty,
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

  const renderKategoriChart = () => {
    return revType === "BarChart" ? (
      <BarChart data={kategoriData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nama_kategori_produk" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="total_qty" fill="#FF3B3F" name="Qty (Pcs)" />
      </BarChart>
    ) : (
      <LineChart data={kategoriData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nama_kategori_produk" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line dataKey="total_qty" stroke="#FF3B3F" name="Qty (Pcs)" />
      </LineChart>
    );
  };

  /* ───── UI ───── */
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {alert.visible && (
        <div className={`alert ${alert.type}`}>{alert.message}</div>
      )}

                {/* tampilkan loading global ketika data sedang di-fetch */}
          {loading && (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
              <Loading />
            </div>
          )}

{isMenuDialogOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300">
    {/* Modal dengan animasi scale-up */}
    <div className="bg-white rounded-lg shadow-lg w-fit transform transition-transform duration-300 scale-100">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <h3 className="text-lg font-semibold">Pilih Jenis Detail Transaksi</h3>
        <button
          onClick={() => {
            setIsMenuDialogOpen(false);
            setSelectedOrderId(null);
          }}
          className="text-gray-600 hover:text-gray-800"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-sm">Silahkan pilih salah satu menu detail yang ingin Anda buka.</p>
      </div>

      {/* Footer */}
      <div className="flex justify-center px-4 py-2 border-t gap-2">
        <button
          onClick={() => {
            handlePembelianBarang();
            setIsMenuDialogOpen(false);
            setSelectedOrderId(null);
          }}
          className="px-4 py-2 w-full text-sm text-white bg-blue-700 rounded hover:bg-blue-900"
        >
          Pembelian Barang
        </button>
        <button
          onClick={() => {
            handleSalesOrder();
            setIsMenuDialogOpen(false);
            setSelectedOrderId(null);
          }}
          className="px-4 py-2 w-full text-sm text-white bg-green-600 rounded hover:bg-green-800"
        >
          Sales Order
        </button>
      </div>

      {/* Cancel */}
      <div className="flex justify-center px-4 py-2 border-t">
        <button
          onClick={() => {
            setIsMenuDialogOpen(false);
            setSelectedOrderId(null);
          }}
          className="px-4 py-2 w-full text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
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
              <div className="mb-2 bg-white p-2 shadow rounded flex justify-between items-center">
<FilterSelect
  label="Filter Lokasi"
  options={lokasiList.map(l => l.nama_lokasi)}
  value={selectedLokasi}
  onChange={setSelectedLokasi}
/>
              </div>
              <div className="flex flex-wrap gap-2">
                
                {/* Pendapatan */}
                <div className="flex-1 min-w-[300px] bg-white p-2 shadow rounded">
                  <h3 className="text-md font-semibold">Penjualan Produk</h3>
                  <div className="flex justify-between items-center">
                    {/* type chart */}
                    <div className="flex justify-between items-center gap-1">
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
                   <div className="flex justify-between items-center gap-1">
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
                    <div className="flex justify-between items-center gap-1">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {filteredOrders.map((o, i) => (
                      <div
                        key={i}
                        className="flex w-full min-w-0 cursor-pointer"
onDoubleClick={() => {
  setSelectedOrderId(o.id);
  setIsDialogOpen(true);
}}



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

              {/* ROW 3 */}
              <div className="flex flex-wrap gap-2 mt-4 mb-32">
                {/* stok rendah */}
                <div className="flex-1 min-w-[300px] bg-white p-2 shadow rounded">
                  <h3 className="text-md font-semibold">
                    5 Penjualan Kategori Tertinggi
                  </h3>
                  <div className="flex justify-between items-center">
                    {/* type chart */}
                    <div className="flex justify-between items-center gap-1">
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

                    {/* tombol export */}
                    <div className="flex gap-1">
                      <button
                        onClick={handleExportKategori}
                        title="Export ke Excel"
                      >
                        <img src={LogoExcel} className="w-8 h-8" alt="excel" />
                      </button>
                    </div>
                  </div>

                  <ResponsiveContainer
                    width="100%"
                    height={300}
                    style={{ fontSize: "12px" }}
                  >
                    {renderKategoriChart()}
                  </ResponsiveContainer>
                </div>

                {/* Omzet Harian */}
                <div className="flex-1 min-w-[300px] bg-white p-4 shadow rounded">
                  <h3 className="text-md font-semibold">Omzet Harian</h3>
                  {omzetHarian.length >= 2 && (
                    <div className="mt-2 m-5 text-sm">
                      <div className="flex">
                        <div className="w-1/2">
<div className="font-semibold text-xl">
  {omzetHarian[0].tanggal !== "-" 
    ? new Date(omzetHarian[0].tanggal).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-"}
</div>

<div className="flex w-full text-xl mt-2 items-center gap-2">
  <img src={LogoMoney} className="h-8 w-8" alt="" />{" "}
  {formatRupiah(omzetHarian[0].omzet)}
</div>


                        </div>
                                                  <div className="flex w-40 items-center gap-2">
                            <div className="">
                              <img
                                src={LogoBasket}
                                className="w-7 h-7"
                                alt=""
                              />
                            </div>{" "}
                            <div className="text-xl">
                              {omzetHarian[0].transaksi} Transaksi
                            </div>
                          </div>
                      </div>

                      <div className="flex mt-3">
                        <div className="w-1/2">
<div className="font-semibold text-xl">
  {omzetHarian[1].tanggal !== "-" 
    ? new Date(omzetHarian[1].tanggal).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-"}
</div>

                          <div className="flex w-full mt-2 text-xl items-center gap-2">
                            <img src={LogoMoney} className="h-8 w-8" alt="" />{" "}
                            {formatRupiah(omzetHarian[1].omzet)}
                          </div>

                        </div>
                            <div className="flex w-40 items-center gap-2">
                            <div className="">
                              <img
                                src={LogoBasket}
                                className="w-7 h-7"
                                alt=""
                              />
                            </div>{" "}
                            <div className="text-xl">
                              {omzetHarian[1].transaksi} Transaksi
                            </div>
                          </div>
                      </div>

                      <div className="mt-4 text-xl font-semibold">
                        Selisih
                        <br />
                        {(() => {
                          const { persen, selisih } = calculateSelisih();
                          const color =
                            persen >= 0 ? "text-green-600" : "text-red-600";
                          const icon =
                            persen >= 0 ? (
                              <div className="logostockop h-12">
                                <img
                                  className="w-10 h-12"
                                  src={LogoStockUp}
                                  alt=""
                                />
                              </div>
                            ) : (
                              <div className="logostokdown h-12">
                                <img
                                  className="w-10 h-12"
                                  src={LogoStockDown}
                                  alt=""
                                />
                              </div>
                            );
                          return (
<span className={`${color} flex items-center gap-2`}>
  {icon} {persen.toFixed(2)}% ({formatRupiah(selisih)})
</span>

                          );
                        })()}
                      </div>
                    </div>
                  )}
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
<DialogTrueFalse
  isOpen={isDialogOpen}
  title="Pilih Menu Detail"
  message="Silahkan pilih ''Yes'' untuk membuka detail"
  onConfirm={() => {
    setIsDialogOpen(false);
    setIsMenuDialogOpen(true);
  }}
  onCancel={() => {
    setIsDialogOpen(false);
    setSelectedOrderId(null);
  }}
/>




    </div>
  );
}
