// src/assets/page/component/MenuLaporanMasterBarang-Basetroli.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getLaporanMasterDataBarang } from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Komponen FilterSelect sesuai contoh
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
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              onClick={() => handleSelect(option)}
              className="px-1 py-0.5.5 hover:bg-gray-200 cursor-pointer text-xs"
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

export default function MenuLaporanMasterBarangBasetroli() {
  const [data, setData] = useState([]); // Data asli dari API
  const [filteredData, setFilteredData] = useState([]); // Data setelah difilter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });
  const navigate = useNavigate();

  // Filter state baru berdasarkan value yang diambil dari API getLaporanMasterDataBarang
  const [nama_lokasi, setNama_lokasi] = useState("");
  const [nama_kategori_produk, setNama_kategori_produk] = useState("");
  const [nama_kategori_bahan_baku, setNama_kategori_bahan_baku] = useState("");
  const [nama_kategori_adonan_produk, setNama_kategori_adonan_produk] = useState("");

  // Filter tanggal (digunakan untuk field createAt)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  // Untuk memetakan status: 0 = "Aktif", 1 = "Tidak Aktif"
  const mapStatus = useMemo(() => ({ "0": "Aktif", "1": "Tidak Aktif" }), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const laporanData = await getLaporanMasterDataBarang(token);
        // console.log("laporanData:", laporanData);

        // Jika laporanData bukan array, gunakan reduce untuk menggabungkan nilai-nilainya
        const dataRows = Array.isArray(laporanData)
          ? laporanData
              .reduce((acc, item) => acc.concat(Object.values(item)), [])
              .filter((row) => typeof row === "object")
          : Object.values(laporanData);

        // Hapus filter berdasarkan id_toko sehingga seluruh data ditampilkan
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

  // Fungsi format Tanggal (dd/MM/yyyy, HH:mm:ss)
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

  // Fungsi format Rupiah (jika diperlukan)
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  const handleRefresh = () => {
    setLoading(true);
    setNama_lokasi("");
    setNama_kategori_produk("");
    setNama_kategori_bahan_baku("");
    setNama_kategori_adonan_produk("");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Nilai unik untuk filter berdasarkan field baru
  const uniqueNamaLokasi = [...new Set(data.map((item) => item.nama_lokasi))].filter(Boolean);
  const uniqueKategoriProduk = [...new Set(data.map((item) => item.nama_kategori_produk))].filter(Boolean);
  const uniqueKategoriBahanBaku = [...new Set(data.map((item) => item.nama_kategori_bahan_baku))].filter(Boolean);
  const uniqueKategoriAdonan = [...new Set(data.map((item) => item.nama_kategori_adonan_produk))].filter(Boolean);

  // Filter data berdasarkan filter yang diinput
  useEffect(() => {
    let filtered = data;

    if (nama_lokasi) {
      filtered = filtered.filter(
        (item) => item.nama_lokasi.toLowerCase() === nama_lokasi.toLowerCase()
      );
    }
    if (nama_kategori_produk) {
      filtered = filtered.filter(
        (item) =>
          item.nama_kategori_produk.toLowerCase() ===
          nama_kategori_produk.toLowerCase()
      );
    }
    if (nama_kategori_bahan_baku) {
      filtered = filtered.filter(
        (item) =>
          item.nama_kategori_bahan_baku.toLowerCase() ===
          nama_kategori_bahan_baku.toLowerCase()
      );
    }
    if (nama_kategori_adonan_produk) {
      filtered = filtered.filter(
        (item) =>
          item.nama_kategori_adonan_produk.toLowerCase() ===
          nama_kategori_adonan_produk.toLowerCase()
      );
    }

    // Filter berdasarkan tanggal (menggunakan properti createAt)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter((item) => {
        if (!item.createAt) return false;
        const itemDate = new Date(item.createAt);
        return itemDate >= start && itemDate <= end;
      });
    } else if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((item) => {
        if (!item.createAt) return false;
        const itemDate = new Date(item.createAt);
        return itemDate >= start;
      });
    } else if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter((item) => {
        if (!item.createAt) return false;
        const itemDate = new Date(item.createAt);
        return itemDate <= end;
      });
    }

    // Filter berdasarkan search term (mencakup kode_produk, nama_produk, nama_lokasi, dan semua filter kategori)
    const lowercasedFilter = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return (
          (item.kode_produk &&
            item.kode_produk.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_produk &&
            item.nama_produk.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_lokasi &&
            item.nama_lokasi.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_kategori_produk &&
            item.nama_kategori_produk.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_kategori_bahan_baku &&
            item.nama_kategori_bahan_baku.toLowerCase().includes(lowercasedFilter)) ||
          (item.nama_kategori_adonan_produk &&
            item.nama_kategori_adonan_produk.toLowerCase().includes(lowercasedFilter))
        );
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [
    nama_lokasi,
    nama_kategori_produk,
    nama_kategori_bahan_baku,
    nama_kategori_adonan_produk,
    startDate,
    endDate,
    searchTerm,
    data,
  ]);

  // Sorting data
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];
        aKey =
          aKey !== undefined && aKey !== null
            ? aKey.toString().toLowerCase()
            : "";
        bKey =
          bKey !== undefined && bKey !== null
            ? bKey.toString().toLowerCase()
            : "";
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

  // Handler sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Handler Export Excel (Bagian ini di-comment, tinggal uncomment jika dibutuhkan)
