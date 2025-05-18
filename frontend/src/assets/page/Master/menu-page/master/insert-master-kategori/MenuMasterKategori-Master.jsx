import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getLaporanMasterKategori, deleteMasterKategori } from "../../../../../services/apiService";
import { useSelector } from "react-redux";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";
import Alert from "../../../../component/Alert";
import DialogTrueFalse from "../../../../component/DialogTrueFalse";

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
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
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

export default function MenuLaporanMasterKategori() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  // Tidak lagi digunakan untuk filter, karena kita menampilkan semua data
  const id_toko = parseInt(id_tokoString, 10);
  
  // console.log("id_user:", id_user);
  // console.log("id_toko:", id_toko);
  // FILTERS
  const [marketplaceFilter, setMarketplaceFilter] = useState("");
  const [tokoFilter, setTokoFilter] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua"); // "Semua", "Aktif", "Non-Aktif"

  // Filter tanggal (berdasarkan createAt)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Search Term
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sort Config
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Alert
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  // Dialog Delete
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getLaporanMasterKategori(token);
        console.log("Data Master Kategori (original):", result);
        const formattedData = Array.isArray(result) ? result : Object.values(result);
        // Tidak dilakukan filter berdasarkan id_toko, tampilkan semua data
        setData(formattedData);
        setFilteredData(formattedData);
      } catch (err) {
        console.error("Error fetching basetroli kategori data:", err);
        setError(err.message || "Failed to fetch basetroli kategori data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Ambil opsi unik untuk filter dropdown
  const uniqueMarketplace = [...new Set(data.map((item) => item.nama_marketplace || ""))];
  const uniqueToko = [...new Set(data.map((item) => item.nama_toko || ""))];
  const uniqueKategori = [...new Set(data.map((item) => item.nama_kategori || ""))];
  const statusOptions = ["Semua", "Aktif", "Non-Aktif"];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  useEffect(() => {
    let filtered = [...data];

    if (marketplaceFilter) {
      filtered = filtered.filter((item) => item.nama_marketplace === marketplaceFilter);
    }

    if (tokoFilter) {
      filtered = filtered.filter((item) => item.nama_toko === tokoFilter);
    }

    if (kategoriFilter) {
      filtered = filtered.filter((item) => item.nama_kategori === kategoriFilter);
    }

    if (statusFilter && statusFilter !== "Semua") {
      if (statusFilter === "Aktif") {
        filtered = filtered.filter((item) => item.status === 0);
      } else if (statusFilter === "Non-Aktif") {
        filtered = filtered.filter((item) => item.status === 1);
      }
    }

    // Filter berdasarkan tanggal (createAt)
    if (startDate) {
      filtered = filtered.filter((item) => {
        const createdDate = new Date(item.createAt);
        return createdDate >= new Date(startDate);
      });
    }
    if (endDate) {
      filtered = filtered.filter((item) => {
        const createdDate = new Date(item.createAt);
        return createdDate <= new Date(endDate);
      });
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const {
          id_kategori,
          nama_marketplace,
          nama_toko,
          nama_kategori,
          biaya_admin,
          biaya_admin_fleksibel,
          biaya_ongkir,
          biaya_ongkir_fleksibel,
          periode_mulai,
          periode_akhir,
          status_periode,
          createBy,
          created_by_user,
          createAt,
          status,
        } = item;
        const combinedString = `
          ${id_kategori ?? ""} 
          ${nama_marketplace ?? ""} 
          ${nama_toko ?? ""} 
          ${nama_kategori ?? ""} 
          ${biaya_admin ?? ""} 
          ${biaya_admin_fleksibel ?? ""} 
          ${biaya_ongkir ?? ""} 
          ${biaya_ongkir_fleksibel ?? ""} 
          ${periode_mulai ?? ""} 
          ${periode_akhir ?? ""} 
          ${status_periode ?? ""} 
          ${createBy ?? ""} 
          ${created_by_user ?? ""} 
          ${createAt ?? ""} 
          ${status ?? ""}
        `.toLowerCase();
        return combinedString.includes(lowerSearchTerm);
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [
    searchTerm,
    marketplaceFilter,
    tokoFilter,
    kategoriFilter,
    statusFilter,
    startDate,
    endDate,
    data,
  ]);

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

        aKey = aKey !== undefined && aKey !== null ? aKey.toString().toLowerCase() : "";
        bKey = bKey !== undefined && bKey !== null ? bKey.toString().toLowerCase() : "";

        if (aKey < bKey) return sortConfig.direction === "asc" ? -1 : 1;
        if (aKey > bKey) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  const formatDate = (dateString) => {
    if (!dateString) return "Data tidak tersedia";
    const date = new Date(dateString);
    const padZero = (num) => String(num).padStart(2, "0");
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());
    const time = `${hours}:${minutes}:${seconds}`;
    const day = padZero(date.getDate());
    const month = padZero(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}, ${time}`;
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  // Handler untuk Edit: navigasi ke halaman update dengan mempassing id_kategori
  const handleEdit = (id_kategori) => {
    console.log("Navigating to update page with id_kategori:", id_kategori);
    navigate(`/dashboard/master/menu/master/kategori/update/${id_kategori}`);
  };

  // Handler untuk menampilkan dialog delete
  const handleDeleteClick = (id_kategori) => {
    setDeleteId(id_kategori);
    setIsDialogOpen(true);
  };

  // Konfirmasi delete: memanggil deleteMasterKategori dan mengupdate state
  const confirmDelete = async () => {
    try {
      await deleteMasterKategori(deleteId, token);
      setAlert({ message: "Data berhasil dinonaktifkan.", type: "success", visible: true });
      const updatedData = data.filter((item) => item.id_kategori !== deleteId);
      setData(updatedData);
      setFilteredData(updatedData);
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
        handleRefresh();
      }, 2000);
    } catch (err) {
      setAlert({ message: err.message || "Delete gagal", type: "error", visible: true });
    } finally {
      setIsDialogOpen(false);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setIsDialogOpen(false);
    setDeleteId(null);
  };

  return (
    <div className="py-14" style={{ fontFamily: "sans-serif" }}>
      {alert.visible && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      <div className="head flex justify-between items-center mb-0.5">
        <div className="cover flex items-center">
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
          <span className="text-xs font-semibold text-gray-400">Master Kategori</span>
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

      {/* ========== Filter Section ========== */}
      <div className="bg-white flex flex-col md:flex-row flex-wrap rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
          <FilterSelect
            label="Filter Marketplace"
            options={uniqueMarketplace.map(String)}
            value={marketplaceFilter}
            onChange={setMarketplaceFilter}
          />
          <FilterSelect
            label="Filter Toko"
            options={uniqueToko.map(String)}
            value={tokoFilter}
            onChange={setTokoFilter}
          />
          <FilterSelect
            label="Filter Kategori"
            options={uniqueKategori.map(String)}
            value={kategoriFilter}
            onChange={setKategoriFilter}
          />
          <FilterSelect
            label="Filter Status"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <div className="flex flex-col text-xs">
            <label className="block mb-1 text-blue-900 font-semibold">
              Filter Tanggal
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="border border-gray-300 w-44 h-7 px-2 rounded-md text-xs"
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
                className="border border-gray-300 w-44 h-7 px-2 rounded-md text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || ""}
                placeholder="End Date"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 w-full">
        <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">Master Kategori</p>
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
          <div className="absolute right-0 flex space-x-2">
          <Link to="/dashboard/master/menu/master/kategori/insert">
              <button className="cetakpdf h-8 rounded-md flex items-center justify-center text-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
                <p className="p-2">Tambah</p>
              </button>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto w-full" style={{ height: "56vh" }}>
          <table className="w-full text-xs text-left text-gray-500 border-collapse border">
            <thead className="text-xs font-semibold text-blue-900 uppercase bg-gray-200 w-full">
              <tr>
                <th className="px-1 py-0.5 w-8 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10">No</th>
                <th onClick={() => handleSort("nama_marketplace")} className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Marketplace {sortConfig.key === "nama_marketplace" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("nama_toko")} className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Toko {sortConfig.key === "nama_toko" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("nama_kategori")} className="px-1 py-0.5 w-44 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Kategori {sortConfig.key === "nama_kategori" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("biaya_admin")} className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Biaya Admin {sortConfig.key === "biaya_admin" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("biaya_admin_fleksibel")} className="px-1 py-0.5 w-36 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Biaya Admin Fleksibel {sortConfig.key === "biaya_admin_fleksibel" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("biaya_ongkir")} className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Biaya Ongkir {sortConfig.key === "biaya_ongkir" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("biaya_ongkir_fleksibel")} className="px-1 py-0.5 w-40 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Biaya Ongkir Fleksibel {sortConfig.key === "biaya_ongkir_fleksibel" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("periode_mulai")} className="px-1 py-0.5 w-36 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Periode Mulai {sortConfig.key === "periode_mulai" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("periode_akhir")} className="px-1 py-0.5 w-36 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Periode Akhir {sortConfig.key === "periode_akhir" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("created_by_user")} className="px-1 py-0.5 w-32 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  DI BUAT OLEH {sortConfig.key === "created_by_user" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("createAt")} className="px-1 py-0.5 w-36 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  CreateAt {sortConfig.key === "createAt" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("status")} className="px-1 py-0.5 w-20 sticky top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-1 py-0.5 sticky w-14 top-0 border border-gray-700 bg-gray-200 text-blue-900 z-10 cursor-pointer">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => {
                  const rowBg = item.status === 0 
                    ? "bg-lime-500" 
                    : item.status === 1 
                    ? "bg-yellow-300" 
                    : "bg-white";
                  return (
                    <tr key={index} className={`border-b text-gray-900 ${rowBg}`}>
                      <td className="px-1 py-0.5 border border-gray-700">{indexOfFirstItem + index + 1}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{item.nama_marketplace}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{item.nama_toko}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{item.nama_kategori}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{item.biaya_admin + " %"}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{item.biaya_admin_fleksibel + " %"}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{item.biaya_ongkir + " %"}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{item.biaya_ongkir_fleksibel + " %"}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{item.periode_mulai || "-"}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{item.periode_akhir || "-"}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{item.created_by_user}</td>
                      <td className="px-1 py-0.5 border border-gray-700">{formatDate(item.createAt)}</td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        {item.status === 0 ? "Aktif" : item.status === 1 ? "Non-Aktif" : ""}
                      </td>
                      <td className="px-1 py-0.5 border border-gray-700">
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleEdit(item.id_kategori)} title="Edit">
                            <svg className="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M5 8a4 4 0 1 1 7.796 1.263l-2.533 2.534A4 4 0 0 1 5 8zM9 13H7a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h2.172a3 3 0 0 1-.114-1.588l.674-3.372a3 3 0 0 1 .82-1.533L9 13zM18 8a2.907 2.907 0 0 0-2.056.852L9.967 14.92a1 1 0 0 0-.273.51l-.675 3.373a1 1 0 0 0 1.177 1.177l3.372-.675a1 1 0 0 0 .511-.273l6.07-6.07a2.91 2.91 0 0 0-.944-4.742A2.907 2.907 0 0 0 18 8z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDeleteClick(item.id_kategori)} title="Delete">
                            <svg className="w-5 h-5 text-red-700 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="15" className="px-1 py-0.5 text-center">Tidak ada data tersedia</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mt-4" aria-label="Table navigation">
          <div className="flex items-center space-x-2">
            <label htmlFor="itemsPerPage" className="text-xs text-gray-700">Tampilkan:</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
            Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedData.length)}</span> of <span className="font-semibold text-gray-900">{sortedData.length}</span>
          </span>
          <ul className="inline-flex items-stretch -space-x-px">
            <li>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center justify-center py-0.5 px-1 ml-0 text-gray-500 bg-white rounded-l-md text-xs border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${ currentPage === 1 ? "cursor-not-allowed opacity-50" : "" }`}
              >
                <span>Previous</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center text-xs py-0.5 px-1 text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${ currentPage === totalPages ? "cursor-not-allowed opacity-50" : "" }`}
              >
                <span>Next</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Dialog Confirmation Delete */}
        <DialogTrueFalse
          isOpen={isDialogOpen}
          title="Konfirmasi Penonaktifan"
          message="Apakah Anda yakin ingin menonaktifkan data kategori ini?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </div>
  );
}
