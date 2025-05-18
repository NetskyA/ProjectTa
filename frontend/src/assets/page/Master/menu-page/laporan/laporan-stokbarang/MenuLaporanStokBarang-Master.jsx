// MenuLaporanStokBarangMaster.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getLaporanStokBarangAll,
  getLaporanStokBarangReturOnlyBsAll,
} from "../../../../../services/apiService"; // Pastikan path sesuai
import { useSelector } from "react-redux";
import LogoExcel from "../../../../../image/icon/excel-document.svg";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// -----------------------------------------------------------------------------
// Fungsi utilitas untuk memastikan data selalu berupa array of objects
// -----------------------------------------------------------------------------
function toArrayOfObjects(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "object") {
    return Object.values(value);
  }
  return [];
}

// -----------------------------------------------------------------------------
// Komponen FilterSelect (autocomplete sederhana)
// -----------------------------------------------------------------------------
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

export default function MenuLaporanStokBarangMaster() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // State untuk filter
  // Ubah filter:
  // - Filter Kode Barang menjadi Filter Kode Bahan (field: kode_bahan_baku)
  // - Filter Nama Barang menjadi Filter Nama Bahan (field: nama_bahan_baku)
  // - Filter Nama Toko menjadi Filter Lokasi (field: nama_lokasi)
  const [lokasi, setLokasi] = useState("");
  const [kodeBahan, setKodeBahan] = useState("");
  const [namaBahan, setNamaBahan] = useState("");

  // Tambahan filter untuk Satuan (field: nama_satuan)
  const [satuan, setSatuan] = useState("");

  // Filter Status (0 = Aktif, 1 = Tidak Aktif) – nanti gunakan dalam perbandingan
  const [status, setStatus] = useState("");

  // Search Term (untuk pencarian di beberapa kolom)
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Report Type: untuk pilihan tombol laporan
  // - reportType "gabungan" : gabungan (tidak diubah)
  // - reportType "induk" (diubah label menjadi "Stok G. Kitchen")
  // - reportType "bs" : tidak diubah
  const [reportType, setReportType] = useState("gabungan");

  // ---------------------------------------------------------------------------
  // Ambil data laporan sesuai dengan reportType
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let dataRows = [];

        if (reportType === "induk") {
          // Data untuk Stok G. Kitchen berasal dari getLaporanStokBarangAll
          const laporanData = await getLaporanStokBarangAll(/* token jika diperlukan */);
          dataRows = toArrayOfObjects(laporanData);
        } else if (reportType === "bs") {
          // Untuk BS, biarkan saja (tidak diubah)
          const laporanData = await getLaporanStokBarangReturOnlyBsAll(/* token jika diperlukan */);
          dataRows = toArrayOfObjects(laporanData);
        } else if (reportType === "gabungan") {
          // Gabungkan data dari keduanya
          const [laporanInduk, laporanBS] = await Promise.all([
            getLaporanStokBarangAll(/* token */),
            getLaporanStokBarangReturOnlyBsAll(/* token */),
          ]);
          const dataRowsInduk = toArrayOfObjects(laporanInduk);
          const dataRowsBS = toArrayOfObjects(laporanBS);
          // Tambahkan properti gudang untuk penanda (jika diperlukan)
          dataRowsInduk.forEach((row) => (row.gudang = "Gudang Induk"));
          dataRowsBS.forEach((row) => (row.gudang = "Gudang BS"));
          dataRows = [...dataRowsInduk, ...dataRowsBS];
        }

        // Catatan: Filter berdasarkan id_toko jika diperlukan bisa ditambahkan di sini
        // console.log("Data laporan (final):", dataRows);
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
  }, [reportType]);

  // ---------------------------------------------------------------------------
  // Fungsi format Rupiah
  // ---------------------------------------------------------------------------
  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };
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
  // ---------------------------------------------------------------------------
  // Filter Unique Value untuk dropdown (sesuai field dari getLaporanStokBarangAll)
  // ---------------------------------------------------------------------------
  const uniqueLokasi = useMemo(() => {
    return [...new Set(data.map((item) => item.nama_lokasi || ""))].filter(Boolean);
  }, [data]);

  const uniqueKodeBahan = useMemo(() => {
    return [...new Set(data.map((item) => item.kode_bahan_baku || ""))].filter(Boolean);
  }, [data]);

  const uniqueNamaBahan = useMemo(() => {
    return [...new Set(data.map((item) => item.nama_bahan_baku || ""))].filter(Boolean);
  }, [data]);

  const uniqueSatuan = useMemo(() => {
    return [...new Set(data.map((item) => item.nama_satuan || ""))].filter(Boolean);
  }, [data]);

  const uniqueStatus = useMemo(() => {
    const statuses = data.map((item) =>
      item.status === 0 ? "Aktif" : "Tidak Aktif"
    );
    return [...new Set(statuses)];
  }, [data]);

  // ---------------------------------------------------------------------------
  // Handle Refresh
  // ---------------------------------------------------------------------------
  const handleRefresh = () => {
    setLoading(true);
    setLokasi("");
    setKodeBahan("");
    setNamaBahan("");
    setSatuan("");
    setStatus("");
    setSearchTerm("");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // ---------------------------------------------------------------------------
  // Filtering & Search
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let tempData = [...data];

    // Filter berdasarkan kode_bahan_baku
    if (kodeBahan) {
      tempData = tempData.filter((item) =>
        (item.kode_bahan_baku || "")
          .toLowerCase()
          .includes(kodeBahan.toLowerCase())
      );
    }

    // Filter berdasarkan nama_bahan_baku
    if (namaBahan) {
      tempData = tempData.filter((item) =>
        (item.nama_bahan_baku || "")
          .toLowerCase()
          .includes(namaBahan.toLowerCase())
      );
    }

    // Filter berdasarkan lokasi (nama_lokasi)
    if (lokasi) {
      tempData = tempData.filter((item) =>
        (item.nama_lokasi || "")
          .toLowerCase()
          .includes(lokasi.toLowerCase())
      );
    }

    // Filter berdasarkan satuan (nama_satuan)
    if (satuan) {
      tempData = tempData.filter((item) =>
        (item.nama_satuan || "")
          .toLowerCase()
          .includes(satuan.toLowerCase())
      );
    }

    // Filter berdasarkan status (field status: 0 = Aktif, 1 = Tidak Aktif)
    if (status) {
      if (status === "Aktif") {
        tempData = tempData.filter((item) => item.status === 0);
      } else if (status === "Tidak Aktif") {
        tempData = tempData.filter((item) => item.status === 1);
      }
    }

    // Global Search: cari di beberapa field
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      tempData = tempData.filter((item) => {
        return (
          String(item.id_bahan_baku || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.kode_bahan_baku || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.nama_bahan_baku || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.nama_lokasi || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.nama_kategori_bahan_baku || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.nama_satuan || "")
            .toLowerCase()
            .includes(lower)
        );
      });
    }

    setFilteredData(tempData);
    setCurrentPage(1);
  }, [data, kodeBahan, namaBahan, lokasi, satuan, status, searchTerm]);

  // ---------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];
        // Tangani null/undefined
        aKey = aKey !== undefined && aKey !== null ? aKey.toString().toLowerCase() : "";
        bKey = bKey !== undefined && bKey !== null ? bKey.toString().toLowerCase() : "";
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

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ---------------------------------------------------------------------------
  // Export Excel (tetap menggunakan reportType yang ada)
  // ---------------------------------------------------------------------------
  const handleExport = () => {
    if (sortedData.length === 0) {
      setAlert({
        message: "Tidak ada data untuk diekspor.",
        type: "error",
        visible: true,
      });
      return;
    }

    let reportName = "Laporan Stok Barang";
    if (reportType === "gabungan") {
      reportName = "Laporan Stok Bahan Baku Gabungan";
    } else if (reportType === "induk") {
      // Ubah label untuk data yang berasal dari getLaporanStokBarangAll
      reportName = "Stok G. Kitchen";
    } else if (reportType === "bs") {
      reportName = "Laporan Stok Barang G. BS";
    }

    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const yyyy = currentDate.getFullYear();
    const formattedDate = `${dd}${mm}${yyyy}`;
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const filename = `${reportName}-${formattedDate}-${randomNumber}.xlsx`;

    // Untuk export, sesuaikan kolom yang digunakan berdasarkan field baru
    const exportData = sortedData.map((item, index) => ({
      No: indexOfFirstItem + index + 1,
      "ID Bahan": item.id_bahan_baku || "",
      Lokasi: item.nama_lokasi || "",
      "Kategori Bahan": item.nama_kategori_bahan_baku || "",
      "Kode Bahan": item.kode_bahan_baku || "",
      "Nama Bahan": item.nama_bahan_baku || "",
      "Stok Bahan": item.stok_bahan_baku || 0,
      Satuan: item.nama_satuan || "",
      "Harga Beli": item.harga_beli_barang || 0,
      "Total Harga": item.total_harga || 0,
      Status: item.status === 0 ? "Aktif" : "Tidak Aktif",
      "DI BUAT OLEH": item.nama_user || "",
      "DI BUAT TANGGAL": item.createAt ? formatDate(item.createAt) : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "StokBarang");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(dataBlob, filename);

    setAlert({
      message: "Export berhasil!",
      type: "success",
      visible: true,
    });
    setTimeout(() => {
      setAlert({ message: "", type: "", visible: false });
    }, 2000);
  };

  // ---------------------------------------------------------------------------
  // Loading & Error Handling
  // ---------------------------------------------------------------------------
  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {/* Header Breadcrumb */}
      <div className="head flex justify-between items-center mb-0.5">
        <div className="cover flex items-center">
          <Link to="/dashboard/master" className="text-xs font-semibold text-blue-900">
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
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-xs font-semibold text-gray-400">
            {reportType === "gabungan"
              ? "Laporan Stok Bahan Baku"
              : reportType === "induk"
              ? "Stok G. Kitchen"
              : "Laporan Stok Barang G. BS"}
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

      {/* Tombol Pilihan Laporan */}
      {/* <div className="flex flex-wrap bg-gray-300 shadow-md rounded-md w-fit mb-2">
        <div className="gap-2">
          <button
            className={`px-3 py-1 m-1 w-32 font-semibold text-xs rounded-md ${
              reportType === "gabungan"
                ? "bg-blue-900 text-white"
                : "bg-white text-blue-900"
            }`}
            onClick={() => setReportType("gabungan")}
          >
            Stok Gabungan
          </button>
          <button
            className={`px-3 py-1 m-1 w-32 font-semibold text-xs rounded-md ${
              reportType === "induk"
                ? "bg-blue-900 text-white"
                : "bg-white text-blue-900"
            }`}
            onClick={() => setReportType("induk")}
          >
            Stok G. Induk
          </button>
          <button
            className={`px-3 py-1 m-1 w-32 font-semibold text-xs rounded-md ${
              reportType === "bs"
                ? "bg-blue-900 text-white"
                : "bg-white text-blue-900"
            }`}
            onClick={() => setReportType("bs")}
          >
            Stok G. BS
          </button>
        </div>
      </div> */}

      {/* Filter Section */}
      <div className="bg-white flex flex-col md:flex-row rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-3/4">
          <FilterSelect
            label="Filter Lokasi"
            options={uniqueLokasi}
            value={lokasi}
            onChange={setLokasi}
          />
          <FilterSelect
            label="Filter Kode Bahan"
            options={uniqueKodeBahan}
            value={kodeBahan}
            onChange={setKodeBahan}
          />
          <FilterSelect
            label="Filter Nama Bahan"
            options={uniqueNamaBahan}
            value={namaBahan}
            onChange={setNamaBahan}
          />
          <FilterSelect
            label="Filter Satuan"
            options={uniqueSatuan}
            value={satuan}
            onChange={setSatuan}
          />
          <FilterSelect
            label="Filter Status"
            options={uniqueStatus}
            value={status}
            onChange={setStatus}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 w-full">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold absolute left-1 text-blue-900">
            Laporan Stok Bahan
          </p>
          {/* Search Bar */}
          <div className="w-2/6 sm:w-1/2 md:w-1/3">
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
                placeholder="Search by ID/Kode/Nama/Lokasi/Status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* Export Button */}
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

        <div className="overflow-x-auto w-full" style={{ height: "56vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200">
              <tr>
                {/* Tambahkan kolom nomor urut */}
                <th className="px-2 py-1 w-8 sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  No
                </th>
                {/* <th
                  className="px-2 py-1 w-10 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("id_bahan_baku")}
                >
                  ID Bahan
                  {sortConfig.key === "id_bahan_baku" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th> */}
                <th
                  className="px-2 py-1 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_lokasi")}
                >
                  Lokasi
                  {sortConfig.key === "nama_lokasi" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-2 py-1 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_kategori_bahan_baku")}
                >
                  Kategori Bahan
                  {sortConfig.key === "nama_kategori_bahan_baku" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-2 py-1 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_bahan_baku")}
                >
                  Kode Bahan
                  {sortConfig.key === "kode_bahan_baku" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-2 py-1 w-48 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_bahan_baku")}
                >
                  Nama Bahan
                  {sortConfig.key === "nama_bahan_baku" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-2 py-1 w-16 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("stok_bahan_baku")}
                >
                  Stok
                  {sortConfig.key === "stok_bahan_baku" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-2 py-1 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_satuan")}
                >
                  Satuan
                  {sortConfig.key === "nama_satuan" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-2 py-1 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("harga_beli_barang")}
                >
                  Harga Beli
                  {sortConfig.key === "harga_beli_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-2 py-1 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("total_harga")}
                >
                  Total Harga
                  {sortConfig.key === "total_harga" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-2 py-1 w-16 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {sortConfig.key === "status" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-2 py-1 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_user")}
                >
                  DI BUAT OLEH
                  {sortConfig.key === "nama_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-2 py-1 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
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
                  // Tentukan background row berdasarkan status:
                  // Jika status === 0 maka tampilkan "Aktif" (bg-lime-500), jika 1 "Tidak Aktif" (bg-red-500)
                  const rowBg = item.status === 0 ? "bg-lime-500" : "bg-red-500";
                  return (
                    <tr key={`${item.id_bahan_baku}-${index}`} className={`border-b cursor-pointer hover:opacity-75 ${rowBg} text-gray-700`}>
                      {/* Nomor Urut */}
                      <td className="px-2 py-0.5 border border-gray-700">
                        {indexOfFirstItem + index + 1}
                      </td>
                      {/* <td className="px-2 py-0.5 border border-gray-700">
                        {item.id_bahan_baku || "Data tidak tersedia"}
                      </td> */}
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.nama_lokasi || "Data tidak tersedia"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.nama_kategori_bahan_baku || "Data tidak tersedia"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.kode_bahan_baku || "Data tidak tersedia"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.nama_bahan_baku || "Data tidak tersedia"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.stok_bahan_baku || "0"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.nama_satuan || "Data tidak tersedia"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.harga_beli_barang
                          ? `Rp ${parseFloat(item.harga_beli_barang).toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.total_harga
                          ? `Rp ${parseFloat(item.total_harga).toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.status === 0 ? "Aktif" : "Tidak Aktif"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.nama_user || "Data tidak tersedia"}
                      </td>
                      <td className="px-2 py-0.5 border border-gray-700">
                        {item.createAt ? formatDate(item.createAt) : "Data tidak tersedia"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={reportType === "gabungan" ? 14 : 13} className="py-4 px-4 text-center text-gray-500">
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
                      (sum, item) =>
                        sum + Number(item.harga_beli_barang || 0),
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
                      (sum, item) =>
                        sum + Number(item.total_harga || 0),
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
              className="border border-gray-700 rounded-md text-xs p-1"
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
                className={`flex items-center justify-center py-1 px-2 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-700 hover:bg-gray-100 hover:text-gray-700 ${
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
                className={`flex items-center justify-center text-xs py-1 px-2 text-gray-500 bg-white rounded-r-md border border-gray-700 hover:bg-gray-100 hover:text-gray-700 ${
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
