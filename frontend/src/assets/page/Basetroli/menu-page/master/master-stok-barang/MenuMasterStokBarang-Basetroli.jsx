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
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filter states
  const [kodeBarangFilter, setKodeBarangFilter] = useState("");
  const [namaBarangFilter, setNamaBarangFilter] = useState("");
  const [namaTokoFilter, setNamaTokoFilter] = useState("");
  const [statusBarangFilter, setStatusBarangFilter] = useState("");

  // 1) Buat array "Aktif"/"Non-Aktif" dari data untuk dropdown status
  const uniqueStatusBarang = useMemo(() => {
    // status_barang === 1 => "Aktif", === 0 => "Non-Aktif".
    const statuses = data.map((item) =>
      item.status_barang === 1 ? "Aktif" : "Non-Aktif"
    );
    return [...new Set(statuses)];
  }, [data]);

  // 2) Untuk filter Toko, Kode Barang, Nama Barang
  const uniqueKodeBarang = useMemo(() => {
    return [...new Set(data.map((item) => item.kode_barang || ""))];
  }, [data]);

  const uniqueNamaBarang = useMemo(() => {
    return [...new Set(data.map((item) => item.namabarang || ""))];
  }, [data]);

  const uniqueNamaToko = useMemo(() => {
    return [...new Set(data.map((item) => item.nama_toko || ""))];
  }, [data]);

  // ----- FETCH DATA dari getLaporanStokBarangAll -----
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const stokData = await getLaporanStokBarangAll(token);
        const dataRows = Array.isArray(stokData) ? stokData : Object.values(stokData);

        // Filter by id_toko jika diperlukan
        const filteredRows = dataRows.filter(
          (item) => parseInt(item.id_toko, 10) === id_toko
        );

        // console.log("Data Laporan Stok Barang:", filteredRows);
        setData(filteredRows);
        setFilteredData(filteredRows);
      } catch (err) {
        console.error("Error in fetching stok barang data:", err);
        setError(err.message || "Failed to fetch stok barang data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, id_toko]);

  // Refresh
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // FILTERING & SEARCH
  useEffect(() => {
    let tempData = [...data];

    // Filter Kode Barang
    if (kodeBarangFilter) {
      tempData = tempData.filter((item) =>
        (item.kode_barang || "")
          .toLowerCase()
          .includes(kodeBarangFilter.toLowerCase())
      );
    }

    // Filter Nama Barang
    if (namaBarangFilter) {
      tempData = tempData.filter((item) =>
        (item.namabarang || "")
          .toLowerCase()
          .includes(namaBarangFilter.toLowerCase())
      );
    }

    // Filter Nama Toko
    if (namaTokoFilter) {
      tempData = tempData.filter((item) =>
        (item.nama_toko || "")
          .toLowerCase()
          .includes(namaTokoFilter.toLowerCase())
      );
    }

    // Filter Status Barang
    if (statusBarangFilter) {
      if (statusBarangFilter === "Aktif") {
        tempData = tempData.filter((item) => item.status_barang === 1);
      } else if (statusBarangFilter === "Non-Aktif") {
        tempData = tempData.filter((item) => item.status_barang === 0);
      }
    }

    // Global Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      tempData = tempData.filter((item) => {
        return (
          String(item.id_stokbarang || "").toLowerCase().includes(lower) ||
          String(item.kode_barang || "").toLowerCase().includes(lower) ||
          String(item.namabarang || "").toLowerCase().includes(lower) ||
          String(item.nama_toko || "").toLowerCase().includes(lower) ||
          String(item.status_barang || "").toLowerCase().includes(lower)
        );
      });
    }

    setFilteredData(tempData);
    setCurrentPage(1);
  }, [
    data,
    kodeBarangFilter,
    namaBarangFilter,
    namaTokoFilter,
    statusBarangFilter,
    searchTerm,
  ]);

  // SORTING
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const aVal = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : "";
        const bVal = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : "";

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
  const handleDeleteClick = (id_stokbarang) => {
    setSelectedBarangId(id_stokbarang);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedBarangId === null) return;
    try {
      // Contoh: deleteMasterDataBarang bisa disesuaikan
      await deleteMasterDataBarang(selectedBarangId, id_toko, token);

      setAlert({
        message: "Data barang (stok) berhasil dinonaktifkan.",
        type: "success",
        visible: true,
      });
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
        handleRefresh();
      }, 2000);

      // Update local state
      setData(data.filter((stok) => stok.id_stokbarang !== selectedBarangId));
      setFilteredData(
        filteredData.filter((stok) => stok.id_stokbarang !== selectedBarangId)
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

  // EDIT HANDLER -> INI BAGIAN YANG MENGARAHKAN KE HALAMAN UPDATE
  const handleEdit = (id_stokbarang) => {
    console.log("Navigating to update page with id_stokbarang:", id_stokbarang);
    navigate(`/dashboard/basetroli/menu/masterstokbarang/update/${id_stokbarang}`);
  };

  // RENDER
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
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}
      <div className="head flex justify-between items-center">
        <div className="breadcrumb flex items-center">
          <Link to="/dashboard/basetroli" className="text-xs font-semibold text-blue-900">
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
          {/* Menu ini diarahkan ke master stok barang */}
          <Link to="/dashboard/basetroli/menu/masterstokbarang" className="text-xs font-semibold text-gray-400">
              Master Stok Barang
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
            label="Filter Kode Barang"
            options={uniqueKodeBarang.map(String)}
            value={kodeBarangFilter}
            onChange={setKodeBarangFilter}
          />
          <FilterSelect
            label="Filter Nama Barang"
            options={uniqueNamaBarang.map(String)}
            value={namaBarangFilter}
            onChange={setNamaBarangFilter}
          />
          <FilterSelect
            label="Filter Nama Toko"
            options={uniqueNamaToko.map(String)}
            value={namaTokoFilter}
            onChange={setNamaTokoFilter}
          />
          <FilterSelect
            label="Filter Status"
            options={uniqueStatusBarang}
            value={statusBarangFilter}
            onChange={setStatusBarangFilter}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 mt-2">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            List Stok Barang
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
                placeholder="Search by ID/Kode/Nama/Toko/Status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* Right: Add Data Barang Button */}
          <div className="absolute right-0 flex space-x-2">
            <Link to="/dashboard/basetroli/menu/masterstokbarang/insert">
              <button className="cetakpdf h-8 rounded-md flex items-center justify-center text-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
                <p className="p-2">Tambah</p>
              </button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto" style={{ height: "60vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border">
            <thead className="text-xs text-blue-900 uppercase font-semibold bg-gray-200">
              <tr>
                <th
                  className="px-1 py-0.5 w-10 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("no")}
                >
                  NO
                  {sortConfig.key === "no" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("nama_toko")}
                >
                  Nama Toko
                  {sortConfig.key === "nama_toko" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("kode_barang")}
                >
                  Kode Barang
                  {sortConfig.key === "kode_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-36 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("namabarang")}
                >
                  Nama Barang
                  {sortConfig.key === "namabarang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("stok_barang")}
                >
                  Stok
                  {sortConfig.key === "stok_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("konversi1")}
                >
                  Konversi1
                  {sortConfig.key === "konversi1" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("konversi2")}
                >
                  Konversi2
                  {sortConfig.key === "konversi2" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-14 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("besar")}
                >
                  Besar
                  {sortConfig.key === "besar" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-14 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("sedang")}
                >
                  Sedang
                  {sortConfig.key === "sedang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-14 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("kecil")}
                >
                  Kecil
                  {sortConfig.key === "kecil" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-16 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200 z-10"
                  onClick={() => handleSort("status_barang")}
                >
                  Status
                  {sortConfig.key === "status_barang" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th
                  className="px-1 py-0.5 w-4 sticky top-0 border border-gray-700 bg-gray-200 z-10"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => {
                  // Background row -> misal hijau untuk aktif, merah untuk non-aktif
                  const rowBg =
                    item.status_barang === 1 ? "bg-lime-500" : "bg-red-500";

                  return (
                    <tr
                      key={`${item.id_stokbarang}-${index}`}
                      className={`text-gray-700 border-b hover:bg-lime-400 ${rowBg}`}
                    >
                      {/* NO */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {indexOfFirstItem + index + 1}
                      </td>
                      {/* Nama Toko */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.nama_toko || "Data tidak tersedia"}
                      </td>
                      {/* Kode Barang */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.kode_barang || "Data tidak tersedia"}
                      </td>
                      {/* Nama Barang */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.namabarang || "Data tidak tersedia"}
                      </td>
                      {/* Stok Barang */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.stok_barang || "0"}
                      </td>
                      {/* Konversi1 */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.konversi1 || "0"}
                      </td>
                      {/* Konversi2 */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.konversi2 || "0"}
                      </td>
                      {/* Besar */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.besar || "0"}
                      </td>
                      {/* Sedang */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.sedang || "0"}
                      </td>
                      {/* Kecil */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.kecil || "0"}
                      </td>
                      {/* Status */}
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.status_barang === 1 ? "Aktif" : "Non-Aktif"}
                      </td>
                      {/* Action Buttons */}
                      <td className="px-1 py-0.5 justify-center border border-gray-500">
                        <div className="flex justify-center">
                          {/* Edit Icon */}
                          <button
                            onClick={() => handleEdit(item.id_stokbarang)}
                            className="flex items-center px-1 justify-center"
                            title="Edit"
                          >
                            <svg
                              className="w-5 h-5 text-green-600"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 8a4 4 0 1 1 7.796 1.263l-2.533 2.534A4 4 0 0 1 5 8Zm4.06 5H7a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h2.172a2.999 2.999 0 0 1-.114-1.588l.674-3.372a3 3 0 0 1 .82-1.533L9.06 13Zm9.032-5a2.907 2.907 0 0 0-2.056.852L9.967 14.92a1 1 0 0 0-.273.51l-.675 3.373a1 1 0 0 0 1.177 1.177l3.372-.675a1 1 0 0 0 .511-.273l6.07-6.07a2.91 2.91 0 0 0-.944-4.742A2.907 2.907 0 0 0 18.092 8Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          {/* Delete Icon */}
                          <button
                            onClick={() => handleDeleteClick(item.id_stokbarang)}
                            className="flex items-center px-1 justify-center"
                            title="Delete"
                          >
                            <svg
                              className="w-5 h-5 text-red-700"
                              aria-hidden="true"
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
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="14" className="px-1 py-0.5 text-center text-gray-500">
                    Tidak ada data yang tersedia
                  </td>
                </tr>
              )}
            </tbody>
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
          {/* Items Per Page Dropdown */}
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