//   const handleExport = () => {
//     if (sortedData.length === 0) {
//       setAlert({
//         message: "Tidak ada data untuk diekspor.",
//         type: "error",
//         visible: true,
//       });
//       return;
//     }
//
//     const currentDate = new Date();
//     const dd = String(currentDate.getDate()).padStart(2, "0");
//     const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
//     const yyyy = currentDate.getFullYear();
//
//     // Gunakan filter nama_lokasi jika ada, jika tidak, gunakan "All"
//     const exportLokasi = nama_lokasi ? nama_lokasi : "All";
//     const filename = `Laporan-Master-Barang-${exportLokasi}-${dd}${mm}${yyyy}.xlsx`;
//
//     const exportData = sortedData.map((item, index) => ({
//       No: indexOfFirstItem + index + 1,
//       "Nama Lokasi": item.nama_lokasi || "Data tidak ditemukan",
//       "Kategori Produk": item.nama_kategori_produk || "Data tidak ditemukan",
//       "Kategori Bahan Baku": item.nama_kategori_bahan_baku || "Data tidak ditemukan",
//       "Kategori Adonan Produk": item.nama_kategori_adonan_produk || "Data tidak ditemukan",
//       "Kode Produk": item.kode_produk || "Data tidak ditemukan",
//       "Nama Produk": item.nama_produk || "Data tidak ditemukan",
//       "Nama Satuan": item.nama_satuan || "Data tidak ditemukan",
//       Status: item.status !== undefined
//         ? Number(item.status) === 0 ? "Aktif" : "Tidak Aktif"
//         : "Data tidak ditemukan",
//       "DI BUAT OLEH": item.nama_user || "Data tidak ditemukan",
//       "DI BUAT TANGGAL": formatDate(item.createAt),
//     }));
//
//     const worksheet = XLSX.utils.json_to_sheet(exportData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Master Barang");
//
//     const excelBuffer = XLSX.write(workbook, {
//       bookType: "xlsx",
//       type: "array",
//     });
//
//     const dataBlob = new Blob([excelBuffer], {
//       type: "application/octet-stream",
//     });
//
//     saveAs(dataBlob, filename);
//
//     setAlert({
//       message: "Export berhasil!",
//       type: "success",
//       visible: true,
//     });
//     setTimeout(() => {
//       setAlert({ message: "", type: "", visible: false });
//     }, 2000);
//   };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} />;
  }

  // Handler Edit - navigasi ke halaman update menggunakan id_produk
  const handleEdit = (idProduk) => {
    // console.log("Navigating to update page with id_produk:", idProduk);
    navigate(`/dashboard/master/menu/laporan/databarang/detail/${idProduk}`);
  };

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() =>
            setAlert((prev) => ({ ...prev, visible: false }))
          }
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="cover flex items-center">
          <Link
            to="/dashboard/basetroli"
            className="text-xs font-semibold text-blue-900"
          >
            Laporan
          </Link>
          <div className="ml-1 mr-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-700 mx-2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            Laporan Master Barang
          </span>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleRefresh}
            className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Bagian Filter */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-3/4">
          <FilterSelect
            label="Filter Lokasi"
            options={uniqueNamaLokasi.map(String)}
            value={nama_lokasi}
            onChange={setNama_lokasi}
          />
          <FilterSelect
            label="Filter Produk"
            options={uniqueKategoriProduk.map(String)}
            value={nama_kategori_produk}
            onChange={setNama_kategori_produk}
          />
          <FilterSelect
            label="Filter Bahan Baku"
            options={uniqueKategoriBahanBaku.map(String)}
            value={nama_kategori_bahan_baku}
            onChange={setNama_kategori_bahan_baku}
          />
          <FilterSelect
            label="Filter Adonan Produk"
            options={uniqueKategoriAdonan.map(String)}
            value={nama_kategori_adonan_produk}
            onChange={setNama_kategori_adonan_produk}
          />
          {/* Filter Tanggal */}
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Tanggal
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) {
                    setEndDate("");
                  }
                }}
                max={endDate || ""}
                placeholder="Start Date"
              />
              <input
                type="date"
                className="border border-gray-300 w-44 h-7 px-1 rounded-md text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || ""}
                placeholder="End Date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 w-full">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Laporan Produk
          </p>
          {/* Search Bar */}
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
                placeholder="Search by kode produk, nama produk, lokasi atau kategori"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* Export Button (di-comment, tinggal uncomment jika dibutuhkan) */}
          {/*
          <div
            className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer"
            onClick={handleExport}
          >
            <button className="h-9 w-8 rounded-md flex items-center justify-center text-gray-700">
              <img src={LogoExcel} className="w-8 h-8" alt="Export to Excel" />
            </button>
            <p className="text-xs p-1 font-semibold text-blue-900">Export</p>
          </div>
          */}
        </div>

        <div className="overflow-x-auto w-full" style={{ height: "56vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse" style={{ width: "100vw" }}>
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-8 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  No {sortConfig.key === "no" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_lokasi")}
                >
                  Lokasi {sortConfig.key === "nama_lokasi" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_kategori_produk")}
                >
                  Jenis Produk {sortConfig.key === "nama_kategori_produk" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_kategori_bahan_baku")}
                >
                  Kategori Bahan Baku {sortConfig.key === "nama_kategori_bahan_baku" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_kategori_adonan_produk")}
                >
                  Kategori Adonan Produk {sortConfig.key === "nama_kategori_adonan_produk" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_produk")}
                >
                  Kode Produk {sortConfig.key === "kode_produk" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-64 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_produk")}
                >
                  Nama Produk {sortConfig.key === "nama_produk" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_satuan")}
                >
                  Nama Satuan {sortConfig.key === "nama_satuan" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("status")}
                >
                  Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_user")}
                >
                  DI BUAT OLEH {sortConfig.key === "nama_user" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("createAt")}
                >
                  DI BUAT TANGGAL {sortConfig.key === "createAt" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                {/* Action Column */}
                <th
                  scope="col"
                   className="px-1 py-0.5 w-6 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => (
                  <tr
                    key={`${item.kode_produk}-${index}`} onDoubleClick={() => handleEdit(item.id_produk)}
                    className={`border-b hover:opacity-75 cursor-pointer text-gray-700 ${
                      Number(item.status) === 0
                        ? "bg-lime-500"
                        : Number(item.status) === 1
                        ? "bg-red-500"
                        : "bg-white"
                    }`}
                  >
                    <td className="px-1 py-0.5 border border-gray-700">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_lokasi || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_kategori_produk || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_kategori_bahan_baku || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_kategori_adonan_produk || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.kode_produk || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_produk || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border text-right border-gray-700">
                      {item.nama_satuan || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border font-semibold border-gray-700">
                      {Number(item.status) === 0 ? (
                        <p className="text-green-600">Aktif</p>
                      ) : (
                        <p className="text-red-700">Tidak Aktif</p>
                      )}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_user || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {formatDate(item.createAt) || "Data tidak ditemukan"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
  <div className="flex items-center justify-center">
    <button
      onClick={() => handleEdit(item.id_produk)}
      className="flex items-center justify-center"
      title="Detail"
    >
      <svg
        className="w-5 h-5 text-green-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M5 8a4 4 0 1 1 7.796 1.263l-2.533 2.534A4 4 0 0 1 5 8zM9 13H7a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h2.172a3 3 0 0 1-.114-1.588l.674-3.372a3 3 0 0 1 .82-1.533L9 13zM18 8a2.907 2.907 0 0 0-2.056.852L9.967 14.92a1 1 0 0 0-.273.51l-.675 3.373a1 1 0 0 0 1.177 1.177l3.372-.675a1 1 0 0 0 .511-.273l6.07-6.07a2.91 2.91 0 0 0-.944-4.742A2.907 2.907 0 0 0 18 8z" />
      </svg>
    </button>
  </div>
</td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="py-4 px-4 text-center text-gray-500 border-b"
                  >
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Subtotal Table (contoh subtotal, disesuaikan jika diperlukan) */}
        {/* SUB-TOTAL */}
        <div className="mt-1">
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <tfoot>
              <tr className="font-semibold text-blue-900 bg-gray-200">
                <td
                  colSpan={9}
                  className="px-1 py-0.5 border border-gray-700 text-right uppercase bg-gray-300"
                >
                  Sub Total Harga Jual
                </td>
                <td className="px-1 py-0.5 border text-right border-gray-700 font-semibold bg-lime-400">
                  {formatRupiah(
                    filteredData.reduce(
                      (s, i) => s + Number(i.harga_jual || 0),
                      0
                    )
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
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
                className={`flex items-center justify-center py-0.5 px-1 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
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
                className={`flex items-center justify-center text-xs py-0.5 px-1 text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
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
