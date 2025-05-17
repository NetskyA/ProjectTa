// MenuMasterAkuntansi-Master.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMasterAkuntansi, deleteMasterAkuntansi } from "../../../../../services/apiService";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../../../../component/Alert";
import DialogTrueFalse from "../../../../component/DialogTrueFalse";
import Loading from "../../../../component/Loading";
import Error from "../../../../component/Error";

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

// ========== Main Component ==========

export default function MenuMasterAkuntansiMaster() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAkunId, setSelectedAkunId] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "", visible: false });

  const token = useSelector((state) => state.auth.token);
  const id_user = useSelector((state) => state.auth.id_user);
  const id_tokoString = useSelector((state) => state.auth.id_toko);
  const id_toko = parseInt(id_tokoString, 10);
  const kode_toko = useSelector((state) => state.auth.kode_toko);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  const formatRupiah = (number) => {
    if (number === undefined || number === null || isNaN(number))
      return "Data tidak tersedia";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(number);
  };

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filter states: untuk nama_akun_akuntansi, kode_akun_akuntansi, dan status
  const [namaAkunFilter, setNamaAkunFilter] = useState("");
  const [kodeAkunFilter, setKodeAkunFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Ambil data master akuntansi
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const masterAkuntansiData = await getMasterAkuntansi(token);
        const dataRows = Array.isArray(masterAkuntansiData)
          ? masterAkuntansiData
          : Object.values(masterAkuntansiData);
        
        // Filter data berdasarkan id_toko
        const filteredByToko = dataRows.filter(
          (item) => parseInt(item.id_toko, 10) === id_toko
        );
        
        setData(filteredByToko);
        setFilteredData(filteredByToko);
      } catch (err) {
        console.error("Error fetching master akuntansi:", err);
        setError(err.message || "Gagal mengambil data master akuntansi.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, id_toko]);

  // Data unik untuk dropdown filter
  const uniqueNamaAkun = useMemo(() => {
    return [...new Set(data.map((item) => item.nama_akun_akuntansi || ""))];
  }, [data]);

  const uniqueKodeAkun = useMemo(() => {
    return [...new Set(data.map((item) => item.kode_akun_akuntansi || ""))];
  }, [data]);

  // Status filter: opsi "Aktif" untuk status 0 dan "Non-Aktif" untuk status 1
  const statusOptions = ["Aktif", "Non-Aktif"];

  // Refresh handler
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Filtering + search
  useEffect(() => {
    let filtered = [...data];
    if (namaAkunFilter !== "") {
      filtered = filtered.filter((item) =>
        String(item.nama_akun_akuntansi || "")
          .toLowerCase()
          .includes(namaAkunFilter.toLowerCase())
      );
    }
    if (kodeAkunFilter !== "") {
      filtered = filtered.filter((item) =>
        String(item.kode_akun_akuntansi || "")
          .toLowerCase()
          .includes(kodeAkunFilter.toLowerCase())
      );
    }
    if (statusFilter !== "") {
      filtered = filtered.filter((item) => {
        if (statusFilter === "Aktif") return item.status === 0;
        if (statusFilter === "Non-Aktif") return item.status === 1;
        return false;
      });
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          String(item.id_master_akun_akuntansi || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.nama_akun_akuntansi || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.kode_akun_akuntansi || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.nama_akun || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.saldo_awal || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.deskripsi || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.created_by || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.nama_user || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.created_at || "")
            .toLowerCase()
            .includes(lower) ||
          String(item.status || "")
            .toLowerCase()
            .includes(lower)
        );
      });
    }
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [namaAkunFilter, kodeAkunFilter, statusFilter, searchTerm, data]);

  // Sorting
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];
        aKey = aKey ? aKey.toString().toLowerCase() : "";
        bKey = bKey ? bKey.toString().toLowerCase() : "";
        if (aKey < bKey) return sortConfig.direction === "asc" ? -1 : 1;
        if (aKey > bKey) return sortConfig.direction === "asc" ? 1 : -1;
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

  // Sorting handler
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Delete handler
  const handleDeleteClick = (id) => {
    setSelectedAkunId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedAkunId === null) return;
    try {
      // Di sini masih memanggil delete dengan (id, id_toko, token) 
      // Pastikan API Anda memang memerlukan id_toko atau tidak
      await deleteMasterAkuntansi(selectedAkunId, 0, token); 
      // ↑ Ganti parameter kedua sesuai kebutuhan, 
      //   atau hapus jika API tidak butuh id_toko

      setAlert({
        message: "Data master akuntansi berhasil dinonaktifkan.",
        type: "success",
        visible: true,
      });
      setTimeout(() => {
        setAlert({ message: "", type: "", visible: false });
        handleRefresh();
      }, 2000);

      setData(data.filter((item) => item.id_master_akun_akuntansi !== selectedAkunId));
      setFilteredData(filteredData.filter((item) => item.id_master_akun_akuntansi !== selectedAkunId));
    } catch (err) {
      console.error("Error deleting master akuntansi:", err);
      setAlert({
        message: "Gagal menghapus data master akuntansi.",
        type: "error",
        visible: true,
      });
    } finally {
      setIsDialogOpen(false);
      setSelectedAkunId(null);
    }
  };

  const cancelDelete = () => {
    setIsDialogOpen(false);
    setSelectedAkunId(null);
  };

  // Edit handler
  const handleEdit = (id) => {
    navigate(`/dashboard/basetroli/menu/masterakuntansi/update/${id}`);
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
          <Link to="/dashboard/basetroli" className="text-xs font-semibold text-blue-900">
            Master
          </Link>
          <div className="ml-1 mr-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 text-gray-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <Link to="/dashboard/basetroli/menu/masterakuntansi" className="text-xs font-semibold text-gray-400">
            Master Akuntansi
          </Link>
        </div>
        <button
          onClick={handleRefresh}
          className="w-14 h-6 text-xs rounded-md border-2 font-xs text-gray-100 bg-blue-900 hover:bg-blue-600 transition duration-300"
        >
          Refresh
        </button>
      </div>

      {/* ========== Filter Section ========== */}
      <div className="bg-white flex flex-col md:flex-row flex-wrap rounded-md shadow-md p-4 justify-between items-center border border-gray-200 mb-2">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
          <FilterSelect
            label="Filter Nama Akuntansi"
            options={uniqueNamaAkun.map(String)}
            value={namaAkunFilter}
            onChange={setNamaAkunFilter}
          />
          <FilterSelect
            label="Filter Kode Akuntansi"
            options={uniqueKodeAkun.map(String)}
            value={kodeAkunFilter}
            onChange={setKodeAkunFilter}
          />
          <FilterSelect
            label="Filter Status"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* <div className="flex items-center justify-between mb-2 relative">
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
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="absolute right-0">
          <Link to="/dashboard/basetroli/menu/masterakuntansi/insert">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center text-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Tambah</p>
            </button>
          </Link>
        </div>
      </div> */}

      {/* ========== Table Section ========== */}
      <div
        className="bg-white rounded-md shadow-md border border-gray-200 p-1.5 mt-2 overflow-x-auto"
        style={{ maxHeight: "60vh" }}
      >
                {/* ========== Search & Add Button Section ========== */}
                <div className="flex items-center justify-center mb-2 relative">
          <p className="text-xl font-semibold text-blue-900 absolute left-1">
            Master Akuntansi
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

          <div className="w-fit flex absolute right-1 items-center justify-center bg-gray-200 rounded-md p-0.5 cursor-pointer">
          <Link to="/dashboard/basetroli/menu/masterakuntansi/insert">
            <button className="cetakpdf h-8 rounded-md flex items-center justify-center text-xs text-gray-100 bg-blue-900 hover:bg-blue-700 transition duration-300">
              <p className="p-2">Tambah</p>
            </button>
          </Link>
          </div>
        </div>
        <table className="w-full text-xs text-left text-gray-500 border">
          <thead className="text-xs text-blue-900 uppercase font-semibold bg-gray-200">
            <tr>
              <th
                className="px-1 py-0.5 w-8 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200"
                onClick={() => handleSort("no")}
              >
                NO
                {sortConfig.key === "no" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-1 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200"
                onClick={() => handleSort("nama_akun")}
              >
                Nama Akun
                {sortConfig.key === "nama_akun" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-1 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200"
                onClick={() => handleSort("kode_akun_akuntansi")}
              >
                Kode Akuntansi
                {sortConfig.key === "kode_akun_akuntansi" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-1 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200"
                onClick={() => handleSort("nama_toko")}
              >
                Nama Toko
                {sortConfig.key === "nama_toko" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-1 py-0.5 w-40 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200"
                onClick={() => handleSort("nama_akun_akuntansi")}
              >
                Nama Akuntansi
                {sortConfig.key === "nama_akun_akuntansi" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-1 py-0.5 w-28 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200"
                onClick={() => handleSort("saldo_awal")}
              >
                Saldo Awal
                {sortConfig.key === "saldo_awal" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-1 py-0.5 w-52 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200"
                onClick={() => handleSort("deskripsi")}
              >
                Deskripsi
                {sortConfig.key === "deskripsi" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-1 py-0.5 w-32 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200"
                onClick={() => handleSort("created_by")}
              >
                DI BUAT OLEH
                {sortConfig.key === "created_by" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-1 py-0.5 w-36 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200"
                onClick={() => handleSort("created_at")}
              >
                DI BUAT TANGGAL
                {sortConfig.key === "created_at" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                className="px-1 py-0.5 w-20 cursor-pointer sticky top-0 border border-gray-700 bg-gray-200"
                onClick={() => handleSort("status")}
              >
                Status
                {sortConfig.key === "status" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th className="px-1 py-0.5 w-10 sticky top-0 border border-gray-700 bg-gray-200">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => {
                const rowBg = item.status === 0 ? "bg-lime-500" : "bg-red-500 text-gray-900";
                return (
                  <tr key={`${item.id_master_akun_akuntansi}-${index}`} className={`text-gray-700 border-b ${rowBg}`}>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_akun || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.kode_akun_akuntansi || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_toko || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.nama_akun_akuntansi || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {formatRupiah(item.saldo_awal) !== undefined ? formatRupiah(item.saldo_awal) : "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.deskripsi || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.created_by_user || "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.created_at ? formatDate(item.created_at) : "-"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      {item.status === 0 ? "Aktif" : "Non-Aktif"}
                    </td>
                    <td className="px-1 py-0.5 border border-gray-700">
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => handleEdit(item.id_master_akun_akuntansi)} title="Edit">
                        <svg
                            className="w-5 h-5 text-green-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 8a4 4 0 1 1 7.796 1.263l-2.533 2.534A4 4 0 0 1 5 8zM9 13H7a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h2.172a3 3 0 0 1-.114-1.588l.674-3.372a3 3 0 0 1 .82-1.533L9 13zM18 8a2.907 2.907 0 0 0-2.056.852L9.967 14.92a1 1 0 0 0-.273.51l-.675 3.373a1 1 0 0 0 1.177 1.177l3.372-.675a1 1 0 0 0 .511-.273l6.07-6.07a2.91 2.91 0 0 0-.944-4.742A2.907 2.907 0 0 0 18 8z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteClick(item.id_master_akun_akuntansi)} title="Delete">
                          <svg className="w-5 h-5 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 8a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" className="px-1 py-0.5 text-center">
                  Tidak ada data yang tersedia
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* ========== Pagination Footer ========== */}
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
                className={`flex items-center justify-center py-1 px-1 ml-0 text-gray-700 bg-white rounded-l-md text-xs border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                Previous
              </button>
            </li>
            <li>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center text-xs py-1 px-1 text-gray-700 bg-white rounded-r-md border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                  currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <DialogTrueFalse
        isOpen={isDialogOpen}
        title="Konfirmasi Penghapusan"
        message="Apakah Anda yakin ingin menonaktifkan data master akuntansi ini?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
