// MenuMasterStokBarang-Basetroli.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getLaporanStokBarangAll
} from "../../../../services/apiService";
import LogoExcel from "../../../../image/icon/excel-document.svg";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../component/Alert";
import DialogTrueFalse from "../../../component/DialogTrueFalse";
import Loading from "../../../component/Loading";
import Error from "../../../component/Error";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


// ========== FilterSelect Component ==========
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
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
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

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
          {filteredOptions.map((option, idx) => (
            <li
              key={idx}
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

// ========== Main Component ==========
export default function MenuMasterStokBarangBasetroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog & delete
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBarangId, setSelectedBarangId] = useState(null);

  // Alert
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Redux
  const token = useSelector((s) => s.auth.token);
  const id_user = useSelector((s) => s.auth.id_user);
  const id_tokoString = useSelector((s) => s.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  // Search & table states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filter states
  const [kodeBahanFilter, setKodeBahanFilter] = useState("");
  const [namaBahanFilter, setNamaBahanFilter] = useState("");
  const [lokasiFilter, setLokasiFilter] = useState("");
  const [statusBarangFilter, setStatusBarangFilter] = useState("");
  const [satuanFilter, setSatuanFilter] = useState("");

  // Unique filter values
  const uniqueKodeBahan = useMemo(
    () => [...new Set(data.map((i) => i.kode_bahan_baku || ""))],
    [data]
  );
  const uniqueNamaBahan = useMemo(
    () => [...new Set(data.map((i) => i.nama_bahan_baku || ""))],
    [data]
  );
  const uniqueLokasi = useMemo(
    () => [...new Set(data.map((i) => i.nama_lokasi || ""))],
    [data]
  );
  const uniqueStatusBarang = useMemo(() => {
    const sts = data.map((i) => (i.status === 0 ? "Aktif" : "Tidak Aktif"));
    return [...new Set(sts)];
  }, [data]);
  const uniqueSatuan = useMemo(
    () => [...new Set(data.map((i) => i.nama_satuan || ""))].filter(Boolean),
    [data]
  );

  // ----- FETCH -----
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const stokData = await getLaporanStokBarangAll(token);
        const rows = Array.isArray(stokData) ? stokData : Object.values(stokData);
        setData(rows);
        setFilteredData(rows);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to fetch stok barang data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Refresh
  const handleRefresh = () => {
    setLoading(true);
    setKodeBahanFilter("");
    setNamaBahanFilter("");
    setLokasiFilter("");
    setStatusBarangFilter("");
    setSatuanFilter("");
    setSearchTerm("");
    setTimeout(() => window.location.reload(), 500);
  };

// di dalam component MenuMasterStokBarangBasetroli, tepat setelah semua `useState` dan sebelum useEffect fetchData
useEffect(() => {
  // setInterval 2 menit = 120.000 ms
  const checkInterval = setInterval(() => {
    // cek apakah ada stok < 2000
    const hasLowStock = filteredData.some(
      (item) => Number(item.stok_bahan_baku) < 2000
    );
    if (hasLowStock) {
      setAlert({
        message: "Peringatan: Ada stok di bawah 2 kg!",
        type: "warning",
        visible: true,
      });
      // otomatis sembunyikan alert setelah 5 detik
      setTimeout(
        () => setAlert((prev) => ({ ...prev, visible: false })),
        10000
      );
    }
  }, 10000);

  return () => clearInterval(checkInterval);
}, [filteredData]);
  
  // ----- FILTERING -----
  useEffect(() => {
    let temp = [...data];

    if (kodeBahanFilter) {
      temp = temp.filter((i) =>
        (i.kode_bahan_baku || "").toLowerCase().includes(kodeBahanFilter.toLowerCase())
      );
    }
    if (namaBahanFilter) {
      temp = temp.filter((i) =>
        (i.nama_bahan_baku || "").toLowerCase().includes(namaBahanFilter.toLowerCase())
      );
    }
    if (lokasiFilter) {
      temp = temp.filter((i) =>
        (i.nama_lokasi || "").toLowerCase().includes(lokasiFilter.toLowerCase())
      );
    }
    if (statusBarangFilter) {
      if (statusBarangFilter === "Aktif") temp = temp.filter((i) => i.status === 0);
      else if (statusBarangFilter === "Tidak Aktif") temp = temp.filter((i) => i.status === 1);
    }
    if (satuanFilter) {
      temp = temp.filter((i) =>
        (i.nama_satuan || "").toLowerCase().includes(satuanFilter.toLowerCase())
      );
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      temp = temp.filter((i) => {
        return (
          String(i.id_bahan_baku || "").toLowerCase().includes(q) ||
          String(i.kode_bahan_baku || "").toLowerCase().includes(q) ||
          String(i.nama_bahan_baku || "").toLowerCase().includes(q) ||
          String(i.nama_lokasi || "").toLowerCase().includes(q) ||
          String(i.nama_kategori_bahan_baku || "").toLowerCase().includes(q) ||
          String(i.nama_kategori_adonan_produk || "").toLowerCase().includes(q) ||
          String(i.nama_satuan || "").toLowerCase().includes(q)
        );
      });
    }

    setFilteredData(temp);
    setCurrentPage(1);
  }, [
    data,
    kodeBahanFilter,
    namaBahanFilter,
    lokasiFilter,
    statusBarangFilter,
    satuanFilter,
    searchTerm,
  ]);

  // ----- SORT -----
  const sortedData = useMemo(() => {
    const list = [...filteredData];
    if (sortConfig.key !== null) {
      list.sort((a, b) => {
        const aVal = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : "";
        const bVal = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [filteredData, sortConfig]);

  // Pagination vars
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (k) => {
    let dir = "asc";
    if (sortConfig.key === k && sortConfig.direction === "asc") dir = "desc";
    setSortConfig({ key: k, direction: dir });
  };
  const paginate = (p) => setCurrentPage(p);

  // ----------------------------- ⇨ EXPORT EXCEL
  const handleExportExcel = () => {
    if (sortedData.length === 0) {
      setAlert({ message: "Tidak ada data untuk diekspor.", type: "error", visible: true });
      return;
    }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const lokasi = lokasiFilter || "All";

    const filename = `Laporan-Stok-Bahan-${lokasi}-${dd}${mm}${yyyy}.xlsx`;

    const exportData = sortedData.map((item, idx) => ({
      No: idx + 1,
      Lokasi: item.nama_lokasi || "Data tidak tersedia",
      "Kategori Bahan": item.nama_kategori_bahan_baku || "Data tidak tersedia",
      "Kode Bahan": item.kode_bahan_baku || "Data tidak tersedia",
      "Nama Bahan": item.nama_bahan_baku || "Data tidak tersedia",
      Stok: item.stok_bahan_baku ?? 0,
      Satuan: item.nama_satuan || "-",
      "Harga Beli": item.harga_beli_barang ?? 0,
      "Total Harga": item.total_harga ?? 0,
      Status: item.status === 0 ? "Aktif" : "Tidak Aktif",
      "DI BUAT OLEH": item.nama_user || "-",
      "DI BUAT TANGGAL": item.createAt
        ? new Date(item.createAt).toLocaleString("id-ID")
        : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stok Bahan");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, filename);

    setAlert({ message: "Export berhasil!", type: "success", visible: true });
    setTimeout(() => setAlert({ message: "", type: "", visible: false }), 2000);
  };
  // -----------------------------

  // Delete handlers (tidak diubah)
  const handleDeleteClick = (id) => {
    setSelectedBarangId(id);
    setIsDialogOpen(true);
  };
  const confirmDelete = async () => { /* ... (tidak diubah) ... */ };
  const cancelDelete = () => { setIsDialogOpen(false); setSelectedBarangId(null); };

  const formatRupiah = (n) =>
    n === undefined || n === null || isNaN(n)
      ? "Data tidak tersedia"
      : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
  const formatDate = (v) => {
    if (!v) return "Data tidak tersedia";
    const d = new Date(v);
    const pad = (x) => String(x).padStart(2, "0");
    return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}, ${pad(
      d.getUTCHours()
    )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="py-14 mb-10" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link
            to="/dashboard/adminpembelian"
            className="text-xs font-semibold text-blue-900"
          >
            Laporan
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4 text-gray-500 mx-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
          <Link
            to="/dashboard/adminpembelian/menu/masterstokbarang"
            className="text-xs font-semibold text-gray-400"
          >
            Laporan Stok Bahan Baku
          </Link>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white flex flex-col md:flex-row flex-wrap rounded-md shadow-md p-2 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-3/4">
          <FilterSelect
            label="Filter Kode Bahan"
            options={uniqueKodeBahan.map(String)}
            value={kodeBahanFilter}
            onChange={setKodeBahanFilter}
          />
          <FilterSelect
            label="Filter Nama Bahan"
            options={uniqueNamaBahan.map(String)}
            value={namaBahanFilter}
            onChange={setNamaBahanFilter}
          />
          <FilterSelect
            label="Filter Lokasi"
            options={uniqueLokasi.map(String)}
            value={lokasiFilter}
            onChange={setLokasiFilter}
          />
          <FilterSelect
            label="Filter Status"
            options={uniqueStatusBarang}
            value={statusBarangFilter}
            onChange={setStatusBarangFilter}
          />
          <FilterSelect
            label="Filter Satuan"
            options={uniqueSatuan}
            value={satuanFilter}
            onChange={setSatuanFilter}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 mt-2">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Laporan Stok Bahan Baku
          </p>
          {/* Search Bar */}
          <div className="w-2/5 sm:w-1/2 md:w-1/3">
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs h-8 rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* Right: Add Data Barang Button */}
          {/* EXPORT BUTTON */}
          <div
            className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
            onClick={handleExportExcel}
          >
            <button className="h-9 w-8 rounded-md flex items-center justify-center text-gray-700">
              <img src={LogoExcel} className="w-8 h-8" alt="Export to Excel" />
            </button>
            <p className="text-xs p-1 font-semibold text-blue-900">Export</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto" style={{ height: "60vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                {/* Tambahkan nomor urut */}
                <th
                  scope="col"
                  className="px-1 py-0.5 w-10 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  NO
                  {sortConfig.key === "no" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* <th
                  className="px-1 py-0.5 w-10 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("id_bahan_baku")}
                >
                  ID Bahan
                  {sortConfig.key === "id_bahan_baku" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th> */}
                <th
                  className="px-1 py-0.5 w-52 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_lokasi")}
                >
                  Lokasi
                  {sortConfig.key === "nama_lokasi" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_kategori_bahan_baku")}
                >
                  Kategori Bahan
                  {sortConfig.key === "nama_kategori_bahan_baku" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_bahan_baku")}
                >
                  Kode Bahan
                  {sortConfig.key === "kode_bahan_baku" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-48 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_bahan_baku")}
                >
                  Nama Bahan
                  {sortConfig.key === "nama_bahan_baku" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-16 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("stok_bahan_baku")}
                >
                  Stok
                  {sortConfig.key === "stok_bahan_baku" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_satuan")}
                >
                  Satuan
                  {sortConfig.key === "nama_satuan" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("harga_beli_barang")}
                >
                  Harga Beli
                  {sortConfig.key === "harga_beli_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("total_harga")}
                >
                  Total Harga
                  {sortConfig.key === "total_harga" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-16 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {sortConfig.key === "status" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-24 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_user")}
                >
                  DI BUAT OLEH
                  {sortConfig.key === "nama_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("createAt")}
                >
                  DI BUAT TANGGAL
                  {sortConfig.key === "createAt" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
    currentItems.map((item, index) => {
      // Prioritas 1: status === 1 → merah
      // Prioritas 2: status === 0 & stok < 2000 → orange
      // Lainnya (status === 0 & stok >= 2000) → lime
      const stok = Number(item.stok_bahan_baku) || 0;
      let rowBg;
      if (item.status === 1) {
        rowBg = "bg-red-500";
      } else if (stok < 2000) {
        rowBg = "bg-yellow-300";
      } else {
        rowBg = "bg-lime-500";
      }
                  return (
                    <tr
                      key={`${item.id_bahan_baku}-${index}`}
                      className={`border-b ${rowBg} text-gray-700`}
                    >
                      {/* Nomor Urut */}
                      <td className="px-2 py-0.5 border border-gray-700">
                        {indexOfFirstItem + index + 1}
                      </td>
                      {/* <td className="px-1 py-0.5 border border-gray-700">
                        {item.id_bahan_baku || "Data tidak tersedia"}
                      </td> */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.nama_lokasi || "Data tidak tersedia"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.nama_kategori_bahan_baku || "Data tidak tersedia"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.kode_bahan_baku || "Data tidak tersedia"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.nama_bahan_baku || "Data tidak tersedia"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.stok_bahan_baku || "0"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.nama_satuan || "Data tidak tersedia"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {formatRupiah(item.harga_beli_barang)}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {formatRupiah(item.total_harga)}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.status === 0 ? "Aktif" : "Tidak Aktif"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.nama_user || "Data tidak tersedia"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.createAt
                          ? formatDate(item.createAt)
                          : "Data tidak tersedia"}
                      </td>
                      {/* <td className="px-1 py-0.5 border border-gray-700 text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleEdit(item.id_bahan_baku)}
                            className="flex items-center justify-center px-1"
                            title="Edit"
                          >
                             <svg className="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5 8a4 4 0 1 1 7.796 1.263l-2.533 2.534A4 4 0 0 1 5 8zM9 13H7a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h2.172a3 3 0 0 1-.114-1.588l.674-3.372a3 3 0 0 1 .82-1.533L9 13zM18 8a2.907 2.907 0 0 0-2.056.852L9.967 14.92a1 1 0 0 0-.273.51l-.675 3.373a1 1 0 0 0 1.177 1.177l3.372-.675a1 1 0 0 0 .511-.273l6.07-6.07a2.91 2.91 0 0 0-.944-4.742A2.907 2.907 0 0 0 18 8z" />
                          </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item.id_bahan_baku)}
                            className="flex items-center justify-center px-1"
                            title="Delete"
                          >
                            <svg
                              className="w-5 h-5 text-red-700"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </td> */}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={14}
                    className="px-1 py-0.5 text-center text-gray-500"
                  >
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Subtotal Table */}
        <div className="mt-1">
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
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total Harga Beli
                </td>
                <td className="px-1 py-0.5 border border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (sum, item) => sum + Number(item.harga_beli_barang || 0),
                      0
                    )
                  )}
                </td>
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 font-semibold text-right uppercase bg-gray-300"
                >
                  Sub Total Harga Bahan
                </td>
                <td className="px-1 py-0.5 border border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (sum, item) => sum + Number(item.total_harga || 0),
                      0
                    )
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Dialog Confirmation Delete */}
        <DialogTrueFalse
          isOpen={isDialogOpen}
          title="Konfirmasi Penonaktifan"
          message="Apakah Anda yakin ingin menonaktifkan data barang ini?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />

        {/* Pagination + Items Per Page */}
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
              className="border border-gray-700 rounded-md text-xs p-1"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
          <span className="text-xs font-normal text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, sortedData.length)}
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
                className={`flex items-center justify-center py-1 px-1 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-700 hover:bg-gray-100 hover:text-gray-700 ${
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
                className={`flex items-center justify-center text-xs py-1 px-1 text-gray-500 bg-white rounded-r-md border border-gray-700 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === totalPages
                    ? "cursor-not-allowed opacity-50"
                    : ""
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
