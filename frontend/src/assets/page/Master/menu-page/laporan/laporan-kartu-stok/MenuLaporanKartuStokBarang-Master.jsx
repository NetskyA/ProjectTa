// src/assets/page/component/MenuLaporanKartuStokBarangRetur.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { getLaporanKartuStokBarangAll, getLaporanMasterToko } from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Komponen FilterSelect (autocomplete sederhana)
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
    <div className="relative w-full md:w-44" ref={wrapperRef}>
      <label className="block mb-1 text-blue-900 font-semibold text-xs">
        {label}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowOptions(true)}
        className="border border-gray-300 text-xs rounded-md p-1 w-full"
        placeholder="Pilih atau ketik..."
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute top-6 right-2 text-red-500 text-sm"
          title="Clear"
        >
          &times;
        </button>
      )}
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto mt-1">
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
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-2 text-xs text-gray-500">
          Tidak ada opsi
        </div>
      )}
    </div>
  );
}

export default function MenuLaporanKartuStokBarangRetur() {
  // Data dan status
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Filter state
  const [selectedToko, setSelectedToko] = useState("");
  const [kodeBarang, setKodeBarang] = useState("");
  const [noPemesanan, setNoPemesanan] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [noTransaksi, setNoTransaksi] = useState("");
  const [kodePackinglist, setKodePackinglist] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination dan Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user); // Pastikan ini mengambil dari Redux state
  const id_toko = useSelector((state) => state.auth.id_toko);
  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);

  // Ambil data laporan kartu stok retur dari API tanpa filter id_toko
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const laporanData = await getLaporanKartuStokBarangAll(token);
        console.log("Data laporan:", laporanData);
        // Asumsikan API mengembalikan data berupa array objek
        const dataRows = Array.isArray(laporanData)
          ? laporanData
          : Object.values(laporanData);
          
        setData(dataRows);
        setFilteredData(dataRows);
      } catch (err) {
        console.error("Error dalam mengambil data laporan:", err);
        setError(err.message || "Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Ambil data master toko
  const [masterToko, setMasterToko] = useState([]);
  useEffect(() => {
    const fetchMasterToko = async () => {
      try {
        const tokoData = await getLaporanMasterToko(token);
        console.log("Data master toko:", tokoData);
        // Asumsikan data master toko berupa array objek
        const tokoRows = Array.isArray(tokoData)
          ? tokoData
          : Object.values(tokoData);
        // Filter data agar data dengan id_toko === 1 tidak ditampilkan
        const filteredTokoRows = tokoRows.filter(
          (toko) => parseInt(toko.id_toko) !== 1
        );
        setMasterToko(filteredTokoRows);
      } catch (err) {
        console.error("Error dalam mengambil data master toko:", err);
      }
    };
    fetchMasterToko();
  }, [token]);
  

  // Buat nilai unik untuk filter
  const uniqueKodeBarang = [
    ...new Set(data.map((item) => (item.kode_barang ? String(item.kode_barang) : ""))),
  ].filter(Boolean);
  const uniqueNoPemesanan = [
    ...new Set(data.map((item) => (item.no_pemesanan ? String(item.no_pemesanan) : ""))),
  ].filter(Boolean);
  const uniqueNamaBarang = [
    ...new Set(data.map((item) => (item.namabarang ? String(item.namabarang) : ""))),
  ].filter(Boolean);
  const uniqueNoTransaksi = [
    ...new Set(data.map((item) => (item.No_Transaksi ? String(item.No_Transaksi) : ""))),
  ].filter(Boolean);
  const uniqueKodePackinglist = [
    ...new Set(data.map((item) => (item.kode_packinglist ? String(item.kode_packinglist) : ""))),
  ].filter(Boolean);

  // Filter data berdasarkan input filter
  useEffect(() => {
    let filtered = data;

    // Filter berdasarkan dropdown Toko
    if (selectedToko) {
      filtered = filtered.filter((item) => String(item.id_toko) === String(selectedToko));
    }

    if (kodeBarang) {
      filtered = filtered.filter((item) =>
        item.kode_barang && item.kode_barang.toLowerCase().includes(kodeBarang.toLowerCase())
      );
    }

    if (noPemesanan) {
      filtered = filtered.filter((item) =>
        item.no_pemesanan && item.no_pemesanan.toLowerCase().includes(noPemesanan.toLowerCase())
      );
    }

    if (namaBarang) {
      filtered = filtered.filter((item) =>
        item.namabarang && item.namabarang.toLowerCase().includes(namaBarang.toLowerCase())
      );
    }

    if (noTransaksi) {
      filtered = filtered.filter((item) =>
        item.No_Transaksi && item.No_Transaksi.toLowerCase().includes(noTransaksi.toLowerCase())
      );
    }

    if (kodePackinglist) {
      filtered = filtered.filter((item) =>
        item.kode_packinglist && item.kode_packinglist.toLowerCase().includes(kodePackinglist.toLowerCase())
      );
    }

    // Filter berdasarkan rentang tanggal; asumsikan properti "Tanggal" berisi string tanggal
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((item) => {
        if (!item.Tanggal) return false;
        const itemDate = new Date(item.Tanggal);
        return itemDate >= start;
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter((item) => {
        if (!item.Tanggal) return false;
        const itemDate = new Date(item.Tanggal);
        return itemDate <= end;
      });
    }

    // Filter tambahan dengan searchTerm, mencari semua nilai di tabel
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          (item.kode_barang && item.kode_barang.toLowerCase().includes(lower)) ||
          (item.namabarang && item.namabarang.toLowerCase().includes(lower)) ||
          (item.no_pemesanan && item.no_pemesanan.toLowerCase().includes(lower)) ||
          (item.No_Transaksi && item.No_Transaksi.toLowerCase().includes(lower)) ||
          (item.kode_packinglist && item.kode_packinglist.toLowerCase().includes(lower))
        );
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [selectedToko, kodeBarang, noPemesanan, namaBarang, startDate, endDate, noTransaksi, kodePackinglist, searchTerm, data]);
  
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Data tidak tersedia";
    const date = new Date(dateString);
    const padZero = (num) => String(num).padStart(2, "0");
    const hours = padZero(date.getUTCHours());
    const minutes = padZero(date.getUTCMinutes());
    const seconds = padZero(date.getUTCSeconds());
    const time = `${hours}:${minutes}:${seconds}`;
    const day = padZero(date.getUTCDate());
    const month = padZero(date.getUTCMonth() + 1);
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}, ${time}`;
  };

  // Sorting data
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];
        aKey =
          aKey !== undefined && aKey !== null ? aKey.toString().toLowerCase() : "";
        bKey =
          bKey !== undefined && bKey !== null ? bKey.toString().toLowerCase() : "";
        if (aKey < bKey) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aKey > bKey) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Gunakan useMemo untuk menghitung total pada kolom Nominal_Masuk, Nominal_Keluar, dan Nominal_Saldo
  const totalNominalMasuk = useMemo(
    () => filteredData.reduce((sum, item) => sum + Number(item.Nominal_Masuk || 0), 0),
    [filteredData]
  );
  const totalNominalKeluar = useMemo(
    () => filteredData.reduce((sum, item) => sum + Number(item.Nominal_Keluar || 0), 0),
    [filteredData]
  );
  const totalNominalSaldo = useMemo(
    () => filteredData.reduce((sum, item) => sum + Number(item.Nominal_Saldo || 0), 0),
    [filteredData]
  );

  // Export Excel
  const handleExport = () => {
    if (sortedData.length === 0) {
      setAlert({ message: "Tidak ada data untuk diekspor.", type: "error", visible: true });
      return;
    }

    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const yyyy = currentDate.getFullYear();
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const filename = `Laporan-Kartu-Stok-Barang-Retur-${dd}${mm}${yyyy}-${randomNumber}.xlsx`;

    const exportData = sortedData.map((item, index) => ({
      No: indexOfFirstItem + index + 1,
      "Kode Barang": item.kode_barang || "",
      "Nama Barang": item.namabarang || "",
      "Tanggal": item.Tanggal || "",
      "No Transaksi": item.No_Transaksi || "",
      "No Pemesanan": item.no_pemesanan || "",
      "Kode Packinglist": item.kode_packinglist || "",
      "Nama Toko": item.nama_toko || "",
      "Keterangan": item.Keterangan || "",
      "Masuk": item.Masuk || "",
      "Keluar": item.Keluar || "",
      "Saldo": item.Saldo || "",
      "Nominal Masuk": item.Nominal_Masuk || "",
      "Nominal Keluar": item.Nominal_Keluar || "",
      "Nominal Saldo": item.Nominal_Saldo || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Kartu Stok Barang Retur");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, filename);

    setAlert({ message: "Export berhasil!", type: "success", visible: true });
    setTimeout(() => {
      setAlert({ message: "", type: "", visible: false });
    }, 2000);
  };

  // Refresh
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {/* Breadcrumb / Header */}
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <Link to="/dashboard/master" className="text-xs font-semibold text-blue-900">
            Laporan
          </Link>
          <div className="ml-1 mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            Laporan Kartu Stok
          </span>
        </div>
        <div className="flex items-center">
          <button onClick={handleRefresh} className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300">
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-2 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full">
          {/* Dropdown Filter Toko */}
          <div className="relative w-full md:w-44">
            <label className="block mb-1 text-blue-900 font-semibold text-xs">
              Filter Toko
            </label>
            <select
              value={selectedToko}
              onChange={(e) => setSelectedToko(e.target.value)}
              className="border border-gray-300 text-xs rounded-md p-1 w-full"
            >
              <option value="">Semua Toko</option>
              {masterToko.map((toko, index) => (
                <option key={index} value={toko.id_toko}>
                  {toko.nama_toko}
                </option>
              ))}
            </select>
          </div>
          <FilterSelect label="Filter Kode Barang" options={uniqueKodeBarang} value={kodeBarang} onChange={setKodeBarang} />
          <FilterSelect label="Filter No Pemesanan" options={uniqueNoPemesanan} value={noPemesanan} onChange={setNoPemesanan} />
          <FilterSelect label="Filter Nama Barang" options={uniqueNamaBarang} value={namaBarang} onChange={setNamaBarang} />
          <FilterSelect label="Filter No Transaksi" options={uniqueNoTransaksi} value={noTransaksi} onChange={setNoTransaksi} />
          <FilterSelect label="Filter Kode Packinglist" options={uniqueKodePackinglist} value={kodePackinglist} onChange={setKodePackinglist} />
          <div className="flex flex-col">
            <label className="block mb-1 text-blue-900 font-semibold text-xs">
              Filter Tanggal Mulai
            </label>
            <div className="flex gap-3">
              <input type="date" className="border border-gray-300 text-xs rounded-md p-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <input type="date" className="border border-gray-300 text-xs rounded-md p-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Export Section */}

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-2">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Laporan Kartu Stok
          </p>
          <div className="w-2/6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="simple-search"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs h-10 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div
            className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
            onClick={handleExport}
          >
            <button className="h-9 w-8 rounded-md flex items-center justify-center text-gray-700">
              <img src={LogoExcel} className="w-8 h-8" alt="Export to Excel" />
            </button>
            <p className="text-xs p-1 font-semibold text-blue-900">Export</p>
          </div>
        </div>
        <div className="overflow-x-auto" style={{ height: "56vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th scope="col" className="px-1 py-0.5 w-8 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("no")}>
                  No {sortConfig.key === "no" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-24 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("kode_barang")}>
                  Kode Barang {sortConfig.key === "kode_barang" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("namabarang")}>
                  Nama Barang {sortConfig.key === "namabarang" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("No_Transaksi")}>
                  No Transaksi {sortConfig.key === "No_Transaksi" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("no_pemesanan")}>
                  No Pemesanan {sortConfig.key === "no_pemesanan" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("kode_packinglist")}>
                  Kode Packinglist {sortConfig.key === "kode_packinglist" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("nama_toko")}>
                  Toko {sortConfig.key === "nama_toko" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-48 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("Keterangan")}>
                  Keterangan {sortConfig.key === "Keterangan" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-16 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("Masuk")}>
                  Masuk {sortConfig.key === "Masuk" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-16 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("Keluar")}>
                  Keluar {sortConfig.key === "Keluar" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-16 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("Saldo")}>
                  Saldo {sortConfig.key === "Saldo" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("Nominal_Masuk")}>
                  Nominal Masuk {sortConfig.key === "Nominal_Masuk" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("Nominal_Keluar")}>
                  Nominal Keluar {sortConfig.key === "Nominal_Keluar" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("Nominal_Saldo")}>
                  Nominal Saldo {sortConfig.key === "Nominal_Saldo" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10" onClick={() => handleSort("Tanggal")}>
                  Tanggal {sortConfig.key === "Tanggal" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr key={`${item.kode_barang}-${index}`} className="border-b text-gray-700">
                    <td className="px-1 py-0.5 border border-gray-700">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.kode_barang || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.namabarang || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.No_Transaksi || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.no_pemesanan || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.kode_packinglist || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_toko || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.Keterangan || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.Masuk !== undefined ? item.Masuk : "0"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.Keluar !== undefined ? item.Keluar : "0"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.Saldo !== undefined ? item.Saldo : "0"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {formatRupiah(item.Nominal_Masuk) !== undefined ? formatRupiah(item.Nominal_Masuk) : "0"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {formatRupiah(item.Nominal_Keluar) !== undefined ? formatRupiah(item.Nominal_Keluar) : "0"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {formatRupiah(item.Nominal_Saldo) !== undefined ? formatRupiah(item.Nominal_Saldo) : "0"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {formatDate(item.Tanggal) || "Data tidak ditemukan"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="py-4 px-4 text-center text-gray-500 border-b">
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-0.5">
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <tfoot>
              <tr className="font-semibold text-blue-900 bg-gray-200">
                <td
                  colSpan={11}
                  className="px-2 py-1 border border-gray-700 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub total Nominal Masuk
                </td>
                <td className="px-2 py-1 border border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(totalNominalMasuk)}
                </td>
                <td className="px-2 py-0 border uppercase border-gray-700 font-semibold text-right bg-gray-300">
                  Sub total Nominal Keluar
                </td>
                <td className="px-2 py-1 border border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(totalNominalKeluar)}
                </td>
                <td
                  className="px-2 py-1 border uppercase border-gray-700 font-semibold text-right bg-gray-300"
                >
                  Sub total Nominal Saldo
                </td>
                <td className="px-2 py-1 border border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(totalNominalSaldo)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* Pagination Section */}
        <nav
          className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mt-4"
          aria-label="Table navigation"
        >
          <div className="flex items-center space-x-2">
            <label htmlFor="itemsPerPage" className="text-xs text-gray-700">
              Tampilkan:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md text-xs p-1"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
          <span className="text-xs font-normal text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedData.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {sortedData.length}
            </span>
          </span>
          <ul className="inline-flex items-stretch -space-x-px">
            <li>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center justify-center py-1 px-1 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <span>Previous</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center text-xs py-1 px-1 text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <span>Next</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
