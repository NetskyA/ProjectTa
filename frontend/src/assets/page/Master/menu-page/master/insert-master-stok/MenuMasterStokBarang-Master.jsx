// MenuMasterStokBarang-Basetroli.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getLaporanStokBarangAll,
  deleteMasterDataBarang, // Sesuaikan jika Anda memiliki fungsi khusus untuk delete stok
} from "../../../../../services/apiService";

import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import DialogTrueFalse from "../../../../component/DialogTrueFalse";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

import LogoExcel from "../../../../../image/icon/excel-document.svg";
import LogoSave from "../../../../../image/icon/logo-save.svg";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


// ========== FilterSelect Component ==========
// Komponen kecil untuk filter dropdown yang bisa diketik
function FilterSelect({ label, options, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [showOptions, setShowOptions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      (options || []).filter((option) => {
        if (typeof option !== "string") {
          return false;
        }
        return option.toLowerCase().includes(inputValue.toLowerCase());
      })
    );
  }, [inputValue, options]);

  // Tutup dropdown saat klik di luar
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

// ========== Main Component for Stok Barang ==========
export default function MenuMasterStokBarangBasetroli() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog & Delete states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBarangId, setSelectedBarangId] = useState(null);

  // Alert
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Redux states
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const id_user = useSelector((state) => state.auth.id_user);
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);

  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);

  const navigate = useNavigate();

  // Search bar state
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // ===== Filter states =====
  // Ubah filter sesuai instruksi:
  // - Filter Kode Barang -> Filter Kode Bahan (field: kode_bahan_baku)
  // - Filter Nama Barang -> Filter Nama Bahan (field: nama_bahan_baku)
  // - Filter Nama Toko -> Filter Lokasi (field: nama_lokasi)
  // - Filter Status sesuai dengan field 'status' (0: Aktif, 1: Tidak Aktif)
  // - Tambahkan filter Satuan (field: nama_satuan)
  const [kodeBahanFilter, setKodeBahanFilter] = useState("");
  const [namaBahanFilter, setNamaBahanFilter] = useState("");
  const [lokasiFilter, setLokasiFilter] = useState("");
  const [statusBarangFilter, setStatusBarangFilter] = useState("");
  const [satuanFilter, setSatuanFilter] = useState("");

  // Unique value untuk filter (sesuai field baru)
  const uniqueKodeBahan = useMemo(() => {
    return [...new Set(data.map((item) => item.kode_bahan_baku || ""))];
  }, [data]);

  const uniqueNamaBahan = useMemo(() => {
    return [...new Set(data.map((item) => item.nama_bahan_baku || ""))];
  }, [data]);

  const uniqueLokasi = useMemo(() => {
    return [...new Set(data.map((item) => item.nama_lokasi || ""))];
  }, [data]);

  const uniqueStatusBarang = useMemo(() => {
    // Gunakan field status: 0 = "Aktif", 1 = "Tidak Aktif"
    const statuses = data.map((item) =>
      item.status === 0 ? "Aktif" : "Tidak Aktif"
    );
    return [...new Set(statuses)];
  }, [data]);

  const uniqueSatuan = useMemo(() => {
    return [...new Set(data.map((item) => item.nama_satuan || ""))].filter(Boolean);
  }, [data]);

  // ----- FETCH DATA dari getLaporanStokBarangAll -----
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const stokData = await getLaporanStokBarangAll(token);
        // console.log("stokData:", stokData);
        const dataRows = Array.isArray(stokData)
          ? stokData
          : Object.values(stokData);

        // Tampilkan seluruh data tanpa filter berdasarkan id_toko
        // console.log("Data Laporan Stok Barang:", dataRows);
        setData(dataRows);
        setFilteredData(dataRows);
      } catch (err) {
        console.error("Error in fetching stok barang data:", err);
        setError(err.message || "Failed to fetch stok barang data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Refresh handler
  const handleRefresh = () => {
    setLoading(true);
    setKodeBahanFilter("");
    setNamaBahanFilter("");
    setLokasiFilter("");
    setStatusBarangFilter("");
    setSatuanFilter("");
    setSearchTerm("");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // FILTERING & SEARCH
  useEffect(() => {
    let tempData = [...data];

    // Filter berdasarkan kode_bahan_baku
    if (kodeBahanFilter) {
      tempData = tempData.filter((item) =>
        (item.kode_bahan_baku || "")
          .toLowerCase()
          .includes(kodeBahanFilter.toLowerCase())
      );
    }

    // Filter berdasarkan nama_bahan_baku
    if (namaBahanFilter) {
      tempData = tempData.filter((item) =>
        (item.nama_bahan_baku || "")
          .toLowerCase()
          .includes(namaBahanFilter.toLowerCase())
      );
    }

    // Filter berdasarkan lokasi (nama_lokasi)
    if (lokasiFilter) {
      tempData = tempData.filter((item) =>
        (item.nama_lokasi || "")
          .toLowerCase()
          .includes(lokasiFilter.toLowerCase())
      );
    }

    // Filter berdasarkan status (field status)
    if (statusBarangFilter) {
      if (statusBarangFilter === "Aktif") {
        tempData = tempData.filter((item) => item.status === 0);
      } else if (statusBarangFilter === "Tidak Aktif") {
        tempData = tempData.filter((item) => item.status === 1);
      }
    }

    // Filter berdasarkan satuan (nama_satuan)
    if (satuanFilter) {
      tempData = tempData.filter((item) =>
        (item.nama_satuan || "")
          .toLowerCase()
          .includes(satuanFilter.toLowerCase())
      );
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
          String(item.nama_kategori_adonan_produk || "")
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
  }, [
    data,
    kodeBahanFilter,
    namaBahanFilter,
    lokasiFilter,
    statusBarangFilter,
    satuanFilter,
    searchTerm,
  ]);

  // SORTING
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const aVal = a[sortConfig.key]
          ? String(a[sortConfig.key]).toLowerCase()
          : "";
        const bVal = b[sortConfig.key]
          ? String(b[sortConfig.key]).toLowerCase()
          : "";
        if (aVal < bVal) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  // PAGINATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // SORT HANDLER
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // DELETE LOGIC
  const handleDeleteClick = (id_bahan_baku) => {
    setSelectedBarangId(id_bahan_baku);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedBarangId === null) return;
    try {
      // Sesuaikan fungsi delete jika diperlukan
      await deleteMasterDataBarang(selectedBarangId, id_toko, token);

      setAlert({
        message: "Data stok barang berhasil dinonaktifkan.",
        type: "success",
        visible: true,
      });
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
        handleRefresh();
      }, 2000);

      // Update local state
      setData(data.filter((item) => item.id_bahan_baku !== selectedBarangId));
      setFilteredData(
        filteredData.filter((item) => item.id_bahan_baku !== selectedBarangId)
      );
    } catch (err) {
      console.error("Error while deleting data stok barang:", err);
      setAlert({
        message: "Gagal menghapus data stok barang.",
        type: "error",
        visible: true,
      });
    } finally {
      setIsDialogOpen(false);
      setSelectedBarangId(null);
    }
  };

  const cancelDelete = () => {
    setIsDialogOpen(false);
    setSelectedBarangId(null);
  };

  // EDIT HANDLER -> Navigasi ke halaman update menggunakan id_bahan_baku
  const handleEdit = (id_bahan_baku) => {
    // console.log("Navigating to update page with id_bahan_baku:", id_bahan_baku);
    navigate(`/dashboard/master/menu/masterstokbarang/update/${id_bahan_baku}`);
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

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className="py-14 mb-10" style={{ fontFamily: "sans-serif" }}>
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
        <div className="breadcrumb flex items-center">
          <Link to="/dashboard/master" className="text-xs font-semibold text-blue-900">
            Master
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
          <Link to="/dashboard/master/menu/masterstokbarang" className="text-xs font-semibold text-gray-400">
            Master Stok Bahan Baku
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
      <div className="bg-white flex flex-col md:flex-row flex-wrap rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
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
            Laporan Stok Bahan
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs h-10 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2"
                placeholder="Search by ID/Kode/Nama/Lokasi/Status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* Right: Add Data Barang Button */}
          {/* <div className="absolute right-0 flex space-x-2">
            <Link to="/dashboard/master/menu/masterstokbarang/insert">
              <button className="cetakpdf h-8 rounded-md flex items-center justify-center text-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
                <p className="p-2">Tambah</p>
              </button>
            </Link>
          </div> */}
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
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_lokasi")}
                >
                  Lokasi
                  {sortConfig.key === "nama_lokasi" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
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
                  className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_user")}
                >
                  DI BUAT OLEH
                  {sortConfig.key === "nama_user" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("createAt")}
                >
                  DI BUAT TANGGAL
                  {sortConfig.key === "createAt" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                {/* Action Column */}
                <th className="px-1 py-0.5 w-4 sticky top-0 border border-gray-700 bg-gray-200 z-10">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => {
                  // Tentukan background row berdasarkan status:
                  // status === 0 => "Aktif" (gunakan bg-lime-500), status === 1 => "Tidak Aktif" (gunakan bg-red-500)
                  const rowBg = item.status === 0 ? "bg-lime-500" : "bg-red-500";
                  return (
                    <tr key={`${item.id_bahan_baku}-${index}`} onDoubleClick={() => handleEdit(item.id_bahan_baku)} className={`border-b hover:opacity-75 cursor-pointer ${rowBg} text-gray-700`}>
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
                        {item.harga_beli_barang
                          ? `Rp ${parseFloat(item.harga_beli_barang).toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.total_harga
                          ? `Rp ${parseFloat(item.total_harga).toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.status === 0 ? "Aktif" : "Tidak Aktif"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.nama_user || "Data tidak tersedia"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.createAt ? formatDate(item.createAt) : "Data tidak tersedia"}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700 text-center">
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
                          {/* <button
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
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={14} className="px-1 py-0.5 text-center text-gray-500">
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
